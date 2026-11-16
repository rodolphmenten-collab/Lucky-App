import Link from 'next/link';

export const metadata = { title: 'Remboursement, annulation et litiges | Lucky' };

/**
 * Politique de remboursement, d'annulation et de traitement des litiges.
 *
 * Document autonome exigé par les partenaires de paiement. Il dit d'abord la
 * chose la plus importante : aucun utilisateur n'est facturé. Les seules
 * sommes encaissées par Lucky le sont auprès d'établissements professionnels.
 */
export default function PolitiqueRemboursement() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l'accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Paiements</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">
        Remboursement, annulation et litiges
      </h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 16/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <h2 className="text-base font-semibold text-bone">Les utilisateurs ne paient rien</h2>
          <p className="mt-2">
            Lucky est gratuit pour les personnes qui l'utilisent dans un établissement. Il n'existe ni
            abonnement, ni crédit, ni fonctionnalité payante, ni paiement au message. Aucune carte bancaire
            n'est demandée à un utilisateur, et aucun paiement d'utilisateur ne transite par Lucky.
          </p>
          <p className="mt-2">
            Lorsqu'une personne en invite une autre à boire un verre sur la carte du lieu, aucune somme n'est
            prélevée par Lucky : un bon est généré, l'établissement le sert et le porte sur l'addition de son
            client, selon ses propres conditions.
          </p>
          <p className="mt-2">
            Les sommes encaissées par LUCKY le sont exclusivement auprès d'établissements professionnels, au
            titre de leur abonnement ou d'une prestation ponctuelle. Ce qui suit les concerne.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Abonnement : essai, facturation, annulation</h2>
          <p className="mt-2">
            Les trente (30) premiers jours sont gratuits. Pendant cette période, l'établissement peut mettre
            fin au contrat à tout moment, par simple e-mail, sans justification ni frais, et aucun
            prélèvement n'intervient.
          </p>
          <p className="mt-2">
            Passé l'essai, l'abonnement est facturé mensuellement d'avance, aux tarifs publics affichés sur{' '}
            <Link href="/" className="text-brass underline">
              lucky-app.io
            </Link>
            , en euros, hors taxes, la TVA au taux en vigueur s'ajoutant sur la facture.
          </p>
          <p className="mt-2">
            L'établissement peut résilier à tout moment, avec un préavis de trente (30) jours notifié par
            écrit à{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            . Le service reste actif jusqu'au terme de la période en cours. Aucune reconduction ne survient
            après la résiliation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Remboursement</h2>
          <p className="mt-2">
            Les abonnements étant facturés d'avance, tout mois commencé est dû. Nous remboursons néanmoins,
            au prorata ou en totalité selon le cas :
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              toute somme prélevée par erreur — double prélèvement, montant erroné, prélèvement postérieur à
              une résiliation : remboursement intégral ;
            </li>
            <li>
              toute période pendant laquelle le service a été indisponible de notre fait pendant plus de
              quarante-huit (48) heures consécutives : remboursement au prorata des jours concernés ;
            </li>
            <li>
              une prestation ponctuelle — soirée — annulée par nos soins, ou qui n'a pas pu se tenir pour une
              raison qui nous est imputable : remboursement intégral.
            </li>
          </ul>
          <p className="mt-2">
            Une prestation ponctuelle annulée par l'établissement est remboursée intégralement si l'annulation
            nous parvient plus de sept (7) jours avant la date convenue. En deçà, elle peut être reportée à
            une autre date sans frais.
          </p>
          <p className="mt-2">
            Toute demande s'adresse à{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            . Nous répondons sous cinq (5) jours ouvrés. Un remboursement accepté est émis sur le moyen de
            paiement d'origine sous dix (10) jours ouvrés ; le délai d'apparition sur le relevé dépend ensuite
            de la banque de l'établissement.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Litiges</h2>
          <p className="mt-2">
            En cas de désaccord sur une facture ou un prélèvement, écrivez-nous d'abord à{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>{' '}
            : nous examinons le dossier et répondons sous cinq (5) jours ouvrés. La très grande majorité des
            situations se règle à ce stade, et plus vite qu'une contestation bancaire.
          </p>
          <p className="mt-2">
            Si une contestation est néanmoins ouverte auprès de la banque, nous y répondons dans les délais
            impartis par le réseau de cartes, pièces à l'appui — contrat signé, factures, journaux
            d'utilisation du service. À défaut d'accord amiable, le litige relève des tribunaux compétents
            selon les règles de droit commun.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Nous joindre</h2>
          <p className="mt-2">
            LUCKY, SAS au capital de 200 euros, RCS de Paris 132 148 941, 8 bis rue Abel, 75012 Paris,
            France.
          </p>
          <p className="mt-2">
            Facturation et réclamations :{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            . Nous répondons sous cinq (5) jours ouvrés.
          </p>
          <p className="mt-2">
            Les conditions complètes applicables aux établissements figurent dans nos{' '}
            <Link href="/legal/etablissements" className="text-brass underline">
              conditions générales de vente
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
