import Link from 'next/link';

export const metadata = { title: 'Conditions Générales d\'Utilisation | Lucky' };

export default function CGUUtilisateurs() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l'accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Conditions générales</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Conditions Générales d'Utilisation</h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <h2 className="text-base font-semibold text-bone">Éditeur</h2>
          <p className="mt-2">
            Lucky est édité par OLIGART, SASU au capital de 1 000 euros, immatriculée au RCS de Paris
            sous le numéro 939 531 125 00010, dont le siège social est situé 9 bis rue Pérignon, 75015 Paris,
            France. Contact : hello@lucky-app.io.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 1 — Objet et acceptation</h2>
          <p className="mt-2">
            Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation du
            service Lucky par toute personne physique (« l'Utilisateur »). L'accès à une salle Lucky (ci-après
            « la Salle »), après scan d'un code QR au sein d'un établissement partenaire, est subordonné à
            l'acceptation expresse et préalable des présentes CGU. Cette acceptation est un préalable
            obligatoire à toute utilisation du Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 2 — Conditions d'accès</h2>
          <p className="mt-2">
            L'utilisation du Service est réservée aux personnes âgées de 18 ans révolus. En créant un profil,
            l'Utilisateur certifie être âgé d'au moins 18 ans et garantit l'exactitude des informations
            fournies, notamment son prénom, son âge, et sa photographie, laquelle doit être une photographie
            récente et fidèle de l'Utilisateur lui-même.
          </p>
          <p className="mt-2">
            Toute usurpation d'identité, création de faux profil, ou communication d'informations trompeuses est
            strictement interdite et peut entraîner la suspension immédiate du compte, sans préjudice d'éventuelles
            poursuites.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 3 — Fonctionnement du Service</h2>
          <p className="mt-2">
            Lucky permet à l'Utilisateur, une fois sa présence physique vérifiée par signal de localisation au
            sein d'un établissement partenaire, de consulter les profils des autres Utilisateurs également
            présents et ayant choisi de rendre leur profil visible, de leur manifester un intérêt (« Wave »), et,
            en cas d'intérêt réciproque, d'échanger par messagerie au sein de l'application.
          </p>
          <p className="mt-2">
            La vérification de présence repose sur les données de localisation transmises par l'appareil de
            l'Utilisateur au moment de la connexion et à intervalles réguliers par la suite. Cette vérification
            est un dispositif technique raisonnable et ne constitue pas une garantie absolue d'exactitude.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 4 — Comportement de l'Utilisateur</h2>
          <p className="mt-2">L'Utilisateur s'engage à ne pas, à l'occasion de l'utilisation du Service :</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Harceler, menacer, injurier ou importuner un autre Utilisateur ;</li>
            <li>Publier ou transmettre un contenu à caractère illicite, violent, pornographique, discriminatoire ou diffamatoire ;</li>
            <li>Utiliser le Service à des fins commerciales, publicitaires, ou de sollicitation non autorisées ;</li>
            <li>Créer plusieurs profils, ou un profil au nom d'un tiers sans son consentement ;</li>
            <li>Contourner ou tenter de contourner les dispositifs de vérification de présence ;</li>
            <li>Porter atteinte, de quelque manière que ce soit, à la sécurité ou à l'intégrité d'un autre Utilisateur.</li>
          </ul>
          <p className="mt-2">
            Tout manquement à ces engagements pourra entraîner la suspension ou la suppression immédiate du
            compte de l'Utilisateur concerné, sans préavis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">
            Article 5 — Rencontres et interactions entre Utilisateurs : avertissement essentiel
          </h2>
          <p className="mt-2 font-medium text-bone">
            L'Utilisateur reconnaît et accepte expressément ce qui suit avant toute utilisation du Service :
          </p>
          <p className="mt-2">
            Lucky est un outil de mise en relation fondé sur la présence géographique déclarée. OLIGART
            n'effectue aucune vérification d'identité approfondie, aucun contrôle d'antécédents judiciaires ou
            autres, et ne garantit en aucune manière l'identité réelle, les intentions, le comportement ou la
            fiabilité des autres Utilisateurs.
          </p>
          <p className="mt-2">
            Toute interaction, échange, rencontre, physique ou non, entre Utilisateurs se déroule sous leur
            entière et seule responsabilité. OLIGART et l'établissement partenaire au sein duquel la mise en
            relation a eu lieu ne sont parties à aucune de ces interactions et déclinent toute responsabilité
            quant à leurs conséquences, y compris en cas de préjudice corporel, matériel ou moral.
          </p>
          <p className="mt-2">
            Il appartient à chaque Utilisateur de faire preuve de la prudence usuelle lors de toute rencontre
            avec une personne connue par l'intermédiaire du Service, notamment lors d'une première rencontre
            physique (privilégier un lieu public, informer un proche, etc.).
          </p>
          <p className="mt-2">
            Le Service met à la disposition de l'Utilisateur des fonctionnalités de signalement et de blocage
            d'un autre Utilisateur. Ces fonctionnalités constituent des outils mis à disposition et ne sauraient
            engager la responsabilité d'OLIGART au titre d'une obligation de surveillance ou de résultat.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 6 — Signalement, blocage et modération</h2>
          <p className="mt-2">
            Tout Utilisateur peut signaler ou bloquer un autre Utilisateur directement depuis l'application.
            OLIGART se réserve le droit d'examiner tout signalement et de suspendre ou supprimer, à sa seule
            discrétion, tout compte dont le comportement contreviendrait aux présentes CGU ou à la loi.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 7 — Visibilité et suppression du compte</h2>
          <p className="mt-2">
            L'Utilisateur peut à tout moment rendre son profil invisible, quitter une Salle, ou demander la
            suppression de son compte et de ses données selon les modalités prévues par la Politique de
            Confidentialité.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 8 — Données personnelles</h2>
          <p className="mt-2">
            Le traitement des données personnelles de l'Utilisateur est décrit dans la Politique de
            Confidentialité de Lucky. En résumé, les coordonnées de localisation exactes, le contenu des
            échanges privés et les données de blocage entre Utilisateurs ne sont jamais communiqués à
            l'établissement partenaire, qui n'a accès qu'à des statistiques agrégées et anonymisées.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 9 — Limitation de responsabilité</h2>
          <p className="mt-2">
            Le Service est fourni « en l'état ». OLIGART ne garantit pas que le Service sera exempt d'erreurs ou
            disponible sans interruption. Dans les limites permises par la loi, la responsabilité d'OLIGART ne
            pourra être engagée qu'en cas de faute prouvée directement imputable à OLIGART dans la fourniture
            du Service, à l'exclusion de tout dommage résultant du comportement d'un autre Utilisateur ou d'un
            tiers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 10 — Modification des CGU</h2>
          <p className="mt-2">
            OLIGART peut modifier les présentes CGU à tout moment. Toute modification substantielle sera portée
            à la connaissance de l'Utilisateur, dont l'acceptation pourra à nouveau être requise.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 11 — Droit applicable</h2>
          <p className="mt-2">
            Les présentes CGU sont soumises au droit français. Pour toute réclamation, l'Utilisateur peut
            contacter hello@lucky-app.io. À défaut de résolution amiable, les tribunaux compétents seront ceux
            désignés par les règles de droit commun applicables aux consommateurs.
          </p>
        </section>
      </div>
    </main>
  );
}
