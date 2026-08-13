import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { WaveBackButton } from './WaveBackButton';

export default async function MatchesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, user_a, user_b, created_at, venues(name)')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // If the person is currently checked in somewhere, offer a quick way back to it.
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('venues(name, slug)')
    .eq('user_id', user.id)
    .in('presence_status', ['verified_now', 'recently_verified'])
    .maybeSingle();
  const activeVenue = (activeCheckIn as any)?.venues;

  const matchedPartnerIds = new Set(
    (matches ?? []).map((m: any) => (m.user_a === user.id ? m.user_b : m.user_a))
  );

  // Waves someone sent you that you haven't matched with yet.
  const { data: incomingWaves } = await supabase
    .from('waves')
    .select('from_user, venue_id, created_at, venues(name)')
    .eq('to_user', user.id)
    .order('created_at', { ascending: false });

  const pendingWaves = (incomingWaves ?? []).filter((w: any) => !matchedPartnerIds.has(w.from_user));

  const otherIds = [
    ...(matches ?? []).map((m: any) => (m.user_a === user.id ? m.user_b : m.user_a)),
    ...pendingWaves.map((w: any) => w.from_user),
  ];
  const { data: profiles } = otherIds.length
    ? await supabase.from('profiles').select('id, first_name, photo_url').in('id', otherIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Connections</p>
      <h1 className="mt-4 font-display text-3xl italic text-bone">Waves & messages</h1>

      {activeVenue && (
        <Link
          href={`/venue/${activeVenue.slug}`}
          className="mt-6 flex items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-2.5 text-xs tracking-wide text-bone-dim transition-colors hover:border-brass hover:text-brass"
        >
          &larr; Back to {activeVenue.name}
        </Link>
      )}

      {pendingWaves.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl italic text-bone">Waves</h2>
          <div className="mt-4 divide-y hairline">
            {pendingWaves.map((w: any) => {
              const other = profileMap.get(w.from_user);
              return (
                <div key={w.from_user} className="flex items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-ink-700">
                      {other?.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-bone">{other?.first_name ?? 'Someone'} waved at you</p>
                      <p className="font-mono text-[11px] text-bone-faint">{w.venues?.name}</p>
                    </div>
                  </div>
                  <WaveBackButton fromUserId={w.from_user} venueId={w.venue_id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="mt-10 font-display text-xl italic text-bone">Messages</h2>
      {!matches || matches.length === 0 ? (
        <p className="mt-4 text-sm text-bone-faint">
          No matches yet. Wave at someone at a venue you’re both in.
        </p>
      ) : (
        <div className="mt-4 divide-y hairline">
          {matches.map((m: any) => {
            const otherId = m.user_a === user.id ? m.user_b : m.user_a;
            const other = profileMap.get(otherId);
            return (
              <Link
                key={m.id}
                href={`/chat/${m.id}`}
                className="flex items-center gap-4 py-4 transition-opacity hover:opacity-80"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full bg-ink-700">
                  {other?.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-bone">{other?.first_name ?? 'Someone'}</p>
                  <p className="font-mono text-[11px] text-bone-faint">{m.venues?.name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
