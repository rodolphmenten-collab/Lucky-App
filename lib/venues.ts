import type { VenueType } from '@/lib/types';
import { DEFAULT_CHECKIN_DURATION_MINUTES } from '@/lib/presence';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/**
 * Les types de lieux, en un seul endroit.
 *
 * Cette liste alimente le formulaire de création, la fiche CRM et le
 * formulaire public : trois listes séparées finissaient toujours par diverger,
 * et un type présent dans l'une mais absente de l'enum retombait sur 'bar'
 * sans rien signaler. Toute valeur ajoutée ici doit exister dans l'enum
 * `venue_type` en base (migration 0028).
 */
export const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'hotel', label: 'Hôtel' },
  { value: 'resort', label: 'Resort / village' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'brasserie', label: 'Brasserie' },
  { value: 'cafe', label: 'Café' },
  { value: 'bar', label: 'Bar' },
  { value: 'pub', label: 'Pub' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'nightclub', label: 'Discothèque / club' },
  { value: 'beach_club', label: 'Beach club' },
  { value: 'casino', label: 'Casino' },
  { value: 'coworking', label: 'Coworking' },
  { value: 'spa', label: 'Spa / thalasso' },
  { value: 'camping', label: 'Camping / village vacances' },
  { value: 'event', label: 'Événement' },
  { value: 'other', label: 'Autre' },
];

export function venueTypeLabel(type?: string | null): string {
  if (!type) return 'Non renseigné';
  return VENUE_TYPES.find((t) => t.value === type)?.label ?? type;
}

/**
 * Tolérant à ce qui arrive du CRM, où le type a longtemps été saisi à la main :
 * on accepte la clé, le libellé français, et les variantes d'espacement.
 */
export const VENUE_TYPE_MAP: Record<string, VenueType> = {
  ...Object.fromEntries(VENUE_TYPES.map((t) => [t.value, t.value])),
  ...Object.fromEntries(VENUE_TYPES.map((t) => [t.label.toLowerCase(), t.value])),
  'beach club': 'beach_club',
  'boite de nuit': 'nightclub',
  'boîte de nuit': 'nightclub',
  discotheque: 'nightclub',
  'discothèque': 'nightclub',
  club: 'nightclub',
  'club de plage': 'beach_club',
  hôtel: 'hotel',
  café: 'cafe',
  'evenement': 'event',
  'événement': 'event',
  thalasso: 'spa',
} as Record<string, VenueType>;

/**
 * Creates a venue with a guaranteed-unique slug, using placeholder coordinates
 * (0, 0) that the owner or an admin must correct from the venue's own edit page
 * before real check-ins will work.
 */
export async function createVenueRecord(
  service: any,
  params: { name: string; city: string; type: string; plan: string; contactName?: string; contactEmail?: string }
) {
  const venueType: VenueType = VENUE_TYPE_MAP[(params.type ?? '').toLowerCase()] ?? 'bar';
  const baseSlug = slugify(params.name) || 'venue';
  let slug = baseSlug;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await service.from('venues').select('id').eq('slug', slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${++suffix}`;
  }

  return service
    .from('venues')
    .insert({
      slug,
      name: params.name,
      city: params.city || 'Unknown',
      type: venueType,
      latitude: 0,
      longitude: 0,
      verification_radius_m: 75,
      checkin_duration_minutes: DEFAULT_CHECKIN_DURATION_MINUTES[venueType],
      plan: (params.plan as any) || 'basique',
      contact_name: params.contactName || null,
      contact_email: params.contactEmail || null,
    })
    .select('id, slug')
    .single();
}
