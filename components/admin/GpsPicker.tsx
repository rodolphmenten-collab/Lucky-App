'use client';

import { useState } from 'react';

/**
 * Relevé GPS depuis la fiche admin.
 *
 * Les coordonnées d'un lieu sont le seul verrou de présence : à 0,0 personne
 * ne peut entrer dans la salle. Les saisir à la main depuis Google Maps marche,
 * mais quand on est physiquement dans le lieu — ce qui est le cas en roadshow —
 * le téléphone connaît déjà la réponse. Ce bouton la lit.
 *
 * La précision est affichée parce qu'elle décide de la suite : un relevé à
 * ±1500 m (position déduite du réseau, pas du GPS) placerait le lieu à une rue
 * de là et casserait silencieusement la vérification de présence.
 */

const PRECISION_DOUTEUSE_M = 100;

export function GpsPicker({
  defaultLat,
  defaultLon,
}: {
  defaultLat: string;
  defaultLon: string;
}) {
  const [lat, setLat] = useState(defaultLat);
  const [lon, setLon] = useState(defaultLon);
  const [enCours, setEnCours] = useState(false);
  const [precision, setPrecision] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function relever() {
    if (!('geolocation' in navigator)) {
      setErreur("Ce navigateur ne sait pas donner la position.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    setPrecision(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setPrecision(Math.round(pos.coords.accuracy));
        setEnCours(false);
      },
      (err) => {
        setErreur(
          err.code === err.PERMISSION_DENIED
            ? "Localisation refusée. Autorise-la pour ce site dans les réglages du navigateur, puis réessaie."
            : "Position introuvable. Sors du bâtiment ou réessaie dans quelques secondes."
        );
        setEnCours(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  /**
   * Google Maps copie les deux coordonnees d'un coup : "48.856614, 2.352221".
   * Un champ `number` refuse ce texte et le collage ne donne rien, sans rien
   * dire. On l'intercepte : si le presse-papier contient bien deux nombres,
   * on les repartit nous-memes dans les deux champs.
   */
  function collerPaire(e: React.ClipboardEvent<HTMLInputElement>) {
    const texte = e.clipboardData.getData('text').trim();
    const paire = texte.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/);
    if (!paire) return;
    e.preventDefault();
    setLat(paire[1].replace(',', '.'));
    setLon(paire[2].replace(',', '.'));
    setPrecision(null);
    setErreur(null);
  }

  return (
    <div className="sm:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-bone-faint">Latitude</span>
          <input
            name="latitude"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onPaste={collerPaire}
            className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-bone-faint">Longitude</span>
          <input
            name="longitude"
            type="number"
            step="any"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            onPaste={collerPaire}
            className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={relever}
        disabled={enCours}
        className="mt-3 min-h-[44px] rounded-full border border-brass/50 px-5 text-sm text-brass hover:bg-brass/10 disabled:opacity-50"
      >
        {enCours ? 'Relevé en cours…' : 'Relever ma position actuelle'}
      </button>

      <p className="mt-2 text-xs leading-relaxed text-bone-faint">
        À utiliser sur place, depuis le téléphone. Les champs se remplissent seuls&nbsp;;
        il reste à enregistrer.
        {' '}Sinon, saisis-les à la main&nbsp;: tu peux coller les deux coordonnées
        Google Maps d&rsquo;un seul coup dans l&rsquo;un des deux champs.
      </p>

      {precision !== null && (
        <p
          className={`mt-2 text-xs leading-relaxed ${
            precision > PRECISION_DOUTEUSE_M ? 'text-brass' : 'text-signal-live'
          }`}
        >
          Relevé à ±{precision} m.
          {precision > PRECISION_DOUTEUSE_M
            ? " C'est trop large pour un lieu : la position vient probablement du réseau et pas du GPS. Réessaie près d'une fenêtre ou dehors avant d'enregistrer."
            : ' Précision suffisante.'}
        </p>
      )}

      {erreur && (
        <p className="mt-2 text-xs leading-relaxed text-brass">{erreur}</p>
      )}
    </div>
  );
}
