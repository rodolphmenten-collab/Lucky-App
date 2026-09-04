export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  costPrice: string; // prix d'achat fournisseur — visible uniquement en interne (jamais côté venue)
  category: 'table' | 'affichage';
  allowsCustomText: boolean;
  image: string;
}

export const SHOP_CATEGORIES: { id: ShopProduct['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'table', label: 'Table' },
  { id: 'affichage', label: 'Affichage' },
];

// Catalogue Lucky (marque blanche) — fabriqué par un partenaire d'impression,
// revendu sous la marque Lucky avec une marge. Le fournisseur n'est jamais
// mentionné côté établissement.
export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'plaque-silver',
    name: 'Plaque de table ronde',
    description: 'Plaque métallique ronde, finition élégante, gravure de votre QR code.',
    price: '7€',
    costPrice: '3,95€',
    category: 'table',
    allowsCustomText: false,
    image: '/shop/plaque-silver.png',
  },
  {
    id: 'plaque-black',
    name: 'Plaque de table — avec logo',
    description: 'Votre logo gravé aux côtés du QR code, pour un rendu plus personnalisé.',
    price: '8€',
    costPrice: '4,70€',
    category: 'table',
    allowsCustomText: true,
    image: '/shop/plaque-black.png',
  },
  {
    id: 'wood-stand',
    name: 'Totem bois massif',
    description: 'Bois massif, gravure sur une ou deux faces — une touche plus chaleureuse.',
    price: '19€',
    costPrice: '11,90€',
    category: 'table',
    allowsCustomText: false,
    image: '/shop/wood-stand.png',
  },
  {
    id: 'coaster',
    name: 'Jeton de table',
    description: 'Un petit support compact posé sur la table, discret et efficace.',
    price: '11€',
    costPrice: '6,45€',
    category: 'table',
    allowsCustomText: false,
    image: '/shop/coaster.png',
  },
  {
    id: 'acrylic-stand',
    name: 'Chevalet de table',
    description: 'Le classique chevalet autoportant, texte et logo personnalisables.',
    price: '27€',
    costPrice: '16,90€',
    category: 'table',
    allowsCustomText: true,
    image: '/shop/acrylic-stand.png',
  },
  {
    id: 'poster-a4',
    name: 'Affiche murale XL',
    description: 'Grand format pour votre hall, votre entrée ou le mur de la réception.',
    price: '85€',
    costPrice: '55,00€',
    category: 'affichage',
    allowsCustomText: true,
    image: '/shop/poster.png',
  },
];
