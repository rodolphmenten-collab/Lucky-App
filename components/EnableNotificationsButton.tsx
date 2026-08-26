'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function EnableNotificationsButton() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'enabling' | 'enabled' | 'unsupported' | 'denied'>('idle');

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      // Push subscriptions created outside of standalone mode on iOS don't
      // reliably deliver — the IOSInstallPrompt component guides these users
      // to install first instead.
      setStatus('unsupported');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      setStatus('enabled');
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus('unsupported');
      return;
    }

    setStatus('enabling');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus('idle');
        return;
      }

      const json = subscription.toJSON();
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setStatus('enabled');
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      setStatus('idle');
    }
  }

  if (status === 'unsupported' || status === 'denied') return null;

  if (status === 'enabled') {
    return <p className="text-[11px] text-bone-faint">✓ {t.join.notificationsEnabled}</p>;
  }

  return (
    <button
      onClick={enable}
      disabled={status === 'enabling'}
      className="rounded-full border border-brass/40 px-3 py-1.5 text-[11px] text-brass hover:bg-brass/10"
    >
      {status === 'enabling' ? '…' : `🔔 ${t.join.enableNotifications}`}
    </button>
  );
}
