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
  | 'informations'
  | 'carte'
  | 'abonnement'
  | 'position'
  | 'qr';

const ONGLETS: { cle: OngletFiche; label: string; exigeLieu: boolean }[] = [
  { cle: 'suivi', label: 'Suivi commercial', exigeLieu: false },
  { cle: 'informations', label: 'Informations & contacts', exigeLieu: false },
  { cle: 'carte', label: 'Carte & avantages', exigeLieu: true },
  { cle: 'abonnement', label: 'Abonnement', exigeLieu: true },
  { cle: 'position', label: 'Position & présence', exigeLieu: true },
  { cle: 'qr', label: 'QR code', exigeLieu: true },
];

export function ongletDepuisUrl(valeur?: string): OngletFiche {
  const connus = ONGLETS.map((o) => o.cle) as string[];
  return (connus.includes(valeur ?? '') ? valeur : 'suivi') as OngletFiche;
}

export function FicheTabs({
  crmId,
  actif,
  aUnLieu,
}: {
  crmId: string;
  actif: OngletFiche;
  aUnLieu: boolean;
}) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2 border-b hairline pb-4">
      {ONGLETS.filter((o) => aUnLieu || !o.exigeLieu).map((o) => (
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
