'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brass px-1 text-[11px] font-bold text-ink shadow-md">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function RoomNav() {
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [waveCount, setWaveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkActivity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matches } = await supabase
        .from('matches')
        .select('id, user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      // Messages non lus : conversations dont le dernier message n'est pas de
      // soi ET est posterieur a la derniere ouverture du fil. L'ancienne
      // version ignorait la lecture : le badge ne retombait qu'en repondant.
      if (matches && matches.length > 0) {
        const identifiants = matches.map((m) => m.id);
        const [{ data: messages }, { data: lectures }] = await Promise.all([
          supabase
            .from('messages')
            .select('match_id, sender_id, created_at')
            .in('match_id', identifiants)
            .order('created_at', { ascending: false }),
          supabase
            .from('match_reads')
            .select('match_id, last_read_at')
            .eq('user_id', user.id)
            .in('match_id', identifiants),
        ]);

        if (messages) {
          const luJusqua = new Map<string, string>(
            (lectures ?? []).map((l: any) => [l.match_id, l.last_read_at])
          );
          const dernierParFil = new Map<string, { sender_id: string; created_at: string }>();
          for (const m of messages) {
            if (!dernierParFil.has(m.match_id)) dernierParFil.set(m.match_id, m);
          }

          let count = 0;
          for (const [matchId, dernier] of dernierParFil) {
            if (dernier.sender_id === user.id) continue;
            const lu = luJusqua.get(matchId);
            if (!lu || new Date(dernier.created_at) > new Date(lu)) count += 1;
          }
          if (!cancelled) setUnreadCount(count);
        }
      }

      // Pending waves: people who waved at you that you haven't waved back (and
      // haven't already matched with).
      const matchedPartnerIds = new Set(
        (matches ?? []).map((m) => (m.user_a === user.id ? m.user_b : m.user_a))
      );
      const { data: waves } = await supabase.from('waves').select('from_user').eq('to_user', user.id);
      if (waves) {
        const pending = new Set(waves.map((w) => w.from_user).filter((id) => !matchedPartnerIds.has(id)));
        if (!cancelled) setWaveCount(pending.size);
      }
    }

    checkActivity();
    const interval = setInterval(checkActivity, 20_000);

    // Revenir sur l'onglet doit rafraichir tout de suite : on sort souvent du
    // fil de discussion par le bouton retour, et attendre vingt secondes avec
    // un badge perime donne l'impression que rien n'a ete lu.
    const auRetour = () => {
      if (document.visibilityState === 'visible') checkActivity();
    };
    document.addEventListener('visibilitychange', auRetour);
    window.addEventListener('focus', auRetour);

    // Real-time: refresh the badge the instant a wave or message arrives,
    // instead of waiting up to 20s for the next poll.
    const channel = supabase
      .channel('room-nav-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waves' }, () => checkActivity())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => checkActivity())
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener('focus', auRetour);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mb-6 flex items-center gap-3 border-b hairline pb-5">
      <Link
        href="/matches"
        className="relative flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        {t.nav.waves}
        <CountBadge count={waveCount} />
      </Link>
      <Link
        href="/matches"
        className="relative flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        {t.nav.messages}
        <CountBadge count={unreadCount} />
      </Link>
      <Link
        href="/profile"
        className="flex flex-1 items-center justify-center rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        {t.nav.profile}
      </Link>
    </div>
  );
}
