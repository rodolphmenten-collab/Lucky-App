'use client';

import { useState } from 'react';
import {
  PLANS,
  COMMITMENTS,
  DEFAULT_COMMITMENT,
  isOneShot,
  monthlyCentsAfterDiscount,
  formatCentsExclTax,
  type PlanKey,
  type CommitmentMonths,
} from '@/lib/stripe';

const PLAN_OPTIONS: { value: PlanKey; label: string }[] = (
  Object.values(PLANS) as (typeof PLANS)[PlanKey][]
).map((p) => ({
  value: p.key,
  label: p.oneShot
    ? `${p.label} — ${formatCentsExclTax(p.monthlyCentsExclTax)} HT la soirée · jusqu'à ${p.supportsIncluded} supports`
    : `${p.label} — ${formatCentsExclTax(p.monthlyCentsExclTax)} HT / mois · jusqu'à ${p.supportsIncluded} supports`,
}));

const COMMITMENT_OPTIONS = (Object.values(COMMITMENTS) as (typeof COMMITMENTS)[CommitmentMonths][]).map((c) => ({
  value: c.months,
  label: c.discountPercent ? `${c.label} — remise de ${c.discountPercent} %` : `${c.label} — plein tarif`,
}));

export function BillingPanel({
  venueId,
  currentPlan,
  currentCommitment,
  statusLabel,
  status,
  contactEmail,
  trialEndsAt,
  currentPeriodEnd,
  checkoutSentAt,
  soireePaidAt,
  soireeAmountCents,
  soireeOfferte,
}: {
  venueId: string;
  currentPlan: string;
  currentCommitment: number | null;
  statusLabel: string;
  status: string;
  contactEmail: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  checkoutSentAt: string | null;
  /** Soirée réglée : c'est elle qui fait foi, pas le statut d'abonnement. */
  soireePaidAt: string | null;
  soireeAmountCents: number | null;
  /** Soirée convenue comme offerte : 0 €, mais pas encore honorée. */
  soireeOfferte?: boolean;
}) {
  const [plan, setPlan] = useState(currentPlan);
  const [commitment, setCommitment] = useState<CommitmentMonths>(
    (currentCommitment as CommitmentMonths) || DEFAULT_COMMITMENT
  );

  const soiree = isOneShot(plan);
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
        body: JSON.stringify({ venueId, plan, send, commitmentMonths: commitment }),
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

  // Trois situations, dans cet ordre de priorité.
  //
  // Un abonnement en cours passe devant tout : un lieu qui a testé une soirée
  // puis s'est abonné est un abonné, et sa soirée n'est plus qu'un souvenir.
  // Sinon, une soirée réglée prime sur le statut d'abonnement — sans quoi un
  // lieu qui vient de payer affichait « Résilié », dernier état connu d'un
  // abonnement qui n'a plus rien à dire sur lui. Enfin, une soirée convenue
  // comme offerte mais pas encore honorée n'attend aucun paiement.
  const abonne = status === 'active' || status === 'trialing';
  const payee = !abonne && Boolean(soireePaidAt);
  const offerte = payee && (soireeAmountCents ?? 0) === 0;
  const offerteAVenir = !abonne && !payee && Boolean(soireeOfferte);

  const statusTone = payee
    ? 'text-emerald-400'
    : offerteAVenir
      ? 'text-brass'
      : status === 'active' || status === 'trialing'
        ? 'text-brass'
        : status === 'past_due' || status === 'unpaid'
          ? 'text-red-400'
          : 'text-bone-dim';

  const libelleEtat = payee
    ? offerte
      ? 'Soirée offerte'
      : 'Soirée payée'
    : offerteAVenir
      ? 'Soirée offerte — à honorer'
      : statusLabel;

  return (
    <section
      id="abonnement"
      className={`mt-10 scroll-mt-8 rounded-2xl border p-6 ${
        payee ? 'border-emerald-500/50 bg-emerald-500/[0.06]' : 'border-brass/30 bg-brass/[0.03]'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-bone">Abonnement</p>
        <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${statusTone}`}>{libelleEtat}</p>
      </div>

      {offerteAVenir && (
        <p className="mt-2 text-sm text-brass">
          Soirée offerte : 0 € à facturer. Le contrat part avec les CGV, et le lieu s'allume le soir venu.
        </p>
      )}

      {payee && (
        <p className="mt-2 text-sm text-emerald-300">
          {offerte ? 'Soirée offerte' : `Réglée — ${((soireeAmountCents ?? 0) / 100).toFixed(2).replace('.', ',')} €`}{' '}
          le {new Date(soireePaidAt as string).toLocaleDateString('fr-FR')}. Le lieu est allumé.
        </p>
      )}

      <div className="mt-3 space-y-1 text-xs text-bone-faint">
        {/* Essai et période en cours appartiennent à un abonnement. Sur une
            soirée, ce sont des reliquats qui contredisent ce qui est affiché
            juste au-dessus. */}
        {!payee && !offerteAVenir && trialEndsAt && (
          <p>Essai jusqu’au {new Date(trialEndsAt).toLocaleDateString('fr-FR')}</p>
        )}
        {!payee && !offerteAVenir && currentPeriodEnd && (
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

      {/* Une soirée ne s'engage pas : afficher une durée ici laisserait croire
          qu'on vend douze soirées. */}
      {!soiree && (
        <select
          value={commitment}
          onChange={(e) => setCommitment(Number(e.target.value) as CommitmentMonths)}
          className="mt-3 w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
        >
          {COMMITMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Engagement {o.label}
            </option>
          ))}
        </select>
      )}

      {/* Le montant affiché ici est celui qui partira dans le lien de paiement :
          c'est le seul endroit où l'on voit, avant d'envoyer, ce que le lieu
          verra sur sa facture. */}
      <div className="mt-4 rounded-xl border border-brass/30 bg-brass/5 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass">Ce que paiera le lieu</p>
        <p className="mt-1 font-display text-2xl text-bone">
          {soiree
            ? formatCentsExclTax(PLANS[plan as PlanKey].monthlyCentsExclTax)
            : formatCentsExclTax(monthlyCentsAfterDiscount(plan as PlanKey, commitment))}
          <span className="text-sm text-bone-dim">{soiree ? ' HT la soirée' : ' HT / mois'}</span>
        </p>
        {!soiree && COMMITMENTS[commitment].discountPercent > 0 && (
          <p className="mt-1 text-[11px] text-bone-dim">
            au lieu de{' '}
            <span className="line-through">{formatCentsExclTax(PLANS[plan as PlanKey].monthlyCentsExclTax)}</span> ·{' '}
            <span className="text-brass">−{COMMITMENTS[commitment].discountPercent} %</span> à vie,
            engagement {COMMITMENTS[commitment].label}
          </p>
        )}
        <p className="mt-1 text-[11px] text-bone-faint">
          {PLANS[plan as PlanKey].supportsIncluded} supports inclus
        </p>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-bone-faint">
        {soiree ? (
          <>
            Paiement unique, prélevé tout de suite — ni essai ni abonnement. Le lieu est allumé dès
            le paiement ; il faudra l’éteindre à la main après la soirée, depuis sa fiche
            établissement. Prix hors taxes, TVA ajoutée sur la facture.
          </>
        ) : (
          <>30 jours d’essai : la carte est enregistrée à la signature, le premier prélèvement intervient
        à J+30. Prix hors taxes, TVA ajoutée sur la facture. La remise est portée par un coupon
        Stripe ; l’engagement lui-même tient par le contrat, pas par Stripe.</>
        )}
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
