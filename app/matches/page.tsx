import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { blockedUserIds } from '@/lib/blocks';
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

  // Un blocage doit effacer la personne partout, pas seulement de la salle :
  // un match deja noue restait visible et joignable, ce qui vidait le blocage
  // de son sens dans le cas qui compte — quelqu'un de deplace apres le match.
  const bloques = await blockedUserIds(user.id);

  const matchesWithOtherId = (matches ?? [])
    .map((m: any) => ({
      id: m.id,
      otherId: m.user_a === user.id ? m.user_b : m.user_a,
      venues: m.venues,
    }))
    .filter((m) => !bloques.has(m.otherId));

  const otherIds = matchesWithOtherId.map((m) => m.otherId);
  const { data: profiles } = otherIds.length
    ? await supabase
        .from('profiles')
        .select('id, first_name, photo_url, age, city, job, bio, intentions')
        .in('id', otherIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <MatchesView
      activeVenue={activeVenue}
      matches={matchesWithOtherId}
      profileMap={profileMap}
    />
  );
}
