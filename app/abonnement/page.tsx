import Link from 'next/link';
import { getStripe, PLANS, isPlanKey } from '@/lib/stripe';
import { formatPrice } from '@/lib/luckyCodes';

/**
 * Page d'atterrissage après Checkout.
 *
 * Volontairement publique : l'établissement qui vient de payer n'a pas encore
 * de session Lucky ouverte, et le renvoyer sur un écran de connexion juste
 * après avoir sorti sa carte est la pire première impression possible. On
 * confirme, on annonce la date de fin d'essai, et on explique comment accéder
 * au dashboard — l'accès lui-même reste protégé, évidemment.
 */
export const dynamic = 'force-dynamic';

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { session_id?: string; annule?: string };
}) {
  if (searchParams.annule) {
    return (
      <Shell eyebrow="Paiement interrompu" title="Rien n’a été débité.">
        <p className="text-sm leading-relaxed text-bone-dim">
          Vous avez quitté le paiement avant la fin. Aucun montant n’a été prélevé et aucun
          abonnement n’a été créé. Le lien que vous avez reçu reste valable — vous pouvez le
          rouvrir quand vous voulez.
        </p>
      </Shell>
    );
  }

  const details = await loadSession(searchParams.session_id);

  return (
    <Shell eyebrow="Abonnement activé" title="C’est en route.">
      <p className="text-sm leading-relaxed text-bone-dim">
        {details?.venueName ? (
          <>
            L’abonnement Lucky de <span className="text-bone">{details.venueName}</span> est actif.
          </>
        ) : (
          <>Votre abonnement Lucky est actif.</>
        )}{' '}
        Votre carte est enregistrée, mais rien n’est prélevé pendant l’essai.
      </p>

      {(details?.planLabel || details?.trialEnd) && (
        <div className="mt-6 space-y-2 rounded-2xl border border-brass/40 bg-brass/5 px-5 py-4 text-left">
          {details.planLabel && (
            <p className="text-sm text-bone">
              Plan {details.planLabel}
              {details.monthlyCents !== null && (
                <span className="text-bone-dim"> · {formatPrice(details.monthlyCents)} HT / mois</span>
              )}
            </p>
          )}
          {details.trialEnd && (
            <p className="text-xs text-bone-dim">
              Essai gratuit jusqu’au{' '}
              <span className="text-brass">
                {details.trialEnd.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>{' '}
              — premier prélèvement à cette date, résiliable avant sans frais.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 space-y-3 text-xs leading-relaxed text-bone-faint">
        <p>
          <span className="text-bone-dim">Pour accéder à votre tableau de bord :</span> utilisez le
          lien d’activation reçu par email lors de votre inscription. Il vous permet de choisir un
          mot de passe et d’ouvrir votre espace.
        </p>
        <p>
          Vous y trouverez votre QR code à imprimer, votre carte, votre avantage Lucky et le suivi
          des rencontres générées chez vous.
        </p>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-full border hairline px-6 py-3 text-xs tracking-wide text-bone-dim hover:border-brass hover:text-brass"
      >
        Retour à l’accueil
      </Link>
    </Shell>
  );
}

interface SessionDetails {
  venueName: string | null;
  planLabel: string | null;
  monthlyCents: number | null;
  trialEnd: Date | null;
}

/**
 * Lecture best-effort : si Stripe n'est pas configuré, si l'id est absent ou
 * périmé, on affiche quand même une confirmation générique plutôt qu'une page
 * d'erreur. Le paiement, lui, a déjà été enregistré par le webhook.
 */
async function loadSession(sessionId: string | undefined): Promise<SessionDetails | null> {
  if (!sessionId) return null;
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const planKey = session.metadata?.plan;
    const plan = isPlanKey(planKey) ? PLANS[planKey] : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = session.subscription as any;
    const trialEndSeconds: number | undefined = subscription?.trial_end;

    return {
      venueName: typeof session.customer === 'object' ? null : session.customer_details?.name ?? null,
      planLabel: plan?.label ?? null,
      monthlyCents: plan?.monthlyCentsExclTax ?? null,
      trialEnd: trialEndSeconds ? new Date(trialEndSeconds * 1000) : null,
    };
  } catch {
    return null;
  }
}

function Shell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl italic text-bone">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}
