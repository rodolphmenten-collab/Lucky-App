'use client';

import { useEffect, useState } from 'react';

const COPY: Record<string, { text: string; accept: string }> = {
  fr: {
    text: 'Ce site utilise des cookies essentiels pour vous garder connecté. Aucun cookie publicitaire ou de suivi.',
    accept: "J'ai compris",
  },
  en: {
    text: 'This site uses essential cookies to keep you signed in. No advertising or tracking cookies.',
    accept: 'Got it',
  },
  es: {
    text: 'Este sitio usa cookies esenciales para mantener tu sesión iniciada. Sin cookies de publicidad ni seguimiento.',
    accept: 'Entendido',
  },
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<'fr' | 'en' | 'es'>('fr');

  useEffect(() => {
    const dismissed = window.localStorage.getItem('lucky_cookie_consent');
    if (!dismissed) setVisible(true);

    // Match whichever language the person is actually seeing: the marketing
    // page's own saved choice takes priority (it defaults to French regardless
    // of browser language), then the consumer app's saved choice, then finally
    // the browser's language as a last resort.
    const landingLang = window.localStorage.getItem('here-lang');
    const consumerLang = window.localStorage.getItem('lucky_consumer_lang');
    const stored = landingLang || consumerLang;

    if (stored === 'en' || stored === 'fr' || stored === 'es') {
      setLang(stored);
    } else {
      const raw = navigator.language?.toLowerCase() ?? 'fr';
      if (raw.startsWith('en')) setLang('en');
      else if (raw.startsWith('es')) setLang('es');
      else setLang('fr');
    }
  }, []);

  function accept() {
    window.localStorage.setItem('lucky_cookie_consent', '1');
    setVisible(false);
  }

  if (!visible) return null;
  const c = COPY[lang];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t hairline bg-ink-900/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-center text-xs text-bone-dim sm:text-left">{c.text}</p>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-bone px-5 py-2 text-xs font-medium text-ink hover:bg-brass-bright"
        >
          {c.accept}
        </button>
      </div>
    </div>
  );
}
