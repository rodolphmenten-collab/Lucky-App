'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { SUPPORTED_LANGS } from '@/lib/i18n/consumer';

const FLAG: Record<string, string> = { en: 'EN', fr: 'FR', es: 'ES' };

export function ConsumerLanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex rounded-full border hairline p-0.5">
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-colors ${
            lang === l ? 'bg-bone text-ink' : 'text-bone-faint hover:text-bone-dim'
          }`}
        >
          {FLAG[l]}
        </button>
      ))}
    </div>
  );
}
