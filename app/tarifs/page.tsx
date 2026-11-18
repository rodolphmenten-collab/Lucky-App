import Link from 'next/link';
import {
  COMMITMENTS,
  PLANS,
  TRIAL_DAYS,
  formatCentsExclTax,
  monthlyCentsAfterDiscount,
  type PlanKey,
} from '@/lib/stripe';

export const metadata = { title: 'Tarifs | Lucky' };

/**
 * Grille tarifaire publique.
 *
 * Page autonome, accessible sans compte, et calculée depuis PLANS et
 * COMMITMENTS : le prix affiché ici ne peut pas diverger de celui qui est
 * proposé à la signature, puisqu'il vient de la même source.
 */
const ABOS: PlanKey[] = ['basique', 'essentiel', 'premium'];

const POUR_QUI: Record<PlanKey, string> = {
  basique: 'Bars et restaurants de quartier — jusqu’à 50 personnes connectées en même temps',
  essentiel: 'Établissements de taille moyenne, coworkings — jusqu’à 200 personnes',
  premium: 'Hôtels, clubs, grands établissements — capacité illimitée',
  soiree: 'Un événement, une date',
};

function ttc(cents: number) {
  return formatCentsExclTax(Math.round(cents * 1.2));
}

export default function Tarifs() {
  const soiree = PLANS.soiree;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l&rsquo;accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Tarifs</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Ce que nous vendons, et à quel prix</h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 18/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section className="rounded-xl border border-brass/40 bg-brass/5 p-4">
          <p className="text-bone">
            <strong className="text-bone">Lucky est gratuit pour le public.</strong> Aucun paiement, aucun
            abonnement, aucune option payante n&rsquo;est jamais demandé à une personne qui utilise
            l&rsquo;application dans un établissement.
          </p>
          <p className="mt-2">
            Nos clients sont les établissements — bars, restaurants, hôtels, clubs — qui s&rsquo;abonnent pour
            que Lucky fonctionne chez eux. C&rsquo;est le seul revenu de l&rsquo;entreprise.
          </p>
          <p className="mt-2 italic text-bone-faint">
            Lucky is free for the public: individuals are never charged. Our customers are hospitality
            venues, which subscribe so that Lucky runs on their premises. This is our only source of
            revenue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Abonnements établissement</h2>
          <p className="mt-2">
            Prix mensuels, hors taxes. TVA française de 20 % en sus. Sans engagement au-delà de la durée
            choisie, résiliable à son terme.
          </p>
          <table className="mt-4 w-full text-left text-xs">
            <thead className="text-bone">
              <tr className="border-b border-white/15">
                <th className="py-2 pr-4 font-semibold">Formule</th>
                <th className="py-2 pr-4 font-semibold">Pour qui</th>
                <th className="py-2 pr-4 font-semibold">Par mois HT</th>
                <th className="py-2 font-semibold">Par mois TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {ABOS.map((key) => {
                const p = PLANS[key];
                return (
                  <tr key={key}>
                    <td className="py-2 pr-4 text-bone">{p.label}</td>
                    <td className="py-2 pr-4">{POUR_QUI[key]}</td>
                    <td className="py-2 pr-4 text-bone">{formatCentsExclTax(p.monthlyCentsExclTax)}</td>
                    <td className="py-2">{ttc(p.monthlyCentsExclTax)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3">
            Chaque formule comprend la page de l&rsquo;établissement, son QR code, les statistiques de
            présence et les supports physiques — {PLANS.basique.supportsIncluded} en Basique,{' '}
            {PLANS.essentiel.supportsIncluded} en Essentiel, {PLANS.premium.supportsIncluded} en Premium.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Durées d&rsquo;engagement et remises</h2>
          <p className="mt-2">
            L&rsquo;établissement choisit sa durée à la souscription. La remise s&rsquo;applique à chaque
            mensualité pendant toute la durée.
          </p>
          <table className="mt-4 w-full text-left text-xs">
            <thead className="text-bone">
              <tr className="border-b border-white/15">
                <th className="py-2 pr-4 font-semibold">Durée</th>
                <th className="py-2 pr-4 font-semibold">Remise</th>
                {ABOS.map((key) => (
                  <th key={key} className="py-2 pr-4 font-semibold">
                    {PLANS[key].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {([3, 6, 12] as const).map((m) => (
                <tr key={m}>
                  <td className="py-2 pr-4 text-bone">{COMMITMENTS[m].label}</td>
                  <td className="py-2 pr-4">
                    {COMMITMENTS[m].discountPercent ? `− ${COMMITMENTS[m].discountPercent} %` : '—'}
                  </td>
                  {ABOS.map((key) => (
                    <td key={key} className="py-2 pr-4">
                      {formatCentsExclTax(monthlyCentsAfterDiscount(key, m))} HT
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3">
            Les {TRIAL_DAYS} premiers jours sont offerts aux établissements qui s&rsquo;engagent pour trois
            mois au minimum. La durée engagée court à partir de la première mensualité facturée ; les
            mensualités restantes sont dues en cas de résiliation anticipée.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Soirée — paiement unique</h2>
          <p className="mt-2">
            Pour un établissement qui veut essayer Lucky sur une seule date, sans abonnement :{' '}
            <strong className="text-bone">{formatCentsExclTax(soiree.monthlyCentsExclTax)} HT</strong> (
            {ttc(soiree.monthlyCentsExclTax)} TTC), payés une fois, {soiree.supportsIncluded} supports
            inclus. Lucky est actif pour la soirée convenue, puis s&rsquo;éteint. Aucune reconduction, aucun
            prélèvement ultérieur.
          </p>
          <p className="mt-2">
            Une remise commerciale peut être consentie sur cette formule ; elle figure alors en clair sur le
            contrat et sur la facture.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Paiement, facturation, remboursement</h2>
          <p className="mt-2">
            Les paiements sont traités par Stripe. Aucune coordonnée bancaire ne transite par nos serveurs
            ni n&rsquo;y est conservée. Chaque échéance donne lieu à une facture adressée par courriel.
          </p>
          <p className="mt-2">
            Les conditions d&rsquo;annulation et de remboursement sont décrites dans notre{' '}
            <Link href="/legal/remboursement" className="text-brass underline">
              politique de remboursement
            </Link>
            , et les conditions de vente dans les{' '}
            <Link href="/legal/etablissements" className="text-brass underline">
              CGV établissements
            </Link>
            .
          </p>
          <p className="mt-2">
            Une question sur un devis ou une facture :{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
