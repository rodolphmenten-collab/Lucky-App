import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, planForPriceId } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail, emailShell } from '@/lib/email';

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

        const clientId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

        if (session.mode === 'payment') {
          // Soirée payée d'un coup : il n'y a pas d'abonnement derrière, donc
          // pas de statut à poser — l'écrire en « trialing » ferait croire à
          // un essai qui se transformerait, et gonflerait le MRR dans trente
          // jours. On allume le lieu, c'est tout ; il sera éteint à la main
          // après la soirée.
          const montant = session.amount_total ?? 0;

          await service
            .from('venues')
            .update({
              stripe_customer_id: clientId,
              active: true,
              deactivated_at: null,
              deactivation_reason: null,
              soiree_paid_at: new Date().toISOString(),
              soiree_amount_cents: montant,
            })
            .eq('id', venueId);

          // Une ligne dans le suivi commercial. Sans elle, le paiement
          // n'existait nulle part dans le CRM : la fiche gardait son dernier
          // statut d'abonnement, et on rappelait un lieu qui avait déjà payé.
          const { data: fiche } = await service
            .from('crm_venues')
            .select('id')
            .eq('venue_id', venueId)
            .maybeSingle();

          if (fiche?.id) {
            await service.from('crm_notes').insert({
              crm_venue_id: fiche.id,
              author_email: 'stripe',
              kind: 'paiement',
              body: `Soirée payée — ${(montant / 100).toFixed(2).replace('.', ',')} €`,
            });
          }
        } else {
          await service
            .from('venues')
            .update({
              stripe_customer_id: clientId,
              stripe_subscription_id:
                typeof session.subscription === 'string'
                  ? session.subscription
                  : session.subscription?.id ?? null,
              subscription_status: 'trialing',
            })
            .eq('id', venueId);
        }

        await service.from('billing_events').update({ venue_id: venueId }).eq('event_id', event.id);

        // Accusé de réception au lieu. Il vient de saisir sa carte sur une
        // page Stripe et retombe sur une page de remerciement : sans ce mail,
        // il n'a aucune trace écrite de ce qu'il a souscrit, et c'est nous
        // qu'il rappelle le lendemain pour demander si c'est bien passé.
        //
        // L'envoi ne doit jamais faire échouer le webhook : Stripe
        // réessaierait l'événement et le lieu serait mis à jour deux fois.
        try {
          const { data: lieu } = await service
            .from('venues')
            .select('name, contact_email')
            .eq('id', venueId)
            .maybeSingle();

          if (lieu?.contact_email) {
            const soiree = session.mode === 'payment';
            await sendEmail({
              to: lieu.contact_email,
              subject: soiree
                ? `Votre soirée Lucky est confirmée — ${lieu.name}`
                : `Votre abonnement Lucky est activé — ${lieu.name}`,
              html: emailShell(
                soiree
                  ? `<h1 style="font-size:22px;margin:0 0 16px;">C'est confirmé</h1>
                     <p style="font-size:14px;line-height:1.6;color:#333;">
                       Votre paiement est bien reçu et Lucky est actif pour ${lieu.name}.
                       Vos supports n'ont qu'à rester sur les tables : vos clients scannent, et
                       la soirée fait le reste.
                     </p>
                     <p style="font-size:14px;line-height:1.6;color:#333;">
                       Votre facture vous parvient séparément. Une question d'ici là, répondez
                       simplement à ce message.
                     </p>`
                  : `<h1 style="font-size:22px;margin:0 0 16px;">Bienvenue chez Lucky</h1>
                     <p style="font-size:14px;line-height:1.6;color:#333;">
                       Votre carte est enregistrée et l'abonnement de ${lieu.name} est actif.
                       Les trente premiers jours sont offerts : rien ne sera prélevé avant la
                       fin de cette période.
                     </p>
                     <p style="font-size:14px;line-height:1.6;color:#333;">
                       Vous pouvez arrêter à tout moment pendant l'essai, par simple réponse à
                       ce message, sans justification ni frais.
                     </p>`,
              ),
            });
          }
        } catch (err) {
          console.error('webhook : mail de confirmation non envoyé —', err);
        }

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
            //
            // Sauf à la résiliation : un abonnement qui s'arrête ne dit plus
            // quelle formule le lieu a aujourd'hui. Le réécrire ici effaçait
            // une soirée vendue depuis, et rendait au lieu une formule
            // mensuelle qu'il venait justement de quitter.
            ...(plan && event.type !== 'customer.subscription.deleted' ? { plan } : {}),
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
