import Link from 'next/link';

export const metadata = { title: 'Politique d\'usage acceptable | Lucky' };

/**
 * Politique d'usage acceptable (Acceptable Use Policy).
 *
 * Ces règles figurent déjà, en substance, à l'article 4 des CGU. Elles sont
 * reprises ici dans un document autonome parce que c'est ce que demandent les
 * partenaires de paiement et les réseaux de cartes : une page identifiable,
 * accessible sans compte, qui dit ce qui est interdit et ce qu'il advient de
 * celui qui enfreint la règle.
 */
export default function PolitiqueUsage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l'accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Règles d'usage</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Politique d'usage acceptable</h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 18/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <p>
            Lucky met en relation des personnes présentes au même moment dans un même établissement. Ce
            service ne fonctionne que si chacun s'y sent en sécurité. Les règles qui suivent s'appliquent à
            tout utilisateur, sans exception, et complètent les{' '}
            <Link href="/legal/utilisateurs" className="text-brass underline">
              Conditions Générales d'Utilisation
            </Link>
            . Elles sont éditées par LUCKY, SAS au capital de 200 euros, RCS de Paris 132 148 941, 8 bis rue
            Abel, 75012 Paris.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">1. Qui peut utiliser Lucky</h2>
          <p className="mt-2">
            Le Service est réservé aux personnes majeures, âgées de 18 ans révolus. Chaque utilisateur
            certifie son âge lors de la création de son profil. Tout compte dont nous avons des raisons
            sérieuses de penser qu'il appartient à un mineur est suspendu immédiatement, sans préavis, et
            ses données sont supprimées.
          </p>
          <p className="mt-2">
            Le profil doit représenter une personne réelle, être à son nom, et porter une photographie
            récente et fidèle d'elle-même. Un seul profil par personne.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">2. Ce qui est interdit</h2>
          <p className="mt-2">Il est interdit, sur Lucky :</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              d&rsquo;utiliser le Service à des fins de traite des êtres humains, y compris l&rsquo;exploitation
              sexuelle, ou pour aider, encourager, faciliter ou favoriser de tels agissements ou toute
              forme d&rsquo;abus ;
            </li>
            <li>de harceler, menacer, injurier, intimider ou importuner une autre personne ;</li>
            <li>
              d'insister auprès de quelqu'un qui ne répond pas, ou de reprendre contact après un blocage ;
            </li>
            <li>
              de publier ou d'envoyer un contenu sexuel, pornographique, violent, haineux, discriminatoire
              ou diffamatoire ;
            </li>
            <li>
              de solliciter ou de proposer des services sexuels, rémunérés ou non — Lucky n'est pas un
              service de rencontre à caractère sexuel et ne le deviendra pas ;
            </li>
            <li>
              d'usurper l'identité d'un tiers, de créer un faux profil, ou d'utiliser la photographie de
              quelqu'un d'autre ;
            </li>
            <li>
              d'utiliser le Service à des fins commerciales, publicitaires, de démarchage, de collecte de
              données ou de promotion d'un autre service ;
            </li>
            <li>
              de demander de l'argent, de proposer un investissement, ou de solliciter des coordonnées
              bancaires — aucune transaction entre utilisateurs n'existe sur Lucky ;
            </li>
            <li>
              de contourner la vérification de présence, d'automatiser l'accès au Service, ou d'en extraire
              les données ;
            </li>
            <li>
              de diffuser hors de l'application le contenu d'une conversation privée, la photographie ou les
              informations d'une autre personne sans son accord.
            </li>
          </ul>
        </section>

        <section>
          <div className="rounded-xl border border-brass/40 bg-brass/5 p-4">
            <p className="text-bone">
              <strong className="text-bone">
                Lucky ne peut en aucun cas être utilisé à des fins de traite des êtres humains, y compris
                l&rsquo;exploitation sexuelle, ni pour aider, encourager ou favoriser un abus.
              </strong>{' '}
              Tout compte pour lequel nous avons des raisons sérieuses de penser qu&rsquo;il sert à de telles
              fins est supprimé immédiatement, sans préavis, et signalé aux autorités compétentes.
            </p>
            <p className="mt-2 italic text-bone-faint">
              Lucky may not be used for human trafficking, including sexual exploitation, or to aid, abet
              or encourage abuse. Any account we have serious reason to believe is used for such purposes
              is deleted immediately, without notice, and reported to the competent authorities.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">3. Ce que nous avons mis en place</h2>
          <p className="mt-2">
            <strong className="text-bone">La présence est vérifiée.</strong> On ne voit que des personnes
            confirmées présentes dans le même établissement au même moment, par signal de localisation
            revérifié au fil de la soirée. Quand quelqu'un s'en va, il disparaît de la salle.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Un seul message tant que l'autre n'a pas répondu.</strong> N'importe
            qui peut écrire le premier, mais personne ne peut enchaîner les messages auprès d'une personne qui
            ne lui répond pas. Cette limite est appliquée par nos serveurs, et non par l'application seule.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Blocage et signalement en un geste.</strong> Depuis une conversation
            ou un profil, chacun peut bloquer une personne — elle disparaît alors de sa salle et ne peut plus
            le joindre — ou la signaler à notre équipe.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Les conversations sont privées.</strong> L'établissement partenaire
            n'y a aucun accès : techniquement, il ne peut pas lire les messages échangés chez lui.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">4. Signaler un comportement</h2>
          <p className="mt-2">
            Tout signalement est examiné par notre équipe. Écrivez à{' '}
            <a href="mailto:signalement@lucky-app.io" className="text-brass underline">
              signalement@lucky-app.io
            </a>{' '}
            si vous préférez nous écrire directement, en précisant le lieu, le moment et, si vous le pouvez,
            une capture d'écran.
          </p>
          <p className="mt-2">
            En cas de danger immédiat, prévenez d'abord le personnel de l'établissement ou composez le 17
            (police) ou le 112 (urgences européennes). Nous traitons des comptes, pas des urgences.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">5. Ce que nous faisons en cas de manquement</h2>
          <p className="mt-2">
            Selon la gravité des faits et leur éventuelle répétition, nous pouvons adresser un avertissement,
            restreindre l'accès au Service, suspendre le compte, ou le supprimer définitivement.
          </p>
          <p className="mt-2">
            Un contenu sexuel non sollicité, une sollicitation de nature sexuelle, un harcèlement caractérisé,
            une menace, l'usurpation d'identité ou tout élément laissant penser que l'utilisateur est mineur
            entraînent la suppression immédiate du compte, sans avertissement préalable.
          </p>
          <p className="mt-2">
            Lorsque les faits sont susceptibles de constituer une infraction pénale, nous conservons les
            éléments utiles et pouvons en saisir les autorités compétentes. Les demandes émanant des autorités
            sont traitées selon la procédure décrite dans nos{' '}
            <Link href="/legal/autorites" className="text-brass underline">
              modalités de réponse aux autorités
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">6. Contester une décision</h2>
          <p className="mt-2">
            Si votre compte a été suspendu ou supprimé et que vous estimez cette décision injustifiée,
            écrivez à{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            . Nous réexaminons le dossier et répondons sous trente (30) jours.
          </p>
        </section>
      </div>
    </main>
  );
}
