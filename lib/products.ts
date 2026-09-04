export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  allowsCustomText: boolean;
  image: string;
  category: 'table' | 'vitrine' | 'affichage' | 'chambre';
}

export const SHOP_CATEGORIES: { id: ShopProduct['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'table', label: 'Table' },
  { id: 'vitrine', label: 'Vitrine' },
  { id: 'affichage', label: 'Affichage' },
  { id: 'chambre', label: 'Chambre' },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'plaque-silver',
    name: 'Plaque de table — argent brossé',
    description: 'Plaque métallique ronde, finition argent brossé, gravure noire. Discrète et élégante sur chaque table.',
    price: '9€',
    unit: 'par unité',
    allowsCustomText: false,
    image: '/shop/plaque-silver.png',
    category: 'table',
  },
  {
    id: 'plaque-black',
    name: 'Plaque de table — noir gravé doré',
    description: 'Version noire avec gravure dorée, pour un rendu plus premium sur vos tables.',
    price: '11€',
    unit: 'par unité',
    allowsCustomText: false,
    image: '/shop/plaque-black.png',
    category: 'table',
  },
  {
    id: 'acrylic-stand',
    name: 'Chevalet acrylique noir',
    description: 'Support autoportant en acrylique, texte et logo personnalisables. Le classique du bar et du restaurant.',
    price: '14€',
    unit: 'par unité',
    allowsCustomText: true,
    image: '/shop/acrylic-stand.png',
    category: 'table',
  },
  {
    id: 'wood-stand',
    name: 'Chevalet bois naturel',
    description: 'Support en bois clair, pour une ambiance plus chaleureuse — idéal en terrasse ou hôtel-boutique.',
    price: '16€',
    unit: 'par unité',
    allowsCustomText: false,
    image: '/shop/wood-stand.png',
    category: 'table',
  },
  {
    id: 'coaster',
    name: 'Sous-verre QR',
    description: 'Un sous-verre épais qui fait aussi office de QR code — discret, présent à chaque service.',
    price: '5€',
    unit: 'par unité',
    allowsCustomText: false,
    image: '/shop/coaster.png',
    category: 'table',
  },
  {
    id: 'window-sticker',
    name: 'Sticker vitrine',
    description: 'Un sticker résistant aux intempéries pour votre entrée ou votre vitrine.',
    price: '12€',
    unit: 'par unité',
    allowsCustomText: false,
    image: '/shop/sticker.png',
    category: 'vitrine',
  },
  {
    id: 'poster-a4',
    name: 'Affiche encadrée (A4)',
    description: 'Une affiche imprimée pour votre hall, vos toilettes, ou le mur de la réception.',
    price: '9€',
    unit: 'par unité',
    allowsCustomText: true,
    image: '/shop/poster.png',
    category: 'affichage',
  },
  {
    id: 'room-card',
    name: 'Insert carte de chambre',
    description: 'Une carte fine à glisser dans les porte-clés de chambre d\u2019hôtel.',
    price: '3€',
    unit: 'par unité',
    allowsCustomText: true,
    image: '/shop/room-card.png',
    category: 'chambre',
  },
];
