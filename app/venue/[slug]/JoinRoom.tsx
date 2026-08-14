'use client';

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
}: {
  venueId: string;
  venueSlug: string;
  venueName: string;
  needsAuth: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, setState] = useState<'idle' | 'locating' | 'error' | 'out_of_range'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleJoin() {
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

      <Button onClick={handleJoin} disabled={state === 'locating'} className="mt-8 w-full">
        {state === 'locating' ? t.join.confirming : t.join.title}
      </Button>

      {state === 'out_of_range' && <p className="mt-4 text-xs text-brass">{t.join.outOfRange(venueName)}</p>}
      {state === 'error' && <p className="mt-4 text-xs text-red-400">{errorMsg}</p>}
    </div>
  );
}
