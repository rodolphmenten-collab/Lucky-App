'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brass px-1 text-[11px] font-bold text-ink shadow-md">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function RoomNav() {
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

      // Unread messages: count how many DIFFERENT conversations have a most-recent
      // message that isn't yours — a lightweight "unread" proxy without a full
      // read-receipts system. The badge shows that count, not just a dot.
      if (matches && matches.length > 0) {
        const { data: messages } = await supabase
          .from('messages')
          .select('match_id, sender_id, created_at')
          .in(
            'match_id',
            matches.map((m) => m.id)
          )
          .order('created_at', { ascending: false });

        if (messages) {
          const latestByMatch = new Map<string, { sender_id: string }>();
          for (const m of messages) {
            if (!latestByMatch.has(m.match_id)) latestByMatch.set(m.match_id, m);
          }
          const count = Array.from(latestByMatch.values()).filter((m) => m.sender_id !== user.id).length;
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
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mb-6 flex items-center gap-3 border-b hairline pb-5">
      <Link
        href="/matches"
        className="relative flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        Waves
        <CountBadge count={waveCount} />
      </Link>
      <Link
        href="/matches"
        className="relative flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        Messages
        <CountBadge count={unreadCount} />
      </Link>
      <Link
        href="/profile"
        className="flex flex-1 items-center justify-center rounded-full border border-white/20 bg-ink-800 py-3 text-sm font-medium tracking-wide text-bone shadow-sm transition-colors hover:border-brass hover:text-brass"
      >
        Profile
      </Link>
    </div>
  );
}
