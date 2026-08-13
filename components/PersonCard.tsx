'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PresenceBadge } from '@/components/PresenceBadge';
import { INTENTION_META } from '@/lib/intentions';
import type { Intention, PresenceStatus } from '@/lib/types';

export interface PersonCardData {
  user_id: string;
  first_name: string;
  age: number | null;
  city: string | null;
  job: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  intentions: Intention[];
  presence_status: PresenceStatus;
  last_verified_at: string;
  waved_at_me: boolean;
  waved_by_me: boolean;
}

export function PersonCard({
  person,
  onWave,
}: {
  person: PersonCardData;
  onWave: (userId: string) => Promise<void>;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>(person.waved_by_me ? 'sent' : 'idle');

  async function handleWave() {
    if (state !== 'idle') return;
    setState('sending');
    try {
      await onWave(person.user_id);
      setState('sent');
    } catch {
      setState('idle');
    }
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-ink-800 animate-fade_up ${
        person.waved_at_me ? 'border-brass' : 'hairline'
      }`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-700">
        {person.photo_url && (
          <Image
            src={person.photo_url}
            alt={person.first_name}
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
        <div className="absolute left-3 top-3">
          <PresenceBadge status={person.presence_status} lastVerifiedAt={person.last_verified_at} />
        </div>
        {person.waved_at_me && (
          <div className="absolute right-3 top-3 rounded-full bg-brass px-2 py-0.5 text-[10px] font-semibold text-ink">
            Waved at you
          </div>
        )}
        {!person.waved_at_me && person.linkedin_url && (
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/80 text-[10px] font-semibold text-bone-dim backdrop-blur transition-colors hover:text-brass"
            aria-label="LinkedIn profile"
          >
            in
          </a>
        )}
        <div className="absolute inset-x-3 bottom-3">
          <p className="font-display text-lg italic leading-tight text-bone">
            {person.first_name}
            {person.age ? `, ${person.age}` : ''}
          </p>
          <p className="mt-0.5 truncate text-xs text-bone-dim">
            {[person.job, person.city].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {person.intentions.map((i) => (
              <span
                key={i}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${INTENTION_META[i].classes}`}
              >
                {INTENTION_META[i].symbol} {INTENTION_META[i].label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={handleWave}
        disabled={state !== 'idle'}
        className="w-full border-t hairline py-3 text-xs font-medium tracking-[0.15em] text-bone-dim transition-colors hover:text-brass disabled:hover:text-bone-dim"
      >
        {state === 'sent' ? 'WAVED' : state === 'sending' ? '···' : person.waved_at_me ? 'WAVE BACK' : 'WAVE'}
      </button>
    </div>
  );
}
