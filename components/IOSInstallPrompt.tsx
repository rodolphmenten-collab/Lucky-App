'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

const DISMISS_KEY = 'lucky_ios_install_dismissed';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function IOSInstallPrompt() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY);
    if (!dismissed && isIOS() && !isStandalone()) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brass/40 bg-brass/5 px-4 py-3">
      <span className="text-lg">🔔</span>
      <div className="flex-1">
        <p className="text-xs font-medium text-bone">{t.join.iosInstallTitle}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-bone-dim">{t.join.iosInstallBody}</p>
        <button onClick={dismiss} className="mt-2 text-[11px] text-bone-faint underline">
          {t.join.iosInstallDismiss}
        </button>
      </div>
    </div>
  );
}
