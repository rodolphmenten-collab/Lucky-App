import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { insertWithUniqueCode, formatPrice } from '@/lib/luckyCodes';
import { sendPushToUser } from '@/lib/push';

/**
 * « J'offre un verre » — crée un bon.
 *
 * Le montant n'est jamais saisi par le client ni par le staff : il vient de la
 * carte du lieu. Le bon porte un code que le client montre au bar ; le barman
 * sert et met sur l'addition, exactement comme pour n'importe quelle commande.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId, itemId } = await request.json();
  if (!matchId || !itemId) {
    return NextResponse.json({ error: 'Missing matchId/itemId' }, { status: 400 });
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, venue_id')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const service = createServiceClient();

  const [{ data: item }, { data: venue }] = await Promise.all([
    service
      .from('venue_menu_items')
      .select('id, venue_id, name, price_cents, active')
      .eq('id', itemId)
      .maybeSingle(),
    service.from('venues').select('lucky_discount_percent').eq('id', match.venue_id).maybeSingle(),
  ]);

  // L'article doit appartenir à la carte du lieu où la rencontre a eu lieu.
  if (!item || !item.active || item.venue_id !== match.venue_id) {
    return NextResponse.json({ error: 'Article indisponible' }, { status: 400 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  // Remise figée à la commande : une renégociation ne doit pas réécrire le
  // CA déjà attribué.
  const discountPercent = Math.max(0, Math.min(100, venue?.lucky_discount_percent ?? 0));
  const netPriceCents = Math.round((item.price_cents * (100 - discountPercent)) / 100);

  const { data: meetup } = await service
    .from('meetups')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  const { data: order, error } = await insertWithUniqueCode<Record<string, unknown>>(
    'lucky_orders',
    service,
    {
      match_id: matchId,
      meetup_id: meetup?.id ?? null,
      venue_id: match.venue_id,
      from_user: user.id,
      to_user: otherId,
      item_id: item.id,
      // figés : la carte peut changer, l'historique du CA ne bouge pas
      item_name: item.name,
      price_cents: item.price_cents,
      discount_percent: discountPercent,
      net_price_cents: netPriceCents,
      status: 'pending',
    },
    'B'
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  (async () => {
    try {
      const { data: sender } = await service.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      await sendPushToUser(service, otherId, {
        title: `${sender?.first_name ?? 'Quelqu’un'} vous offre un verre`,
        body: `${item.name} · ${formatPrice(netPriceCents)}`,
        url: `/chat/${matchId}`,
      });
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  })();

  return NextResponse.json({ order });
}
