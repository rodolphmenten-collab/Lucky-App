import Stripe from 'stripe';

/**
 * Client Stripe côté serveur uniquement. La clé secrète n'est jamais exposée
 * au navigateur : tout passe par des routes API.
 *
 * Volontairement paresseux — l'absence de clé ne doit pas casser le build ni
 * les pages qui ne facturent rien (même logique que ANTHROPIC_API_KEY pour les
 * suggestions IA : la fonctionnalité échoue proprement, le reste tourne).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia' });
}

export type PlanKey = 'basique' | 'essentiel' | 'premium';

export interface PlanDefinition {
  key: PlanKey;
  label: string;
  /** Prix mensuel HT, en centimes. Affichage uniquement : le montant facturé
   *  est celui du Price Stripe, jamais celui-ci. */
  monthlyCentsExclTax: number;
  priceIdEnv: string;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  basique: {
    key: 'basique',
    label: 'Basique',
    monthlyCentsExclTax: 9900,
    priceIdEnv: 'STRIPE_PRICE_BASIQUE',
  },
  essentiel: {
    key: 'essentiel',
    label: 'Essentiel',
    monthlyCentsExclTax: 14900,
    priceIdEnv: 'STRIPE_PRICE_ESSENTIEL',
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    monthlyCentsExclTax: 29900,
    priceIdEnv: 'STRIPE_PRICE_PREMIUM',
  },
};

export const TRIAL_DAYS = 30;

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && value in PLANS;
}

export function priceIdForPlan(plan: PlanKey): string | null {
  return process.env[PLANS[plan].priceIdEnv] ?? null;
}

/** Plan correspondant à un Price Stripe, pour retrouver le plan vendu depuis un webhook. */
export function planForPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (process.env[plan.priceIdEnv] === priceId) return plan.key;
  }
  return null;
}

/**
 * Stripe Tax calcule et applique la TVA (20 % en France) au-dessus d'un prix HT.
 * Désactivé par défaut : tant que Stripe Tax n'est pas activé sur le compte,
 * une session avec automatic_tax échoue. On l'allume par variable
 * d'environnement une fois la configuration faite côté Stripe.
 */
export function automaticTaxEnabled(): boolean {
  return process.env.STRIPE_AUTOMATIC_TAX === 'true';
}

export function formatPriceExclTax(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} € HT`;
}
