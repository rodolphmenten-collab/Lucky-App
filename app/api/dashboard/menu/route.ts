import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

interface IncomingItem {
  id?: string | null;
  name: string;
  priceCents: number;
  category: string;
}

const CATEGORIES = ['drink', 'bottle', 'food', 'other'];

/**
 * Enregistrement de la carte du lieu, de l'avantage Lucky et du panier moyen.
 *
 * Autorisation explicite côté serveur (admin du lieu OU admin plateforme en
 * mode consultation), écriture en service role : le mode « admin viewing » ne
 * change pas auth.uid(), une écriture directe depuis le navigateur échouerait
 * silencieusement sous RLS.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const venueId: string = body.venueId;
  if (!venueId) return NextResponse.json({ error: 'Missing venueId' }, { status: 400 });

  const service = createServiceClient();

  const [{ data: ownerRow }, isPlatformAdmin] = await Promise.all([
    service.from('venue_admins').select('id').eq('venue_id', venueId).eq('user_id', user.id).maybeSingle(),
    isPlatformAdminEmail(user.email),
  ]);

  if (!ownerRow && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Not authorized for this venue' }, { status: 403 });
  }

  const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .filter((i) => i && typeof i.name === 'string' && i.name.trim().length > 0)
    .slice(0, 60)
    .map((i, index) => ({
      id: i.id && String(i.id).length > 20 ? String(i.id) : null,
      name: i.name.trim().slice(0, 80),
      price_cents: Math.max(0, Math.min(1000000, Math.round(Number(i.priceCents) || 0))),
      category: CATEGORIES.includes(i.category) ? i.category : 'drink',
      sort_order: index,
    }));

  // Avantage + panier moyen
  const perkLabel = typeof body.perkLabel === 'string' ? body.perkLabel.trim().slice(0, 120) : '';
  const averageTicket =
    body.averageTicketCents === null || body.averageTicketCents === undefined || body.averageTicketCents === ''
      ? null
      : Math.max(0, Math.min(1000000, Math.round(Number(body.averageTicketCents) || 0)));

  const discountPercent = Math.max(0, Math.min(100, Math.round(Number(body.discountPercent) || 0)));

  const { error: venueErr } = await service
    .from('venues')
    .update({
      perk_label: perkLabel || null,
      average_ticket_cents: averageTicket,
      lucky_discount_percent: discountPercent,
    })
    .eq('id', venueId);

  if (venueErr) return NextResponse.json({ error: venueErr.message }, { status: 400 });

  // Les articles retirés sont désactivés, jamais supprimés : les commandes
  // passées gardent leur référence et l'historique du CA reste lisible.
  const keptIds = items.map((i) => i.id).filter(Boolean) as string[];
  const { data: existing } = await service
    .from('venue_menu_items')
    .select('id')
    .eq('venue_id', venueId)
    .eq('active', true);

  const toDeactivate = (existing ?? [])
    .map((r: { id: string }) => r.id)
    .filter((id: string) => !keptIds.includes(id));

  if (toDeactivate.length > 0) {
    await service.from('venue_menu_items').update({ active: false }).in('id', toDeactivate);
  }

  for (const item of items) {
    if (item.id) {
      const { error } = await service
        .from('venue_menu_items')
        .update({
          name: item.name,
          price_cents: item.price_cents,
          category: item.category,
          sort_order: item.sort_order,
          active: true,
        })
        .eq('id', item.id)
        .eq('venue_id', venueId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await service.from('venue_menu_items').insert({
        venue_id: venueId,
        name: item.name,
        price_cents: item.price_cents,
        category: item.category,
        sort_order: item.sort_order,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const { data: saved } = await service
    .from('venue_menu_items')
    .select('id, name, price_cents, category, sort_order')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return NextResponse.json({ ok: true, items: saved ?? [] });
}
