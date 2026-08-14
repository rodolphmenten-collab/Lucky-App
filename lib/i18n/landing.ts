export type Lang = 'en' | 'fr';

export const landingCopy = {
  en: {
    logIn: 'Log in',
    signUp: 'Sign up',
    eyebrow: 'For hotels, restaurants, bars & beach clubs',
    heroTitle: "Don't try to change the world. Connect it.",
    heroSubtitle:
      'Your guests cross paths, sit at neighbouring tables, leave without a word. Lucky changes that, quietly, while they\u2019re still with you \u2014 and turns your venue into the one people remember.',
    ctaPrimary: 'Get your venue set up',
    ctaSecondary: 'See pricing',
    heroQuote:
      'The most memorable encounter of the night might be three tables away. Your guests just need to know it.',
    howItWorksEyebrow: 'How it works',
    steps: [
      {
        mark: 'I.',
        title: 'Your QR, everywhere',
        body: 'One code at reception, on every table, in every room. Guests scan it in a second \u2014 no app to install, no friction, no reason not to try.',
      },
      {
        mark: 'II.',
        title: 'Verified presence',
        body: 'Every profile shown is confirmed present in real time \u2014 not a memory from six hours ago. When someone leaves, they disappear from the room: your guests only ever meet people who are actually there.',
      },
      {
        mark: 'III.',
        title: 'An atmosphere that sets you apart',
        body: 'Word of mouth that builds itself, guests who come back because something is always happening. It\u2019s no longer just your menu or your décor people recommend \u2014 it\u2019s your venue.',
      },
    ],
    previewEyebrow: 'What guests see',
    previewTitle: 'Presence, not memory.',
    previewBody:
      'Every profile is confirmed present through location and activity signals, re-verified as the evening goes on. When someone leaves your venue, they disappear from the room \u2014 your guests never have to guess who\u2019s still around.',
    showcaseRows: [
      {
        eyebrow: 'The room',
        title: 'Everyone present, at a glance.',
        body: 'Your guests see who\u2019s sharing their evening \u2014 by affinity, not by chance. Business, Dating or Social: each person chooses what they\u2019re there for, and only sees profiles who are actually on-site.',
      },
      {
        eyebrow: 'The conversation',
        title: 'From a wave to a conversation, without leaving your venue.',
        body: 'One tap is enough to signal interest. If it\u2019s mutual, the conversation opens right away \u2014 while they\u2019re still sitting at your tables.',
      },
      {
        eyebrow: 'Your dashboard',
        title: 'Footfall and engagement, in real time.',
        body: 'How many guests are present, how many connections have formed, what hours your venue comes alive. Enough to fine-tune your evenings \u2014 and prove the impact to your team.',
      },
    ],
    pricingEyebrow: 'Pricing',
    pricingTitle: 'A plan sized to your venue.',
    choosePlan: 'Choose',
    requestEyebrow: 'Get in touch',
    requestTitle: 'Want this atmosphere at your venue?',
    requestBody:
      'We work directly with a curated set of hotels, restaurants, bars and beach clubs that want to give their guests an experience they won\u2019t find anywhere else. Reach out \u2014 we\u2019ll set up everything for you: account, QR code, and page included.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Everything you\u2019re wondering.',
    faqItems: [
      {
        q: 'Do my guests need to download an app?',
        a: 'No. Lucky works right in the browser after a QR code scan \u2014 no install, no friction.',
      },
      {
        q: 'How does presence verification work?',
        a: 'Location and activity are checked when someone joins the room, then re-checked regularly. If someone leaves your venue, they\u2019re automatically removed from the room.',
      },
      {
        q: 'How long does it take to set up my venue?',
        a: 'Once your account is created, your QR code is ready immediately. Most venues are up and running within a day.',
      },
      {
        q: 'Can I change plans later?',
        a: 'Yes, anytime. Reach out and we\u2019ll adjust your plan as your venue grows.',
      },
      {
        q: 'Is my guests\u2019 data secure?',
        a: 'Yes. Exact coordinates, message content, and blocking data are never visible from your dashboard \u2014 you only ever see aggregated statistics.',
      },
      {
        q: 'Can I order physical materials (table QR codes, etc.)?',
        a: 'Yes, directly from your dashboard once your account is active \u2014 table stands, stickers, posters, and hotel room card inserts.',
      },
    ],
    plans: [
      {
        id: 'basique',
        name: 'Basique',
        price: '€99',
        idealFor: 'Small bars & restaurants — up to ~50 concurrent guests',
        features: [
          '1 venue QR code',
          'Logo + cover photo',
          'Core presence stats',
          'Up to 50 concurrent guests',
          'Email support',
          'Physical materials ordered separately',
        ],
      },
      {
        id: 'essentiel',
        name: 'Essentiel',
        price: '€149',
        highlighted: true,
        idealFor: 'Mid-sized venues & coworking spaces — up to ~200 concurrent guests',
        features: [
          'Everything in Basique',
          'Full photo gallery',
          'Advanced stats — peak hours, connection rate',
          'Custom presence duration',
          'Up to 200 concurrent guests',
          'Email + chat support',
          '1 standard physical support included (custom branding available as an add-on)',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '€299',
        idealFor: 'Hotels, beach clubs & large venues — unlimited capacity',
        features: [
          'Everything in Essentiel',
          'QR code per zone (bar, lobby, terrace…)',
          'Fully custom page design',
          'Unlimited concurrent guests',
          'Monthly reports & data export',
          'Dedicated onboarding support',
          'Premium physical materials included, branded to your venue — fully handled for you',
        ],
      },
    ],
  },
  fr: {
    logIn: 'Connexion',
    signUp: "S'inscrire",
    eyebrow: 'Pour hôtels, restaurants, bars & beach clubs',
    heroTitle: "N'essayez pas de changer le monde, connectez-le.",
    heroSubtitle:
      'Vos clients se croisent, s\u2019installent aux tables voisines, repartent sans un mot. Lucky change cette réalité, discrètement, pendant qu\u2019ils sont encore chez vous \u2014 et fait de votre établissement celui dont on se souvient.',
    ctaPrimary: 'Configurer mon établissement',
    ctaSecondary: 'Voir les tarifs',
    heroQuote:
      'Les rencontres les plus mémorables de la soirée se produisent parfois à trois tables de distance. Encore faut-il que vos clients le sachent.',
    howItWorksEyebrow: 'Comment ça marche',
    steps: [
      {
        mark: 'I.',
        title: 'Votre QR, partout',
        body: 'Un code à l\u2019accueil, sur chaque table, dans les chambres. Vos clients le scannent en un geste \u2014 aucune application à installer, aucune friction, aucune raison de ne pas essayer.',
      },
      {
        mark: 'II.',
        title: 'Présence vérifiée',
        body: 'Chaque profil affiché est confirmé présent en temps réel \u2014 pas un souvenir de la veille. Quand quelqu\u2019un part, il disparaît de la salle : vos clients n\u2019échangent qu\u2019avec des personnes réellement sur place.',
      },
      {
        mark: 'III.',
        title: 'Une ambiance qui vous distingue',
        body: 'Un bouche-à-oreille qui se construit de lui-même, des clients qui reviennent parce qu\u2019il s\u2019y passe toujours quelque chose. Ce n\u2019est plus seulement votre carte ou votre décor qu\u2019on recommande \u2014 c\u2019est votre lieu.',
      },
    ],
    previewEyebrow: 'Ce que voient vos clients',
    previewTitle: 'La présence, pas le souvenir.',
    previewBody:
      'Chaque profil est confirmé présent grâce à des signaux de localisation et d\u2019activité, revérifiés au fil de la soirée. Quand quelqu\u2019un quitte votre établissement, il disparaît de la salle \u2014 vos clients n\u2019ont jamais à deviner qui est encore là.',
    showcaseRows: [
      {
        eyebrow: 'La salle',
        title: 'Chaque personne présente, en un coup d\u2019œil.',
        body: 'Vos clients voient qui partage leur soirée \u2014 par affinité, pas au hasard. Business, Dating ou Social : chacun choisit ce qu\u2019il cherche, et ne voit que des profils réellement sur place.',
      },
      {
        eyebrow: 'La conversation',
        title: 'D\u2019un signe à l\u2019échange, sans quitter votre établissement.',
        body: 'Un geste suffit pour se signaler à quelqu\u2019un. Si l\u2019intérêt est partagé, la conversation s\u2019ouvre aussitôt \u2014 pendant qu\u2019ils sont encore assis à vos tables.',
      },
      {
        eyebrow: 'Votre tableau de bord',
        title: 'L\u2019affluence et l\u2019engagement, en temps réel.',
        body: 'Combien de personnes sont présentes, combien de connexions se sont créées, à quelles heures votre établissement vit le plus. De quoi affiner vos soirées \u2014 et le prouver à vos équipes.',
      },
    ],
    pricingEyebrow: 'Tarifs',
    pricingTitle: 'Une formule adaptée à la taille de votre établissement.',
    choosePlan: 'Choisir',
    requestEyebrow: 'Nous contacter',
    requestTitle: 'Envie de cette ambiance chez vous ?',
    requestBody:
      'Nous travaillons directement avec une sélection d\u2019hôtels, restaurants, bars et beach clubs qui veulent offrir à leurs clients une expérience qu\u2019ils ne trouveront nulle part ailleurs. Contactez-nous : nous nous occupons de tout \u2014 compte, QR code et page inclus.',
    faqEyebrow: 'Questions fréquentes',
    faqTitle: 'Tout ce que vous vous demandez.',
    faqItems: [
      {
        q: 'Mes clients doivent-ils télécharger une application ?',
        a: 'Non. Lucky fonctionne directement dans le navigateur après un scan de QR code \u2014 aucune installation, aucune friction.',
      },
      {
        q: 'Comment fonctionne la vérification de présence ?',
        a: 'La position et l\u2019activité sont vérifiées au moment de l\u2019entrée dans la salle, puis revérifiées régulièrement. Si quelqu\u2019un quitte votre établissement, il disparaît automatiquement de la salle.',
      },
      {
        q: 'Combien de temps pour mettre en place mon établissement ?',
        a: 'Une fois votre compte créé, votre QR code est disponible immédiatement. La plupart des établissements sont opérationnels en moins d\u2019une journée.',
      },
      {
        q: 'Puis-je changer de formule plus tard ?',
        a: 'Oui, à tout moment. Contactez-nous et nous ajustons votre formule selon l\u2019évolution de votre établissement.',
      },
      {
        q: 'Les données de mes clients sont-elles sécurisées ?',
        a: 'Oui. Les coordonnées exactes, le contenu des messages et les données de blocage ne sont jamais visibles depuis votre tableau de bord \u2014 vous n\u2019avez accès qu\u2019à des statistiques agrégées.',
      },
      {
        q: 'Est-ce que je peux commander des supports physiques (QR à poser sur les tables) ?',
        a: 'Oui, directement depuis votre tableau de bord une fois votre compte actif \u2014 chevalets, stickers, affiches, et inserts pour chambres d\u2019hôtel.',
      },
    ],
    plans: [
      {
        id: 'basique',
        name: 'Basique',
        price: '99€',
        idealFor: 'Petits bars & restaurants — jusqu\u2019à ~50 personnes en simultané',
        features: [
          '1 QR code unique',
          'Logo + photo de couverture',
          'Statistiques de présence de base',
          'Jusqu\u2019à 50 personnes connectées simultanément',
          'Support par email',
          'Supports physiques à commander séparément',
        ],
      },
      {
        id: 'essentiel',
        name: 'Essentiel',
        price: '149€',
        highlighted: true,
        idealFor: 'Établissements de taille moyenne, coworkings — jusqu\u2019à ~200 personnes',
        features: [
          'Tout Basique',
          'Galerie photo complète',
          'Statistiques avancées — heures de pointe, taux de connexion',
          'Durée de présence personnalisable',
          'Jusqu\u2019à 200 personnes connectées simultanément',
          'Support email + chat',
          '1 support physique standard offert (personnalisation en option, payante)',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '299€',
        idealFor: 'Hôtels, beach clubs, grands établissements — capacité illimitée',
        features: [
          'Tout Essentiel',
          'QR code par zone (bar, lobby, terrasse…)',
          'Page 100% personnalisée',
          'Capacité illimitée',
          'Rapports mensuels + export des données',
          'Accompagnement dédié au lancement',
          'Supports physiques haut de gamme inclus, personnalisés à vos couleurs — tout géré pour vous',
        ],
      },
    ],
  },
} as const;
