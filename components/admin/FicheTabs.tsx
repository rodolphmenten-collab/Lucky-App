import Link from 'next/link';

/**
 * Onglets de la fiche d'un lieu.
 *
 * Tout tenait sur une seule page : suivi commercial, QR, position, carte,
 * abonnement et journal s'enchaînaient sans separation. En rendez-vous, on
 * cherchait l'abonnement en faisant defiler, et on tombait d'abord sur le
 * journal. Chaque sujet a desormais sa page.
 *
 * L'onglet actif passe par l'URL plutot que par un etat local : un lien peut
 * donc pointer directement sur l'abonnement d'un lieu, et le retour arriere
 * du navigateur fonctionne.
 */

export type OngletFiche =
  | 'suivi'
  | 'performance'
  | 'informations'
  | 'carte'
  | 'abonnement'
  | 'position'
  | 'qr';

/**
 * Les sept onglets s'affichent pour tous les lieux, prospects compris.
 *
 * Ils etaient d'abord masques tant que le lieu n'avait pas d'etablissement
 * cree : deux fiches se lisaient donc differemment selon l'etape, et on ne
 * savait plus ou chercher. Un onglet sans contenu dit desormais ce qui manque
 * et comment l'obtenir — c'est plus utile qu'un onglet absent.
 */
const ONGLETS: { cle: OngletFiche; label: string }[] = [
  { cle: 'suivi', label: 'Suivi commercial' },
  // Ce que le lieu voit quand il se connecte : on le regarde ici plutot que
  // de basculer en visualisation pour repondre a « et ca donne quoi ? ».
  { cle: 'performance', label: 'Performance' },
  { cle: 'informations', label: 'Informations & contacts' },
  { cle: 'carte', label: 'Carte & avantages' },
  { cle: 'abonnement', label: 'Abonnement' },
  { cle: 'position', label: 'Position & présence' },
  { cle: 'qr', label: 'QR code' },
];

export function ongletDepuisUrl(valeur?: string): OngletFiche {
  const connus = ONGLETS.map((o) => o.cle) as string[];
  return (connus.includes(valeur ?? '') ? valeur : 'suivi') as OngletFiche;
}

export function FicheTabs({ crmId, actif }: { crmId: string; actif: OngletFiche }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2 border-b hairline pb-4">
      {ONGLETS.map((o) => (
        <Link
          key={o.cle}
          href={`/admin/crm/${crmId}?onglet=${o.cle}`}
          className={`rounded-full border px-4 py-2 text-xs transition-colors ${
            actif === o.cle
              ? 'border-brass bg-brass/10 text-brass'
              : 'hairline text-bone-dim hover:border-white/30'
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
