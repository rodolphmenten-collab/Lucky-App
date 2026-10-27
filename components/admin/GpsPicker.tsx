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
 * Les champs sont en `text` et non en `number`. Un champ `number` sur un
 * navigateur configuré en français affiche la virgule décimale mais refuse
 * qu'on la tape : la valeur devient vide à la frappe, et le champ paraît
 * cassé. On garde donc la saisie telle quelle et on normalise la virgule en
 * point au moment d'envoyer, dans des champs cachés.
 */

const PRECISION_DOUTEUSE_M = 100;

/** Une coordonnée en cours de frappe : « -4, », « 43,14 », « » sont tolérées. */
function enCoursDeSaisie(v: string): boolean {
  return /^-?\d*([.,]\d*)?$/.test(v.trim());
}

function normaliser(v: string): string {
  return v.trim().replace(',', '.');
}

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
  const [refusee, setRefusee] = useState(false);

  function relever() {
    if (!('geolocation' in navigator)) {
      setErreur('Ce navigateur ne sait pas donner la position.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    setRefusee(false);
    setPrecision(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setPrecision(Math.round(pos.coords.accuracy));
        setEnCours(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setRefusee(true);
          setErreur(null);
        } else {
          setErreur(
            "Position introuvable. Sors du bâtiment ou réessaie dans quelques secondes."
          );
        }
        setEnCours(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  /**
   * Google Maps copie les deux coordonnees d'un coup : "48.856614, 2.352221".
   * On l'intercepte : si le presse-papier contient bien deux nombres, on les
   * repartit nous-memes dans les deux champs.
   */
  function collerPaire(e: React.ClipboardEvent<HTMLInputElement>) {
    const texte = e.clipboardData.getData('text').trim();
    const paire = texte.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/);
    if (!paire) return;
    e.preventDefault();
    setLat(normaliser(paire[1]));
    setLon(normaliser(paire[2]));
    setPrecision(null);
    setErreur(null);
    setRefusee(false);
  }

  function saisir(valeur: string, poser: (v: string) => void) {
    // On refuse les lettres, mais on laisse passer un champ a moitie tape :
    // bloquer « 43, » empecherait d'ecrire « 43,15 ».
    if (enCoursDeSaisie(valeur)) poser(valeur);
  }

  const champ =
    'mt-1 min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none';

  return (
    <div className="sm:col-span-2">
      {/* Ce que le formulaire envoie : toujours avec un point décimal. */}
      <input type="hidden" name="latitude" value={normaliser(lat)} />
      <input type="hidden" name="longitude" value={normaliser(lon)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-bone-faint">Latitude</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={lat}
            onChange={(e) => saisir(e.target.value, setLat)}
            onPaste={collerPaire}
            placeholder="43.149574"
            className={champ}
          />
        </label>
        <label className="block">
          <span className="text-xs text-bone-faint">Longitude</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={lon}
            onChange={(e) => saisir(e.target.value, setLon)}
            onPaste={collerPaire}
            placeholder="5.700693"
            className={champ}
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
        Le relevé n&rsquo;a de sens que sur place, depuis le téléphone. Sur ordinateur, la
        position vient du réseau et tombe souvent à plusieurs centaines de mètres&nbsp;: passe
        plutôt par Google&nbsp;Maps — clic droit sur le lieu, puis clic sur les coordonnées pour
        les copier, et colle-les d&rsquo;un seul coup dans l&rsquo;un des deux champs. La virgule
        est acceptée.
      </p>

      {refusee && (
        <div className="mt-3 rounded-xl border border-brass/40 bg-brass/5 p-4">
          <p className="text-xs font-medium text-brass">Localisation refusée par le navigateur</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-bone-dim">
            <li>Clique sur l&rsquo;icône à gauche de l&rsquo;adresse du site, en haut.</li>
            <li>Passe « Position » sur Autoriser.</li>
            <li>Recharge la page, puis réessaie.</li>
          </ol>
          <p className="mt-2 text-xs leading-relaxed text-bone-faint">
            Sur ordinateur, ça ne vaut souvent pas le détour&nbsp;: le collage Google Maps
            ci-dessus donne une position plus juste.
          </p>
        </div>
      )}

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

      {erreur && <p className="mt-2 text-xs leading-relaxed text-brass">{erreur}</p>}
    </div>
  );
}
