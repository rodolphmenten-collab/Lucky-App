import type Stripe from 'stripe';
import {
  getStripe,
  priceIdForPlan,
  automaticTaxEnabled,
  TRIAL_DAYS,
  type PlanKey,
} from '@/lib/stripe';

export interface VenueBillingRow {
  id: string;
  name: string;
  contact_email: string | null;
  contact_name: string | null;
  stripe_customer_id: string | null;
}

/**
 * Crée une session Checkout d'abonnement pour un établissement donné.
 *
 * Deux choses comptent ici :
 *  - le lieu est rattaché à la session (client_reference_id + metadata), donc
 *    le webhook sait sans ambiguïté qui vient de payer. Aucun rapprochement
 *    manuel entre un paiement et un établissement.
 *  - le client Stripe est réutilisé s'il existe déjà, pour qu'un lieu n'ait pas
 *    deux fiches client après un lien renvoyé.
 */
export async function createVenueCheckoutSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  venue: VenueBillingRow,
  plan: PlanKey
): Promise<{ url?: string; error?: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'STRIPE_SECRET_KEY absente — facturation non configurée.' };

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return { error: `Price Stripe manquant pour le plan ${plan} (voir scripts/stripe-setup.mjs).` };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!siteUrl) return { error: 'NEXT_PUBLIC_SITE_URL absente.' };

  let customerId = venue.stripe_customer_id;

  if (!customerId) {
    if (!venue.contact_email) {
      return { error: 'Cet établissement n’a pas d’email de contact — renseignez-le avant d’envoyer le lien.' };
    }
    const customer = await stripe.customers.create({
      email: venue.contact_email,
      name: venue.name,
      metadata: { venue_id: venue.id },
    });
    customerId = customer.id;
    await service.from('venues').update({ stripe_customer_id: customerId }).eq('id', venue.id);
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: venue.id,
    locale: 'fr',
    line_items: [{ price: priceId, quantity: 1 }],
    // La carte est enregistrée à la signature ; le premier prélèvement a lieu
    // à la fin de l'essai.
    payment_method_collection: 'always',
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { venue_id: venue.id, plan },
    },
    metadata: { venue_id: venue.id, plan },
    billing_address_collection: 'required',
    // B2B : on collecte le numéro de TVA intracommunautaire pour les factures.
    tax_id_collection: { enabled: true },
    // Surtout pas /dashboard : le lieu qui vient de payer n'a pas de session
    // ouverte et tomberait sur un écran de connexion juste après avoir payé.
    success_url: `${siteUrl}/abonnement?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/abonnement?annule=1`,
  };

  if (automaticTaxEnabled()) {
    params.automatic_tax = { enabled: true };
    params.customer_update = { address: 'auto', name: 'auto' };
  }

  try {
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) return { error: 'Stripe n’a pas renvoyé d’URL de paiement.' };
    await service.from('venues').update({ checkout_sent_at: new Date().toISOString() }).eq('id', venue.id);
    return { url: session.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Échec de la création de la session Stripe.' };
  }
}

const STATUS_LABELS: Record<string, string> = {
  none: 'Aucun abonnement',
  trialing: 'Essai en cours',
  active: 'Actif',
  past_due: 'Impayé',
  unpaid: 'Impayé',
  canceled: 'Résilié',
  incomplete: 'Paiement incomplet',
  incomplete_expired: 'Paiement abandonné',
  paused: 'En pause',
};

export function subscriptionStatusLabel(status: string | null | undefined): string {
  return STATUS_LABELS[status ?? 'none'] ?? (status ?? 'Inconnu');
}
