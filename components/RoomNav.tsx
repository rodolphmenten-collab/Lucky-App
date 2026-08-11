'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function RoomNav() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function checkUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matches } = await supabase
        .from('matches')
        .select('id, user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (!matches || matches.length === 0) return;

      const { data: messages } = await supabase
        .from('messages')
        .select('match_id, sender_id, created_at')
        .in(
          'match_id',
          matches.map((m) => m.id)
        )
        .order('created_at', { ascending: false });

      if (!messages) return;

      // For each match, look at only the most recent message. A badge shows if the
      // latest word in any conversation wasn't yours — a lightweight "unread" proxy
      // without a full read-receipts system.
      const latestByMatch = new Map<string, { sender_id: string }>();
      for (const m of messages) {
        if (!latestByMatch.has(m.match_id)) latestByMatch.set(m.match_id, m);
      }
      const unread = Array.from(latestByMatch.values()).some((m) => m.sender_id !== user.id);
      if (!cancelled) setHasUnread(unread);
    }

    checkUnread();
    const interval = setInterval(checkUnread, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mb-6 flex items-center justify-between border-b hairline pb-4">
      <Link href="/matches" className="relative flex items-center gap-1.5 text-xs tracking-wide text-bone-dim hover:text-brass">
        Messages
        {hasUnread && <span className="h-1.5 w-1.5 rounded-full bg-brass" />}
      </Link>
      <Link href="/profile" className="text-xs tracking-wide text-bone-dim hover:text-brass">
        Your profile
      </Link>
    </div>
  );
}
