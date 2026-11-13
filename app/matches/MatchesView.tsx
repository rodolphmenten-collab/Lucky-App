'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { PersonProfileModal } from '@/components/PersonProfileModal';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';

interface ProfileLite {
  first_name: string;
  photo_url: string | null;
  age?: number | null;
  city?: string | null;
  job?: string | null;
  bio?: string | null;
  intentions?: string[] | null;
  photos?: string[] | null;
  interests?: string[] | null;
}

export function MatchesView({
  activeVenue,
  matches,
  profileMap,
}: {
  activeVenue: { name: string; slug: string } | null;
  matches: { id: string; otherId: string; venues: { name: string } | null }[];
  profileMap: Record<string, ProfileLite>;
}) {
  const { t } = useLanguage();
  // La photo ouvre le profil, le reste de la ligne ouvre la conversation.
  const [profilOuvert, setProfilOuvert] = useState<string | null>(null);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          {/* Marque blanche : l'en-tete porte le nom du lieu ou l'on se trouve,
              jamais celui de la plateforme. Hors d'un lieu, il n'y a rien a
              afficher — mieux vaut un blanc qu'une marque. */}
          {activeVenue?.name && (
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
              {activeVenue.name}
            </p>
          )}
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

      <h2 className="mt-10 font-display text-xl italic text-bone">{t.matches.messagesHeading}</h2>
      {matches.length === 0 ? (
        <p className="mt-4 text-sm text-bone-faint">{t.matches.noMatches}</p>
      ) : (
        <div className="mt-4 divide-y hairline">
          {matches.map((m) => {
            const other = profileMap[m.otherId];
            return (
              <div key={m.id} className="flex items-center gap-4 py-4">
                <button
                  onClick={() => setProfilOuvert(m.otherId)}
                  aria-label={`Voir le profil de ${other?.first_name ?? ''}`}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink-700 ring-1 ring-white/15 transition-all hover:ring-brass"
                >
                  {other?.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
                <Link
                  href={`/chat/${m.id}`}
                  className="flex-1 transition-opacity hover:opacity-80"
                >
                  <p className="text-sm text-bone">{other?.first_name ?? 'Someone'}</p>
                  <p className="font-mono text-[11px] text-bone-faint">{m.venues?.name}</p>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {profilOuvert && profileMap[profilOuvert] && (
        <PersonProfileModal
          person={{
            user_id: profilOuvert,
            first_name: profileMap[profilOuvert].first_name,
            age: profileMap[profilOuvert].age,
            city: profileMap[profilOuvert].city,
            job: profileMap[profilOuvert].job,
            bio: profileMap[profilOuvert].bio,
            photo_url: profileMap[profilOuvert].photo_url,
            photos: profileMap[profilOuvert].photos,
            interests: profileMap[profilOuvert].interests,
            intentions: (profileMap[profilOuvert].intentions ?? []) as any,
          }}
          onClose={() => setProfilOuvert(null)}
        />
      )}
    </main>
  );
}
