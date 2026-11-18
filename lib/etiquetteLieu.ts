/**
 * L'étiquette d'état d'un établissement.
 *
 * Elle répondait jusqu'ici au seul statut d'abonnement Stripe, ce qui
 * affichait « Résilié » sur un lieu qui n'a jamais rien eu à résilier et qui
 * reçoit une soirée la semaine suivante. Ce qu'on veut lire d'un coup d'œil
 * sur cette liste, c'est où en est la relation commerciale : rien tant que le
 * contrat n'est pas signé, puis ce qui a été signé.
 *
 * Les couleurs suivent une progression, du plus froid au plus chaud :
 * gris pour l'essai, bleu pour la soirée payée, laiton pâle puis laiton pour
 * l'abonnement, vert pour l'engagement d'un an. Un impayé passe devant tout
 * le reste, parce que c'est la seule ligne sur laquelle il faut agir le jour
 * même.
 */

export interface Etiquette {
  libelle: string;
  /** Classes de bordure et de texte, à poser sur la pastille. */
  classe: string;
  /** Pour les tests et le tri : la clé logique, sans la présentation. */
  cle:
    | 'impaye'
    | 'resilie'
    | 'soiree-test'
    | 'soiree'
    | 'abo-3'
    | 'abo-6'
    | 'abo-12'
    | 'abo';
}

export interface EtatLieu {
  /** Date de signature du contrat. Rien ne s'affiche tant qu'elle est nulle. */
  contratSigneLe?: string | null;
  /** Formule : 'soiree' ou une formule d'abonnement. */
  plan?: string | null;
  /** Durée d'engagement en mois, pour les abonnements. */
  engagementMois?: number | null;
  /** Soirée annoncée comme offerte sur la fiche. */
  soireeOfferte?: boolean | null;
  /** Soirée réglée (ou honorée à zéro euro). */
  soireePayeeLe?: string | null;
  /** Montant réellement encaissé pour la soirée, en centimes. */
  soireeMontantCents?: number | null;
  /** Statut de l'abonnement côté Stripe. */
  statutAbonnement?: string | null;
}

const IMPAYES = new Set(['past_due', 'unpaid', 'incomplete_expired']);
const FINIS = new Set(['canceled', 'incomplete']);

export function etiquetteLieu(e: EtatLieu): Etiquette | null {
  // Rien avant la signature. Un lieu en cours de discussion vit dans le
  // pipeline, pas sur cette liste — lui coller une pastille d'état laisse
  // croire à un engagement qui n'existe pas.
  if (!e.contratSigneLe) return null;

  const statut = e.statutAbonnement ?? 'none';

  if (IMPAYES.has(statut)) {
    return { libelle: 'Impayé', cle: 'impaye', classe: 'border-red-400/50 text-red-400' };
  }

  const soiree = (e.plan ?? '') === 'soiree';

  if (soiree) {
    const offerte =
      Boolean(e.soireeOfferte) || (e.soireePayeeLe != null && (e.soireeMontantCents ?? 0) === 0);
    return offerte
      ? { libelle: 'Soirée test', cle: 'soiree-test', classe: 'border-white/20 text-bone-faint' }
      : { libelle: 'Soirée', cle: 'soiree', classe: 'border-sky-400/45 text-sky-300' };
  }

  // Un abonnement résilié reste un abonnement qui a existé : on le marque,
  // mais en sourdine, pour qu'il ne se confonde pas avec un lieu actif.
  if (FINIS.has(statut)) {
    return { libelle: 'Résilié', cle: 'resilie', classe: 'border-white/15 text-bone-faint/70' };
  }

  switch (e.engagementMois) {
    case 12:
      return { libelle: 'Abonné · 12 mois', cle: 'abo-12', classe: 'border-emerald-400/50 text-emerald-300' };
    case 6:
      return { libelle: 'Abonné · 6 mois', cle: 'abo-6', classe: 'border-brass/60 text-brass' };
    case 3:
      return { libelle: 'Abonné · 3 mois', cle: 'abo-3', classe: 'border-brass/30 text-brass/80' };
    default:
      return { libelle: 'Abonné', cle: 'abo', classe: 'border-brass/30 text-brass/80' };
  }
}
