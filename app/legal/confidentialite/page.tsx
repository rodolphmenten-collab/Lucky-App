import Link from 'next/link';

export const metadata = { title: 'Politique de Confidentialité | Lucky' };

/**
 * La politique de confidentialité.
 *
 * Les CGU la citaient depuis le début sans qu'elle existe : le consentement
 * recueilli à l'inscription renvoyait donc à un document introuvable, ce qui
 * est précisément ce qui fragilise un consentement.
 *
 * Elle décrit ce que le produit fait réellement — géolocalisation vérifiée
 * puis jetée, profil visible dans un seul établissement, établissement qui ne
 * voit que des agrégats. Si le produit change sur l'un de ces points, cette
 * page doit changer le même jour.
 */
export default function PolitiqueConfidentialite() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l&rsquo;accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Vos données</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Politique de Confidentialité</h1>
      <p className="mt-3 text-xs text-bone-faint">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <p>
            Lucky met en relation des personnes qui se trouvent, au même moment, dans le même établissement.
            Cela suppose de traiter des données qui vous concernent. Cette page dit lesquelles, pourquoi, pendant
            combien de temps, et ce que vous pouvez exiger de nous.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">1. Qui est responsable de vos données</h2>
          <p className="mt-2">
            Le responsable du traitement est <strong className="text-bone">LUCKY</strong>, [forme sociale à
            compléter] au capital de [montant à compléter] euros, immatriculée au RCS de [ville à compléter] sous
            le numéro [SIREN à compléter], dont le siège social est situé [adresse à compléter].
          </p>
          <p className="mt-2">
            Contact pour toute question relative à vos données :{' '}
            <a href="mailto:privacy@lucky-app.io" className="text-brass hover:underline">
              privacy@lucky-app.io
            </a>
            .
          </p>
          <p className="mt-2">
            L&rsquo;établissement dans lequel vous scannez un code QR n&rsquo;est pas responsable de ces
            traitements et n&rsquo;en détermine ni les finalités ni les moyens. Lorsque le service vous est
            présenté sous le nom de l&rsquo;établissement, c&rsquo;est néanmoins Lucky qui traite vos données.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">2. Les données que nous traitons</h2>
          <p className="mt-2">Nous ne collectons que ce dont le service a besoin pour fonctionner.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-bone">Votre profil</strong> : prénom, âge, métier, ville, photo, courte
              description, intentions déclarées et, si vous le renseignez, lien LinkedIn. C&rsquo;est ce que les
              autres personnes présentes voient.
            </li>
            <li>
              <strong className="text-bone">Votre email</strong> : il sert uniquement à vous envoyer le code de
              connexion à usage unique. Il n&rsquo;est jamais visible par les autres utilisateurs ni par
              l&rsquo;établissement.
            </li>
            <li>
              <strong className="text-bone">Votre présence</strong> : l&rsquo;établissement où vous êtes et
              l&rsquo;heure de votre arrivée, le temps de votre passage.
            </li>
            <li>
              <strong className="text-bone">Votre position</strong> : au moment du scan uniquement, pour vérifier
              que vous êtes bien sur place. Voir le point 4, qui précise ce que nous en faisons.
            </li>
            <li>
              <strong className="text-bone">Vos interactions</strong> : signes envoyés, mises en relation,
              messages échangés, et les bons offerts ou reçus dans l&rsquo;établissement.
            </li>
            <li>
              <strong className="text-bone">Données techniques</strong> : journaux de connexion et informations
              nécessaires à la sécurité du service.
            </li>
          </ul>
          <p className="mt-3">
            Nous ne demandons ni votre nom de famille, ni votre adresse postale, ni vos coordonnées bancaires.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">3. Pourquoi, et sur quelle base</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-bone">
                  <th className="py-2 pr-4 font-semibold">Finalité</th>
                  <th className="py-2 pr-4 font-semibold">Données</th>
                  <th className="py-2 font-semibold">Base légale</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Vous rendre visible des personnes présentes</td>
                  <td className="py-2 pr-4">Profil, présence</td>
                  <td className="py-2">Votre consentement</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Vérifier que vous êtes dans l&rsquo;établissement</td>
                  <td className="py-2 pr-4">Position au scan</td>
                  <td className="py-2">Exécution du service</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Permettre les mises en relation et les échanges</td>
                  <td className="py-2 pr-4">Signes, messages</td>
                  <td className="py-2">Exécution du service</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Vous connecter sans mot de passe</td>
                  <td className="py-2 pr-4">Email</td>
                  <td className="py-2">Exécution du service</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Sécurité, modération, lutte contre les abus</td>
                  <td className="py-2 pr-4">Journaux, signalements</td>
                  <td className="py-2">Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Mesurer l&rsquo;activité générée pour l&rsquo;établissement</td>
                  <td className="py-2 pr-4">Bons servis, montants</td>
                  <td className="py-2">Intérêt légitime</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Vous pouvez retirer votre consentement à tout moment en vous rendant invisible ou en supprimant votre
            compte. Cela n&rsquo;affecte pas la licéité de ce qui a été fait avant.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">4. Votre position</h2>
          <p className="mt-2">
            Votre position est demandée au moment où vous rejoignez une salle, pour une seule raison : vérifier
            que vous êtes réellement dans l&rsquo;établissement. Sans cette vérification, n&rsquo;importe qui
            pourrait apparaître dans n&rsquo;importe quel lieu.
          </p>
          <p className="mt-2">
            Nous conservons le résultat de cette vérification — vous étiez sur place, ou non — et non vos
            coordonnées précises. Celles-ci ne sont ni communiquées à l&rsquo;établissement, ni aux autres
            utilisateurs, ni utilisées pour vous suivre entre deux lieux. Le service ne vous géolocalise pas en
            arrière-plan : il ne demande votre position qu&rsquo;au moment du scan.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">5. Qui voit quoi</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-bone">Les autres personnes présentes</strong> voient votre profil, et
              uniquement pendant votre passage dans cet établissement. Vous disparaissez quand vous partez ou
              quand vous vous rendez invisible.
            </li>
            <li>
              <strong className="text-bone">L&rsquo;établissement</strong> ne voit ni votre profil, ni vos
              messages, ni votre identité. Il n&rsquo;a accès qu&rsquo;à des statistiques agrégées : combien de
              personnes présentes, combien de rencontres, quel chiffre d&rsquo;affaires généré. Son personnel ne
              voit, sur un bon présenté au comptoir, que le montant à encaisser et le prénom associé.
            </li>
            <li>
              <strong className="text-bone">Sauf si vous le demandez vous-même.</strong> Dans la salle, une case
              décochée vous propose de recevoir les actualités de cet établissement précis. Si vous la cochez,
              et seulement dans ce cas, votre prénom, votre adresse e-mail et la date de votre accord lui sont
              transmis ; il devient alors responsable de l&rsquo;usage qu&rsquo;il en fait et doit vous offrir
              un moyen de vous désinscrire de ses envois. Votre accord vaut pour cet établissement et pour aucun
              autre, et vous pouvez le retirer à tout moment au même endroit — il cesse alors de vous voir dans
              sa liste. Nous conservons la date de votre accord et celle de son retrait, afin de pouvoir établir
              ce que vous aviez accepté et quand.
            </li>
            <li>
              <strong className="text-bone">Nos prestataires techniques</strong>, strictement pour faire
              fonctionner le service : hébergement et base de données (Supabase, Union européenne), envoi
              d&rsquo;emails, paiement des abonnements des établissements (Stripe). Ils agissent sur nos
              instructions et n&rsquo;exploitent pas vos données pour leur compte.
            </li>
          </ul>
          <p className="mt-3">
            Nous ne vendons pas vos données. Nous ne les cédons pas à des annonceurs. Nous ne faisons pas de
            publicité ciblée.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">6. Combien de temps</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Votre profil : tant que votre compte existe.</li>
            <li>Votre présence dans un lieu : la durée de votre passage, puis en historique pendant 12 mois.</li>
            <li>Vos messages : tant que la mise en relation existe, et jusqu&rsquo;à sa suppression par vous.</li>
            <li>
              Les bons et les montants associés : 10 ans, parce qu&rsquo;ils participent à la comptabilité de
              l&rsquo;établissement.
            </li>
            <li>Les journaux techniques : 12 mois.</li>
            <li>
              Les données liées à un signalement ou à une mesure de modération : jusqu&rsquo;à 3 ans après la
              mesure.
            </li>
          </ul>
          <p className="mt-3">
            À la suppression de votre compte, votre profil et vos messages sont effacés. Ce qui doit être
            conservé pour des raisons comptables ou de sécurité l&rsquo;est sous une forme qui ne permet plus de
            vous identifier.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">7. Vos droits</h2>
          <p className="mt-2">
            Vous disposez d&rsquo;un droit d&rsquo;accès, de rectification, d&rsquo;effacement, de limitation,
            d&rsquo;opposition et de portabilité, ainsi que du droit de retirer votre consentement.
          </p>
          <p className="mt-2">
            Pour les exercer, écrivez à{' '}
            <a href="mailto:privacy@lucky-app.io" className="text-brass hover:underline">
              privacy@lucky-app.io
            </a>
            . Nous répondons sous un mois. La suppression de votre compte depuis l&rsquo;application produit le
            même effet qu&rsquo;une demande d&rsquo;effacement, immédiatement.
          </p>
          <p className="mt-2">
            Si notre réponse ne vous satisfait pas, vous pouvez saisir la Commission Nationale de
            l&rsquo;Informatique et des Libertés (CNIL), 3 place de Fontenoy, 75007 Paris —{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass hover:underline"
            >
              cnil.fr
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">8. Sécurité et localisation</h2>
          <p className="mt-2">
            Vos données sont hébergées au sein de l&rsquo;Union européenne. Les accès sont restreints aux
            personnes qui en ont besoin, les échanges sont chiffrés en transit, et les mots de passe
            n&rsquo;existent pas — la connexion se fait par code à usage unique.
          </p>
          <p className="mt-2">
            En cas de violation de données susceptible d&rsquo;engendrer un risque élevé pour vos droits, nous
            vous en informons et notifions la CNIL dans les délais prévus par le Règlement.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">9. Mineurs</h2>
          <p className="mt-2">
            Le service est réservé aux personnes majeures. Nous ne collectons pas sciemment de données
            concernant des mineurs. Si vous constatez qu&rsquo;un mineur utilise le service, signalez-le à{' '}
            <a href="mailto:privacy@lucky-app.io" className="text-brass hover:underline">
              privacy@lucky-app.io
            </a>{' '}
            : le compte sera supprimé.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">10. Modifications</h2>
          <p className="mt-2">
            Cette politique peut évoluer avec le service. Toute modification substantielle vous sera signalée
            dans l&rsquo;application avant son entrée en vigueur. La date en haut de page indique la dernière
            mise à jour.
          </p>
        </section>
      </div>
    </main>
  );
}
