'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { marquerRelanceFaite, reporterRelance } from '@/app/admin/actions';

/**
 * Le bloc « À faire » de l'accueil admin.
 *
 * Il était jusqu'ici en lecture seule : on voyait les relances dues sans
 * pouvoir les solder, donc la liste grossissait jusqu'à ne plus rien vouloir
 * dire. Deux gestes la tiennent propre, et les deux doivent se faire d'ici,
 * sans ouvrir la fiche :
 *
 *  - « Fait » efface l'échéance et journalise la relance dans la fiche.
 *  - La date est un bouton : on la clique, on en choisit une autre, la ligne
 *    disparaît jusqu'à ce jour-là.
 *
 * Les lignes traitées sont masquées localement avant la réponse du serveur.
 * L'action revalide /admin de toute façon, mais sur un réseau de terrain la
 * seconde d'attente suffit à faire recliquer, et un double clic sur « Fait »
 * écrirait deux notes.
 */

type Relance = {
  id: string;
  name: string;
  next_action: string | null;
  next_action_at: string;
};

export default function RelancesDues({
  rows,
  todayKey,
  enRetard,
}: {
  rows: Relance[];
  todayKey: string;
  enRetard: number;
}) {
  const [masquees, setMasquees] = useState<Set<string>>(new Set());
  const [dateOuverte, setDateOuverte] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visibles = rows.filter((r) => !masquees.has(r.id));
  if (visibles.length === 0) return null;

  function masquer(id: string) {
    setMasquees((prec) => new Set(prec).add(id));
  }

  function fait(id: string) {
    masquer(id);
    const fd = new FormData();
    fd.set('crmId', id);
    startTransition(() => {
      void marquerRelanceFaite(fd);
    });
  }

  function reporter(id: string, date: string) {
    setDateOuverte(null);
    // Une date d'aujourd'hui ou d'avant laisse la ligne due : inutile de la
    // masquer, elle doit rester visible.
    if (date > todayKey) masquer(id);
    const fd = new FormData();
    fd.set('crmId', id);
    fd.set('next_action_at', date);
    startTransition(() => {
      void reporterRelance(fd);
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-brass/40 bg-brass/5 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
        À faire {enRetard > 0 && `· ${enRetard} en retard`}
      </p>
      <ul className="mt-3 space-y-2">
        {visibles.slice(0, 8).map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              onClick={() => fait(c.id)}
              aria-label={`Marquer la relance de ${c.name} comme faite`}
              title="Marquer comme fait"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-brass/50 text-brass transition hover:border-brass hover:bg-brass hover:text-ink"
            >
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <Link href={`/admin/crm/${c.id}`} className="text-bone underline decoration-brass/40">
              {c.name}
            </Link>
            <span className="text-bone-dim">{c.next_action}</span>

            {dateOuverte === c.id ? (
              <input
                type="date"
                autoFocus
                defaultValue={c.next_action_at}
                onChange={(e) => e.target.value && reporter(c.id, e.target.value)}
                onBlur={() => setDateOuverte(null)}
                className="rounded border border-brass/50 bg-ink px-1 py-0.5 font-mono text-[11px] text-bone"
              />
            ) : (
              <button
                type="button"
                onClick={() => setDateOuverte(c.id)}
                title="Reporter"
                className={`font-mono text-[11px] underline decoration-dotted decoration-brass/40 ${
                  c.next_action_at < todayKey ? 'text-red-400' : 'text-bone-faint'
                }`}
              >
                {new Date(c.next_action_at).toLocaleDateString('fr-FR')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
