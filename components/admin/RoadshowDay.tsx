'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ACTIVE_STAGES, STAGE_SHORT, stageLabel, type Stage } from '@/lib/crm';

/**
 * Une journée de tournée : la carte, puis la liste, dans l'ordre où on s'en
 * sert sur le trottoir.
 *
 * Tout ce qui est coché ici écrit dans le pipeline. C'est le point du
 * dispositif : il n'y a plus deux endroits où noter qu'un bar est intéressé,
 * donc plus de moment où les deux se contredisent.
 *
 * La carte est dessinée à la main depuis les coordonnées, sans fond de plan
 * ni clé d'API : elle montre où sont les lieux les uns par rapport aux autres
 * et dans quel ordre les faire. Pour l'itinéraire réel, le bouton ouvre
 * Google Maps, qui fait ça mieux que n'importe quel dessin.
 */

export interface RoadshowStop {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  category: string | null;
  stage: string;
  contactName: string | null;
  contactPhone: string | null;
  lat: number | null;
  lon: number | null;
  firstNote: string | null;
  lastNoteBy: string | null;
  lastNoteAt: string | null;
}

type Action = (formData: FormData) => void | Promise<void>;

// Leaflet touche a `window` : il ne peut pas etre rendu cote serveur.
const CarteRoadshow = dynamic(
  () => import('./CarteRoadshow').then((m) => m.CarteRoadshow),
  { ssr: false, loading: () => <div className="mt-4 h-[280px] animate-pulse rounded-2xl border hairline bg-ink-800" /> }
);

const STAGE_COLOR: Record<string, string> = {
  prospect: '#8A8478',
  contacte: '#5B93CC',
  rdv: '#C9A46A',
  demo: '#C9A46A',
  interesse: '#E8619D',
  signe: '#5EB98A',
  perdu: '#B5635B',
};

export function RoadshowDay({
  stops,
  setStageAction,
  addNoteAction,
  me,
  jour,
}: {
  stops: RoadshowStop[];
  setStageAction: Action;
  addNoteAction: Action;
  me: string;
  jour: string;
}) {
  const [rows, setRows] = useState(stops);
  const [open, setOpen] = useState<string | null>(null);
  const [geocodage, setGeocodage] = useState<'repos' | 'en cours' | 'fait'>('repos');
  // Une note prise dans la rue doit se voir enregistree tout de suite : sans
  // retour visible, on retape la meme note en croyant l'avoir perdue.
  const [notes, setNotes] = useState<Record<string, 'repos' | 'envoi' | 'ok' | 'echec'>>({});
  const [resultatGeo, setResultatGeo] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.stage] = (c[r.stage] ?? 0) + 1;
    return c;
  }, [rows]);

  const geo = useMemo(() => rows.filter((r) => r.lat !== null && r.lon !== null), [rows]);

  // Les points de la carte. Plus de projection maison : Leaflet place les
  // coordonnees sur un vrai fond de plan, donc on lui passe lat/lon tels quels.
  const pins = useMemo(
    () =>
      geo.map((g) => ({
        id: g.id,
        n: rows.indexOf(g) + 1,
        nom: g.name,
        lat: g.lat as number,
        lon: g.lon as number,
        couleur: STAGE_COLOR[g.stage] ?? '#8A8478',
        adresse: g.address,
      })),
    [geo, rows]
  );

  const mapsUrl = useMemo(() => {
    if (geo.length < 2) return null;
    // Google Maps n'accepte qu'un nombre limité d'étapes dans une URL.
    const pts = geo.slice(0, 10).map((g) => `${g.lat},${g.lon}`);
    const origin = pts[0];
    const destination = pts[pts.length - 1];
    const waypoints = pts.slice(1, -1).join('|');
    const p = new URLSearchParams({ api: '1', origin, destination, travelmode: 'walking' });
    if (waypoints) p.set('waypoints', waypoints);
    return `https://www.google.com/maps/dir/?${p.toString()}`;
  }, [geo]);

  async function placerSurLaCarte() {
    setGeocodage('en cours');
    setResultatGeo(null);
    try {
      const res = await fetch('/api/admin/geocoder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jour }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultatGeo(data.error ?? 'La recherche a échoué.');
        setGeocodage('repos');
        return;
      }
      const bouts = [`${data.places} lieu(x) placé(s)`];
      if (data.introuvables?.length) {
        bouts.push(`introuvables : ${data.introuvables.join(', ')} — à saisir à la main`);
      }
      if (data.restants) bouts.push(`${data.restants} restant(s), relance pour les suivants`);
      setResultatGeo(bouts.join(' · ') + '. Recharge la page pour voir la carte.');
      setGeocodage('fait');
    } catch {
      setResultatGeo("La recherche a échoué : le serveur n'a pas répondu.");
      setGeocodage('repos');
    }
  }

  async function enregistrerNote(id: string, formulaire: HTMLFormElement) {
    const fd = new FormData(formulaire);
    if (!String(fd.get('body') ?? '').trim()) return;
    setNotes((n) => ({ ...n, [id]: 'envoi' }));
    try {
      await addNoteAction(fd);
      formulaire.reset();
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, lastNoteAt: new Date().toISOString(), lastNoteBy: me } : r
        )
      );
      setNotes((n) => ({ ...n, [id]: 'ok' }));
    } catch {
      // On ne vide pas le champ : le texte reste disponible pour reessayer.
      setNotes((n) => ({ ...n, [id]: 'echec' }));
    }
  }

  function move(id: string, stage: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stage } : r)));
    const fd = new FormData();
    fd.set('crmId', id);
    fd.set('stage', stage);
    void setStageAction(fd);
  }

  function focusCard(id: string) {
    setOpen(id);
    cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div>
      {/* ------------------------------------------------------------ compte */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t hairline pt-4">
        <Count value={rows.length} label="lieux" />
        {ACTIVE_STAGES.filter((s) => counts[s]).map((s) => (
          <Count key={s} value={counts[s]} label={STAGE_SHORT[s].toLowerCase()} color={STAGE_COLOR[s]} />
        ))}
        {counts.perdu ? <Count value={counts.perdu} label="perdus" color={STAGE_COLOR.perdu} /> : null}
      </div>

      {/* ------------------------------------------------------------ carte */}
      {pins.length > 0 && (
        <div className="mt-4">
          <CarteRoadshow points={pins} onPointClick={focusCard} />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1.5">
            <p className="text-[11px] text-bone-faint">
              Numérotés comme la liste. Touche un point pour son adresse et l&rsquo;itinéraire,
              double-touche pour ouvrir sa fiche.
            </p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brass underline">
                Itinéraire à pied dans Google Maps ({Math.min(geo.length, 10)} arrêts) ↗
              </a>
            )}
          </div>
        </div>
      )}

      {rows.length > 0 && geo.length < rows.length && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-[11px] text-bone-faint">
            {rows.length - geo.length} lieu(x) sans coordonnées ne figurent pas sur la carte.
          </p>
          <button
            type="button"
            onClick={placerSurLaCarte}
            disabled={geocodage === 'en cours'}
            className="min-h-[36px] rounded-full border border-brass/50 px-4 text-[11px] text-brass hover:bg-brass/10 disabled:opacity-50"
          >
            {geocodage === 'en cours' ? 'Recherche en cours…' : 'Les placer sur la carte'}
          </button>
        </div>
      )}

      {resultatGeo && <p className="mt-2 text-[11px] leading-relaxed text-bone-dim">{resultatGeo}</p>}

      {/* ------------------------------------------------------------ liste */}
      <ol className="mt-4 space-y-2">
        {rows.map((r, i) => {
          const isOpen = open === r.id;
          return (
            <li
              key={r.id}
              ref={(el) => {
                if (el) cardRefs.current.set(r.id, el);
                else cardRefs.current.delete(r.id);
              }}
              className={`rounded-2xl border p-4 transition-colors ${
                isOpen ? 'border-brass bg-brass/5' : 'hairline'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-ink"
                  style={{ background: STAGE_COLOR[r.stage] ?? '#8A8478' }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight text-bone">{r.name}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-bone-faint">
                    {[r.category, r.address].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border hairline px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-bone-dim">
                  {stageLabel(r.stage)}
                </span>
              </button>

              {isOpen && (
                <div className="mt-4 border-t hairline pt-4">
                  {r.firstNote && (
                    <p className="text-sm leading-relaxed text-bone-dim">{r.firstNote}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ACTIVE_STAGES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => move(r.id, s)}
                        className={`min-h-[44px] rounded-full border px-4 text-xs ${
                          r.stage === s
                            ? 'border-brass bg-brass font-medium text-ink'
                            : 'hairline text-bone-faint hover:border-white/30'
                        }`}
                      >
                        {STAGE_SHORT[s as Stage]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => move(r.id, 'perdu')}
                      className={`min-h-[44px] rounded-full border px-4 text-xs ${
                        r.stage === 'perdu'
                          ? 'border-red-400 bg-red-400/15 text-red-300'
                          : 'hairline text-bone-faint hover:border-red-400/40 hover:text-red-300'
                      }`}
                    >
                      Perdu
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void enregistrerNote(r.id, e.currentTarget);
                    }}
                    className="mt-3"
                  >
                    <input type="hidden" name="crmId" value={r.id} />
                    <textarea
                      name="body"
                      rows={2}
                      required
                      placeholder="Ce qui s'est dit — interlocuteur, objection, suite à donner"
                      className="w-full rounded-xl border hairline bg-ink-800 p-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={notes[r.id] === 'envoi'}
                        className="min-h-[44px] rounded-full bg-bone px-5 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
                      >
                        {notes[r.id] === 'envoi' ? 'Enregistrement…' : 'Enregistrer la note'}
                      </button>
                      {notes[r.id] === 'ok' && (
                        <span className="text-xs text-signal-live">Note enregistrée ✓</span>
                      )}
                      {notes[r.id] === 'echec' && (
                        <span className="text-xs text-red-400">
                          Échec — ton texte est conservé, réessaie.
                        </span>
                      )}
                      {r.contactPhone && (
                        <a href={`tel:${r.contactPhone}`} className="text-xs text-brass underline">
                          Appeler {r.contactName ?? ''}
                        </a>
                      )}
                      {/* Sans adresse, on envoie le nom et la ville : Google Maps
                          retrouve l'etablissement. Mieux qu'un bouton absent
                          au moment ou on cherche la porte. */}
                      {(r.address || r.name) && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            r.address || [r.name, r.city].filter(Boolean).join(', ')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brass underline"
                        >
                          M&rsquo;y emmener ↗
                        </a>
                      )}
                      <Link href={`/admin/crm/${r.id}`} className="text-xs text-bone-dim underline">
                        Fiche complète
                      </Link>
                    </div>
                  </form>

                  {r.lastNoteAt && (
                    <p className="mt-2 font-mono text-[10px] text-bone-faint">
                      Dernière note : {r.lastNoteBy?.split('@')[0]} ·{' '}
                      {new Date(r.lastNoteAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {rows.length === 0 && (
        <p className="mt-6 rounded-2xl border hairline px-5 py-10 text-center text-sm text-bone-faint">
          Aucun lieu pour cette journée.
        </p>
      )}
    </div>
  );
}

function Count({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <span className="flex items-baseline gap-2 text-xs text-bone-faint">
      <b className="font-display text-xl font-medium" style={{ color: color ?? '#F4EFE6' }}>
        {value}
      </b>
      {label}
    </span>
  );
}
