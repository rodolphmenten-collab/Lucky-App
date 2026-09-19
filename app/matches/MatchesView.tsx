'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';
import { WaveBackButton } from './WaveBackButton';

interface ProfileLite {
  first_name: string;
  photo_url: string | null;
  age?: number | null;
  city?: string | null;
  job?: string | null;
  bio?: string | null;
  intentions?: string[] | null;
}

export function MatchesView({
  activeVenue,
  pendingWaves,
  matches,
  profileMap,
}: {
  activeVenue: { name: string; slug: string } | null;
  pendingWaves: { from_user: string; venue_id: string; venues: { name: string } | null }[];
  matches: { id: string; otherId: string; venues: { name: string } | null }[];
  profileMap: Record<string, ProfileLite>;
}) {
  const { t } = useLanguage();
  const [previewWave, setPreviewWave] = useState<{ from_user: string; venue_id: string; venueName?: string } | null>(
    null
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Lucky</p>
          <h1 className="mt-4 font-display text-3xl italic text-bone">{t.matches.title}</h1>
        </div>
        <ConsumerLanguageSwitcher />
      </div>

      {activeVenue && (
        <Link
          href={`/venue/${activeVenue.slug}`}
          className="mt-6 flex items-center justify-center gap-2 rounded-full border border-white/20 bg-ink-800 py-2.5 text-xs tracking-wide text-bone-dim transition-colors hover:border-brass hover:text-brass"
        >
          {t.matches.backTo} {activeVenue.name}
        </Link>
      )}

      {pendingWaves.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl italic text-bone">{t.matches.wavesHeading}</h2>
          <div className="mt-4 divide-y hairline">
            {pendingWaves.map((w) => {
              const other = profileMap[w.from_user];
              return (
                <div key={w.from_user} className="flex items-center justify-between gap-3 py-4">
                  <button
                    onClick={() => setPreviewWave({ from_user: w.from_user, venue_id: w.venue_id, venueName: w.venues?.name })}
                    className="flex items-center gap-4 text-left"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink-700">
                      {other?.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-bone">
                        {other?.first_name ?? 'Someone'} {t.matches.wavedAtYouSuffix}
                      </p>
                      <p className="font-mono text-[11px] text-bone-faint">{w.venues?.name}</p>
                    </div>
                  </button>
                  <WaveBackButton fromUserId={w.from_user} venueId={w.venue_id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="mt-10 font-display text-xl italic text-bone">{t.matches.messagesHeading}</h2>
      {matches.length === 0 ? (
        <p className="mt-4 text-sm text-bone-faint">{t.matches.noMatches}</p>
      ) : (
        <div className="mt-4 divide-y hairline">
          {matches.map((m) => {
            const other = profileMap[m.otherId];
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

      {previewWave && (
        <ProfilePreview
          profile={profileMap[previewWave.from_user]}
          venueName={previewWave.venueName}
          intentionLabels={t.intentions}
          onClose={() => setPreviewWave(null)}
          waveAction={
            <WaveBackButton
              fromUserId={previewWave.from_user}
              venueId={previewWave.venue_id}
              onDone={() => setPreviewWave(null)}
            />
          }
        />
      )}
    </main>
  );
}

function ProfilePreview({
  profile,
  venueName,
  intentionLabels,
  onClose,
  waveAction,
}: {
  profile: ProfileLite | undefined;
  venueName?: string;
  intentionLabels: Record<string, string>;
  onClose: () => void;
  waveAction: React.ReactNode;
}) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-t-3xl border hairline bg-ink-900 sm:rounded-3xl">
        <div className="relative aspect-square w-full overflow-hidden bg-ink-800">
          {profile.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-bone backdrop-blur"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <p className="font-display text-2xl italic text-bone">
            {profile.first_name}
            {profile.age ? `, ${profile.age}` : ''}
          </p>
          <p className="mt-1 text-xs text-bone-dim">
            {[profile.job, profile.city].filter(Boolean).join(' · ')}
          </p>
          {venueName && <p className="mt-1 font-mono text-[11px] text-bone-faint">{venueName}</p>}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed text-bone-dim">{profile.bio}</p>}
          {profile.intentions && profile.intentions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.intentions.map((i) => (
                <span key={i} className="rounded-full border hairline px-3 py-1 text-[11px] text-bone-dim">
                  {intentionLabels[i] ?? i}
                </span>
              ))}
            </div>
          )}
          <div className="mt-5">{waveAction}</div>
        </div>
      </div>
    </div>
  );
}
