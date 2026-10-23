'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Barre d'actions au-dessus du contrat. Invisible à l'impression.
 *
 * « Envoyer pour signature » construit le PDF côté serveur et le dépose chez
 * Yousign, qui écrit au signataire. Le bouton reste désactivé tant qu'un champ
 * manque d'un côté ou de l'autre : une fois la demande partie, la seule façon
 * de corriger une coquille est de l'annuler devant le client.
 *
 * Les liens vers les deux interfaces restent là pour le dépôt manuel — un lieu
 * qui a déjà son compte, un avenant, un contrat signé sur place.
 */
export function BarreContrat({
  crmId,
  nomLieu,
  emailContact,
  manquants,
  manquantsLucky,
  envoyeLe,
  signatureActive,
}: {
  crmId: string;
  nomLieu: string;
  emailContact: string | null;
  manquants: string[];
  manquantsLucky: string[];
  envoyeLe: string | null;
  signatureActive: boolean;
}) {
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'parti'>(envoyeLe ? 'parti' : 'repos');
  const [erreur, setErreur] = useState<string | null>(null);
  const [bacASable, setBacASable] = useState(false);
  const [diag, setDiag] = useState<string | null>(null);

  const complet = manquants.length === 0 && manquantsLucky.length === 0;
  const peutEnvoyer = signatureActive && complet && !!emailContact && etat === 'repos';

  async function tester() {
    setDiag('Test en cours…');
    try {
      const res = await fetch('/api/admin/contrat/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setDiag(data.error ?? 'Le test a échoué.');
        return;
      }
      const ok = data.resultats.filter((r: any) => r.reponse === 'la cle fonctionne');
      if (ok.length === 0) {
        setDiag(
          "La clé n'est acceptée ni par le bac à sable ni par la production. " +
            'Elle est probablement incomplète ou révoquée.'
        );
        return;
      }
      const bon = ok[0];
      const utilise = data.resultats.find((r: any) => r.utilisee);
      setDiag(
        bon.utilisee
          ? `Clé valide en ${bon.environnement}. C'est bien l'environnement utilisé — rien à changer.`
          : `Clé valide en ${bon.environnement}, mais l'app envoie en ${utilise?.environnement}. ` +
              `Ajouter la variable YOUSIGN_API_BASE = ${bon.base} sur Netlify, sinon l'envoi échouera.`
      );
    } catch {
      setDiag("Le test a échoué : le serveur n'a pas répondu.");
    }
  }

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
      setBacASable(!!data.bacASable);
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
            title={raisonBlocage(signatureActive, complet, emailContact, etat)}
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
          <button
            onClick={tester}
            disabled={!signatureActive}
            className="min-h-[44px] rounded-full border hairline px-5 text-sm text-bone-dim hover:border-brass hover:text-brass disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tester la clé Yousign
          </button>
          <a
            href="https://yousign.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center rounded-full border hairline px-5 text-sm text-bone-dim hover:border-brass hover:text-brass"
          >
            Ouvrir Yousign
          </a>
        </div>
      </div>

      {diag && (
        <p className="mt-4 rounded-2xl border hairline bg-ink-800 p-4 text-sm leading-relaxed text-bone-dim">
          {diag}
        </p>
      )}

      {erreur && (
        <p className="mt-4 rounded-2xl border border-signal-fading/50 bg-signal-fading/10 p-4 text-sm leading-relaxed text-bone">
          {erreur}
        </p>
      )}

      {etat === 'parti' && !erreur && (
        <p className="mt-4 rounded-2xl border border-signal-live/40 bg-signal-live/10 p-4 text-sm leading-relaxed text-bone-dim">
          Parti{emailContact ? ` à ${emailContact}` : ''}. Le signataire reçoit un lien Yousign.
          {bacASable && (
            <>
              {' '}
              <span className="text-brass">
                Attention : clé de test. L&rsquo;e-mail part mais la signature n&rsquo;a aucune valeur
                juridique — passer la clé en production avant le premier vrai lieu.
              </span>
            </>
          )}
        </p>
      )}

      {!signatureActive && (
        <p className="mt-4 rounded-2xl border hairline bg-ink-800 p-4 text-sm leading-relaxed text-bone-dim">
          L&rsquo;envoi direct est inactif : la clé Yousign n&rsquo;est pas présente sur ce
          déploiement. En attendant, « Relire le PDF » puis dépôt manuel dans Yousign.
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

function raisonBlocage(
  active: boolean,
  complet: boolean,
  email: string | null,
  etat: string
): string | undefined {
  if (!active) return "La clé Yousign n'est pas configurée sur ce déploiement.";
  if (!complet) return 'Des champs obligatoires sont vides.';
  if (!email) return "Pas d'adresse e-mail de contact sur la fiche.";
  if (etat === 'parti') return 'Déjà envoyé.';
  return undefined;
}

function liste(items: string[]): string {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1];
}
