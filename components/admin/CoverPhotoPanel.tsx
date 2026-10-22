'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Photo d'ambiance du lieu, depuis la fiche admin.
 *
 * Elle n'était réglable que depuis le tableau de bord du lieu lui-même, ce qui
 * obligeait à se connecter à sa place pour la poser. Or c'est la première
 * chose que voit quelqu'un qui scanne : elle doit pouvoir être mise en place
 * pendant la démo, sans attendre que le lieu s'en occupe.
 */
export function CoverPhotoPanel({
  venueId,
  currentUrl,
}: {
  venueId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [apercu, setApercu] = useState<string | null>(currentUrl);
  const [fichier, setFichier] = useState<File | null>(null);
  const [lien, setLien] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);

  function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFichier(f);
    setLien('');
    setApercu(URL.createObjectURL(f));
    setEtat('idle');
  }

  function collerLien(valeur: string) {
    setLien(valeur);
    setFichier(null);
    setApercu(valeur.trim() || currentUrl);
    setEtat('idle');
  }

  async function enregistrer() {
    if (!fichier && !lien.trim()) return;
    setEtat('envoi');
    setErreur(null);

    const data = new FormData();
    data.set('venueId', venueId);
    if (fichier) data.set('coverFile', fichier);
    if (lien.trim()) data.set('coverUrl', lien.trim());

    const res = await fetch('/api/dashboard/save-venue', { method: 'POST', body: data });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErreur(json.error ?? 'Enregistrement impossible.');
      setEtat('idle');
      return;
    }

    setEtat('ok');
    router.refresh();
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Photo d&rsquo;ambiance</p>
      <p className="mt-2 text-xs leading-relaxed text-bone-faint">
        Affichée en haut de la salle, à l&rsquo;entrée. C&rsquo;est elle qui donne le ton du lieu
        avant même la liste des personnes présentes.
      </p>

      <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-2xl border hairline bg-ink-800">
        {apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-bone-faint">
            Aucune photo
          </div>
        )}
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-bone-faint">Choisir un fichier</span>
        <input
          type="file"
          accept="image/*"
          onChange={choisirFichier}
          className="mt-1 block w-full text-xs text-bone-dim file:mr-3 file:rounded-full file:border file:border-white/10 file:bg-transparent file:px-4 file:py-2 file:text-xs file:text-bone-dim"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs text-bone-faint">ou coller un lien vers une image</span>
        <input
          type="url"
          value={lien}
          onChange={(e) => collerLien(e.target.value)}
          placeholder="https://…"
          className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={enregistrer}
        disabled={etat === 'envoi' || (!fichier && !lien.trim())}
        className="mt-4 min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-40"
      >
        {etat === 'envoi' ? 'Envoi…' : etat === 'ok' ? 'Enregistré' : 'Enregistrer la photo'}
      </button>

      {erreur && <p className="mt-2 text-xs text-brass">{erreur}</p>}
    </div>
  );
}
