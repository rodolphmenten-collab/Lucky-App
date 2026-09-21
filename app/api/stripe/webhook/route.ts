import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, planForPriceId } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

// Signature Stripe = hash du corps brut. Toute réécriture du body invalide la
// vérification, d'où le runtime Node et la lecture en texte.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Facturation non configurée' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    // Une signature invalide, c'est soit une mauvaise clé, soit quelqu'un qui
    // essaie de nous faire écrire n'importe quoi : on refuse sans rien traiter.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Signature invalide' },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Stripe peut relivrer le même événement : la contrainte unique sur event_id
  // garantit qu'on ne le traite qu'une fois.
  const { error: dedupeError } = await service
    .from('billing_events')
    .insert({ event_id: event.id, type: event.type, payload: event.data.object as unknown });

  if (dedupeError) {
    if (dedupeError.code === '23505') return NextResponse.json({ received: true, duplicate: true });
    console.error('billing_events insert failed:', dedupeError.message);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const venueId = session.client_reference_id ?? session.metadata?.venue_id ?? null;
        if (!venueId) break;

        await service
          .from('venues')
          .update({
            stripe_customer_id:
              typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
            stripe_subscription_id:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id ?? null,
            subscription_status: 'trialing',
          })
          .eq('id', venueId);

        await service.from('billing_events').update({ venue_id: venueId }).eq('event_id', event.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const venueId = await resolveVenueId(service, sub);
        if (!venueId) break;

        const priceId = sub.items?.data?.[0]?.price?.id ?? null;
        const plan = planForPriceId(priceId);

        await service
          .from('venues')
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
            trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            current_period_end: periodEndIso(sub),
            // Le plan vendu suit le Price effectivement facturé : si le plan est
            // changé dans Stripe, Lucky ne reste pas désynchronisé.
            ...(plan ? { plan } : {}),
          })
          .eq('id', venueId);

        await service.from('billing_events').update({ venue_id: venueId }).eq('event_id', event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        await service
          .from('venues')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Stripe webhook handler failed:', err);
    // On renvoie 500 pour que Stripe rejoue : mieux vaut un doublon (protégé
    // par l'idempotence) qu'un abonnement jamais enregistré.
    return NextResponse.json({ error: 'Traitement échoué' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Depuis l'API 2025-04-30 (Basil), la période courante vit sur les items d'abonnement
 * et non plus sur l'abonnement lui-même. On lit les deux pour rester compatible.
 */
function periodEndIso(sub: Stripe.Subscription): string | null {
  const fromItem = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacy = (sub as any).current_period_end as number | undefined;
  const seconds = fromItem?.current_period_end ?? legacy;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function resolveVenueId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  sub: Stripe.Subscription
): Promise<string | null> {
  const fromMetadata = sub.metadata?.venue_id;
  if (fromMetadata) return fromMetadata;

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;

  const { data } = await service
    .from('venues')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.id ?? null;
}
