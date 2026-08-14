'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/LanguageProvider';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';

export function JoinRoom({
  venueId,
  venueSlug,
  venueName,
  needsAuth,
  termsAcceptedAt,
}: {
  venueId: string;
  venueSlug: string;
  venueName: string;
  needsAuth: boolean;
  termsAcceptedAt: string | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, setState] = useState<'idle' | 'locating' | 'error' | 'out_of_range'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [termsChecked, setTermsChecked] = useState(Boolean(termsAcceptedAt));

  async function handleJoin() {
    if (!termsChecked) {
      setErrorMsg(t.join.termsRequired);
      return;
    }
    setErrorMsg('');

    if (needsAuth) {
      router.push(`/onboarding?next=/venue/${venueSlug}`);
      return;
    }

    if (!('geolocation' in navigator)) {
      setState('error');
      setErrorMsg(t.join.noGeoSupport);
      return;
    }

    setState('locating');

    // Record acceptance (harmless if already accepted before — just refreshes the timestamp).
    if (!termsAcceptedAt) {
      fetch('/api/accept-terms', { method: 'POST' });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              venueId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            setState('error');
            setErrorMsg(data.error ?? t.join.genericError);
            return;
          }

          if (!data.withinRadius) {
            setState('out_of_range');
            return;
          }

          router.refresh();
        } catch {
          setState('error');
          setErrorMsg(t.join.genericError);
        }
      },
      () => {
        setState('error');
        setErrorMsg(t.join.needsLocation);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mb-6 flex justify-center">
        <ConsumerLanguageSwitcher />
      </div>
      <p className="font-display text-2xl italic text-bone">{t.join.title}</p>
      <p className="mt-3 text-sm text-bone-dim">{t.join.subtitle(venueName)}</p>

      {!termsAcceptedAt && (
        <label className="mt-6 flex items-start gap-2.5 text-left text-xs text-bone-dim">
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => {
              setTermsChecked(e.target.checked);
              if (e.target.checked) setErrorMsg('');
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-brass"
          />
          <span>
            {t.join.termsPrefix}{' '}
            <Link href="/legal/utilisateurs" target="_blank" className="underline hover:text-brass">
              {t.join.termsLink}
            </Link>
          </span>
        </label>
      )}

      <Button onClick={handleJoin} disabled={state === 'locating'} className="mt-6 w-full">
        {state === 'locating' ? t.join.confirming : t.join.title}
      </Button>

      {state === 'out_of_range' && <p className="mt-4 text-xs text-brass">{t.join.outOfRange(venueName)}</p>}
      {errorMsg && <p className="mt-4 text-xs text-red-400">{errorMsg}</p>}
    </div>
  );
}
