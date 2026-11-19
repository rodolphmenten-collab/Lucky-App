'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { createClient } from '@/lib/supabase/client';

/**
 * Le compte affiche en haut de la salle.
 *
 * Les deux nombres arrivent du serveur au chargement, puis ne bougeaient plus :
 * la liste des personnes, elle, se rafraichit toute seule. Au bout d'une heure
 * de soiree l'entete annoncait quarante-quatre personnes au-dessus d'une liste
 * qui en montrait trente-neuf, et c'est l'entete que le patron du lieu regarde.
 *
 * On reinterroge donc le meme compteur au meme rythme que la liste. Les valeurs
 * du serveur restent l'affichage initial : la page n'attend rien pour afficher
 * un premier chiffre juste.
 */
const RAFRAICHISSEMENT_MS = 30_000;

export function PeopleCountLine({
  venueSlug,
  peopleHere,
  openToMeeting,
}: {
  venueSlug: string;
  peopleHere: number;
  openToMeeting: number;
}) {
  const { t } = useLanguage();
  const [presents, setPresents] = useState(peopleHere);
  const [ouverts, setOuverts] = useState(openToMeeting);

  useEffect(() => {
    let annule = false;
    const supabase = createClient();

    async function relire() {
      const { data } = await supabase.rpc('get_venue_live_counts', { p_venue_slug: venueSlug });
      const ligne = Array.isArray(data) ? data[0] : data;
      if (annule || !ligne) return;
      setPresents(ligne.people_here ?? 0);
      setOuverts(ligne.open_to_meeting ?? 0);
    }

    const interval = setInterval(relire, RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      clearInterval(interval);
    };
  }, [venueSlug]);

  return <p className="mt-2 font-mono text-xs text-bone-dim">{t.join.peopleHere(presents, ouverts)}</p>;
}
