'use client';

import { useLanguage } from '@/components/LanguageProvider';

function detectPlatform(): 'iosSafari' | 'androidChrome' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (isIOS) return 'iosSafari';
  if (/Android/.test(ua)) return 'androidChrome';
  return 'desktop';
}

export function LocationPermissionHelp({ onRetry, onDismiss }: { onRetry: () => void; onDismiss?: () => void }) {
  const { t } = useLanguage();
  const platform = detectPlatform();
  const steps: string[] = t.join.locationSteps[platform];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-sm rounded-t-3xl border hairline bg-ink-900 p-6 sm:rounded-3xl">
        <p className="font-display text-xl italic text-bone">{t.join.locationHelpTitle}</p>
        <p className="mt-2 text-xs leading-relaxed text-bone-dim">{t.join.locationHelpBody}</p>

        <ol className="mt-5 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brass/50 font-mono text-[11px] text-brass">
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm text-bone-dim">{step}</span>
            </li>
          ))}
        </ol>

        <button
          onClick={onRetry}
          className="mt-6 w-full rounded-full bg-bone py-3 text-sm font-medium tracking-wide text-ink hover:bg-brass-bright"
        >
          {t.join.locationHelpRetry}
        </button>
        {onDismiss && (
          <button onClick={onDismiss} className="mt-3 w-full text-center text-xs text-bone-faint underline">
            {t.chat.dismiss}
          </button>
        )}
      </div>
    </div>
  );
}
