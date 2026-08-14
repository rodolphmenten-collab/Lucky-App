'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { ConsumerLanguageSwitcher } from '@/components/ConsumerLanguageSwitcher';

export function OnboardingHeader({ isEdit }: { isEdit: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          {isEdit ? t.onboarding.eyebrowEdit : t.onboarding.eyebrowNew}
        </p>
        <h1 className="mt-4 font-display text-3xl italic text-bone">
          {isEdit ? t.onboarding.titleEdit : t.onboarding.titleNew}
        </h1>
        {!isEdit && <p className="mt-2 text-sm text-bone-dim">{t.onboarding.subtitle}</p>}
      </div>
      <ConsumerLanguageSwitcher />
    </div>
  );
}
