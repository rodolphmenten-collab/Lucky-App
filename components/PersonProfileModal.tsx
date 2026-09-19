'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { INTENTION_META } from '@/lib/intentions';
import { INTEREST_LABELS, type InterestKey } from '@/lib/interests';
import { useLanguage } from '@/components/LanguageProvider';
import type { Intention } from '@/lib/types';

export interface ProfileModalPerson {
  user_id: string;
  first_name: string;
  age?: number | null;
  city?: string | null;
  job?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  photos?: string[] | null;
  intentions: Intention[];
  interests?: string[] | null;
  waved_at_me?: boolean;
  waved_by_me?: boolean;
}

export function PersonProfileModal({
  person,
  onClose,
  onWave,
}: {
  person: ProfileModalPerson;
  onClose: () => void;
  onWave?: (userId: string) => Promise<void>;
}) {
  const { t, lang } = useLanguage();
  const allPhotos = [person.photo_url, ...(person.photos ?? [])].filter(Boolean) as string[];
  const [photoIndex, setPhotoIndex] = useState(0);
  const [waveState, setWaveState] = useState<'idle' | 'sending' | 'sent'>(person.waved_by_me ? 'sent' : 'idle');

  async function handleWave() {
    if (!onWave || waveState !== 'idle') return;
    setWaveState('sending');
    try {
      await onWave(person.user_id);
      setWaveState('sent');
    } catch {
      setWaveState('idle');
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl border hairline bg-ink-900 sm:rounded-3xl">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-800">
          {allPhotos.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={allPhotos[photoIndex]} alt="" className="h-full w-full object-cover" />
          )}

          {allPhotos.length > 1 && (
            <div className="absolute inset-x-3 top-3 flex gap-1.5">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i === photoIndex ? 'bg-bone' : 'bg-bone/30'
                  }`}
                />
              ))}
            </div>
          )}

          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                className="absolute inset-y-0 left-0 w-1/3"
                aria-label="Previous photo"
              />
              <button
                onClick={() => setPhotoIndex((i) => Math.min(allPhotos.length - 1, i + 1))}
                className="absolute inset-y-0 right-0 w-1/3"
                aria-label="Next photo"
              />
            </>
          )}

          <button
            onClick={onClose}
            className="absolute right-3 top-9 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-bone backdrop-blur"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="font-display text-2xl italic text-bone">
            {person.first_name}
            {person.age ? `, ${person.age}` : ''}
          </p>
          <p className="mt-1 text-xs text-bone-dim">{[person.job, person.city].filter(Boolean).join(' · ')}</p>

          {(person as any).bio && (
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">{(person as any).bio}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {person.intentions.map((i) => (
              <span
                key={i}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${INTENTION_META[i].classes}`}
              >
                {INTENTION_META[i].symbol} {t.intentions[i]}
              </span>
            ))}
          </div>

          {(person as any).interests?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-bone-faint">{t.onboarding.interests}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(person as any).interests.map((key: string) => (
                  <span key={key} className="rounded-full border hairline px-2.5 py-1 text-[11px] text-bone-dim">
                    {INTEREST_LABELS[lang]?.[key as InterestKey] ?? key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onWave && (
            <button
              onClick={handleWave}
              disabled={waveState !== 'idle'}
              className="mt-6 w-full rounded-full bg-bone py-3 text-sm font-medium tracking-wide text-ink transition-colors hover:bg-brass-bright disabled:opacity-70"
            >
              {waveState === 'sent'
                ? t.room.waved
                : waveState === 'sending'
                  ? '···'
                  : person.waved_at_me
                    ? t.room.waveBack
                    : t.room.wave}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
