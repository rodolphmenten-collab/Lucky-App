'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import type { Message } from '@/lib/types';

interface OtherProfile {
  id: string;
  first_name: string;
  photo_url: string | null;
}

const FEEDBACK_DELAY_HOURS = 3;

export function ChatThread({
  matchId,
  currentUserId,
  other,
  venueName,
  venueSlug,
  initialMessages,
  justMatched,
  matchCreatedAt,
  feedbackGiven,
}: {
  matchId: string;
  currentUserId: string;
  other: OtherProfile | null;
  venueName?: string;
  venueSlug?: string;
  initialMessages: Message[];
  justMatched: boolean;
  matchCreatedAt: string;
  feedbackGiven: boolean;
}) {
  const supabase = createClient();
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [showMatchBanner, setShowMatchBanner] = useState(justMatched);
  const [showMenu, setShowMenu] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(feedbackGiven);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedbackGiven) return;
    const hoursSince = (Date.now() - new Date(matchCreatedAt).getTime()) / (1000 * 60 * 60);
    setShowFeedback(hoursSince >= FEEDBACK_DELAY_HOURS);
  }, [matchCreatedAt, feedbackGiven]);

  async function blockUser() {
    if (!other) return;
    await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: other.id }),
    });
    setActionDone('blocked');
    setShowMenu(false);
  }

  async function reportUser() {
    if (!other) return;
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportedId: other.id, reason: 'Reported from chat' }),
    });
    setActionDone('reported');
    setShowMenu(false);
  }

  async function sendFeedback(met: boolean) {
    setShowFeedback(false);
    setFeedbackDone(true);
    await fetch('/api/match-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, met }),
    });
  }

  async function suggestOpener() {
    setSuggesting(true);
    try {
      const res = await fetch('/api/icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, lang }),
      });
      const data = await res.json();
      if (res.ok && data.suggestion) {
        setDraft(data.suggestion);
      }
    } finally {
      setSuggesting(false);
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: currentUserId, content })
      .select()
      .single();

    if (error) {
      setDraft(content);
      return;
    }
    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-8">
      <div className="flex items-center gap-3 border-b hairline pb-4">
        <Link href="/matches" className="text-bone-faint">
          &larr;
        </Link>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-ink-700">
          {other?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-bone">{other?.first_name ?? 'Someone'}</p>
          {venueName && <p className="font-mono text-[11px] text-bone-faint">{venueName}</p>}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu((s) => !s)} className="px-2 text-bone-faint">
            &#8942;
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border hairline bg-ink-800 py-1 text-xs">
              <button onClick={reportUser} className="block w-full px-4 py-2 text-left text-bone-dim hover:text-bone">
                {t.chat.report}
              </button>
              <button onClick={blockUser} className="block w-full px-4 py-2 text-left text-red-400 hover:text-red-300">
                {t.chat.block}
              </button>
            </div>
          )}
        </div>
      </div>

      {venueSlug && (
        <Link
          href={`/venue/${venueSlug}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-full border hairline bg-ink-800 py-2.5 text-xs tracking-wide text-bone-dim transition-colors hover:border-brass hover:text-brass"
        >
          &larr; {venueName ?? 'the room'}
        </Link>
      )}

      {actionDone && (
        <p className="mt-3 text-center text-xs text-bone-faint">
          {actionDone === 'blocked' ? t.chat.blocked : t.chat.reported}
        </p>
      )}

      {showMatchBanner && (
        <div className="mt-6 rounded-2xl border border-brass/40 bg-brass/5 p-5 text-center animate-fade_up">
          <p className="font-display text-xl italic text-brass">{t.chat.justMatched}</p>
          <p className="mt-1 text-xs text-bone-dim">{t.chat.justMatchedBody(venueName ?? '')}</p>
          <button onClick={() => setShowMatchBanner(false)} className="mt-3 text-[11px] text-bone-faint underline">
            {t.chat.dismiss}
          </button>
        </div>
      )}

      {showFeedback && !feedbackDone && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border hairline bg-ink-800 px-5 py-4">
          <p className="text-sm text-bone">{t.chat.didYouMeet(other?.first_name ?? '')}</p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => sendFeedback(true)}
              className="rounded-full bg-bone px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
            >
              {t.chat.yes}
            </button>
            <button
              onClick={() => sendFeedback(false)}
              className="rounded-full border hairline px-3 py-1.5 text-xs text-bone-dim"
            >
              {t.chat.no}
            </button>
          </div>
        </div>
      )}
      {feedbackDone && !feedbackGiven && (
        <p className="mt-3 text-center text-xs text-bone-faint">{t.chat.thanksFeedback}</p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto py-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
              m.sender_id === currentUserId
                ? 'ml-auto bg-bone text-ink'
                : 'bg-ink-800 text-bone border hairline'
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <button
          onClick={suggestOpener}
          disabled={suggesting}
          className="mb-3 self-start rounded-full border border-brass/40 px-4 py-2 text-xs text-brass hover:bg-brass/10"
        >
          {suggesting ? t.chat.suggesting : t.chat.suggestOpener}
        </button>
      )}

      <form onSubmit={sendMessage} className="flex gap-2 border-t hairline pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.chat.placeholder}
          className="flex-1 rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <button
          type="submit"
          className="rounded-full bg-bone px-5 py-3 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          {t.chat.send}
        </button>
      </form>
    </main>
  );
}
