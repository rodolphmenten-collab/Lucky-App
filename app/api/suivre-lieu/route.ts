import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Abonnement et désabonnement aux actualités d'un établissement.
 *
 * Le retrait date la ligne au lieu de la supprimer : si un envoi est contesté
 * plus tard, il faut pouvoir montrer que la personne était consentante à cette
 * date-là, puis qu'elle s'est retirée. Une ligne effacée ne prouve rien.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { venueId, suivre } = await request.json().catch(() => ({}));
  if (!venueId || typeof suivre !== 'boolean') {
    return NextResponse.json({ error: 'Requête incomplète' }, { status: 400 });
  }

  const { error } = await supabase.from('venue_follows').upsert(
    {
      user_id: user.id,
      venue_id: venueId,
      consented_at: new Date().toISOString(),
      withdrawn_at: suivre ? null : new Date().toISOString(),
      source: 'room',
    },
    { onConflict: 'user_id,venue_id' }
  );

  if (error) {
    console.error('[suivre-lieu]', error);
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, suivi: suivre });
}
