import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JoinRoom } from './JoinRoom';
import { PeopleHere } from './PeopleHere';
import { SuivreLieu } from './SuivreLieu';
import { PeopleCountLine } from './PeopleCountLine';

/**
 * Chaque lieu sert son propre manifeste : l'application installee depuis cette
 * page porte le nom du lieu, pas celui de la plateforme.
 */
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { manifest: `/venue/${params.slug}/manifest.webmanifest` };
}

export default async function VenuePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: venue } = await supabase
    .from('venues')
    .select('id, slug, name, city, type, checkin_duration_minutes, cover_photo_url')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!venue) notFound();

  const { data: counts } = (await supabase
    .rpc('get_venue_live_counts', { p_venue_slug: params.slug })
    .maybeSingle()) as { data: { people_here: number; open_to_meeting: number } | null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A profile is required before anyone can join a room — without this check, a
  // brand-new user could check in and appear to others with no name, no photo,
  // nothing to go on.
  let termsAcceptedAt: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, terms_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) redirect(`/onboarding?next=${encodeURIComponent(`/venue/${params.slug}`)}`);
    termsAcceptedAt = profile.terms_accepted_at;
  }

  let hasActiveCheckIn = false;
  if (user) {
    const { data: activeCheckIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .in('presence_status', ['verified_now', 'recently_verified'])
      .maybeSingle();
    hasActiveCheckIn = Boolean(activeCheckIn);
  }

  // Abonnement aux actualites du lieu : lu ici pour que la case arrive deja
  // dans le bon etat, plutot que de se cocher toute seule apres l'affichage.
  let dejaSuivi = false;
  if (user) {
    const { data: suivi } = await supabase
      .from('venue_follows')
      .select('withdrawn_at')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .maybeSingle();
    dejaSuivi = Boolean(suivi && !suivi.withdrawn_at);
  }

  return (
    <main className="min-h-screen">
      <header className="relative flex h-64 items-end overflow-hidden border-b hairline">
        {venue.cover_photo_url && (
          // La photo etait a 40 % d'opacite sous un degrade couvrant toute la
          // hauteur : on ne distinguait plus le lieu. Elle est desormais pleine,
          // avec un voile uniquement en bas, la ou le texte doit rester lisible.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.cover_photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className={
            venue.cover_photo_url
              ? 'absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-ink-900/10'
              : 'absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent'
          }
        />
        <div className="relative w-full px-6 pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{venue.city}</p>
          <h1 className="mt-2 font-display text-4xl italic text-bone">{venue.name}</h1>
          <PeopleCountLine peopleHere={counts?.people_here ?? 0} openToMeeting={counts?.open_to_meeting ?? 0} />
        </div>
      </header>

      <div className="px-6 py-10">
        {!user ? (
          <JoinRoom venueId={venue.id} venueSlug={venue.slug} venueName={venue.name} needsAuth termsAcceptedAt={null} />
        ) : !hasActiveCheckIn ? (
          <JoinRoom
            venueId={venue.id}
            venueSlug={venue.slug}
            venueName={venue.name}
            needsAuth={false}
            termsAcceptedAt={termsAcceptedAt}
          />
        ) : (
          <>
            <PeopleHere
              venueSlug={venue.slug}
              venueId={venue.id}
              venueName={venue.name}
              durationMinutes={venue.checkin_duration_minutes}
            />
            {/* Separe de l'entree dans la salle : on ne conditionne pas
                l'acces au service a l'acceptation de recevoir des e-mails. */}
            <div className="mx-auto max-w-sm">
              <SuivreLieu venueId={venue.id} venueName={venue.name} dejaSuivi={dejaSuivi} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
