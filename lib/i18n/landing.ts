export type Lang = 'en' | 'fr';

export const landingCopy = {
  en: {
    logIn: 'Log in',
    signUp: 'Sign up',
    eyebrow: 'For hotels, restaurants, bars & beach clubs',
    heroTitle: "Don't try to change the world. Connect it.",
    heroSubtitle:
      'Your guests cross paths, sit at neighbouring tables, leave without a word. Lucky changes that, quietly, while they’re still with you — and shows you, to the euro, what it put in your till.',
    ctaPrimary: 'Get your venue set up',
    ctaSecondary: 'See pricing',
    heroQuote:
      'The most memorable encounter of the night might be three tables away. Your guests just need to know it.',
    howItWorksEyebrow: 'How it works',
    steps: [
      {
        mark: 'I.',
        title: 'Your QR, everywhere',
        body: 'One code at reception, on every table, in every room. Guests scan it in a second — no app to install, no friction, no reason not to try.',
      },
      {
        mark: 'II.',
        title: 'Verified presence',
        body: 'Every profile shown is confirmed present in real time — not a memory from six hours ago. When someone leaves, they disappear from the room: your guests only ever meet people who are actually there.',
      },
      {
        mark: 'III.',
        title: 'Revenue you can actually see',
        body: 'When two guests meet, one can offer the other something from your menu — at a small Lucky discount. The order becomes a voucher your bar simply reads and serves. Your dashboard then shows the certified revenue it generated, net of that discount.',
      },
    ],
    previewEyebrow: 'What guests see',
    previewTitle: 'Presence, not memory.',
    previewBody:
      'Every profile is confirmed present through location and activity signals, re-verified as the evening goes on. When someone leaves your venue, they disappear from the room — your guests never have to guess who’s still around.',
    showcaseRows: [
      {
        eyebrow: 'The room',
        title: 'Everyone present, at a glance.',
        body: 'Your guests see who’s sharing their evening — by affinity, not by chance. Business, Dating or Social: each person chooses what they’re there for, and only sees profiles who are actually on-site.',
      },
      {
        eyebrow: 'The conversation',
        title: 'From a wave to a drink on your menu.',
        body: 'One tap is enough to signal interest. If it’s mutual, the conversation opens right away — and either of them can offer the other something from your menu, at a Lucky discount, without leaving their table.',
      },
      {
        eyebrow: 'Your dashboard',
        title: 'What Lucky generated here, to the euro.',
        body: 'Certified revenue from orders actually placed and served, net of the discount you granted. Confirmed meet-ups. Today’s vouchers, line by line, with a CSV export to reconcile against your till at the end of service. Nothing for your floor team to do: the bar reads the voucher, serves, adds it to the bill.',
      },
    ],
    pricingEyebrow: 'Pricing',
    pricingTitle: 'A plan sized to your venue.',
    choosePlan: 'Choose',
    requestEyebrow: 'Get in touch',
    requestTitle: 'Want this atmosphere at your venue?',
    requestBody:
      'We work directly with a curated set of hotels, restaurants, bars and beach clubs that want to give their guests an experience they won’t find anywhere else. Reach out — we’ll set up everything for you: account, QR code, menu and page included.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Everything you’re wondering.',
    faqItems: [
      {
        q: 'Do my guests need to download an app?',
        a: 'No. Lucky works right in the browser after a QR code scan — no install, no friction.',
      },
      {
        q: 'How does presence verification work?',
        a: 'Location and activity are checked when someone joins the room, then re-checked regularly. If someone leaves your venue, they’re automatically removed from the room.',
      },
      {
        q: 'How do you know what Lucky actually brought in?',
        a: 'When a guest offers something from your menu through Lucky, they get a small discount — which is exactly why they go through the app rather than straight to the bar. That order becomes a voucher with a code, an item and the discounted price. Once it’s served, it counts as certified revenue, net of the discount. Nothing is typed in by hand: the amounts come from your own menu.',
      },
      {
        q: 'Does this add work for my floor team?',
        a: 'No. The voucher shows the code, the item and the amount to charge. The bar reads it, serves it, adds it to the bill. Your team never needs an account or access to the dashboard.',
      },
      {
        q: 'How do I reconcile it with my till?',
        a: 'Your dashboard lists the day’s vouchers line by line — time, code, item, menu price, amount charged, status — and exports the month as a CSV you can open in Excel.',
      },
      {
        q: 'How long does it take to set up my venue?',
        a: 'Once your account is created, your QR code is ready immediately. Most venues are up and running within a day, menu included.',
      },
      {
        q: 'Can I change plans later?',
        a: 'Yes, anytime. Reach out and we’ll adjust your plan as your venue grows.',
      },
      {
        q: 'Is my guests’ data secure?',
        a: 'Yes. Exact coordinates, message content, and blocking data are never visible from your dashboard — you only ever see aggregated statistics.',
      },
      {
        q: 'Can I order physical materials (table QR codes, etc.)?',
        a: 'Standard materials are included with every plan. Premium branded versions — engraved stands, your colours — can be ordered from your dashboard.',
      },
    ],
    plans: [
      {
        id: 'basique',
        name: 'Basique',
        price: '€99',
        idealFor: 'Small bars & restaurants — up to ~50 concurrent guests',
        features: [
          'Your menu + your Lucky offer',
          'Certified revenue generated, in real time',
          'Your QR code, print as many as you need',
          'Logo + cover photo',
          'Core presence stats',
          'Up to 50 concurrent guests',
          'Standard physical materials included',
          'Email support',
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
          'Daily vouchers + CSV export to reconcile your till',
          'Estimated revenue from your average ticket',
          'Advanced stats — peak hours, connection rate',
          'Custom presence duration',
          'Full photo gallery',
          'Up to 200 concurrent guests',
          'Email + chat support',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '€299',
        idealFor: 'Hotels, beach clubs & large venues — unlimited capacity',
        features: [
          'Everything in Essentiel',
          'Unlimited concurrent guests',
          'Fully custom page design',
          'Monthly reports & full data export',
          'Dedicated onboarding support',
          'Premium branded materials included (up to 40), fully handled for you',
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
      'Vos clients se croisent, s’installent aux tables voisines, repartent sans un mot. Lucky change cette réalité, discrètement, pendant qu’ils sont encore chez vous — et vous montre, à l’euro près, ce que ça a mis dans votre caisse.',
    ctaPrimary: 'Configurer mon établissement',
    ctaSecondary: 'Voir les tarifs',
    heroQuote:
      'Les rencontres les plus mémorables de la soirée se produisent parfois à trois tables de distance. Encore faut-il que vos clients le sachent.',
    howItWorksEyebrow: 'Comment ça marche',
    steps: [
      {
        mark: 'I.',
        title: 'Votre QR, partout',
        body: 'Un code à l’accueil, sur chaque table, dans les chambres. Vos clients le scannent en un geste — aucune application à installer, aucune friction, aucune raison de ne pas essayer.',
      },
      {
        mark: 'II.',
        title: 'Présence vérifiée',
        body: 'Chaque profil affiché est confirmé présent en temps réel — pas un souvenir de la veille. Quand quelqu’un part, il disparaît de la salle : vos clients n’échangent qu’avec des personnes réellement sur place.',
      },
      {
        mark: 'III.',
        title: 'Du chiffre d’affaires que vous voyez',
        body: 'Quand deux clients se rencontrent, l’un peut offrir à l’autre quelque chose sur votre carte — avec une remise Lucky. La commande devient un bon que votre bar lit et sert, sans rien saisir. Votre tableau de bord affiche ensuite le CA certifié que ça vous a rapporté, remise déduite.',
      },
    ],
    previewEyebrow: 'Ce que voient vos clients',
    previewTitle: 'La présence, pas le souvenir.',
    previewBody:
      'Chaque profil est confirmé présent grâce à des signaux de localisation et d’activité, revérifiés au fil de la soirée. Quand quelqu’un quitte votre établissement, il disparaît de la salle — vos clients n’ont jamais à deviner qui est encore là.',
    showcaseRows: [
      {
        eyebrow: 'La salle',
        title: 'Chaque personne présente, en un coup d’œil.',
        body: 'Vos clients voient qui partage leur soirée — par affinité, pas au hasard. Business, Dating ou Social : chacun choisit ce qu’il cherche, et ne voit que des profils réellement sur place.',
      },
      {
        eyebrow: 'La conversation',
        title: 'D’un signe à un verre sur votre carte.',
        body: 'Un geste suffit pour se signaler à quelqu’un. Si l’intérêt est partagé, la conversation s’ouvre aussitôt — et l’un peut offrir à l’autre quelque chose sur votre carte, avec une remise Lucky, sans quitter sa table.',
      },
      {
        eyebrow: 'Votre tableau de bord',
        title: 'Ce que Lucky a généré ici, à l’euro près.',
        body: 'Le CA certifié des commandes réellement passées et servies, net de la remise que vous avez consentie. Les rencontres confirmées. Les bons du jour, ligne par ligne, avec un export CSV pour recouper votre caisse en fin de service. Rien n’est demandé à votre équipe de salle : le bar lit le bon, sert, met sur l’addition.',
      },
    ],
    pricingEyebrow: 'Tarifs',
    pricingTitle: 'Une formule adaptée à la taille de votre établissement.',
    choosePlan: 'Choisir',
    requestEyebrow: 'Nous contacter',
    requestTitle: 'Envie de cette ambiance chez vous ?',
    requestBody:
      'Nous travaillons directement avec une sélection d’hôtels, restaurants, bars et beach clubs qui veulent offrir à leurs clients une expérience qu’ils ne trouveront nulle part ailleurs. Contactez-nous : nous nous occupons de tout — compte, QR code, carte et page inclus.',
    faqEyebrow: 'Questions fréquentes',
    faqTitle: 'Tout ce que vous vous demandez.',
    faqItems: [
      {
        q: 'Mes clients doivent-ils télécharger une application ?',
        a: 'Non. Lucky fonctionne directement dans le navigateur après un scan de QR code — aucune installation, aucune friction.',
      },
      {
        q: 'Comment fonctionne la vérification de présence ?',
        a: 'La position et l’activité sont vérifiées au moment de l’entrée dans la salle, puis revérifiées régulièrement. Si quelqu’un quitte votre établissement, il disparaît automatiquement de la salle.',
      },
      {
        q: 'Comment savez-vous ce que Lucky m’a réellement rapporté ?',
        a: 'Quand un client en invite un autre sur votre carte via Lucky, il bénéficie d’une remise — c’est précisément ce qui le pousse à passer par l’application plutôt que directement au comptoir. Cette commande devient un bon, avec un code, un article et le prix remisé. Une fois servie, elle est comptée en CA certifié, net de la remise. Aucune saisie manuelle : les montants viennent de votre propre carte.',
      },
      {
        q: 'Est-ce que ça ajoute du travail à mon équipe de salle ?',
        a: 'Non. Le bon affiche le code, l’article et le montant à encaisser. Le bar lit, sert, met sur l’addition. Votre équipe n’a besoin ni de compte, ni d’accès au tableau de bord.',
      },
      {
        q: 'Comment je recoupe avec ma caisse ?',
        a: 'Votre tableau de bord liste les bons du jour ligne par ligne — heure, code, article, prix carte, montant encaissé, état — et exporte le mois en CSV, ouvrable dans Excel.',
      },
      {
        q: 'Combien de temps pour mettre en place mon établissement ?',
        a: 'Une fois votre compte créé, votre QR code est disponible immédiatement. La plupart des établissements sont opérationnels en moins d’une journée, carte comprise.',
      },
      {
        q: 'Puis-je changer de formule plus tard ?',
        a: 'Oui, à tout moment. Contactez-nous et nous ajustons votre formule selon l’évolution de votre établissement.',
      },
      {
        q: 'Les données de mes clients sont-elles sécurisées ?',
        a: 'Oui. Les coordonnées exactes, le contenu des messages et les données de blocage ne sont jamais visibles depuis votre tableau de bord — vous n’avez accès qu’à des statistiques agrégées.',
      },
      {
        q: 'Est-ce que je peux commander des supports physiques (QR à poser sur les tables) ?',
        a: 'Les supports standard sont inclus dans toutes les formules. Les versions premium — chevalets gravés, à vos couleurs — se commandent depuis votre tableau de bord.',
      },
    ],
    plans: [
      {
        id: 'basique',
        name: 'Basique',
        price: '99€',
        idealFor: 'Petits bars & restaurants — jusqu’à ~50 personnes en simultané',
        features: [
          'Votre carte + votre avantage Lucky',
          'CA certifié généré, en temps réel',
          'Votre QR code, à imprimer autant que vous voulez',
          'Logo + photo de couverture',
          'Statistiques de présence',
          'Jusqu’à 50 personnes connectées simultanément',
          'Supports physiques standard inclus',
          'Support par email',
        ],
      },
      {
        id: 'essentiel',
        name: 'Essentiel',
        price: '149€',
        highlighted: true,
        idealFor: 'Établissements de taille moyenne, coworkings — jusqu’à ~200 personnes',
        features: [
          'Tout Basique',
          'Bons du jour + export CSV pour recouper la caisse',
          'CA estimé à partir de votre panier moyen',
          'Statistiques avancées — heures de pointe, taux de connexion',
          'Durée de présence personnalisable',
          'Galerie photo complète',
          'Jusqu’à 200 personnes connectées simultanément',
          'Support email + chat',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '299€',
        idealFor: 'Hôtels, beach clubs, grands établissements — capacité illimitée',
        features: [
          'Tout Essentiel',
          'Capacité illimitée',
          'Page 100% personnalisée',
          'Rapports mensuels + export complet des données',
          'Accompagnement dédié au lancement',
          'Supports premium personnalisés inclus (jusqu’à 40), tout géré pour vous',
        ],
      },
    ],
  },
} as const;
