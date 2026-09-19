'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/components/LanguageProvider';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';
import { LocationPermissionHelp } from '@/components/LocationPermissionHelp';

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
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [knownDenied, setKnownDenied] = useState(false);

  useEffect(() => {
    if (!('permissions' in navigator)) return;
    (navigator as any).permissions
      ?.query({ name: 'geolocation' })
      .then((status: PermissionStatus) => {
        setKnownDenied(status.state === 'denied');
        status.onchange = () => setKnownDenied(status.state === 'denied');
      })
      .catch(() => {});
  }, []);

  function attemptCheckin(position: GeolocationPosition) {
    fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
    })
      .then(async (res) => {
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
      })
      .catch(() => {
        setState('error');
        setErrorMsg(t.join.genericError);
      });
  }

  function requestLocation() {
    setState('locating');
    setShowLocationHelp(false);

    navigator.geolocation.getCurrentPosition(
      attemptCheckin,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('idle');
          setKnownDenied(true);
          setShowLocationHelp(true);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          attemptCheckin,
          () => {
            setState('error');
            setErrorMsg(t.join.needsLocation);
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  }

  function handleJoin() {
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

    if (!termsAcceptedAt) {
      fetch('/api/accept-terms', { method: 'POST' });
    }

    if (knownDenied) {
      setShowLocationHelp(true);
      return;
    }

    requestLocation();
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

      {showLocationHelp && (
        <LocationPermissionHelp onRetry={requestLocation} onDismiss={() => setShowLocationHelp(false)} />
      )}
    </div>
  );
}
