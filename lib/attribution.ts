/**
 * Attribution du CA généré par Lucky pour un établissement.
 *
 * Trois niveaux, jamais mélangés dans un seul chiffre :
 *
 *  - CERTIFIÉ : commandes passées dans Lucky et dont la réception a été
 *    confirmée. Le montant vient de la carte du lieu, personne ne l'a saisi
 *    à la main, il n'est pas discutable.
 *  - EN ATTENTE : bons émis pas encore confirmés reçus. Montré à part, jamais
 *    compté comme du CA.
 *  - ESTIMÉ : rencontres confirmées qui n'ont donné lieu à aucune commande
 *    Lucky, valorisées au panier moyen déclaré par le lieu. Toujours affiché
 *    comme une estimation.
 *
 * Appelé côté serveur avec un client service role, après vérification
 * explicite que l'appelant est admin du lieu ou admin plateforme.
 */

export interface AttributionStats {
  meetupsConfirmedToday: number;
  meetupsConfirmed: number;
  ordersServed: number;
  ordersPending: number;
  revenueCertifiedCents: number;
  revenuePendingCents: number;
  meetupsWithoutOrder: number;
  averageTicketCents: number | null;
  revenueEstimatedCents: number;
  discountGrantedCents: number;
  windowDays: number;
}

const WINDOW_DAYS = 30;

export interface TodayOrder {
  id: string;
  code: string;
  item_name: string;
  price_cents: number;
  discount_percent: number;
  net_price_cents: number | null;
  status: string;
  created_at: string;
}

/**
 * Les bons émis aujourd'hui, pour recouper avec la caisse en fin de service.
 * C'est la contrepartie du « zéro saisie » : personne ne tape le code, mais le
 * patron doit pouvoir vérifier que chaque bon correspond bien à une ligne
 * d'addition.
 */
export async function getTodayOrders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  venueId: string
): Promise<TodayOrder[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data } = await service
    .from('lucky_orders')
    .select('id, code, item_name, price_cents, discount_percent, net_price_cents, status, created_at')
    .eq('venue_id', venueId)
    .gte('created_at', startOfToday.toISOString())
    .order('created_at', { ascending: false });

  return (data ?? []) as TodayOrder[];
}

export async function getAttributionStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  venueId: string,
  averageTicketCents: number | null
): Promise<AttributionStats> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [meetupsRes, ordersRes] = await Promise.all([
    service
      .from('meetups')
      .select('id, match_id, confirmed_at')
      .eq('venue_id', venueId)
      .eq('status', 'confirmed')
      .gte('confirmed_at', since),
    service
      .from('lucky_orders')
      .select('id, match_id, price_cents, net_price_cents, status, created_at')
      .eq('venue_id', venueId)
      .gte('created_at', since),
  ]);

  const meetups: { id: string; match_id: string; confirmed_at: string | null }[] = meetupsRes.data ?? [];
  const orders: { match_id: string; price_cents: number; net_price_cents: number | null; status: string }[] =
    ordersRes.data ?? [];

  // Le CA attribué est ce qui entre réellement en caisse, remise déduite.
  const net = (o: { price_cents: number; net_price_cents: number | null }) =>
    o.net_price_cents ?? o.price_cents;

  const served = orders.filter((o) => o.status === 'served');
  const pending = orders.filter((o) => o.status === 'pending');

  const matchesWithOrder = new Set(orders.map((o) => o.match_id));
  const meetupsWithoutOrder = meetups.filter((m) => !matchesWithOrder.has(m.match_id)).length;

  return {
    meetupsConfirmedToday: meetups.filter(
      (m) => m.confirmed_at && new Date(m.confirmed_at) >= startOfToday
    ).length,
    meetupsConfirmed: meetups.length,
    ordersServed: served.length,
    ordersPending: pending.length,
    revenueCertifiedCents: served.reduce((sum, o) => sum + net(o), 0),
    revenuePendingCents: pending.reduce((sum, o) => sum + net(o), 0),
    meetupsWithoutOrder,
    averageTicketCents: averageTicketCents ?? null,
    revenueEstimatedCents: averageTicketCents ? meetupsWithoutOrder * averageTicketCents : 0,
    discountGrantedCents: served.reduce((sum, o) => sum + ((o.price_cents ?? 0) - net(o)), 0),
    windowDays: WINDOW_DAYS,
  };
}
