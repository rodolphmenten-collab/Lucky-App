import Link from 'next/link';

export const metadata = { title: 'Conditions Générales — Établissements | Lucky' };

export default function CGUEtablissements() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l'accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Conditions générales</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">
        Conditions Générales de Vente et d'Utilisation — Établissements
      </h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <h2 className="text-base font-semibold text-bone">Éditeur du service</h2>
          <p className="mt-2">
            Le service Lucky (ci-après « Lucky » ou « le Service ») est édité par OLIGART, société par actions
            simplifiée unipersonnelle (SASU) au capital de 1 000 euros, immatriculée au Registre du
            Commerce et des Sociétés de Paris sous le numéro 939 531 125 00010, dont le siège social est situé
            9 bis rue Pérignon, 75015 Paris, France (ci-après « OLIGART », « Lucky », « nous »).
          </p>
          <p className="mt-2">Directeur de la publication : Rodolph Menten.</p>
          <p className="mt-2">Contact : hello@lucky-app.io</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 1 — Objet</h2>
          <p className="mt-2">
            Les présentes Conditions Générales de Vente et d'Utilisation (ci-après « CGV ») ont pour objet de
            définir les conditions dans lesquelles OLIGART met à disposition des établissements (hôtels,
            restaurants, bars, beach clubs, coworkings, et tout établissement recevant du public, ci-après
            « l'Établissement » ou « le Client ») le service Lucky, plateforme technique permettant à des
            personnes physiquement présentes dans un même lieu de se découvrir et d'échanger entre elles.
          </p>
          <p className="mt-2">
            Toute souscription au Service implique l'acceptation sans réserve des présentes CGV, ainsi que des
            conditions particulières éventuellement convenues entre OLIGART et le Client dans le cadre d'un
            contrat de vente spécifique.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 2 — Description du Service</h2>
          <p className="mt-2">
            Lucky fournit à l'Établissement un outil technique comprenant : un code QR propre à l'établissement
            (ou à ses différentes zones selon la formule souscrite), une page de mise en relation accessible aux
            personnes présentes sur place après vérification de leur position géographique, un tableau de bord
            de statistiques agrégées et anonymisées, ainsi que les fonctionnalités additionnelles décrites dans
            l'offre commerciale souscrite par le Client.
          </p>
          <p className="mt-2">
            Lucky est un outil de mise en relation. Lucky n'organise, ne supervise, ne contrôle et ne garantit
            en aucune manière les échanges, rencontres ou interactions ayant lieu entre les utilisateurs du
            Service, qu'elles se déroulent dans l'enceinte de l'Établissement ou en dehors (voir Article 8).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 3 — Accès au Service et compte Établissement</h2>
          <p className="mt-2">
            L'accès au Service est réservé aux établissements ayant fait l'objet d'une validation par OLIGART.
            Le Client s'engage à fournir des informations exactes lors de la création de son compte et à les
            maintenir à jour. Les identifiants de connexion sont strictement personnels et confidentiels ; le
            Client est seul responsable de leur conservation et de toute utilisation en résultant.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 4 — Obligations du Client</h2>
          <p className="mt-2">Le Client s'engage à :</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Utiliser le Service conformément à sa destination et à la réglementation en vigueur ;</li>
            <li>
              Ne pas altérer, contourner, ou tenter de contourner les dispositifs techniques de vérification de
              présence mis en place par Lucky ;
            </li>
            <li>
              Informer ses clients, par tout moyen approprié, de la présence du dispositif Lucky au sein de
              l'établissement ;
            </li>
            <li>
              Ne pas utiliser les statistiques agrégées fournies par le tableau de bord à des fins autres que
              l'amélioration de son propre établissement ;
            </li>
            <li>
              Signaler sans délai à OLIGART tout dysfonctionnement, incident de sécurité, ou comportement
              manifestement illicite dont il aurait connaissance en lien avec l'utilisation du Service dans ses
              locaux.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">
            Article 5 — Propriété intellectuelle et interdiction de reproduction
          </h2>
          <p className="mt-2">
            Le Service, sa technologie, son concept (incluant sans limitation le principe de vérification de
            présence géolocalisée associée à une mise en relation par intention), son interface, sa marque, son
            nom, son logo, ainsi que l'ensemble des éléments logiciels, graphiques et textuels qui le composent,
            sont la propriété exclusive d'OLIGART et sont protégés par le droit de la propriété intellectuelle.
          </p>
          <p className="mt-2 font-medium text-bone">
            Il est strictement interdit au Client, à ses préposés, ou à tout tiers agissant pour son compte,
            directement ou indirectement, de reproduire, copier, décompiler, désassembler, imiter, adapter ou
            développer, pour son propre usage ou celui d'un tiers, tout service, application ou système
            reproduisant en tout ou partie le concept, le fonctionnement ou la technologie de Lucky, que ce soit
            pendant la durée du contrat ou après son terme, pour une durée de trois (3) ans à compter de la fin
            de la relation contractuelle.
          </p>
          <p className="mt-2">
            Cette interdiction et ses modalités spécifiques (y compris les éventuelles clauses pénales
            applicables) sont détaillées et peuvent être renforcées dans le contrat de vente particulier conclu
            avec chaque Client. Tout manquement à la présente clause pourra donner lieu à la résiliation
            immédiate du contrat sans préjudice de tout dommage et intérêt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 6 — Tarifs et paiement</h2>
          <p className="mt-2">
            Les tarifs applicables sont ceux en vigueur au jour de la souscription, tels que présentés sur le
            site lucky-app.io ou convenus dans le cadre d'une offre commerciale spécifique. Sauf stipulation
            contraire, les abonnements sont facturés mensuellement et renouvelés par tacite reconduction. Tout
            mois commencé est dû dans son intégralité.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 7 — Durée, résiliation et suspension</h2>
          <p className="mt-2">
            Le contrat est conclu pour une durée indéterminée à compter de l'activation du compte, sauf
            stipulation contraire dans le contrat de vente particulier. Chaque partie peut résilier à tout
            moment, avec un préavis de trente (30) jours notifié par écrit.
          </p>
          <p className="mt-2">
            OLIGART se réserve le droit de suspendre ou résilier immédiatement l'accès au Service, sans préavis
            ni indemnité, en cas de manquement grave du Client à ses obligations, notamment en cas de non-respect
            de l'Article 5, d'impayé, ou d'utilisation du Service de nature à porter atteinte à la sécurité des
            utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">
            Article 8 — Responsabilité relative aux interactions entre utilisateurs
          </h2>
          <p className="mt-2 font-medium text-bone">
            Le Client reconnaît et accepte expressément ce qui suit :
          </p>
          <p className="mt-2">
            Lucky est un outil technique de mise en relation fondé sur la présence géographique déclarée et
            vérifiée par signal de localisation. Ni OLIGART ni le Client n'effectuent de vérification d'identité
            approfondie, de contrôle d'antécédents, ni aucune forme de filtrage des utilisateurs au-delà des
            informations librement déclarées par ceux-ci lors de la création de leur profil.
          </p>
          <p className="mt-2">
            OLIGART et le Client ne sont en conséquence parties à aucune interaction, échange, rencontre ou
            relation, quelle qu'en soit la nature, se nouant entre les utilisateurs du Service par l'intermédiaire
            de celui-ci, que cette interaction ait lieu dans l'enceinte de l'Établissement ou en dehors. Ni
            OLIGART ni le Client ne pourront être tenus responsables, à quelque titre que ce soit, des
            conséquences directes ou indirectes de ces interactions, y compris en cas de dommage corporel,
            matériel, moral, de comportement délictuel ou de tout litige opposant des utilisateurs entre eux.
          </p>
          <p className="mt-2">
            Le Service met à disposition des utilisateurs des outils de signalement et de blocage (voir les
            Conditions Générales d'Utilisation applicables aux utilisateurs). L'existence de ces outils ne
            saurait constituer une garantie de sécurité et ne transfère aucune obligation de surveillance ou de
            résultat à la charge d'OLIGART ou du Client.
          </p>
          <p className="mt-2">
            Le Client s'engage à ne faire aucune déclaration, publicité ou communication laissant entendre que
            Lucky garantit la sécurité, l'identité ou la fiabilité des utilisateurs du Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 9 — Garanties et limitation de responsabilité générale</h2>
          <p className="mt-2">
            Le Service est fourni « en l'état ». OLIGART s'engage à mettre en œuvre des moyens raisonnables pour
            assurer la disponibilité et le bon fonctionnement du Service, sans garantie de résultat. OLIGART ne
            saurait être tenue responsable des interruptions, dysfonctionnements ou pertes de données résultant
            de causes qui lui sont extérieures, notamment de la défaillance de prestataires techniques tiers, de
            problèmes de connectivité, ou de cas de force majeure.
          </p>
          <p className="mt-2">
            En tout état de cause, la responsabilité totale d'OLIGART au titre du présent contrat, toutes causes
            confondues, est limitée au montant des sommes effectivement versées par le Client au titre des douze
            (12) derniers mois précédant le fait générateur du dommage.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 10 — Protection des données personnelles</h2>
          <p className="mt-2">
            Le traitement des données personnelles des utilisateurs et des représentants du Client dans le cadre
            du Service est décrit dans la Politique de Confidentialité de Lucky, accessible sur demande. Le
            tableau de bord fourni au Client n'expose que des données statistiques agrégées et anonymisées ; en
            aucun cas les coordonnées exactes, le contenu des échanges, ou les données de blocage entre
            utilisateurs ne sont accessibles au Client.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 11 — Modification des CGV</h2>
          <p className="mt-2">
            OLIGART se réserve le droit de modifier les présentes CGV à tout moment. Les Clients seront informés
            de toute modification substantielle par email ou via leur tableau de bord, avec un préavis raisonnable
            avant leur entrée en vigueur.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 12 — Droit applicable et juridiction</h2>
          <p className="mt-2">
            Les présentes CGV sont soumises au droit français. Tout litige relatif à leur interprétation ou leur
            exécution relève de la compétence exclusive des tribunaux du ressort de Paris, sauf disposition
            légale impérative contraire.
          </p>
        </section>
      </div>
    </main>
  );
}
