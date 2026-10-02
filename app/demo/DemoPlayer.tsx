'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Démo animée de Lucky, pensée pour un patron qui scanne un flyer sur son
 * comptoir : il regarde trente secondes, debout, sans son. Donc pas de son,
 * pas de texte long, et chaque écran répond à « qu'est-ce que ça me rapporte ».
 */

const SCENE_MS = 4200;

interface Scene {
  eyebrow: string;
  caption: string;
  render: () => React.ReactNode;
}

export function DemoPlayer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startedAt = useRef<number>(Date.now());
  const [progress, setProgress] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= SCENES.length) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
    startedAt.current = Date.now();
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setProgress(Math.min(1, elapsed / SCENE_MS));
      if (elapsed >= SCENE_MS) next();
    }, 60);
    return () => clearInterval(tick);
  }, [playing, next]);

  const scene = SCENES[index];
  const finished = !playing && index === SCENES.length - 1;

  function replay() {
    setIndex(0);
    setProgress(0);
    startedAt.current = Date.now();
    setPlaying(true);
  }

  return (
    <div className="w-full">
      {/* Barre de progression : une case par scène, comme une story. */}
      <div className="mx-auto flex max-w-[280px] gap-1.5">
        {SCENES.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-bone/15">
            <div
              className="h-full bg-brass transition-[width] duration-100 ease-linear"
              style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={finished ? replay : next}
        aria-label={finished ? 'Rejouer la démo' : 'Écran suivant'}
        className="mx-auto mt-5 block w-full max-w-[280px] text-left"
      >
        {/* Cadre de téléphone : le patron doit reconnaître l'écran que ses
            clients auront en main, pas une capture de site web. */}
        <div className="relative flex aspect-[9/14] w-full flex-col overflow-hidden rounded-[2rem] border border-bone/15 bg-ink-900 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-bone/20" />
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.25em] text-brass">
            {scene.eyebrow}
          </p>
          {/* Les écrans n'ont pas la même hauteur : on les centre plutôt que de
              les coller en haut d'un cadre à moitié vide. */}
          <div key={index} className="flex flex-1 animate-fade_up flex-col justify-center">
            {scene.render()}
          </div>
        </div>
      </button>

      <p className="mx-auto mt-5 max-w-sm text-center text-sm leading-relaxed text-bone-dim">
        {scene.caption}
      </p>

      <div className="mt-4 text-center">
        {finished ? (
          <button onClick={replay} className="text-[11px] text-brass underline decoration-brass/40">
            Revoir la démo
          </button>
        ) : (
          <button onClick={next} className="text-[11px] text-bone-faint underline decoration-bone/20">
            Passer
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Briques d'écran ------------------------------------------- */

function Row({ initials, name, line, live = true }: { initials: string; name: string; line: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border hairline bg-ink-800 px-3 py-2.5">
      <div className="relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/20 font-display text-xs italic text-brass">
          {initials}
        </div>
        {live && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-signal-live ring-2 ring-ink-800" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-bone">{name}</p>
        <p className="truncate text-[9px] text-bone-faint">{line}</p>
      </div>
    </div>
  );
}

const SCENES: Scene[] = [
  {
    eyebrow: 'La salle',
    caption:
      'Vos clients scannent le QR posé sur la table. Aucune appli à installer. Ils voient qui est présent chez vous, à cet instant.',
    render: () => (
      <div className="space-y-2">
        <p className="font-display text-lg italic text-bone">La Palette</p>
        <p className="text-[10px] text-bone-faint">7 personnes ici en ce moment</p>
        <div className="mt-3 space-y-2">
          <Row initials="CL" name="Clara, 29" line="Social · arrivée il y a 20 min" />
          <Row initials="MA" name="Marc, 34" line="Business · au bar" />
          <Row initials="LÉ" name="Léa, 31" line="Social · en terrasse" />
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Le signe',
    caption:
      'Un geste suffit pour se signaler. Si c’est réciproque, la conversation s’ouvre — pendant qu’ils sont encore assis à vos tables.',
    render: () => (
      <div className="space-y-3">
        <Row initials="CL" name="Clara, 29" line="Social · arrivée il y a 20 min" />
        <div className="rounded-2xl border border-brass/40 bg-brass/10 px-4 py-5 text-center">
          <p className="font-display text-xl italic text-bone">Vous vous plaisez.</p>
          <p className="mt-1 text-[10px] text-bone-dim">La conversation est ouverte</p>
        </div>
        <div className="space-y-1.5">
          <p className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-bone px-3 py-1.5 text-[10px] text-ink">
            Vous êtes au bar ou en terrasse ?
          </p>
          <p className="max-w-[75%] rounded-2xl rounded-bl-sm border hairline bg-ink-800 px-3 py-1.5 text-[10px] text-bone">
            Terrasse, table du fond 🙂
          </p>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'La rencontre',
    caption:
      'Ils se rencontrent pour de vrai. Un code s’affiche : c’est la première connexion que vous pouvez compter, et non plus deviner.',
    render: () => (
      <div className="space-y-3">
        <div className="rounded-2xl border border-brass/40 bg-brass/5 px-4 py-6 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-brass">Votre rencontre</p>
          <p className="mt-2 font-display text-3xl tracking-[0.2em] text-bone">7K3D</p>
          <p className="mt-3 text-[10px] text-bone-dim">
            Votre avantage : une coupe offerte à la première rencontre
          </p>
        </div>
        <p className="text-center text-[9px] text-bone-faint">
          Rencontre enregistrée · 18 h 42
        </p>
      </div>
    ),
  },
  {
    eyebrow: 'Le verre',
    caption:
      'Il lui offre un verre depuis votre carte. Le montant est déjà net de votre remise : le bar encaisse, personne ne saisit rien.',
    render: () => (
      <div className="space-y-3">
        <div className="rounded-2xl border border-brass/40 bg-ink-800 px-4 py-5 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-brass">À montrer au bar</p>
          <p className="mt-2 font-display text-3xl tracking-[0.2em] text-bone">B4F2</p>
          <p className="mt-3 text-[11px] text-bone">Verre de rosé</p>
          <div className="mt-3 rounded-xl border border-brass/40 bg-brass/5 px-3 py-2">
            <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-brass">À encaisser</p>
            <p className="mt-0.5 font-display text-xl text-bone">10,20 €</p>
            <p className="mt-0.5 text-[9px] text-bone-dim">
              au lieu de <span className="line-through">12,00 €</span> ·{' '}
              <span className="text-brass">-15 % Lucky</span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Votre tableau de bord',
    caption:
      'Et à la fin du service, le chiffre que personne d’autre ne peut vous donner : ce que les rencontres ont réellement mis dans votre caisse.',
    render: () => (
      <div className="space-y-3">
        <div className="rounded-2xl border border-brass/40 bg-brass/5 px-4 py-5 text-center">
          <p className="font-display text-3xl text-bone">48,60 €</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-brass">
            CA certifié ce soir
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border hairline bg-ink-800 px-3 py-3 text-center">
            <p className="font-display text-lg text-bone">6</p>
            <p className="text-[8px] uppercase tracking-wider text-bone-faint">Rencontres</p>
          </div>
          <div className="rounded-xl border hairline bg-ink-800 px-3 py-3 text-center">
            <p className="font-display text-lg text-bone">4</p>
            <p className="text-[8px] uppercase tracking-wider text-bone-faint">Verres offerts</p>
          </div>
        </div>
        <p className="text-center text-[9px] leading-relaxed text-bone-faint">
          Exportable en CSV pour recouper avec votre caisse
        </p>
      </div>
    ),
  },
];
