'use client';

import { useTransition, useState } from 'react';
import { ACTIVE_STAGES, STAGE_SHORT, type Stage } from '@/lib/crm';

/**
 * La barre d'étapes. Pensée pour être utilisée debout, sur une tablette, juste
 * après un rendez-vous : des cibles de 44 px minimum, une seule pression, et
 * l'étape qui bascule tout de suite à l'écran sans attendre le serveur — sinon
 * on tape deux fois et on fait reculer le lieu sans le vouloir.
 */
export function StagePicker({
  crmId,
  current,
  action,
}: {
  crmId: string;
  current: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(current);

  function go(stage: string) {
    if (stage === optimistic) return;
    setOptimistic(stage);
    const fd = new FormData();
    fd.set('crmId', crmId);
    fd.set('stage', stage);
    startTransition(() => {
      void action(fd);
    });
  }

  const index = ACTIVE_STAGES.indexOf(optimistic as Stage);

  return (
    <div className={`mt-4 flex flex-wrap gap-1.5 ${pending ? 'opacity-60' : ''}`}>
      {ACTIVE_STAGES.map((s, i) => {
        const isCurrent = s === optimistic;
        const isPassed = index >= 0 && i < index;
        return (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            aria-current={isCurrent}
            className={`min-h-[44px] rounded-full border px-4 text-xs transition-colors ${
              isCurrent
                ? 'border-brass bg-brass text-ink font-medium'
                : isPassed
                  ? 'border-brass/30 text-brass/70'
                  : 'hairline text-bone-faint hover:border-white/30'
            }`}
          >
            {STAGE_SHORT[s]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => go('perdu')}
        className={`ml-auto min-h-[44px] rounded-full border px-4 text-xs transition-colors ${
          optimistic === 'perdu'
            ? 'border-red-400 bg-red-400/15 text-red-400'
            : 'hairline text-bone-faint hover:border-red-400/40 hover:text-red-400'
        }`}
      >
        Perdu
      </button>
    </div>
  );
}
