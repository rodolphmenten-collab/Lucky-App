export const INTEREST_KEYS = [
  'travel', 'music', 'food', 'wine', 'coffee', 'art', 'cinema', 'reading',
  'fitness', 'yoga', 'sport', 'photography', 'fashion', 'tech', 'nature',
  'dance', 'gaming', 'pets', 'cooking', 'startups',
] as const;

export type InterestKey = (typeof INTEREST_KEYS)[number];

export const INTEREST_LABELS: Record<'en' | 'fr' | 'es', Record<InterestKey, string>> = {
  en: {
    travel: 'Travel', music: 'Music', food: 'Food', wine: 'Wine', coffee: 'Coffee',
    art: 'Art', cinema: 'Cinema', reading: 'Reading', fitness: 'Fitness', yoga: 'Yoga',
    sport: 'Sport', photography: 'Photography', fashion: 'Fashion', tech: 'Tech',
    nature: 'Nature', dance: 'Dance', gaming: 'Gaming', pets: 'Pets', cooking: 'Cooking',
    startups: 'Startups',
  },
  fr: {
    travel: 'Voyages', music: 'Musique', food: 'Gastronomie', wine: 'Vin', coffee: 'Café',
    art: 'Art', cinema: 'Cinéma', reading: 'Lecture', fitness: 'Fitness', yoga: 'Yoga',
    sport: 'Sport', photography: 'Photographie', fashion: 'Mode', tech: 'Tech',
    nature: 'Nature', dance: 'Danse', gaming: 'Jeux vidéo', pets: 'Animaux', cooking: 'Cuisine',
    startups: 'Startups',
  },
  es: {
    travel: 'Viajes', music: 'Música', food: 'Gastronomía', wine: 'Vino', coffee: 'Café',
    art: 'Arte', cinema: 'Cine', reading: 'Lectura', fitness: 'Fitness', yoga: 'Yoga',
    sport: 'Deporte', photography: 'Fotografía', fashion: 'Moda', tech: 'Tecnología',
    nature: 'Naturaleza', dance: 'Baile', gaming: 'Videojuegos', pets: 'Mascotas', cooking: 'Cocina',
    startups: 'Startups',
  },
};
