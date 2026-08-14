'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RoomNav } from '@/components/RoomNav';
import { createClient } from '@/lib/supabase/client';
import { PersonCard, type PersonCardData } from '@/components/PersonCard';
import { Button } from '@/components/ui/Button';
import { HEARTBEAT_INTERVAL_SECONDS, shouldPromptReverification } from '@/lib/presence';
import { useLanguage } from '@/components/LanguageProvider';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';
import type { Intention } from '@/lib/types';

const FILTER_VALUES: (Intention | 'all')[] = ['all', 'dating', 'business', 'social'];

// How often we quietly re-check GPS in the background to catch someone who has
// physically left without telling the app. Not so frequent that it drains battery
// or spams location prompts, frequent enough to feel "automatic".
const AUTO_LOCATION_CHECK_SECONDS = 180;

export function PeopleHere({
  venueSlug,
  venueId,
  venueName,
}: {
  venueSlug: string;
  venueId: string;
  venueName: string;
  durationMinutes: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [people, setPeople] = useState<PersonCardData[]>([]);
  const [filter, setFilter] = useState<Intention | 'all'>('all');
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [showReverify, setShowReverify] = useState(false);
  const [leftMessage, setLeftMessage] = useState<string | null>(null);
  const [waveToast, setWaveToast] = useState<string | null>(null);
  const currentUserId = useRef<string | null>(null);

  const loadPeople = useCallback(async () => {
    const { data } = await supabase.rpc('get_people_here', { p_venue_slug: venueSlug });
    if (data) setPeople(data as PersonCardData[]);
  }, [supabase, venueSlug]);

  useEffect(() => {
    loadPeople();
    const poll = setInterval(loadPeople, 30_000);
    return () => clearInterval(poll);
  }, [loadPeople]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId.current = user.id;
      const { data } = await supabase
        .from('check_ins')
        .select('id, last_verified_at')
        .eq('user_id', user.id)
        .eq('venue_id', venueId)
        .in('presence_status', ['verified_now', 'recently_verified'])
        .maybeSingle();
      if (data) {
        setCheckInId(data.id);
        setLastVerifiedAt(data.last_verified_at);
      }
    })();
  }, [supabase, venueId]);

  // Heartbeat while the tab is active.
  useEffect(() => {
    if (!checkInId) return;
    const send = () => {
      if (document.visibilityState === 'visible') {
        fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkInId }),
        });
      }
    };
    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [checkInId]);

  // Quiet, automatic GPS re-check: if it turns out the person has physically left
  // the venue's radius, check them out for real — no "Still here?" click needed.
  // Runs only while the tab is visible, and never interrupts the person; failures
  // (permission denied, no signal) are silently skipped, leaving the existing
  // time-based expiry and manual "Still here?" prompt as the fallback.
  useEffect(() => {
    if (!checkInId || !('geolocation' in navigator)) return;

    const runAutoCheck = () => {
      if (document.visibilityState !== 'visible') return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch('/api/reverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                checkInId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }),
            });
            const data = await res.json();
            if (data.status === 'expired') {
              setLeftMessage(venueName);
              setCheckInId(null);
            } else if (data.status === 'verified_now') {
              setLastVerifiedAt(new Date().toISOString());
              setShowReverify(false);
            }
          } catch {
            // Silent — the time-based fallback still applies.
          }
        },
        () => {
          // Permission denied or unavailable — silently skip, fallback still applies.
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
      );
    };

    const interval = setInterval(runAutoCheck, AUTO_LOCATION_CHECK_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [checkInId, venueName]);

  // "Still here?" re-verification prompt — the fallback for when background GPS
  // checks aren't available (permission denied, etc.).
  useEffect(() => {
    if (!lastVerifiedAt) return;
    const check = () => setShowReverify(shouldPromptReverification(lastVerifiedAt));
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [lastVerifiedAt]);

  // Live notification the moment someone waves at you, while you're in the room.
  useEffect(() => {
    const channel = supabase
      .channel(`waves:${venueId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waves', filter: `venue_id=eq.${venueId}` },
        async (payload) => {
          const wave = payload.new as { to_user: string; from_user: string };
          if (wave.to_user !== currentUserId.current) return;
          const { data: sender } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', wave.from_user)
            .maybeSingle();
          setWaveToast(`${sender?.first_name ?? 'Someone'} waved at you \u{1F44B}`);
          setTimeout(() => setWaveToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, venueId]);

  async function confirmStillHere() {
    if (!checkInId) return;
    await fetch('/api/reverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId }),
    });
    setLastVerifiedAt(new Date().toISOString());
    setShowReverify(false);
    loadPeople();
  }

  async function handleWave(toUserId: string) {
    const res = await fetch('/api/wave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId, venueId }),
    });
    const data = await res.json();
    if (data.matched) {
      router.push(`/chat/${data.matchId}?justMatched=1`);
    }
  }

  async function leaveVenue() {
    if (!checkInId) return;
    await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId }),
    });
    router.refresh();
  }

  const filtered = filter === 'all' ? people : people.filter((p) => p.intentions.includes(filter));

  if (leftMessage) {
    return (
      <div className="mx-auto max-w-sm py-24 text-center">
        <p className="font-display text-2xl italic text-bone">
          {t.room.leftMessage} {venueName}.
        </p>
        <Button href={`/venue/${venueSlug}`} className="mt-8">
          {t.room.rejoin} {venueName}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {waveToast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink shadow-lg">
          {waveToast}
        </div>
      )}

      {showReverify && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-brass/40 bg-brass/5 px-5 py-4">
          <p className="text-sm text-bone">{t.room.stillHere}</p>
          <Button onClick={confirmStillHere} variant="outline" className="!px-4 !py-2 text-xs">
            {t.room.yesStillHere}
          </Button>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <ConsumerLanguageSwitcher />
      </div>

      <RoomNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-colors ${
                filter === v ? 'border-brass text-brass' : 'hairline text-bone-dim'
              }`}
            >
              {v === 'all' ? t.filters.everyone : t.intentions[v]}
            </button>
          ))}
        </div>
        <button
          onClick={leaveVenue}
          className="rounded-full border border-white/20 bg-ink-800 px-4 py-2 text-xs tracking-wide text-bone-dim transition-colors hover:border-red-400/40 hover:text-red-400"
        >
          {t.room.leave}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-sm text-bone-faint">{t.room.noOneHere}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <PersonCard key={p.user_id} person={p} onWave={handleWave} />
          ))}
        </div>
      )}
    </div>
  );
}
