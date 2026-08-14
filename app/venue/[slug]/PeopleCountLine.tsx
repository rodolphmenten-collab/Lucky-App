'use client';

import { useLanguage } from '@/components/LanguageProvider';

export function PeopleCountLine({ peopleHere, openToMeeting }: { peopleHere: number; openToMeeting: number }) {
  const { t } = useLanguage();
  return <p className="mt-2 font-mono text-xs text-bone-dim">{t.join.peopleHere(peopleHere, openToMeeting)}</p>;
}
