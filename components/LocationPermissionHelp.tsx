'use client';

import { useLanguage } from '@/components/LanguageProvider';

export type PlateformeAide = 'inApp' | 'iosSafari' | 'iosChrome' | 'iosAutre' | 'androidChrome' | 'desktop';

/**
 * Quel mode d'emploi montrer.
 *
 * L'ancienne version tenait pour acquis qu'un iPhone signifiait Safari. Or le
 * cas le plus frequent un soir de soiree n'est pas Safari : c'est le navigateur
 * integre d'Instagram ou de WhatsApp, parce que les gens arrivent par un lien
 * partage. Ces personnes lisaient des instructions parlant de Safari, allaient
 * les chercher dans leurs reglages, ne trouvaient rien, et abandonnaient.
 *
 * Dans un navigateur integre, aucun reglage ne sert : la seule issue est
 * d'ouvrir la page dans un vrai navigateur. C'est donc ce qu'on dit, et on le
 * dit en premier.
 */
export function detecterPlateforme(ua: string): PlateformeAide {
  // Les navigateurs integres se declarent dans l'agent utilisateur. On les
  // traite avant tout le reste : la marque du telephone ne change rien au
  // conseil a donner.
  if (/Instagram|FBAN|FBAV|FB_IAB|Messenger|WhatsApp|Line\/|TikTok|Snapchat|Twitter|LinkedInApp|Pinterest/i.test(ua)) {
    return 'inApp';
  }

  const estIOS = /iPad|iPhone|iPod/.test(ua);
  if (estIOS) {
    if (/CriOS/.test(ua)) return 'iosChrome';
    // Safari est le seul navigateur iOS a ne porter aucun marqueur propre.
    if (/FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave/i.test(ua)) return 'iosAutre';
    return 'iosSafari';
  }

  if (/Android/.test(ua)) return 'androidChrome';
  return 'desktop';
}

function plateformeCourante(): PlateformeAide {
  if (typeof navigator === 'undefined') return 'desktop';
  return detecterPlateforme(navigator.userAgent);
}

export function LocationPermissionHelp({ onDismiss }: { onDismiss?: () => void }) {
  const { t } = useLanguage();
  const platform = plateformeCourante();
  const steps: string[] = t.join.locationSteps[platform];

  // Dans un navigateur integre, recharger la page ne sert a rien : il n'y a pas
  // de reglage a changer, il faut en sortir. Le bouton « j'ai active » n'a donc
  // pas de sens la, et son absence evite une boucle ou la personne recharge
  // dix fois sans comprendre pourquoi rien ne change.
  const dansUneApp = platform === 'inApp';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-sm rounded-t-3xl border hairline bg-ink-900 p-6 sm:rounded-3xl">
        <p className="font-display text-xl italic text-bone">{t.join.locationHelpTitle}</p>
        {!dansUneApp && (
          <>
            <p className="mt-2 text-xs leading-relaxed text-bone-dim">{t.join.locationHelpBody}</p>
            {/* Autoriser la position dans les reglages ne suffit pas : la page
                doit etre rechargee pour que le navigateur en tienne compte. On
                le dit, et le bouton recharge vraiment au lieu de redemander. */}
            <p className="mt-2 text-xs leading-relaxed text-brass">{t.join.locationHelpReload}</p>
          </>
        )}

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

        {!dansUneApp && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-full bg-bone py-3 text-sm font-medium tracking-wide text-ink hover:bg-brass-bright"
          >
            {t.join.locationHelpRetry}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${dansUneApp ? 'mt-6' : 'mt-3'} w-full text-center text-xs text-bone-faint underline`}
          >
            {t.chat.dismiss}
          </button>
        )}
      </div>
    </div>
  );
}
