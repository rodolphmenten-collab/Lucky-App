'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ACTIVE_STAGES,
  SOURCE_LABELS,
  STAGE_SHORT,
  formatEuros,
  planMonthlyCents,
  type Stage,
} from '@/lib/crm';

/**
 * Le pipeline en colonnes, façon Odoo/HubSpot.
 *
 * Deux choix structurants, tous les deux dictés par l'usage sur tablette,
 * debout, dehors :
 *
 *  - Le glisser-déposer est écrit en événements pointeur, pas en HTML5 drag
 *    and drop. Le DnD natif ne se déclenche tout simplement pas au doigt sur
 *    iPad : la fonctionnalité serait là et ne marcherait jamais là où elle
 *    sert.
 *  - Au doigt, le geste démarre sur un appui maintenu (180 ms). Sans ce délai,
 *    impossible de faire défiler une colonne sans emporter une carte avec soi.
 *    À la souris, quelques pixels de déplacement suffisent : pas d'attente
 *    inutile au bureau.
 *
 * L'état bascule tout de suite à l'écran et le serveur suit. Dehors, en 4G
 * incertaine, attendre la réponse donnerait l'impression que rien ne marche.
 */

const HOLD_MS = 180;
const MOVE_TOLERANCE = 10;
const EDGE = 60; // zone de défilement automatique au bord du board

export interface BoardCard {
  id: string;
  venueId: string | null;
  name: string;
  city: string | null;
  type: string | null;
  source: string | null;
  contactName: string | null;
  contactPhone: string | null;
  country: string | null;
  category: string | null;
  isGroup: boolean;
  groupName: string | null;
  /** Lieu de test : visible dans le pipe, absent de tous les compteurs. */
  isTest: boolean;
  ownerEmail: string | null;
  expectedPlan: string | null;
  stage: string;
  nextAction: string | null;
  nextActionAt: string | null;
  subscriptionStatus: string | null;
}

type Action = (formData: FormData) => void | Promise<void>;

export function PipelineBoard({
  cards,
  setStageAction,
  deleteAction,
  me,
}: {
  cards: BoardCard[];
  setStageAction: Action;
  deleteAction: Action;
  me: string;
}) {
  const [rows, setRows] = useState(cards);
  const [mineOnly, setMineOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [showLost, setShowLost] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Le serveur reste la source de vérité : quand la page est revalidée,
  // on reprend ses données plutôt que de garder un état local qui dérive.
  useEffect(() => setRows(cards), [cards]);

  const columns = useMemo<Stage[]>(
    () => (showLost ? ([...ACTIVE_STAGES, 'perdu'] as Stage[]) : ACTIVE_STAGES),
    [showLost]
  );

  // Les listes deroulantes se construisent sur les donnees reelles : pas de
  // ville codee en dur qui disparait le jour ou plus aucun lieu n'y est.
  // Les villes se restreignent au pays choisi, sinon on propose Lille a
  // quelqu'un qui vient de filtrer sur la Belgique.
  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter(Boolean))].sort() as string[],
    [rows]
  );
  const cities = useMemo(
    () =>
      [
        ...new Set(
          rows
            .filter((r) => !country || r.country === country)
            .map((r) => r.city)
            .filter(Boolean)
        ),
      ].sort((a, b) => (a as string).localeCompare(b as string)) as string[],
    [rows, country]
  );
  const categories = useMemo(
    () =>
      [...new Set(rows.map((r) => r.category).filter(Boolean))].sort((a, b) =>
        (a as string).localeCompare(b as string)
      ) as string[],
    [rows]
  );
  const sources = useMemo(
    () => [...new Set(rows.map((r) => r.source).filter(Boolean))].sort() as string[],
    [rows]
  );

  // Changer de pays invalide la ville choisie.
  useEffect(() => {
    if (city && !cities.includes(city)) setCity('');
  }, [cities, city]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (mineOnly && (r.ownerEmail ?? '').toLowerCase() !== me) return false;
      if (country && r.country !== country) return false;
      if (city && r.city !== city) return false;
      if (category && r.category !== category) return false;
      if (source && r.source !== source) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.city ?? '').toLowerCase().includes(q) ||
        (r.contactName ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, mineOnly, me, query, country, city, category, source]);

  const activeFilters = [country, city, category, source].filter(Boolean).length + (mineOnly ? 1 : 0);
  function resetFilters() {
    setCountry('');
    setCity('');
    setCategory('');
    setSource('');
    setMineOnly(false);
    setQuery('');
  }

  const byStage = useMemo(() => {
    const m = new Map<string, BoardCard[]>();
    for (const s of columns) m.set(s, []);
    for (const r of visible) m.get(r.stage)?.push(r);
    return m;
  }, [visible, columns]);

  // ---------------------------------------------------------------- drag
  const boardRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<string, HTMLElement>());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const ghost = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{
    id: string;
    from: string;
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
    holdTimer: number | null;
    el: HTMLElement;
  } | null>(null);
  const autoScroll = useRef<number | null>(null);

  const stopAutoScroll = () => {
    if (autoScroll.current !== null) {
      cancelAnimationFrame(autoScroll.current);
      autoScroll.current = null;
    }
  };

  const cleanup = useCallback(() => {
    const d = drag.current;
    if (d?.holdTimer) window.clearTimeout(d.holdTimer);
    if (ghost.current) {
      ghost.current.remove();
      ghost.current = null;
    }
    stopAutoScroll();
    drag.current = null;
    setDragId(null);
    setOverStage(null);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function beginDrag(clientX: number, clientY: number) {
    const d = drag.current;
    if (!d) return;
    d.active = true;
    setDragId(d.id);

    const r = d.el.getBoundingClientRect();
    const g = d.el.cloneNode(true) as HTMLDivElement;
    g.style.position = 'fixed';
    g.style.left = '0';
    g.style.top = '0';
    g.style.width = `${r.width}px`;
    g.style.pointerEvents = 'none';
    g.style.zIndex = '60';
    g.style.opacity = '0.95';
    g.style.transform = `translate(${r.left}px, ${r.top}px) rotate(1.5deg) scale(1.02)`;
    g.style.boxShadow = '0 18px 40px rgba(0,0,0,.55)';
    g.dataset.offsetX = String(clientX - r.left);
    g.dataset.offsetY = String(clientY - r.top);
    document.body.appendChild(g);
    ghost.current = g;

    if ('vibrate' in navigator) navigator.vibrate?.(8);
  }

  function columnUnder(x: number, y: number): string | null {
    for (const [stage, el] of colRefs.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return stage;
    }
    // Hors des colonnes verticalement : on retient quand même la colonne
    // survolée horizontalement, sinon déposer au-dessus ou en dessous
    // d'une colonne courte ne fait rien et on croit que ça a planté.
    for (const [stage, el] of colRefs.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right) return stage;
    }
    return null;
  }

  function runAutoScroll(x: number) {
    stopAutoScroll();
    const board = boardRef.current;
    if (!board) return;
    const r = board.getBoundingClientRect();
    let dx = 0;
    if (x < r.left + EDGE) dx = -Math.min(14, (r.left + EDGE - x) / 3);
    else if (x > r.right - EDGE) dx = Math.min(14, (x - (r.right - EDGE)) / 3);
    if (dx === 0) return;
    const step = () => {
      board.scrollLeft += dx;
      autoScroll.current = requestAnimationFrame(step);
    };
    autoScroll.current = requestAnimationFrame(step);
  }

  function onPointerDown(e: React.PointerEvent, card: BoardCard) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const el = (e.currentTarget as HTMLElement).closest('[data-card]') as HTMLElement;
    if (!el) return;

    drag.current = {
      id: card.id,
      from: card.stage,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      holdTimer: null,
      el,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (e.pointerType === 'mouse') return; // la souris démarre au mouvement
    const x = e.clientX;
    const y = e.clientY;
    drag.current.holdTimer = window.setTimeout(() => beginDrag(x, y), HOLD_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      const moved = Math.hypot(dx, dy);
      if (moved < MOVE_TOLERANCE) return;
      if (e.pointerType === 'mouse') {
        beginDrag(e.clientX, e.clientY);
      } else {
        // Le doigt a bougé avant la fin de l'appui maintenu : c'est un
        // défilement, pas un déplacement de carte.
        if (d.holdTimer) window.clearTimeout(d.holdTimer);
        drag.current = null;
        return;
      }
    }

    e.preventDefault();
    const g = ghost.current;
    if (g) {
      const ox = Number(g.dataset.offsetX ?? 0);
      const oy = Number(g.dataset.offsetY ?? 0);
      g.style.transform = `translate(${e.clientX - ox}px, ${e.clientY - oy}px) rotate(1.5deg) scale(1.02)`;
    }
    setOverStage(columnUnder(e.clientX, e.clientY));
    runAutoScroll(e.clientX);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;

    if (d.active) {
      const target = columnUnder(e.clientX, e.clientY);
      if (target && target !== d.from) {
        setRows((prev) => prev.map((r) => (r.id === d.id ? { ...r, stage: target } : r)));
        const fd = new FormData();
        fd.set('crmId', d.id);
        fd.set('stage', target);
        void setStageAction(fd);
      }
    }
    cleanup();
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    const fd = new FormData();
    fd.set('crmId', id);
    void deleteAction(fd);
  }

  const total = visible.length;

  return (
    <div>
      {/* ---------------------------------------------------------- barre */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un lieu, une ville, un contact…"
          className="min-h-[48px] min-w-0 flex-1 rounded-full border hairline bg-transparent px-5 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none sm:max-w-sm"
        />
        <Toggle on={mineOnly} onClick={() => setMineOnly((v) => !v)} label="Mes lieux" />
        <Toggle on={showLost} onClick={() => setShowLost((v) => !v)} label="Perdus" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Select value={country} onChange={setCountry} label="Tous pays" options={countries} format={paysLabel} />
        <Select value={city} onChange={setCity} label="Toutes villes" options={cities} />
        <Select value={category} onChange={setCategory} label="Toutes catégories" options={categories} />
        <Select value={source} onChange={setSource} label="Toutes sources" options={sources} format={sourceLabel} />
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[44px] rounded-full border border-brass/50 px-4 text-xs text-brass"
          >
            Tout afficher
          </button>
        )}
        <span className="ml-auto whitespace-nowrap text-xs text-bone-faint">
          {total} lieu{total > 1 ? 'x' : ''}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-bone-faint">
        Au doigt, garde la carte appuyée un instant avant de la faire glisser — sinon le geste
        fait défiler la colonne.
      </p>

      {/* ---------------------------------------------------------- board */}
      <div
        ref={boardRef}
        className="mt-3 flex gap-3 overflow-x-auto overflow-y-visible pb-4"
        style={{ scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}
      >
        {columns.map((stage) => {
          const list = byStage.get(stage) ?? [];
          const sum = list.reduce((s, c) => s + planMonthlyCents(c.expectedPlan), 0);
          const isOver = overStage === stage && dragId !== null;
          return (
            <section
              key={stage}
              ref={(el) => {
                if (el) colRefs.current.set(stage, el);
                else colRefs.current.delete(stage);
              }}
              className={`flex w-[78vw] max-w-[300px] shrink-0 flex-col rounded-2xl border transition-colors sm:w-[270px] ${
                isOver ? 'border-brass bg-brass/10' : 'hairline bg-ink-900/40'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <header className="sticky top-0 z-10 rounded-t-2xl border-b hairline bg-ink-900/90 px-4 py-3 backdrop-blur">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass">
                    {stage === 'perdu' ? 'Perdus' : STAGE_SHORT[stage as Stage]}
                  </p>
                  <span className="font-display text-base text-bone">{list.length}</span>
                </div>
                {sum > 0 && (
                  <p className="mt-0.5 text-[11px] text-bone-faint">{formatEuros(sum)}/mois</p>
                )}
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: '62vh' }}>
                {list.map((c) => (
                  <article
                    key={c.id}
                    data-card
                    className={`rounded-xl border bg-ink-800 p-3 transition-opacity ${
                      dragId === c.id ? 'opacity-25' : 'opacity-100'
                    } ${c.venueId ? 'border-brass/30' : 'hairline'}`}
                  >
                    <div
                      onPointerDown={(e) => onPointerDown(e, c)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={cleanup}
                      style={{ touchAction: 'pan-y' }}
                      className="cursor-grab select-none active:cursor-grabbing"
                    >
                      <p className="text-sm font-medium leading-snug text-bone">
                        {c.isGroup && <span className="mr-1.5 text-brass">◆</span>}
                        {c.name}
                        {c.isTest && (
                          <span className="ml-1.5 rounded-full border border-white/20 px-1.5 py-px align-middle font-mono text-[9px] uppercase tracking-wider text-bone-faint">
                            test
                          </span>
                        )}
                      </p>
                      {c.groupName && (
                        <p className="mt-0.5 text-[10px] text-brass/80">{c.groupName}</p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-bone-faint">
                        {[c.city, c.type].filter(Boolean).join(' · ')}
                      </p>
                      {c.contactName && (
                        <p className="mt-1 truncate text-[11px] text-bone-dim">{c.contactName}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.expectedPlan && (
                          <span className="rounded-full border hairline px-2 py-0.5 text-[10px] text-bone-dim">
                            {formatEuros(planMonthlyCents(c.expectedPlan))}
                          </span>
                        )}
                        {c.subscriptionStatus && c.subscriptionStatus !== 'none' && (
                          <span className="rounded-full border border-brass/50 px-2 py-0.5 text-[10px] text-brass">
                            {c.subscriptionStatus === 'active' ? 'Payant' : 'Essai'}
                          </span>
                        )}
                        {c.nextActionAt && (
                          <span className="rounded-full border hairline px-2 py-0.5 text-[10px] text-bone-faint">
                            {new Date(c.nextActionAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t hairline pt-2">
                      {/* Le libelle dit ce qui va se passer : un prospect n'a
                          pas d'etablissement a ouvrir, il en a un a creer. */}
                      {c.venueId ? (
                        <Link
                          href={`/admin/crm/${c.id}`}
                          className="rounded-full border border-brass/50 px-3 py-1 text-[10px] text-brass hover:bg-brass/10"
                        >
                          Ouvrir l&rsquo;établissement
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/venues/new?crm=${c.id}`}
                          className="rounded-full border hairline px-3 py-1 text-[10px] text-bone-dim hover:border-brass hover:text-brass"
                        >
                          Créer l&rsquo;établissement
                        </Link>
                      )}
                      {c.contactPhone && (
                        <a href={`tel:${c.contactPhone}`} className="text-[11px] text-bone-dim underline">
                          Appeler
                        </a>
                      )}
                      {c.venueId && c.subscriptionStatus && c.subscriptionStatus !== 'none' ? (
                        <span
                          className="text-[10px] text-bone-faint"
                          title="Abonnement en cours : résilier dans Stripe avant de supprimer"
                        >
                          facturé
                        </span>
                      ) : confirmId === c.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => remove(c.id)}
                            title={
                              c.venueId
                                ? 'Supprime aussi l’établissement, son QR et tout son historique'
                                : undefined
                            }
                            className="min-h-[32px] rounded-full bg-red-400/20 px-3 text-[11px] text-red-300"
                          >
                            {c.venueId ? 'Supprimer tout' : 'Supprimer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="min-h-[32px] px-2 text-[11px] text-bone-faint"
                          >
                            Non
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(c.id)}
                          aria-label={`Supprimer ${c.name}`}
                          className="min-h-[32px] min-w-[32px] rounded-full text-[13px] text-bone-faint hover:bg-red-400/10 hover:text-red-300"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </article>
                ))}

                {list.length === 0 && (
                  <p className="px-2 py-6 text-center text-[11px] text-bone-faint">
                    {isOver ? 'Déposer ici' : 'Vide'}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function paysLabel(code: string) {
  return { FR: 'France', BE: 'Belgique' }[code] ?? code;
}

function sourceLabel(code: string) {
  return SOURCE_LABELS[code] ?? code;
}

function Select({
  value,
  onChange,
  label,
  options,
  format,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
  format?: (v: string) => string;
}) {
  if (options.length < 2) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`min-h-[44px] max-w-[46vw] truncate rounded-full border bg-ink-800 px-4 text-xs sm:max-w-none ${
        value ? 'border-brass text-brass' : 'hairline text-bone-dim'
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {format ? format(o) : o}
        </option>
      ))}
    </select>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[48px] rounded-full border px-5 text-xs transition-colors ${
        on ? 'border-brass bg-brass/10 text-brass' : 'hairline text-bone-dim hover:border-white/30'
      }`}
    >
      {label}
    </button>
  );
}
