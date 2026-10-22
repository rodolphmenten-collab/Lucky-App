'use client';

import Link from 'next/link';

/**
 * Barre d'actions au-dessus du contrat. Invisible à l'impression.
 *
 * Les deux prestataires de signature acceptent un PDF déposé depuis leur
 * interface. On ouvre donc la bonne page chez eux plutôt que de brancher leur
 * API : celle-ci demanderait un compte, des clés et une société immatriculée,
 * qu'on n'a pas encore. Le jour où le compte existe, l'envoi direct se
 * branchera ici sans rien changer au reste.
 */
export function BarreContrat({
  crmId,
  nomLieu,
  manquants,
  manquantsLucky,
}: {
  crmId: string;
  nomLieu: string;
  manquants: string[];
  manquantsLucky: string[];
}) {
  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/crm/${crmId}`} className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
          ← {nomLieu}
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="min-h-[44px] rounded-full bg-bone px-5 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            Enregistrer en PDF
          </button>
          <a
            href="https://yousign.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-full border border-brass/50 px-5 text-sm text-brass hover:bg-brass/10"
          >
            Ouvrir Yousign
          </a>
          <a
            href="https://app.docusign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-full border hairline px-5 text-sm text-bone-dim hover:border-brass hover:text-brass"
          >
            Ouvrir DocuSign
          </a>
        </div>
      </div>

      {(manquants.length > 0 || manquantsLucky.length > 0) && (
        <div className="mt-4 rounded-2xl border border-brass/40 bg-brass/5 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">À compléter avant l&rsquo;envoi</p>

          {manquants.length > 0 && (
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">
              Côté lieu, il manque {liste(manquants)}. Les champs correspondants sont vides dans le
              contrat ci-dessous —{' '}
              <Link href={`/admin/crm/${crmId}?onglet=informations`} className="text-brass underline">
                les renseigner dans Informations &amp; contacts
              </Link>
              .
            </p>
          )}

          {manquantsLucky.length > 0 && (
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">
              Côté Lucky, il manque {liste(manquantsLucky)}. Ces mentions sont obligatoires : tant que la
              société n&rsquo;est pas immatriculée, ce contrat ne peut pas être envoyé à un lieu pour
              signature.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-bone-faint">
        Seules les conditions particulières sont générées ici. Les conditions générales, identiques pour
        tous les lieux, sont publiées sur{' '}
        <Link href="/legal/etablissements" className="underline hover:text-bone-dim">
          lucky-app.io/legal/etablissements
        </Link>{' '}
        et doivent être jointes à l&rsquo;envoi.
      </p>

      <div className="mt-6" />
    </div>
  );
}

function liste(items: string[]): string {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1];
}
