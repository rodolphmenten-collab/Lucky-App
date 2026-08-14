'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { consumerCopy, detectBrowserLang, type ConsumerLang } from '@/lib/i18n/consumer';

const LanguageContext = createContext<{
  lang: ConsumerLang;
  setLang: (l: ConsumerLang) => void;
  t: (typeof consumerCopy)['en'];
}>({
  lang: 'en',
  setLang: () => {},
  t: consumerCopy.en,
});

const STORAGE_KEY = 'lucky_consumer_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<ConsumerLang>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ConsumerLang | null;
    setLangState(stored ?? detectBrowserLang());
  }, []);

  function setLang(l: ConsumerLang) {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: consumerCopy[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
