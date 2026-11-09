import {
  PLANS,
  COMMITMENTS,
  isOneShot,
  monthlyCentsAfterDiscount,
  formatCentsExclTax,
  TAUX_TVA,
  centsTva,
  type PlanKey,
  type CommitmentMonths,
} from '@/lib/stripe';

/**
 * Préparation des conditions particulières du contrat.
 *
 * Le contrat tient en deux parties : les conditions générales, identiques pour
 * tous les lieux et déjà publiées sur le site, et une page de conditions
 * particulières qui change à chaque envoi. Seule cette page est générée ici,
 * à partir de la fiche du lieu — c'est précisément celle qu'on retapait à la
 * main, et donc celle où se glissaient les erreurs.
 *
 * Aucune valeur n'est inventée : un champ vide reste vide et apparaît dans
 * `manquants`. Mieux vaut un contrat visiblement incomplet qu'un contrat
 * complété au jugé sur un acte qui engage.
 */

/**
 * Identité de Lucky, telle qu'elle figure sur l'extrait Kbis du 28/10/2026
 * (Greffe du Tribunal des Activités Économiques de Paris, n° de gestion
 * 2026B53779). Ces valeurs sont publiques et ne varient pas d'un
 * environnement à l'autre : elles vivent donc dans le code, et non dans des
 * variables d'environnement qu'il faudrait penser à configurer. L'env reste
 * prioritaire si une valeur change avant le prochain déploiement.
 *
 * `siren` est le numéro d'immatriculation au RCS, qui est la mention
 * légalement exigée — ce n'est pas le SIRET, qui désigne l'établissement.
 */
export const LUCKY = {
  raisonSociale: process.env.NEXT_PUBLIC_LUCKY_RAISON_SOCIALE ?? 'LUCKY',
  formeSociale: process.env.NEXT_PUBLIC_LUCKY_FORME ?? 'société par actions simplifiée (SAS)',
  capital: process.env.NEXT_PUBLIC_LUCKY_CAPITAL ?? '200',
  rcsVille: process.env.NEXT_PUBLIC_LUCKY_RCS ?? 'Paris',
  siren: process.env.NEXT_PUBLIC_LUCKY_SIREN ?? '132 148 941',
  siege: process.env.NEXT_PUBLIC_LUCKY_SIEGE ?? '8 bis rue Abel, 75012 Paris',
  representant: process.env.NEXT_PUBLIC_LUCKY_REPRESENTANT ?? 'Rodolph Menten',
  qualite: process.env.NEXT_PUBLIC_LUCKY_QUALITE ?? 'Président',
};

export interface SignataireLucky {
  nom: string;
  qualite: string;
  email: string;
}

/**
 * Les deux fondateurs signent. L'adresse reste côté serveur : c'est elle qui
 * reçoit la demande de signature, elle n'a rien à faire dans le navigateur.
 */
export const LUCKY_SIGNATAIRES: SignataireLucky[] = [
  {
    nom: process.env.NEXT_PUBLIC_LUCKY_SIGNATAIRE_1_NOM ?? 'Rodolph Menten',
    // Seul mandataire social au Kbis, donc seul habilité à engager la société.
    qualite: process.env.NEXT_PUBLIC_LUCKY_SIGNATAIRE_1_QUALITE ?? 'Président',
    email: process.env.LUCKY_SIGNATAIRE_1_EMAIL ?? '',
  },
  {
    nom: process.env.NEXT_PUBLIC_LUCKY_SIGNATAIRE_2_NOM ?? 'Julien Dessertenne',
    // Cofondateur, mais pas mandataire social au Kbis du 28/10/2026 : sa
    // signature vaut engagement moral, pas pouvoir d'engager la société.
    // Le titre reste volontairement « Cofondateur » pour ne pas laisser
    // croire à un mandat qu'il n'a pas.
    qualite: process.env.NEXT_PUBLIC_LUCKY_SIGNATAIRE_2_QUALITE ?? 'Cofondateur',
    email: process.env.LUCKY_SIGNATAIRE_2_EMAIL ?? '',
  },
];

/** « Rodolph Menten et Julien Dessertenne », pour la phrase des parties. */
export function representantsLucky(): string {
  const noms = LUCKY_SIGNATAIRES.map((s) => `${s.nom} (${s.qualite})`);
  if (noms.length === 1) return noms[0];
  return noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1];
}

export interface Contrat {
  lieu: {
    enseigne: string;
    raisonSociale: string;
    formeSociale: string;
    rcsVille: string;
    siren: string;
    siege: string;
    adresseEtablissement: string;
    signataire: string;
    qualite: string;
    contactOperationnel: string;
  };
  formule: { cle: PlanKey; label: string; mensuelHT: string };
  /** Vrai pour la formule Soirée : prestation ponctuelle, pas d'abonnement.
   *  Le PDF bascule alors sur une autre trame — titre, tableau et clauses. */
  estSoiree: boolean;
  /** Renseigné seulement quand estSoiree. Montants d'une vente unique. */
  soiree: { date: string; montantHT: string; tva: string; ttc: string };
  engagement: {
    mois: number;
    label: string;
    remise: number;
    mensuelApresRemise: string;
    tauxTva: number;
    mensuelTva: string;
    mensuelTtc: string;
  };
  supports: { installes: number | null; inclus: number; personnalises: boolean; supplement: number | null };
  dates: { debutEssai: string; premierPrelevement: string; fait: string };
  manquants: string[];
}

const VIDE = '____________________';

function ou(valeur: string | null | undefined, manquants: string[], libelle: string): string {
  if (valeur && valeur.trim()) return valeur.trim();
  manquants.push(libelle);
  return VIDE;
}

function jour(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function preparerContrat(c: any, debutEssai = new Date()): Contrat {
  const manquants: string[] = [];

  const clePlan = ((c.expected_plan ?? 'basique') as PlanKey) in PLANS
    ? ((c.expected_plan ?? 'basique') as PlanKey)
    : 'basique';
  const plan = PLANS[clePlan];
  if (!c.expected_plan) manquants.push('la formule');

  // Une soirée ne s'engage pas et n'a pas d'essai : réclamer une durée ou
  // signaler un essai manquant n'aurait aucun sens, et bloquerait l'envoi
  // d'un contrat pourtant complet.
  const soiree = isOneShot(clePlan);

  const mois = (c.commitment_months ?? 3) as CommitmentMonths;
  const engagement = COMMITMENTS[mois] ?? COMMITMENTS[3];
  if (!soiree && !c.commitment_months) manquants.push("la durée d'engagement");

  const dateSoiree = soiree
    ? ou(
        c.soiree_date ? jour(new Date(`${c.soiree_date}T12:00:00`)) : null,
        manquants,
        'la date de la soirée',
      )
    : '';

  if (c.supports_count == null) manquants.push('le nombre de supports');

  const prelevement = new Date(debutEssai);
  prelevement.setDate(prelevement.getDate() + 30);

  const contact = [c.contact_name, c.contact_role, c.contact_phone, c.contact_email]
    .filter(Boolean)
    .join(' · ');

  return {
    lieu: {
      enseigne: ou(c.name, manquants, "l'enseigne"),
      raisonSociale: ou(c.legal_name, manquants, 'la raison sociale'),
      formeSociale: ou(c.legal_form, manquants, 'la forme sociale'),
      rcsVille: ou(c.rcs_city, manquants, 'la ville du RCS'),
      siren: ou(c.siren, manquants, 'le SIREN'),
      siege: ou(c.legal_address, manquants, 'le siège social'),
      adresseEtablissement: ou(c.address, manquants, "l'adresse de l'établissement"),
      signataire: ou(c.signer_name, manquants, 'le nom du signataire'),
      qualite: ou(c.signer_role, manquants, 'la qualité du signataire'),
      contactOperationnel: contact || ou(null, manquants, 'le contact opérationnel'),
    },
    formule: {
      cle: clePlan,
      label: plan.label,
      mensuelHT: formatCentsExclTax(plan.monthlyCentsExclTax),
    },
    estSoiree: soiree,
    soiree: {
      date: dateSoiree,
      montantHT: formatCentsExclTax(plan.monthlyCentsExclTax),
      tva: formatCentsExclTax(centsTva(plan.monthlyCentsExclTax)),
      ttc: formatCentsExclTax(plan.monthlyCentsExclTax + centsTva(plan.monthlyCentsExclTax)),
    },
    engagement: {
      mois: engagement.months,
      label: engagement.label,
      remise: engagement.discountPercent,
      mensuelApresRemise: formatCentsExclTax(monthlyCentsAfterDiscount(clePlan, mois)),
      // Le Lieu signe un montant HT, mais c'est le TTC qui sera prélevé :
      // autant qu'il le lise sur le contrat plutôt que de le découvrir
      // sur sa première facture.
      tauxTva: TAUX_TVA,
      mensuelTva: formatCentsExclTax(centsTva(monthlyCentsAfterDiscount(clePlan, mois))),
      mensuelTtc: formatCentsExclTax(
        monthlyCentsAfterDiscount(clePlan, mois) + centsTva(monthlyCentsAfterDiscount(clePlan, mois)),
      ),
    },
    supports: {
      installes: c.supports_count ?? null,
      inclus: plan.supportsIncluded,
      personnalises: !!c.supports_custom,
      supplement: null,
    },
    dates: {
      debutEssai: jour(debutEssai),
      premierPrelevement: jour(prelevement),
      fait: jour(new Date()),
    },
    manquants,
  };
}

/** Ce qui manque côté Lucky tant que la société n'est pas immatriculée. */
export function manquantsLucky(): string[] {
  const m: string[] = [];
  if (LUCKY.siren.startsWith('[')) m.push('le SIREN de Lucky');
  if (LUCKY.formeSociale.startsWith('[')) m.push('la forme sociale de Lucky');
  if (LUCKY.siege.startsWith('[')) m.push('le siège social de Lucky');
  if (LUCKY.rcsVille.startsWith('[')) m.push('la ville du RCS de Lucky');
  if (LUCKY.capital.startsWith('[')) m.push('le capital de Lucky');

  // Les deux fondateurs signent : il faut la qualité de chacun pour la phrase
  // des parties, et son adresse pour que la demande de signature lui parvienne.
  for (const s of LUCKY_SIGNATAIRES) {
    if (s.qualite.startsWith('[')) m.push(`la qualité de ${s.nom}`);
    if (!s.email.trim()) m.push(`l'adresse e-mail de ${s.nom}`);
  }
  return m;
}
