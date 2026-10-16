'use client';

import { useState } from 'react';

const PLAN_OPTIONS = [
  { value: 'basique', label: 'Basique — 99 € HT / mois' },
  { value: 'essentiel', label: 'Essentiel — 149 € HT / mois' },
  { value: 'premium', label: 'Premium — 299 € HT / mois' },
];

export function BillingPanel({
  venueId,
  currentPlan,
  statusLabel,
  status,
  contactEmail,
  trialEndsAt,
  currentPeriodEnd,
  checkoutSentAt,
}: {
  venueId: string;
  currentPlan: string;
  statusLabel: string;
  status: string;
  contactEmail: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  checkoutSentAt: string | null;
}) {
  const [plan, setPlan] = useState(currentPlan);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(send: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, plan, send }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Échec de la génération du lien.');
        return;
      }
      setLink(data.url);
      if (send) {
        setMessage(
          data.emailed
            ? `Lien envoyé à ${contactEmail}.`
            : `Email non envoyé (${data.emailError ?? 'raison inconnue'}) — le lien reste copiable ci-dessous.`
        );
      }
    } catch {
      setError('Échec réseau.');
    } finally {
      setBusy(false);
    }
  }

  const statusTone =
    status === 'active' || status === 'trialing'
      ? 'text-brass'
      : status === 'past_due' || status === 'unpaid'
        ? 'text-red-400'
        : 'text-bone-dim';

  return (
    <section id="abonnement" className="mt-10 scroll-mt-8 rounded-2xl border border-brass/30 bg-brass/[0.03] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-bone">Abonnement</p>
        <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${statusTone}`}>{statusLabel}</p>
      </div>

      <div className="mt-3 space-y-1 text-xs text-bone-faint">
        {trialEndsAt && <p>Essai jusqu’au {new Date(trialEndsAt).toLocaleDateString('fr-FR')}</p>}
        {currentPeriodEnd && (
          <p>Période en cours jusqu’au {new Date(currentPeriodEnd).toLocaleDateString('fr-FR')}</p>
        )}
        {checkoutSentAt && !trialEndsAt && (
          <p>Dernier lien généré le {new Date(checkoutSentAt).toLocaleDateString('fr-FR')}</p>
        )}
        {!contactEmail && <p className="text-red-400">Aucun email de contact — l’envoi est impossible.</p>}
      </div>

      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="mt-5 w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
      >
        {PLAN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <p className="mt-2 text-[11px] leading-relaxed text-bone-faint">
        30 jours d’essai : la carte est enregistrée à la signature, le premier prélèvement intervient
        à J+30. Prix hors taxes, TVA ajoutée sur la facture.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => generate(true)}
          disabled={busy || !contactEmail}
          className="rounded-full bg-bone px-5 py-2.5 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-40"
        >
          {busy ? 'Génération…' : 'Envoyer le lien de paiement'}
        </button>
        <button
          onClick={() => generate(false)}
          disabled={busy}
          className="rounded-full border hairline px-5 py-2.5 text-xs text-bone-dim hover:border-brass hover:text-brass disabled:opacity-40"
        >
          Générer sans envoyer
        </button>
      </div>

      {message && <p className="mt-4 text-xs text-brass">{message}</p>}
      {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

      {link && (
        <div className="mt-4">
          <p className="text-[11px] text-bone-faint">Lien de paiement (valable 24 h) :</p>
          <p className="mt-1 break-all rounded-xl border hairline bg-ink-900 p-3 font-mono text-[11px] text-bone-dim">
            {link}
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(link)}
            className="mt-2 text-[11px] text-brass underline"
          >
            Copier
          </button>
        </div>
      )}
    </section>
  );
}
