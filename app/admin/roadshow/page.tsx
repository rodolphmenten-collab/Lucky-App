import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import { RoadshowDay, type RoadshowStop } from '@/components/admin/RoadshowDay';
import { setStage, addNote } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * La tournée, journée par journée.
 *
 * Les lieux viennent du pipeline — ce sont les mêmes lignes, avec la même
 * étape. Cocher « Intéressé » ici, c'est le faire dans le CRM : il n'y a
 * qu'un seul endroit où un lieu existe.
 */
export default async function RoadshowPage({
  searchParams,
}: {
  searchParams?: { secteur?: string; jour?: string; agent?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const me = (user.email ?? '').toLowerCase();
  const service = createServiceClient();

  const [{ data: all }, { count: pendingReports }] = await Promise.all([
    service
      .from('crm_venues')
      .select('*')
      .not('roadshow_date', 'is', null)
      .order('roadshow_date', { ascending: true })
      // L'ordre de marche d'abord : une journée se lit dans l'ordre où on
      // pousse les portes, pas dans l'ordre alphabétique. Les lieux sans
      // ordre défini retombent derrière, triés par nom.
      .order('roadshow_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true }),
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Le select est assez large pour que l'inference de Supabase abandonne ;
  // on type la ligne nous-memes plutot que de propager des `unknown`.
  const toutes: any[] = (all as any[] | null) ?? [];

  // Les personnes qui ont des lieux en tournée. La liste se construit depuis les
  // données : un agent apparaît quand on lui confie des lieux, et disparaît le
  // jour où on les lui retire. Rien à coder pour ouvrir ou fermer une section.
  const agents: string[] = Array.from(
    new Set(toutes.map((r: any) => (r.owner_email ?? '').toLowerCase()).filter(Boolean))
  ).sort();

  // Par défaut, chacun arrive sur sa propre tournée. Cédric ouvre le
  // back-office et voit ses lieux du jour, pas ceux de toute l'équipe.
  const agentChoisi: string | null =
    searchParams?.agent === 'tous'
      ? null
      : searchParams?.agent && agents.includes(searchParams.agent.toLowerCase())
        ? searchParams.agent.toLowerCase()
        : agents.includes(me)
          ? me
          : null;

  const rows: any[] = agentChoisi
    ? toutes.filter((r: any) => (r.owner_email ?? '').toLowerCase() === agentChoisi)
    : toutes;

  const lien = (params: Record<string, string>) => {
    const q = new URLSearchParams(params);
    return `/admin/roadshow?${q.toString()}`;
  };

  /**
   * Le nom affiché pour une personne.
   *
   * On le prend dans le libellé de tournée — « Roadshow Cédric — Paris 16e »
   * donne « Roadshow Cédric » — parce que c'est le nom que l'équipe a écrit
   * elle-même. L'adresse e-mail ne sert que de dernier recours : découper
   * descouturescedric@ donne « Descouturescedric », ce que personne n'appelle
   * personne.
   */
  const titreAgent = (e: string) => {
    const libelles = toutes
      .filter((r: any) => (r.owner_email ?? '').toLowerCase() === e)
      .map((r: any) => String(r.roadshow_label ?? '').split('—')[0].trim())
      .filter((l: string) => l.length > 0);
    const frequences = libelles.reduce((acc: Map<string, number>, l: string) => {
      acc.set(l, (acc.get(l) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
    const [meilleur] = [...frequences.entries()].sort((a, b) => b[1] - a[1]);
    if (meilleur) return meilleur[0];
    const brut = e.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return `Roadshow ${brut.charAt(0).toUpperCase() + brut.slice(1)}`;
  };

  const nomAgent = (e: string) => titreAgent(e).replace(/^Roadshow\s+/i, '');

  /**
   * Le secteur d'un lieu : l'arrondissement pour Paris (« 9e », « 16e »),
   * la ville sinon (« Boulogne », « Lille »). On le lit d'abord dans le code
   * postal de l'adresse, puis dans la ville saisie (« Paris 9e »).
   * La tournée se découpe par secteur et non par date : un secteur se fait
   * sur plusieurs passages, au rythme de Cédric.
   */
  const secteurDe = (r: any): string => {
    const adresse = String(r.address ?? '');
    const ville = String(r.city ?? '').trim().replace(/\s+/g, ' ');
    const cp = adresse.match(/\b75(?:0(\d{2})|116)\b/);
    if (cp) {
      const n = cp[1] ? parseInt(cp[1], 10) : 16;
      if (n >= 1 && n <= 20) return n === 1 ? '1er' : `${n}e`;
    }
    const arr = ville.match(/paris\s*(\d{1,2})\s*(?:e|er|ème|eme)?\b/i);
    if (arr) {
      const n = parseInt(arr[1], 10);
      if (n >= 1 && n <= 20) return n === 1 ? '1er' : `${n}e`;
    }
    if (/boulogne/i.test(ville) || /92100/.test(adresse)) return 'Boulogne';
    if (!ville) return 'Autres';
    const nom = ville.replace(/\s*\(.*\)\s*$/, '').split(/[-\s]/)[0];
    return nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
  };

  // Les arrondissements dans l'ordre (1er → 20e), puis les autres villes.
  const rangSecteur = (z: string): [number, string] => {
    const m = z.match(/^(\d{1,2})(?:e|er)$/);
    return m ? [parseInt(m[1], 10), ''] : [100, z];
  };
  const days: string[] = Array.from(new Set(rows.map(secteurDe))).sort((a, b) => {
    const [na, sa] = rangSecteur(a);
    const [nb, sb] = rangSecteur(b);
    return na !== nb ? na - nb : sa.localeCompare(sb, 'fr');
  });

  // Le titre d'un secteur : le libellé de tournée le plus fréquent de ses+  // lieux (« Roadshow Cédric — 9e : Galeries Lafayette → Grands Boulevards »),
  // à défaut le secteur lui-même.
  const labelFor = (z: string): string => {
    const freq = new Map<string, number>();
    for (const r of rows) {
      if (secteurDe(r) !== z || !r.roadshow_label) continue;
      freq.set(r.roadshow_label, (freq.get(r.roadshow_label) ?? 0) + 1);
    }
    const [meilleur] = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    return meilleur ? meilleur[0] : z === 'Autres' ? 'Autres lieux' : z;
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  // Ouvert d'office : le secteur demandé, sinon celui qui a des lieux prévus
  // aujourd'hui ou au plus tôt à venir, sinon le premier.
  const prochain = rows
    .filter((r: any) => String(r.roadshow_date) >= todayKey)
    .sort((a: any, b: any) => String(a.roadshow_date).localeCompare(String(b.roadshow_date)))[0];
  const selected: string | null =
    (searchParams?.secteur && days.includes(searchParams.secteur) ? searchParams.secteur : null) ??
    (prochain ? secteurDe(prochain) : null) ??
    days[0] ??
    null;

  const dayRows = rows.filter((r: any) => secteurDe(r) === selected);

  // La première note de chaque lieu porte le « pourquoi on y va ». On la
  // remonte ici pour l'avoir sous les yeux en poussant la porte, plutôt que
  // d'avoir à ouvrir une fiche de plus.
  const ids = dayRows.map((r: any) => r.id);
  const { data: notes } = ids.length
    ? await service
        .from('crm_notes')
        .select('crm_venue_id, body, author_email, created_at')
        .in('crm_venue_id', ids)
        .order('created_at', { ascending: true })
    : { data: [] as any[] };

  const firstNote = new Map<string, string>();
  const lastNote = new Map<string, { by: string; at: string }>();
  for (const n of notes ?? []) {
    if (!firstNote.has(n.crm_venue_id)) firstNote.set(n.crm_venue_id, n.body);
    lastNote.set(n.crm_venue_id, { by: n.author_email, at: n.created_at });
  }

  const stops: RoadshowStop[] = dayRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    city: r.city ?? null,
    category: r.category ?? r.type ?? null,
    stage: r.stage,
    contactName: r.contact_name ?? null,
    contactPhone: r.contact_phone ?? null,
    lat: r.latitude ?? null,
    lon: r.longitude ?? null,
    firstNote: firstNote.get(r.id) ?? null,
    lastNoteBy: lastNote.get(r.id)?.by ?? null,
    lastNoteAt: lastNote.get(r.id)?.at ?? null,
  }));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <AdminNav current="roadshow" pendingReports={pendingReports ?? 0} />

        {agents.length > 1 && (
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Tournées par personne">
            <Link
              href={lien({ agent: 'tous' })}
              className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                agentChoisi === null
                  ? 'border-brass bg-brass/10 text-brass'
                  : 'hairline text-bone-dim hover:border-white/30'
              }`}
            >
              Toute l&rsquo;équipe
            </Link>
            {agents.map((a) => {
              const n = toutes.filter(
                (r: any) => (r.owner_email ?? '').toLowerCase() === a
              ).length;
              const on = agentChoisi === a;
              return (
                <Link
                  key={a}
                  href={lien({ agent: a })}
                  className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                    on ? 'border-brass bg-brass/10 text-brass' : 'hairline text-bone-dim hover:border-white/30'
                  }`}
                >
                  {titreAgent(a)}
                  <span className="ml-2 text-bone-faint">{n}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {days.length === 0 ? (
          <p className="mt-10 rounded-2xl border hairline px-5 py-12 text-center text-sm text-bone-faint">
            {agentChoisi
              ? `Aucune journée de tournée pour ${nomAgent(agentChoisi)}.`
              : 'Aucune journée de tournée.'}{' '}
            Depuis la fiche d&rsquo;un lieu, donne-lui une date de tournée et un responsable,
            et elle apparaîtra ici.
          </p>
        ) : (
          <>
            {/* Les secteurs (arrondissements, villes). */}
            <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Secteurs de tournée">
              {days.map((d) => {
                const duSecteur = rows.filter((r: any) => secteurDe(r) === d);
                const n = duSecteur.length;
                const done = duSecteur.filter((r: any) => r.stage !== 'prospect').length;
                const on = d === selected;
                return (
                  <Link
                    key={d}
                    href={lien(agentChoisi ? { secteur: d, agent: agentChoisi } : { secteur: d, agent: 'tous' })}
                    className={`min-h-[56px] shrink-0 rounded-xl border px-4 py-2 text-left transition-colors ${
                      on ? 'border-brass bg-brass/10' : 'hairline hover:border-white/30'
                    }`}
                  >
                    <span className={`block text-sm ${on ? 'text-brass' : 'text-bone'}`}>
                      {d}
                    </span>
                    <span className="block text-[11px] text-bone-faint">
                      {done}/{n}
                      {duSecteur.some((r: any) => String(r.roadshow_date) === todayKey)
                        ? " · aujourd'hui"
                        : ''}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <h1 className="mt-5 font-display text-3xl italic text-bone">{labelFor(selected!)}</h1>
            <p className="mt-1 text-sm text-bone-dim">
              {dayRows.length} lieu{dayRows.length > 1 ? 'x' : ''} · {dayRows.filter((r: any) => r.stage !== 'prospect').length} visité{dayRows.filter((r: any) => r.stage !== 'prospect').length > 1 ? 's' : ''}
            </p>

            {/* La cle vaut la journee : sans elle, React garde le meme
                composant d'un jour a l'autre, et son etat initial avec — on
                changeait de date et la liste comme la carte restaient sur la
                journee precedente. */}
            <RoadshowDay
              key={selected!}
              stops={stops}
              setStageAction={setStage}
              addNoteAction={addNote}
              me={me}
              jour={selected!}
            />

            <p className="mt-10 border-t hairline pt-4 text-xs leading-relaxed text-bone-faint">
              Ce que tu coches ici est écrit dans le pipeline, et ce que Julien coche, tu le vois.
              Les lieux sont rangés par secteur, d&rsquo;après leur adresse. Pour sortir un lieu
              de la tournée, ouvre sa fiche et efface sa date de tournée.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
