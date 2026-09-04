export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: 'table' | 'affichage';
  supplierUrl: string;
  supplierName: string;
}

export const SHOP_CATEGORIES: { id: ShopProduct['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'table', label: 'Table' },
  { id: 'affichage', label: 'Affichage' },
];

// Catalogue réel — chaque produit renvoie vers sa vraie fiche chez Hungry Club
// (atelier français, Lyon), avec de vraies photos et un vrai prix. Lucky ne
// fabrique rien lui-même : c'est un annuaire curé, pas une boutique en propre.
export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'plaque-rondo',
    name: 'Plaque QR Code "Rondo"',
    description: 'Plaque ronde, 5 couleurs disponibles, texte personnalisable en haut et en bas.',
    price: '3,95€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/plaque-qr-code-ronde',
    supplierName: 'Hungry Club',
  },
  {
    id: 'plaque-logo',
    name: 'Plaque QR Code "Logo"',
    description: 'Plaque avec votre logo gravé, 5 couleurs, ligne de texte et numéro de table.',
    price: '4,70€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/plaque-qr-code-logo',
    supplierName: 'Hungry Club',
  },
  {
    id: 'plaque-bois',
    name: 'Plaque QR Code "Effet Bois"',
    description: '4 teintes de bois, 4 modèles — une touche plus chaleureuse sur vos tables.',
    price: '4,25€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/plaque-qr-code-effet-bois',
    supplierName: 'Hungry Club',
  },
  {
    id: 'jeton-carre',
    name: 'Jeton QR Code à poser',
    description: 'Jeton compact posé sur table, 5 couleurs, 2 formes disponibles.',
    price: '6,45€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/jeton-qr-code-a-poser-carre',
    supplierName: 'Hungry Club',
  },
  {
    id: 'totem-bois',
    name: 'Totem QR Code Bois — Premium',
    description: 'Bois massif, gravure 1 ou 2 faces, 5 couleurs de plaque.',
    price: '11,90€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/totem-bois-plaque-qr-code',
    supplierName: 'Hungry Club',
  },
  {
    id: 'chevalet-bois',
    name: 'Chevalet QR Code Bois',
    description: 'Le classique chevalet de table autoportant, 1 ou 2 faces, 2 teintes de bois.',
    price: '16,90€',
    category: 'table',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/chevalet-de-table',
    supplierName: 'Hungry Club',
  },
  {
    id: 'plaque-murale-xl',
    name: 'Plaque QR Code "Murale XL"',
    description: 'Grand format pour hall, entrée ou mur de réception. 4 teintes, fixation murale.',
    price: '55,00€',
    category: 'affichage',
    supplierUrl: 'https://hungryclub.fr/collections/supports-qr-code/products/plaque-qr-code-murale-xl',
    supplierName: 'Hungry Club',
  },
];
