/**
 * Les conditions générales applicables aux établissements, comme données.
 *
 * Elles étaient écrites en JSX dans la page publique, donc impossibles à
 * annexer au contrat autrement qu'en les recopiant — et deux copies d'un texte
 * contractuel finissent toujours par diverger. Elles vivent ici une seule
 * fois : la page les affiche, le PDF du contrat les annexe.
 *
 * Format volontairement pauvre — titres, paragraphes, listes — parce qu'il doit
 * se rendre aussi bien en HTML qu'avec les polices standard d'un PDF.
 */

export interface BlocCgv {
  /** Paragraphe courant. */
  p?: string;
  /** Paragraphe mis en avant (gras dans les deux rendus). */
  fort?: string;
  /** Sous-titre à l'intérieur d'un article. */
  sous?: string;
  /** Liste à puces. */
  liste?: string[];
}

export interface ArticleCgv {
  titre: string;
  blocs: BlocCgv[];
}

export const CGV_VERSION = '2026-11-18';

export const CGV_ETABLISSEMENTS: ArticleCgv[] = [
  {
    titre: 'Éditeur du service',
    blocs: [
      {
        p: "Le service Lucky (ci-après « Lucky » ou « le Service ») est édité par LUCKY, société par " +
          "actions simplifiée (SAS) au capital de 200 euros, immatriculée au Registre du Commerce et des " +
          "Sociétés de Paris sous le numéro 132 148 941, dont le siège social est situé 8 bis rue Abel, " +
          "75012 Paris, France (ci-après « LUCKY », « Lucky », « nous »).",
      },
      { p: 'Directeur de la publication : Rodolph Menten, Président.' },
      { p: 'Contact : hello@lucky-app.io' },
    ],
  },
  {
    titre: 'Article 1 — Objet',
    blocs: [
      {
        p: "Les présentes Conditions Générales de Vente et d'Utilisation (ci-après « CGV ») ont pour objet " +
          "de définir les conditions dans lesquelles LUCKY met à disposition des établissements (hôtels, " +
          "restaurants, bars, beach clubs, coworkings, et tout établissement recevant du public, ci-après " +
          "« l'Établissement » ou « le Client ») le service Lucky, plateforme technique permettant à des " +
          "personnes physiquement présentes dans un même lieu de se découvrir et d'échanger entre elles.",
      },
      {
        p: "Toute souscription au Service implique l'acceptation sans réserve des présentes CGV, ainsi que " +
          "des conditions particulières éventuellement convenues entre LUCKY et le Client dans le cadre " +
          "d'un contrat de vente spécifique.",
      },
    ],
  },
  {
    titre: 'Article 2 — Description du Service',
    blocs: [
      {
        p: "Lucky fournit à l'Établissement un outil technique comprenant : un code QR propre à " +
          "l'établissement (ou à ses différentes zones selon la formule souscrite), une page de mise en " +
          "relation accessible aux personnes présentes sur place après vérification de leur position " +
          "géographique, un tableau de bord de statistiques agrégées et anonymisées, ainsi que les " +
          "fonctionnalités additionnelles décrites dans l'offre commerciale souscrite par le Client.",
      },
      {
        p: "Lucky est un outil de mise en relation. Lucky n'organise, ne supervise, ne contrôle et ne " +
          "garantit en aucune manière les échanges, rencontres ou interactions ayant lieu entre les " +
          "utilisateurs du Service, qu'elles se déroulent dans l'enceinte de l'Établissement ou en dehors " +
          "(voir Article 8).",
      },
    ],
  },
  {
    titre: 'Article 3 — Accès au Service et compte Établissement',
    blocs: [
      {
        p: "L'accès au Service est réservé aux établissements ayant fait l'objet d'une validation par " +
          "LUCKY. Le Client s'engage à fournir des informations exactes lors de la création de son compte " +
          "et à les maintenir à jour. Les identifiants de connexion sont strictement personnels et " +
          "confidentiels ; le Client est seul responsable de leur conservation et de toute utilisation en " +
          "résultant.",
      },
    ],
  },
  {
    titre: 'Article 4 — Obligations du Client',
    blocs: [
      { p: "Le Client s'engage à :" },
      {
        liste: [
          "Utiliser le Service conformément à sa destination et à la réglementation en vigueur ;",
          "Ne pas altérer, contourner, ou tenter de contourner les dispositifs techniques de vérification de présence mis en place par Lucky ;",
          "Informer ses clients, par tout moyen approprié, de la présence du dispositif Lucky au sein de l'établissement ;",
          "Ne pas utiliser les statistiques agrégées fournies par le tableau de bord à des fins autres que l'amélioration de son propre établissement ;",
          "Signaler sans délai à LUCKY tout dysfonctionnement, incident de sécurité, ou comportement manifestement illicite dont il aurait connaissance en lien avec l'utilisation du Service dans ses locaux.",
        ],
      },
      { sous: '4.1 — Supports physiques' },
      {
        p: "Les supports portant le code QR (plaques, chevalets, jetons, affichages) sont mis à disposition " +
          "du Client dans le cadre d'un prêt à usage. Ils demeurent la propriété de LUCKY pendant toute la " +
          "durée du contrat, y compris lorsqu'ils sont personnalisés aux couleurs du Client.",
      },
      {
        liste: [
          "Le Client maintient les supports installés, visibles et accessibles à sa clientèle pendant toute la durée du contrat. Leur retrait durable, leur dissimulation ou leur mise hors d'usage constitue un manquement aux présentes.",
          "L'usure normale est à la charge de LUCKY, qui remplace les supports concernés. La dégradation, la casse, la perte et le vol sont à la charge du Client, qui règle le remplacement au tarif unitaire en vigueur — notamment lorsqu'un support est brisé, plié, taché, brûlé, immergé, recouvert, ou que son code QR est devenu illisible.",
          "Par année contractuelle, LUCKY remplace gratuitement un nombre de supports égal à 10 % du nombre installé, arrondi à l'unité supérieure. Au-delà, les remplacements sont facturés.",
          "Le Client s'interdit de modifier, masquer, recouvrir, recopier, réimprimer, reproduire ou rediriger un code QR, et de faire réaliser des supports par un tiers.",
          "À la fin du contrat, quelle qu'en soit la cause, le Client restitue les supports dans un délai de trente jours, aux frais de LUCKY. Les supports non restitués passé ce délai sont facturés au tarif unitaire en vigueur.",
        ],
      },
    ],
  },
  {
    titre: 'Article 5 — Propriété intellectuelle et interdiction de reproduction',
    blocs: [
      {
        p: "Le Service, sa technologie, son concept (incluant sans limitation le principe de vérification " +
          "de présence géolocalisée associée à une mise en relation par intention), son interface, sa " +
          "marque, son nom, son logo, ainsi que l'ensemble des éléments logiciels, graphiques et textuels " +
          "qui le composent, sont la propriété exclusive de LUCKY et sont protégés par le droit de la " +
          "propriété intellectuelle.",
      },
      {
        fort: "Il est strictement interdit au Client, à ses préposés, ou à tout tiers agissant pour son " +
          "compte, directement ou indirectement, de reproduire, copier, décompiler, désassembler, imiter, " +
          "adapter ou développer, pour son propre usage ou celui d'un tiers, tout service, application ou " +
          "système reproduisant en tout ou partie le concept, le fonctionnement ou la technologie de Lucky, " +
          "que ce soit pendant la durée du contrat ou après son terme, pour une durée de trois (3) ans à " +
          "compter de la fin de la relation contractuelle.",
      },
      {
        p: "Cette interdiction et ses modalités spécifiques (y compris les éventuelles clauses pénales " +
          "applicables) sont détaillées et peuvent être renforcées dans le contrat de vente particulier " +
          "conclu avec chaque Client. Tout manquement à la présente clause pourra donner lieu à la " +
          "résiliation immédiate du contrat sans préjudice de tout dommage et intérêt.",
      },
    ],
  },
  {
    titre: 'Article 6 — Tarifs et paiement',
    blocs: [
      {
        p: "Les tarifs applicables sont ceux en vigueur au jour de la souscription, tels que présentés sur " +
          "le site lucky-app.io ou convenus dans le cadre d'une offre commerciale spécifique. Sauf " +
          "stipulation contraire, les abonnements sont facturés mensuellement et renouvelés par tacite " +
          "reconduction. Tout mois commencé est dû dans son intégralité.",
      },
      {
        p: "Tous les prix sont indiqués hors taxes. La taxe sur la valeur ajoutée au taux en vigueur, soit " +
          "20 % à ce jour pour les prestations de services en France, s'ajoute au montant hors taxes et " +
          "apparaît distinctement sur chaque facture. Le montant effectivement prélevé est le montant " +
          "toutes taxes comprises.",
      },
      {
        p: "Le Client établi dans un autre État membre de l'Union européenne et disposant d'un numéro de " +
          "TVA intracommunautaire valide peut être facturé hors taxes par autoliquidation, sous réserve " +
          "qu'il communique ce numéro lors de la souscription.",
      },
    ],
  },
  {
    titre: 'Article 7 — Durée, engagement, période offerte et résiliation',
    blocs: [
      {
        p: "La durée d'engagement est celle indiquée dans les conditions particulières. À défaut de " +
          "mention contraire, elle est de trois (3) mois à compter de l'activation du compte.",
      },
      { sous: '7.1 — Période offerte' },
      {
        fort: "Les trente (30) premiers jours ne sont pas facturés. Cette gratuité est consentie en " +
          "contrepartie de l'engagement minimum souscrit : elle n'est pas une période d'essai libre et " +
          "n'ouvre pas de droit de rétractation.",
      },
      {
        p: "Le Service est pleinement actif pendant cette période : les supports sont installés, le Lieu " +
          "apparaît dans l'application et peut accueillir des soirées. Le premier prélèvement intervient à " +
          "l'issue des trente jours.",
      },
      { sous: '7.2 — Résiliation' },
      {
        p: "Le contrat ne peut être résilié avant le terme de la période d'engagement. Passé ce terme, il " +
          "se poursuit pour une durée indéterminée et chaque partie peut y mettre fin à tout moment, avec " +
          "un préavis de trente (30) jours notifié par écrit. Le Service reste actif jusqu'au terme de la " +
          "période en cours.",
      },
      {
        p: "En cas de rupture par le Client avant le terme de son engagement, y compris pendant les trente " +
          "premiers jours, les mensualités restant à courir jusqu'à ce terme deviennent immédiatement " +
          "exigibles, déduction faite des sommes déjà réglées.",
      },
      {
        p: "Cette clause ne s'applique pas lorsque la rupture est imputable à LUCKY — indisponibilité " +
          "durable du Service, manquement de LUCKY à ses obligations — ni en cas de cessation d'activité " +
          "ou de procédure collective du Client dûment justifiée.",
      },
      { sous: '7.3 — Suspension' },
      {
        p: "LUCKY se réserve le droit de suspendre ou résilier immédiatement l'accès au Service, sans " +
          "préavis ni indemnité, en cas de manquement grave du Client à ses obligations, notamment en cas " +
          "de non-respect de l'Article 5, d'impayé, ou d'utilisation du Service de nature à porter atteinte " +
          "à la sécurité des utilisateurs.",
      },
    ],
  },
  {
    titre: 'Article 8 — Responsabilité relative aux interactions entre utilisateurs',
    blocs: [
      { fort: 'Le Client reconnaît et accepte expressément ce qui suit :' },
      {
        p: "Lucky est un outil technique de mise en relation fondé sur la présence géographique déclarée et " +
          "vérifiée par signal de localisation. Ni LUCKY ni le Client n'effectuent de vérification " +
          "d'identité approfondie, de contrôle d'antécédents, ni aucune forme de filtrage des utilisateurs " +
          "au-delà des informations librement déclarées par ceux-ci lors de la création de leur profil.",
      },
      {
        p: "LUCKY et le Client ne sont en conséquence parties à aucune interaction, échange, rencontre ou " +
          "relation, quelle qu'en soit la nature, se nouant entre les utilisateurs du Service par " +
          "l'intermédiaire de celui-ci, que cette interaction ait lieu dans l'enceinte de l'Établissement " +
          "ou en dehors. Ni LUCKY ni le Client ne pourront être tenus responsables, à quelque titre que ce " +
          "soit, des conséquences directes ou indirectes de ces interactions, y compris en cas de dommage " +
          "corporel, matériel, moral, de comportement délictuel ou de tout litige opposant des utilisateurs " +
          "entre eux.",
      },
      {
        p: "Le Service met à disposition des utilisateurs des outils de signalement et de blocage (voir les " +
          "Conditions Générales d'Utilisation applicables aux utilisateurs). L'existence de ces outils ne " +
          "saurait constituer une garantie de sécurité et ne transfère aucune obligation de surveillance ou " +
          "de résultat à la charge de LUCKY ou du Client.",
      },
      {
        p: "Le Client s'engage à ne faire aucune déclaration, publicité ou communication laissant entendre " +
          "que Lucky garantit la sécurité, l'identité ou la fiabilité des utilisateurs du Service.",
      },
    ],
  },
  {
    titre: 'Article 9 — Garanties et limitation de responsabilité générale',
    blocs: [
      {
        p: "Le Service est fourni « en l'état ». LUCKY s'engage à mettre en œuvre des moyens raisonnables " +
          "pour assurer la disponibilité et le bon fonctionnement du Service, sans garantie de résultat. " +
          "LUCKY ne saurait être tenue responsable des interruptions, dysfonctionnements ou pertes de " +
          "données résultant de causes qui lui sont extérieures, notamment de la défaillance de " +
          "prestataires techniques tiers, de problèmes de connectivité, ou de cas de force majeure.",
      },
      {
        p: "En tout état de cause, la responsabilité totale de LUCKY au titre du présent contrat, toutes " +
          "causes confondues, est limitée au montant des sommes effectivement versées par le Client au " +
          "titre des douze (12) derniers mois précédant le fait générateur du dommage.",
      },
    ],
  },
  {
    titre: 'Article 10 — Protection des données personnelles',
    blocs: [
      {
        p: "Le traitement des données personnelles des utilisateurs et des représentants du Client dans le " +
          "cadre du Service est décrit dans la Politique de Confidentialité de Lucky, consultable à " +
          "l'adresse lucky-app.io/legal/confidentialite. Le tableau de bord fourni au Client n'expose que " +
          "des données statistiques agrégées et anonymisées ; en aucun cas les coordonnées exactes, le " +
          "contenu des échanges, ou les données de blocage entre utilisateurs ne sont accessibles au Client.",
      },
      {
        p: "LUCKY s'interdit d'exploiter les données des utilisateurs rencontrés dans l'établissement du " +
          "Client à d'autres fins que le fonctionnement du Service. En particulier, LUCKY ne vend, ne loue " +
          "ni ne cède ces données à quiconque, ne les utilise pas à des fins publicitaires ou de " +
          "prospection pour son propre compte ou celui d'un tiers, et ne s'en sert pas pour démarcher la " +
          "clientèle du Client au profit d'un autre établissement. Cet engagement survit à la fin du " +
          "présent contrat.",
      },
      {
        p: "Par exception, un utilisateur peut consentir expressément, dans la salle du Client et par une " +
          "case décochée par défaut le désignant nommément, à recevoir les actualités de cet " +
          "établissement. Les données transmises au Client sont alors limitées au prénom, à l'adresse " +
          "e-mail et à la date du consentement.",
      },
      {
        p: "À compter de cette transmission, le Client agit comme responsable de traitement autonome pour " +
          "ces données. Il s'engage à ne les utiliser que pour communiquer sur son propre établissement, à " +
          "ne les céder ni les louer à quiconque, à faire figurer dans chaque envoi un moyen de " +
          "désinscription fonctionnel, à traiter sans délai les demandes d'effacement et d'opposition qui " +
          "lui sont adressées, et à cesser tout envoi à une personne qui ne figure plus dans la liste mise " +
          "à sa disposition. Le Client vérifie cette liste avant chaque campagne. LUCKY n'est pas " +
          "responsable des communications émises par le Client ni de l'usage qu'il fait de ces données, et " +
          "le Client garantit LUCKY contre toute réclamation en découlant. En cas de manquement, LUCKY peut " +
          "suspendre l'accès à cette fonctionnalité sans que cela ouvre droit à indemnité.",
      },
    ],
  },
  {
    titre: 'Article 11 — Modification des CGV',
    blocs: [
      {
        p: "LUCKY se réserve le droit de modifier les présentes CGV à tout moment. Les Clients seront " +
          "informés de toute modification substantielle par e-mail ou via leur tableau de bord, avec un " +
          "préavis raisonnable avant leur entrée en vigueur. Les conditions annexées à un contrat signé " +
          "restent celles en vigueur au jour de la signature pour la durée de l'engagement en cours.",
      },
    ],
  },
  {
    titre: 'Article 12 — Droit applicable et juridiction',
    blocs: [
      {
        p: "Les présentes CGV sont soumises au droit français. Tout litige relatif à leur interprétation ou " +
          "leur exécution relève de la compétence exclusive des tribunaux du ressort de Paris, sauf " +
          "disposition légale impérative contraire.",
      },
    ],
  },
];
