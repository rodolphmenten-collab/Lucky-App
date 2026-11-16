import Link from 'next/link';

export const metadata = { title: 'Réponse aux demandes des autorités | Lucky' };

/**
 * Procédure de réponse aux réquisitions judiciaires et administratives
 * (protocols for law enforcement).
 *
 * Page exigée par les partenaires de paiement pour les services de mise en
 * relation. Elle dit qui contacter, sous quelle forme, ce que nous détenons
 * réellement, et ce que nous ne détenons pas — cette dernière précision évite
 * autant de réquisitions inutiles qu'elle protège nos utilisateurs.
 */
export default function ReponseAutorites() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l'accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Autorités</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">
        Réponse aux demandes des autorités
      </h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 16/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <p>
            Cette page s'adresse aux services d'enquête, aux autorités judiciaires et administratives. Elle
            décrit comment adresser une demande à LUCKY, ce que nous pouvons fournir, et dans quels délais.
          </p>
          <p className="mt-2">
            LUCKY, SAS au capital de 200 euros, immatriculée au RCS de Paris sous le numéro 132 148 941,
            siège social 8 bis rue Abel, 75012 Paris, France.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Point de contact</h2>
          <p className="mt-2">
            Toute demande doit être adressée à{' '}
            <a href="mailto:legal@lucky-app.io" className="text-brass underline">
              legal@lucky-app.io
            </a>
            , depuis une adresse officielle du service requérant, ou par courrier au siège social à
            l'attention du responsable juridique.
          </p>
          <p className="mt-2">
            Nous accusons réception sous deux (2) jours ouvrés. Ce point de contact est réservé aux
            autorités : les utilisateurs passent par{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>{' '}
            et les signalements par{' '}
            <a href="mailto:signalement@lucky-app.io" className="text-brass underline">
              signalement@lucky-app.io
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Forme de la demande</h2>
          <p className="mt-2">
            Nous communiquons des données personnelles sur le fondement d'une réquisition judiciaire, d'une
            commission rogatoire, d'une décision de justice ou de toute autre demande régulière fondée en
            droit français ou européen. Une demande informelle, sans base légale, ne peut pas être satisfaite.
          </p>
          <p className="mt-2">La demande doit préciser :</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>le fondement légal invoqué et l'autorité requérante ;</li>
            <li>
              l'identifiant exact de la personne ou du compte concerné — adresse e-mail utilisée pour la
              connexion, ou identifiant de profil ;
            </li>
            <li>la période précise sur laquelle porte la demande ;</li>
            <li>la nature exacte des données sollicitées ;</li>
            <li>les coordonnées de l'enquêteur en charge.</li>
          </ul>
          <p className="mt-2">
            Une demande trop générale, ou visant un établissement entier plutôt qu'un compte identifié, sera
            renvoyée pour précision.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Ce que nous détenons</h2>
          <p className="mt-2">Selon les cas, et dans la limite de nos durées de conservation :</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              les données de profil : prénom, âge déclaré, métier, ville, photographie, description, et le
              cas échéant lien professionnel renseigné par l'utilisateur ;
            </li>
            <li>l'adresse e-mail de connexion ;</li>
            <li>
              l'historique de présence : établissements fréquentés, dates et heures d'arrivée et de départ ;
            </li>
            <li>les mises en relation, et les messages échangés au sein de l'application ;</li>
            <li>les signalements et blocages émis ou reçus ;</li>
            <li>les journaux techniques de connexion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Ce que nous ne détenons pas</h2>
          <p className="mt-2">
            Nous ne collectons ni nom de famille, ni adresse postale, ni pièce d'identité, ni coordonnées
            bancaires d'utilisateur. Aucun paiement d'utilisateur ne transite par Lucky.
          </p>
          <p className="mt-2">
            La position géographique n'est utilisée qu'au moment de la vérification de présence, pour
            confirmer que la personne se trouve dans l'établissement : nous n'établissons ni ne conservons
            d'historique de déplacements en dehors de ces établissements.
          </p>
          <p className="mt-2">
            Les conversations ne sont pas accessibles aux établissements partenaires, par construction
            technique.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Conservation et gel des données</h2>
          <p className="mt-2">
            Les durées de conservation sont celles indiquées dans notre{' '}
            <Link href="/legal/confidentialite" className="text-brass underline">
              politique de confidentialité
            </Link>
            . En cas d'enquête en cours, une demande de conservation conservatoire peut être adressée au même
            point de contact : nous gelons alors les données visées pendant quatre-vingt-dix (90) jours, dans
            l'attente d'une réquisition régulière, et ce délai peut être prolongé sur demande motivée.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Délais</h2>
          <p className="mt-2">
            Une demande régulière est traitée sous dix (10) jours ouvrés. En cas de danger grave et imminent
            pour la vie ou l'intégrité physique d'une personne, signalez-le explicitement dans l'objet du
            message : la demande est traitée en urgence, sous vingt-quatre (24) heures.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Information de la personne concernée</h2>
          <p className="mt-2">
            Sauf interdiction légale, obligation de confidentialité imposée par l'autorité requérante, ou
            risque que cette information fasse obstacle à l'enquête ou mette une personne en danger, nous
            informons l'utilisateur concerné qu'une demande portant sur ses données a été reçue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Demandes émanant d'autorités étrangères</h2>
          <p className="mt-2">
            LUCKY est une société française, établie en France, et ses données sont hébergées dans l'Union
            européenne. Les demandes émanant d'autorités étrangères doivent emprunter les canaux de
            coopération judiciaire internationale applicables.
          </p>
        </section>
      </div>
    </main>
  );
}
