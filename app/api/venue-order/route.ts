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
  const productId = formData.get('productId') as string;
  const productName = formData.get('productName') as string;
  const quantity = Number(formData.get('quantity'));
  const customText = (formData.get('customText') as string) || null;
  const logoFile = formData.get('logoFile') as File | null;

  if (!venueId || !productId || !productName || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();

  const [{ data: ownerRow }, isPlatformAdmin] = await Promise.all([
    service.from('venue_admins').select('id').eq('venue_id', venueId).eq('user_id', user.id).maybeSingle(),
    isPlatformAdminEmail(user.email),
  ]);

  if (!ownerRow && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  let logoUrl: string | null = null;
  if (logoFile && logoFile.size > 0) {
    const path = `${venueId}/logo-${Date.now()}-${logoFile.name}`;
    const bytes = new Uint8Array(await logoFile.arrayBuffer());
    const { error: uploadErr } = await service.storage.from('venue-photos').upload(path, bytes, {
      contentType: logoFile.type,
      upsert: true,
    });
    if (uploadErr) {
      return NextResponse.json({ error: `Échec de l'envoi du logo : ${uploadErr.message}` }, { status: 400 });
    }
    logoUrl = service.storage.from('venue-photos').getPublicUrl(path).data.publicUrl;
  }

  const { error } = await service.from('venue_orders').insert({
    venue_id: venueId,
    ordered_by: user.id,
    product_id: productId,
    product_name: productName,
    quantity,
    custom_text: customText,
    logo_url: logoUrl,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
