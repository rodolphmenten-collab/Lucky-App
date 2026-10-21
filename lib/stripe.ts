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
  /** Nombre de supports inclus dans la formule. C'est lui qui détermine la
   *  formule : on vend une couverture de salle, pas une liste de fonctions.
   *  Le produit est identique dans les trois formules. */
  supportsIncluded: number;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  basique: {
    key: 'basique',
    label: 'Basique',
    monthlyCentsExclTax: 9900,
    priceIdEnv: 'STRIPE_PRICE_BASIQUE',
    supportsIncluded: 10,
  },
  essentiel: {
    key: 'essentiel',
    label: 'Essentiel',
    monthlyCentsExclTax: 14900,
    priceIdEnv: 'STRIPE_PRICE_ESSENTIEL',
    supportsIncluded: 25,
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    monthlyCentsExclTax: 29900,
    priceIdEnv: 'STRIPE_PRICE_PREMIUM',
    supportsIncluded: 40,
  },
};

export const TRIAL_DAYS = 30;

// ---------------------------------------------------------------------------
// Durées d'engagement
//
// La remise passe par un coupon Stripe appliqué au prix mensuel, pas par un
// prix dédié par durée : trois prix et deux coupons se redupliquent plus
// facilement qu'une grille de neuf prix, et la remise apparaît en clair sur
// la facture du lieu.
//
// L'engagement lui-même n'est pas tenu par Stripe mais par le contrat : Stripe
// ne sait pas refuser une résiliation anticipée. C'est l'article 10 du contrat
// qui rend les mensualités restantes exigibles.
// ---------------------------------------------------------------------------

export type CommitmentMonths = 3 | 6 | 12;

export interface CommitmentDefinition {
  months: CommitmentMonths;
  label: string;
  /** Remise en pourcentage appliquée au prix mensuel. */
  discountPercent: number;
  /** Identifiant du coupon Stripe. Surchargeable par variable d'environnement
   *  pour le jour où le compte Stripe change. */
  couponIdEnv: string | null;
  defaultCouponId: string | null;
}

export const COMMITMENTS: Record<CommitmentMonths, CommitmentDefinition> = {
  3: {
    months: 3,
    label: '3 mois',
    discountPercent: 0,
    couponIdEnv: null,
    defaultCouponId: null,
  },
  6: {
    months: 6,
    label: '6 mois',
    discountPercent: 10,
    couponIdEnv: 'STRIPE_COUPON_6M',
    defaultCouponId: 'engagement-6-mois',
  },
  12: {
    months: 12,
    label: '12 mois',
    discountPercent: 20,
    couponIdEnv: 'STRIPE_COUPON_12M',
    defaultCouponId: 'engagement-12-mois',
  },
};

export const DEFAULT_COMMITMENT: CommitmentMonths = 3;

export function isCommitmentMonths(value: unknown): value is CommitmentMonths {
  return value === 3 || value === 6 || value === 12;
}

export function couponIdForCommitment(months: CommitmentMonths): string | null {
  const c = COMMITMENTS[months];
  if (!c.couponIdEnv) return null;
  return process.env[c.couponIdEnv] ?? c.defaultCouponId;
}

/**
 * Montant mensuel HT après remise, en centimes.
 *
 * Affichage uniquement, comme `monthlyCentsExclTax` : ce qui est facturé est
 * le prix Stripe diminué du coupon. Les deux doivent concorder — s'ils
 * divergent, c'est le coupon Stripe qui fait foi, pas cette fonction.
 */
export function monthlyCentsAfterDiscount(plan: PlanKey, months: CommitmentMonths): number {
  const base = PLANS[plan].monthlyCentsExclTax;
  const pct = COMMITMENTS[months].discountPercent;
  if (!pct) return base;
  return Math.round((base * (100 - pct)) / 100);
}

export function formatCentsExclTax(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

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
