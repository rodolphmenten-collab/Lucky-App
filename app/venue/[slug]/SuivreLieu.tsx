'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * Case de consentement aux actualités du lieu.
 *
 * Trois choses la rendent valable, et aucune n'est décorative : elle nomme
 * l'établissement (un consentement « aux partenaires » ne vaut rien), elle est
 * décochée au départ, et le retrait se fait au même endroit, d'un clic. Elle
 * est aussi séparée de l'entrée dans la salle : on ne conditionne pas l'accès
 * au service à l'acceptation de recevoir des e-mails.
 */
export function SuivreLieu({
  venueId,
  venueName,
  dejaSuivi,
}: {
  venueId: string;
  venueName: string;
  dejaSuivi: boolean;
}) {
  const { t } = useLanguage();
  const [suivi, setSuivi] = useState(dejaSuivi);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);

  async function basculer(valeur: boolean) {
    setEnCours(true);
    setErreur(false);
    const avant = suivi;
    setSuivi(valeur); // optimiste : la case suit le doigt, pas le réseau
    try {
      const res = await fetch('/api/suivre-lieu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, suivre: valeur }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSuivi(avant);
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border hairline bg-ink-800 p-4">
      {suivi ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-bone-dim">{t.suivre.actif(venueName)}</p>
          <button
            onClick={() => basculer(false)}
            disabled={enCours}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-brass underline disabled:opacity-50"
          >
            {t.suivre.retirer}
          </button>
        </div>
      ) : (
        <label className="flex items-start gap-2.5 text-left">
          <input
            type="checkbox"
            checked={false}
            disabled={enCours}
            onChange={(e) => basculer(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-brass"
          />
          <span>
            <span className="block text-xs text-bone">{t.suivre.label(venueName)}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-bone-faint">
              {t.suivre.aide(venueName)}
            </span>
          </span>
        </label>
      )}

      {erreur && <p className="mt-2 text-[11px] text-red-400">{t.suivre.erreur}</p>}
    </div>
  );
}
