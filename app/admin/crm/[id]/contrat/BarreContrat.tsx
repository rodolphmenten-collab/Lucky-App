'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Barre d'actions au-dessus du contrat. Invisible à l'impression.
 *
 * « Envoyer pour signature » fige le PDF côté serveur et envoie au signataire
 * un lien vers la page de signature de Lucky. Le bouton reste désactivé tant
 * qu'un champ manque d'un côté ou de l'autre : une fois la demande partie, la
 * seule façon de corriger une coquille est de renvoyer le contrat, ce qui
 * annule le lien précédent.
 */
export function BarreContrat({
  crmId,
  nomLieu,
  emailContact,
  manquants,
  manquantsLucky,
  envoyeLe,
}: {
  crmId: string;
  nomLieu: string;
  emailContact: string | null;
  manquants: string[];
  manquantsLucky: string[];
  envoyeLe: string | null;
}) {
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'parti'>(envoyeLe ? 'parti' : 'repos');
  const [erreur, setErreur] = useState<string | null>(null);

  const complet = manquants.length === 0 && manquantsLucky.length === 0;
  const peutEnvoyer = complet && !!emailContact && etat === 'repos';

  async function envoyer() {
    if (!confirm(`Envoyer le contrat à ${emailContact} pour signature ?`)) return;
    setEtat('envoi');
    setErreur(null);
    try {
      const res = await fetch('/api/admin/contrat/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: crmId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "L'envoi a échoué.");
        setEtat('repos');
        return;
      }
      setEtat('parti');
    } catch {
      setErreur("L'envoi a échoué : le serveur n'a pas répondu. Le contrat n'est pas parti.");
      setEtat('repos');
    }
  }

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/crm/${crmId}`} className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
          ← {nomLieu}
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={envoyer}
            disabled={!peutEnvoyer}
            title={raisonBlocage(complet, emailContact, etat)}
            className="min-h-[44px] rounded-full bg-brass px-5 text-sm font-medium text-ink hover:bg-brass-bright disabled:cursor-not-allowed disabled:bg-brass/25 disabled:text-bone-faint"
          >
            {etat === 'envoi' ? 'Envoi…' : etat === 'parti' ? 'Envoyé pour signature' : 'Envoyer pour signature'}
          </button>
          <a
            href={`/api/admin/contrat/pdf?id=${crmId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-full bg-bone px-5 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            Relire le PDF
          </a>
        </div>
      </div>

      {erreur && (
        <p className="mt-4 rounded-2xl border border-signal-fading/50 bg-signal-fading/10 p-4 text-sm leading-relaxed text-bone">
          {erreur}
        </p>
      )}

      {etat === 'parti' && !erreur && (
        <p className="mt-4 rounded-2xl border border-signal-live/40 bg-signal-live/10 p-4 text-sm leading-relaxed text-bone-dim">
          Parti{emailContact ? ` à ${emailContact}` : ''}. Le signataire reçoit un lien vers la page
          de signature ; une fois signé, le contrat définitif revient par e-mail aux deux parties et
          la fiche passe au vert.
        </p>
      )}

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

      {complet && !emailContact && (
        <p className="mt-4 rounded-2xl border border-brass/40 bg-brass/5 p-4 text-sm leading-relaxed text-bone-dim">
          Aucune adresse e-mail sur la fiche : c&rsquo;est elle qui reçoit la demande de signature.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-bone-faint">
        Seules les conditions particulières partent à la signature. Les conditions générales,
        identiques pour tous les lieux, sont publiées sur{' '}
        <Link href="/legal/etablissements" className="underline hover:text-bone-dim">
          lucky-app.io/legal/etablissements
        </Link>{' '}
        et le contrat y renvoie.
      </p>

      <div className="mt-6" />
    </div>
  );
}

function raisonBlocage(complet: boolean, email: string | null, etat: string): string | undefined {
  if (!complet) return 'Des champs obligatoires sont vides.';
  if (!email) return "Pas d'adresse e-mail de contact sur la fiche.";
  if (etat === 'parti') return 'Déjà envoyé.';
  return undefined;
}

function liste(items: string[]): string {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1];
}
