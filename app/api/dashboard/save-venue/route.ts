import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const formData = await request.formData();
  const venueId = formData.get('venueId') as string;
  if (!venueId) return NextResponse.json({ error: 'Missing venueId' }, { status: 400 });

  const service = createServiceClient();

  const [{ data: ownerRow }, isPlatformAdmin] = await Promise.all([
    service.from('venue_admins').select('id').eq('venue_id', venueId).eq('user_id', user.id).maybeSingle(),
    isPlatformAdminEmail(user.email),
  ]);

  if (!ownerRow && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  const { data: existingVenue } = await service
    .from('venues')
    .select('cover_photo_url')
    .eq('id', venueId)
    .maybeSingle();
  if (!existingVenue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

  let coverUrl = existingVenue.cover_photo_url;

  // Deux chemins pour la photo : un fichier televerse, ou un lien colle. Les
  // lieux ont souvent deja une photo en ligne ; leur imposer un telechargement
  // puis un renvoi n'apporte rien.
  const coverUrlInput = (formData.get('coverUrl') as string | null)?.trim();
  if (coverUrlInput) coverUrl = coverUrlInput;

  const coverFile = formData.get('coverFile') as File | null;
  if (coverFile && coverFile.size > 0) {
    const safeName = coverFile.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.]+/g, '-');
    const path = `${venueId}/${Date.now()}-${safeName}`;
    const bytes = new Uint8Array(await coverFile.arrayBuffer());
    const { error: uploadErr } = await service.storage.from('venue-photos').upload(path, bytes, {
      contentType: coverFile.type,
      upsert: true,
    });
    if (uploadErr) {
      return NextResponse.json({ error: `Échec de l'envoi de la photo : ${uploadErr.message}` }, { status: 400 });
    }
    coverUrl = service.storage.from('venue-photos').getPublicUrl(path).data.publicUrl;
  }

  // On n'ecrit que les champs reellement envoyes. L'ancienne version ecrasait
  // systematiquement nom, ville et rayon : un formulaire partiel — celui de
  // l'admin qui ne change que la photo — aurait vide le reste sans un mot.
  const patch: Record<string, unknown> = { cover_photo_url: coverUrl };

  const name = formData.get('name');
  if (typeof name === 'string' && name.trim()) patch.name = name.trim();

  const city = formData.get('city');
  if (typeof city === 'string' && city.trim()) patch.city = city.trim();

  const radius = formData.get('radius');
  if (radius !== null && radius !== '' && Number.isFinite(Number(radius))) {
    patch.verification_radius_m = Number(radius);
  }

  const lat = formData.get('lat') ? Number(formData.get('lat')) : null;
  const lng = formData.get('lng') ? Number(formData.get('lng')) : null;
  if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
    patch.latitude = lat;
    patch.longitude = lng;
  }

  const { error: updateErr } = await service
    .from('venues')
    .update(patch)
    .eq('id', venueId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, coverUrl });
}
