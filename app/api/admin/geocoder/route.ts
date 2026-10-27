import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Retrouve les coordonnées des lieux qui n'en ont pas, pour une journée de
 * tournée.
 *
 * Un lieu sans coordonnées n'apparaît pas sur la carte et ne peut pas vérifier
 * la présence de ses clients : c'est la panne la plus silencieuse du produit.
 * Les saisir à la main pour trente adresses n'est pas réaliste la veille d'un
 * départ.
 *
 * Nominatim (OpenStreetMap) ne demande pas de clé mais impose d'identifier
 * l'appelant et de ne pas dépasser une requête par seconde — d'où l'en-tête
 * User-Agent et l'attente entre deux appels. On écrit le résultat seulement
 * quand il est plausible, et on dit lesquels ont échoué plutôt que de laisser
 * croire que tout est placé.
 */

const ATTENTE_MS = 1100;

function dormir(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { jour } = await request.json().catch(() => ({}));
  if (!jour) return NextResponse.json({ error: 'Journée manquante' }, { status: 400 });

  const service = createServiceClient();
  const { data: lieux } = await service
    .from('crm_venues')
    .select('id, name, city, address, latitude, longitude')
    .eq('roadshow_date', jour)
    .or('latitude.is.null,longitude.is.null');

  const aTraiter = (lieux ?? []).slice(0, 40);
  const places: string[] = [];
  const introuvables: string[] = [];

  for (const [i, lieu] of aTraiter.entries()) {
    if (i > 0) await dormir(ATTENTE_MS);

    const requete = [lieu.address || lieu.name, lieu.address ? null : lieu.city, 'France']
      .filter(Boolean)
      .join(', ');

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', requete);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'fr');

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Lucky/1.0 (contact: rodolph@lucky-app.io)',
          'Accept-Language': 'fr',
        },
      });
      if (!res.ok) {
        introuvables.push(lieu.name);
        continue;
      }

      const data = await res.json();
      const premier = Array.isArray(data) ? data[0] : null;
      const lat = premier ? Number(premier.lat) : NaN;
      const lon = premier ? Number(premier.lon) : NaN;

      // Un résultat hors de France métropolitaine est une erreur de
      // recherche, pas une adresse : mieux vaut ne rien écrire.
      const plausible =
        Number.isFinite(lat) && Number.isFinite(lon) &&
        lat > 41 && lat < 52 && lon > -5.5 && lon < 10;

      if (!plausible) {
        introuvables.push(lieu.name);
        continue;
      }

      await service
        .from('crm_venues')
        .update({ latitude: lat, longitude: lon })
        .eq('id', lieu.id);
      places.push(lieu.name);
    } catch {
      introuvables.push(lieu.name);
    }
  }

  return NextResponse.json({
    ok: true,
    places: places.length,
    introuvables,
    restants: Math.max((lieux ?? []).length - aTraiter.length, 0),
  });
}
