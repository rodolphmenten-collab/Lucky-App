import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MatchesView } from './MatchesView';

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
  const activeVenue = (activeCheckIn as any)?.venues ?? null;

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

  const matchesWithOtherId = (matches ?? []).map((m: any) => ({
    id: m.id,
    otherId: m.user_a === user.id ? m.user_b : m.user_a,
    venues: m.venues,
  }));

  const otherIds = [...matchesWithOtherId.map((m) => m.otherId), ...pendingWaves.map((w: any) => w.from_user)];
  const { data: profiles } = otherIds.length
    ? await supabase.from('profiles').select('id, first_name, photo_url').in('id', otherIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <MatchesView
      activeVenue={activeVenue}
      pendingWaves={pendingWaves as any}
      matches={matchesWithOtherId}
      profileMap={profileMap}
    />
  );
}
