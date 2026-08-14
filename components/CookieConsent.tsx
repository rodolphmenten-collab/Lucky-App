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
  const [lang, setLang] = useState<'fr' | 'en' | 'es'>('en');

  useEffect(() => {
    const dismissed = window.localStorage.getItem('lucky_cookie_consent');
    if (!dismissed) setVisible(true);

    const raw = navigator.language?.toLowerCase() ?? 'en';
    if (raw.startsWith('fr')) setLang('fr');
    else if (raw.startsWith('es')) setLang('es');
    else setLang('en');
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
