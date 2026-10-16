/**
 * CRM établissements — étapes, libellés et calcul des indicateurs fondateur.
 *
 * Un principe : rien n'est inventé. Le MRR vient des abonnements Stripe
 * réellement actifs, le CA généré vient des bons servis. Ce qui n'est que
 * probable (pipeline, essais en cours) est compté à part et nommé comme tel.
 */

import { PLANS, type PlanKey, isPlanKey } from '@/lib/stripe';

export const STAGES = [
  'prospect',
  'contacte',
  'rdv',
  'demo',
  'interesse',
  'signe',
  'perdu',
] as const;

export type Stage = (typeof STAGES)[number];

/** Les étapes qu'on fait défiler sur la tablette, dans l'ordre du cycle de vente. */
export const ACTIVE_STAGES: Stage[] = ['prospect', 'contacte', 'rdv', 'demo', 'interesse', 'signe'];

export const STAGE_LABELS: Record<Stage, string> = {
  prospect: 'Prospect',
  contacte: 'Contacté',
  rdv: 'RDV pris',
  demo: 'Démo faite',
  interesse: 'Intéressé',
  signe: 'Signé',
  perdu: 'Perdu',
};

/** Court, pour les pastilles sur tablette où la place manque. */
export const STAGE_SHORT: Record<Stage, string> = {
  prospect: 'Prospect',
  contacte: 'Contacté',
  rdv: 'RDV',
  demo: 'Démo',
  interesse: 'Intéressé',
  signe: 'Signé',
  perdu: 'Perdu',
};

export const SOURCE_LABELS: Record<string, string> = {
  roadshow: 'Roadshow',
  inbound: 'Formulaire site',
  reseau: 'Réseau',
  terrain: 'Terrain',
  existant: 'Déjà client',
  autre: 'Autre',
};

export function isStage(value: unknown): value is Stage {
  return typeof value === 'string' && (STAGES as readonly string[]).includes(value);
}

export function stageLabel(value: string | null | undefined): string {
  return isStage(value) ? STAGE_LABELS[value] : 'Prospect';
}

export function planMonthlyCents(plan: string | null | undefined): number {
  return isPlanKey(plan) ? PLANS[plan as PlanKey].monthlyCentsExclTax : 0;
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatEurosPrecise(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export interface VenueRow {
  id: string;
  name: string;
  plan: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

export interface CrmRow {
  id: string;
  venue_id: string | null;
  stage: string;
  expected_plan: string | null;
  next_action_at: string | null;
  owner_email: string | null;
}

export interface FounderKpis {
  /** Abonnements réellement facturés aujourd'hui. */
  mrrCents: number;
  arrCents: number;
  payingVenues: number;

  /** Essais en cours : du revenu probable, jamais mélangé au MRR. */
  trialMrrCents: number;
  trialVenues: number;
  trialsEndingIn7Days: number;

  /** Signés mais pas encore passés à la caisse : le travail qui reste à finir. */
  signedNotBilled: number;

  /** Pipeline commercial, pondéré par l'étape. */
  pipelineVenues: number;
  pipelineMrrCents: number;
  weightedPipelineMrrCents: number;

  /** Impayés — le seul chiffre rouge qui mérite d'être en haut de page. */
  pastDueVenues: number;

  /** Relances dues aujourd'hui ou en retard. */
  actionsDue: number;
  actionsOverdue: number;
}

/**
 * Probabilité de signature par étape. Volontairement prudente : un pipeline
 * pondéré qui flatte ne sert à rien, ni pour décider ni devant un investisseur.
 */
const STAGE_WEIGHT: Record<Stage, number> = {
  prospect: 0.05,
  contacte: 0.15,
  rdv: 0.3,
  demo: 0.5,
  interesse: 0.7,
  signe: 1,
  perdu: 0,
};

export function computeFounderKpis(venues: VenueRow[], crm: CrmRow[], today = new Date()): FounderKpis {
  const paying = venues.filter((v) => v.subscription_status === 'active');
  const trialing = venues.filter((v) => v.subscription_status === 'trialing');
  const pastDue = venues.filter((v) => v.subscription_status === 'past_due' || v.subscription_status === 'unpaid');

  const mrrCents = paying.reduce((sum, v) => sum + planMonthlyCents(v.plan), 0);
  const trialMrrCents = trialing.reduce((sum, v) => sum + planMonthlyCents(v.plan), 0);

  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const trialsEndingIn7Days = trialing.filter(
    (v) => v.trial_ends_at && new Date(v.trial_ends_at) <= in7Days
  ).length;

  const billedVenueIds = new Set(
    venues.filter((v) => v.subscription_status !== 'none').map((v) => v.id)
  );

  const openCrm = crm.filter((c) => c.stage !== 'perdu');

  // Le pipeline, c'est ce qui n'est pas encore facturé. Un lieu signé dont
  // l'abonnement tourne déjà est du MRR, pas du pipeline — le compter deux fois
  // serait le plus facile des mensonges.
  const pipeline = openCrm.filter((c) => !c.venue_id || !billedVenueIds.has(c.venue_id));

  const pipelineMrrCents = pipeline.reduce((sum, c) => sum + planMonthlyCents(c.expected_plan), 0);
  const weightedPipelineMrrCents = Math.round(
    pipeline.reduce(
      (sum, c) => sum + planMonthlyCents(c.expected_plan) * (STAGE_WEIGHT[c.stage as Stage] ?? 0),
      0
    )
  );

  const todayKey = toDateKey(today);
  const withAction = openCrm.filter((c) => c.next_action_at);
  const actionsDue = withAction.filter((c) => c.next_action_at! <= todayKey).length;
  const actionsOverdue = withAction.filter((c) => c.next_action_at! < todayKey).length;

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    payingVenues: paying.length,
    trialMrrCents,
    trialVenues: trialing.length,
    trialsEndingIn7Days,
    signedNotBilled: openCrm.filter(
      (c) => c.stage === 'signe' && (!c.venue_id || !billedVenueIds.has(c.venue_id))
    ).length,
    pipelineVenues: pipeline.length,
    pipelineMrrCents,
    weightedPipelineMrrCents,
    pastDueVenues: pastDue.length,
    actionsDue,
    actionsOverdue,
  };
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Le ratio qui tient tout l'argumentaire commercial : combien d'euros Lucky a
 * mis dans la caisse du lieu pour chaque euro d'abonnement facturé. En dessous
 * de 1, le produit ne se paie pas tout seul et il faut le savoir avant le client.
 */
export function roiRatio(revenueGeneratedCents: number, mrrCents: number): number | null {
  if (mrrCents <= 0) return null;
  return revenueGeneratedCents / mrrCents;
}
