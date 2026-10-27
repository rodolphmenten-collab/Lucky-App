'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * La carte de la journée, sur un vrai fond de plan.
 *
 * Elle était dessinée en SVG : des points colorés sur fond noir, sans rues ni
 * zoom. On voyait la forme du parcours mais pas où on allait, ce qui est
 * précisément ce qu'on demande à une carte quand on est dans la rue.
 *
 * Fond OpenStreetMap : pas de clé d'API à gérer, et les rues sont nommées.
 * Leaflet est chargé à l'affichage seulement — il touche à `window`, donc il
 * ne peut pas être rendu côté serveur.
 */

export interface PointCarte {
  id: string;
  n: number;
  nom: string;
  lat: number;
  lon: number;
  couleur: string;
  adresse: string | null;
}

export function CarteRoadshow({
  points,
  onPointClick,
}: {
  points: PointCarte[];
  onPointClick: (id: string) => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<any>(null);
  // Le callback change à chaque rendu du parent ; on le garde dans une
  // référence pour ne pas reconstruire la carte à chaque fois.
  const clic = useRef(onPointClick);
  clic.current = onPointClick;

  useEffect(() => {
    if (!conteneur.current || points.length === 0) return;
    let annule = false;
    let instance: any = null;

    (async () => {
      const L = (await import('leaflet')).default;
      if (annule || !conteneur.current) return;

      instance = L.map(conteneur.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      });
      carte.current = instance;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(instance);

      const groupe: any[] = [];
      for (const p of points) {
        const pastille = L.divIcon({
          className: '',
          html:
            `<div style="width:26px;height:26px;border-radius:50%;background:${p.couleur};` +
            `border:2px solid #0B0A08;box-shadow:0 1px 4px rgba(0,0,0,.5);` +
            `display:flex;align-items:center;justify-content:center;` +
            `font:600 12px/1 system-ui,sans-serif;color:#0B0A08;">${p.n}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const destination = encodeURIComponent(p.adresse || `${p.nom}, Lille`);
        const marqueur = L.marker([p.lat, p.lon], { icon: pastille })
          .addTo(instance)
          .bindPopup(
            `<strong>${p.n}. ${escapeHtml(p.nom)}</strong>` +
              (p.adresse ? `<br>${escapeHtml(p.adresse)}` : '') +
              `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${destination}" ` +
              `target="_blank" rel="noopener noreferrer">M'y emmener ↗</a>`
          );
        marqueur.on('dblclick', () => clic.current(p.id));
        groupe.push(marqueur);
      }

      const bornes = L.featureGroup(groupe).getBounds();
      // Un seul point n'a pas d'étendue : on choisit un zoom de quartier
      // plutôt que de laisser Leaflet aller au maximum.
      if (points.length === 1) instance.setView([points[0].lat, points[0].lon], 16);
      else instance.fitBounds(bornes, { padding: [40, 40] });
    })();

    return () => {
      annule = true;
      if (instance) instance.remove();
      carte.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div
      ref={conteneur}
      className="overflow-hidden rounded-2xl border hairline"
      style={{ height: 'min(50vh, 420px)' }}
    />
  );
}

function escapeHtml(v: string): string {
  return v.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
