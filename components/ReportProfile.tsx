'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

/**
 * Signalement d'un profil, accessible depuis le profil lui-même.
 *
 * Il était jusqu'ici enterré dans le menu de la conversation : on ne pouvait
 * signaler quelqu'un qu'après avoir matché et ouvert un chat avec lui. Or le
 * comportement déplacé arrive souvent avant — dans la salle, sur le profil.
 *
 * L'entrée reste discrète : visible pour qui la cherche, jamais mise en avant
 * au point de suggérer la défiance à chaque profil consulté.
 */
export function ReportProfile({ userId, onDone }: { userId: string; onDone?: () => void }) {
  const { t } = useLanguage();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState<string | null>(null);
  const [precisions, setPrecisions] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);

  const c = t.chat;

  const motifs = [
    { cle: 'inappropriate', label: c.reportReasonInappropriate },
    { cle: 'harassment', label: c.reportReasonHarassment },
    { cle: 'fake', label: c.reportReasonFake },
    { cle: 'other', label: c.reportReasonOther },
  ];

  async function envoyer() {
    if (!motif || envoi) return;
    setEnvoi(true);
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedId: userId, reason: motif, details: precisions || null }),
      });
      setFait(true);
      onDone?.();
    } finally {
      setEnvoi(false);
    }
  }

  if (fait) {
    return (
      <p className="mt-6 rounded-2xl border border-brass/30 bg-brass/5 px-4 py-3 text-center text-xs leading-relaxed text-brass">
        {c.reportDone}
      </p>
    );
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mt-6 w-full text-center text-xs text-bone-faint underline"
      >
        {c.reportProfile}
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-sm font-medium text-bone">{c.reportTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-bone-dim">{c.reportIntro}</p>

      <div className="mt-3 flex flex-col gap-1.5">
        {motifs.map((m) => (
          <button
            key={m.cle}
            onClick={() => setMotif(m.cle)}
            className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
              motif === m.cle
                ? 'border-brass bg-brass/10 text-brass'
                : 'border-white/10 text-bone-dim hover:text-bone'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        value={precisions}
        onChange={(e) => setPrecisions(e.target.value)}
        placeholder={c.reportDetails}
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border hairline bg-transparent px-3 py-2 text-xs text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
      />

      <button
        onClick={envoyer}
        disabled={!motif || envoi}
        className="mt-3 w-full rounded-full bg-bone py-2.5 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-40"
      >
        {envoi ? '···' : c.reportSubmit}
      </button>
      <button
        onClick={() => setOuvert(false)}
        className="mt-2 w-full text-center text-[11px] text-bone-faint underline"
      >
        {t.meetup.cancel}
      </button>
    </div>
  );
}
