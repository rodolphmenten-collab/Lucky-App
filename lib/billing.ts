import type Stripe from 'stripe';
import {
  getStripe,
  isOneShot,
  priceIdForPlan,
  couponIdForCommitment,
  couponIdForRemiseSoiree,
  automaticTaxEnabled,
  TRIAL_DAYS,
  DEFAULT_COMMITMENT,
  type PlanKey,
  type CommitmentMonths,
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
/**
 * Le coupon Stripe d'une remise de soirée, créé au premier usage.
 *
 * Les remises d'engagement ont leurs coupons posés une fois pour toutes par le
 * script d'installation. Pour les soirées, la remise se décide en rendez-vous :
 * demander à quelqu'un d'aller d'abord créer un coupon dans Stripe, c'est
 * garantir qu'un jour le lien partira au prix fort. On le crée donc ici s'il
 * manque, et on le réutilise ensuite.
 */
async function couponSoiree(stripe: Stripe, pct: number): Promise<string | null> {
  const id = couponIdForRemiseSoiree(pct);
  if (!id) return null;

  try {
    await stripe.coupons.retrieve(id);
    return id;
  } catch {
    // Absent : on le crée. Une course entre deux envois simultanés ferait
    // échouer la création — on retente alors la lecture.
  }

  try {
    await stripe.coupons.create({
      id,
      percent_off: pct,
      duration: 'once',
      name: `Soirée Lucky — remise ${pct} %`,
    });
    return id;
  } catch (err) {
    try {
      await stripe.coupons.retrieve(id);
      return id;
    } catch {
      console.error('billing : coupon de remise soirée indisponible —', err);
      return null;
    }
  }
}

export async function createVenueCheckoutSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  venue: VenueBillingRow,
  plan: PlanKey,
  commitmentMonths: CommitmentMonths = DEFAULT_COMMITMENT,
  /** Remise consentie sur une soirée, en pourcentage. Ignorée hors soirée. */
  remiseSoireePct: number = 0
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

  // Un identifiant client peut être périmé : créé en mode test alors que la
  // clé est passée en production, ou supprimé à la main dans Stripe. Dans ce
  // cas Stripe répond « No such customer » et tout s'arrête. On vérifie donc
  // qu'il existe encore, et on le remplace sinon plutôt que d'échouer.
  if (customerId) {
    try {
      const existant = await stripe.customers.retrieve(customerId);
      if ((existant as Stripe.DeletedCustomer).deleted) customerId = null;
    } catch {
      customerId = null;
    }
    if (!customerId) {
      console.warn(`billing : client Stripe introuvable pour ${venue.name}, un nouveau sera créé.`);
    }
  }

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
    const { error: erreurClient } = await service
      .from('venues')
      .update({ stripe_customer_id: customerId })
      .eq('id', venue.id);
    if (erreurClient) {
      // Sans cet enregistrement, chaque envoi recréerait un client : autant le
      // dire tout de suite plutôt que de laisser des doublons s'accumuler.
      return { error: `Client Stripe créé mais non enregistré : ${erreurClient.message}` };
    }
  }

  // Une soirée se paie une fois : pas d'abonnement, pas d'essai de 30 jours
  // (il n'y aurait rien à essayer), pas de remise d'engagement. On demande
  // quand même la facture, parce que le lieu la réclamera.
  const soiree = isOneShot(plan);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: soiree ? 'payment' : 'subscription',
    customer: customerId,
    client_reference_id: venue.id,
    locale: 'fr',
    line_items: [{ price: priceId, quantity: 1 }],
    // La carte est enregistrée à la signature ; le premier prélèvement a lieu
    // à la fin de l'essai.
    metadata: { venue_id: venue.id, plan, commitment_months: String(commitmentMonths) },
    billing_address_collection: 'required',
    // B2B : on collecte le numéro de TVA intracommunautaire pour les factures.
    tax_id_collection: { enabled: true },
    // Surtout pas /dashboard : le lieu qui vient de payer n'a pas de session
    // ouverte et tomberait sur un écran de connexion juste après avoir payé.
    success_url: `${siteUrl}/abonnement?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/abonnement?annule=1`,
  };

  if (soiree) {
    params.invoice_creation = { enabled: true };
    params.payment_intent_data = {
      metadata: { venue_id: venue.id, plan },
    };
  } else {
    // La carte est enregistrée à la signature ; le premier prélèvement a lieu
    // à la fin de l'essai.
    params.payment_method_collection = 'always';
    params.subscription_data = {
      trial_period_days: TRIAL_DAYS,
      metadata: { venue_id: venue.id, plan, commitment_months: String(commitmentMonths) },
    };
  }

  // La remise est portée par un coupon. Sans lui, le lieu signe un contrat à
  // 134,10 € et se fait prelever 149 € : l'ecart ne se voit qu'a la premiere
  // facture, c'est-a-dire trente jours trop tard. Même principe pour une
  // soirée négociée.
  const couponId = soiree
    ? await couponSoiree(stripe, remiseSoireePct)
    : couponIdForCommitment(commitmentMonths);
  if (couponId) {
    params.discounts = [{ coupon: couponId }];
  }

  // tax_id_collection exige que Stripe puisse completer le client existant, et
  // il lui faut les deux champs : le nom (raison sociale portee sur la facture)
  // et l'adresse (le numero de TVA se verifie contre un pays). Sans eux la
  // session est refusee, d'abord sur le nom puis sur l'adresse.
  //
  // Ce reglage ne depend pas de Stripe Tax : il est requis des qu'on collecte
  // un numero de TVA, ce qu'on fait sur chaque session.
  params.customer_update = { address: 'auto', name: 'auto' };

  if (automaticTaxEnabled()) {
    params.automatic_tax = { enabled: true };
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
