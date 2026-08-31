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
  const coverFile = formData.get('coverFile') as File | null;
  if (coverFile && coverFile.size > 0) {
    const path = `${venueId}/${Date.now()}-${coverFile.name}`;
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

  const name = formData.get('name') as string;
  const city = formData.get('city') as string;
  const radius = Number(formData.get('radius'));
  const lat = formData.get('lat') ? Number(formData.get('lat')) : null;
  const lng = formData.get('lng') ? Number(formData.get('lng')) : null;

  const { error: updateErr } = await service
    .from('venues')
    .update({
      name,
      city,
      cover_photo_url: coverUrl,
      verification_radius_m: radius,
      ...(lat !== null && lng !== null ? { latitude: lat, longitude: lng } : {}),
    })
    .eq('id', venueId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, coverUrl });
}
