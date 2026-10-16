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
  searchParams?: { jour?: string };
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
      .select(
        'id, name, address, city, category, type, stage, contact_name, contact_phone, latitude, longitude, roadshow_date, roadshow_label'
      )
      .not('roadshow_date', 'is', null)
      .order('roadshow_date', { ascending: true })
      .order('city', { ascending: true })
      .order('name', { ascending: true }),
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Le select est assez large pour que l'inference de Supabase abandonne ;
  // on type la ligne nous-memes plutot que de propager des `unknown`.
  const rows: any[] = (all as any[] | null) ?? [];

  // Une journée = une date. Le libellé vient des lieux eux-mêmes, donc
  // déplacer un lieu d'un jour à l'autre suffit à réorganiser la tournée.
  const days: string[] = Array.from(
    new Set(rows.map((r: any) => String(r.roadshow_date)))
  ).sort();
  const labelFor = (d: string): string =>
    (rows.find((r: any) => r.roadshow_date === d && r.roadshow_label)?.roadshow_label as
      | string
      | undefined) ??
    [...new Set(rows.filter((r: any) => r.roadshow_date === d).map((r: any) => String(r.city ?? '')))]
      .filter(Boolean)
      .join(', ');

  const todayKey = new Date().toISOString().slice(0, 10);
  const selected: string | null =
    (searchParams?.jour && days.includes(searchParams.jour) ? searchParams.jour : null) ??
    days.find((d) => d >= todayKey) ??
    days[days.length - 1] ??
    null;

  const dayRows = rows.filter((r: any) => r.roadshow_date === selected);

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

        {days.length === 0 ? (
          <p className="mt-10 rounded-2xl border hairline px-5 py-12 text-center text-sm text-bone-faint">
            Aucune journée de tournée. Depuis la fiche d&rsquo;un lieu, donne-lui une date de
            tournée et elle apparaîtra ici.
          </p>
        ) : (
          <>
            {/* Les journées. Celle du jour, ou la prochaine, est ouverte d'office. */}
            <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Journées de tournée">
              {days.map((d) => {
                const n = rows.filter((r: any) => r.roadshow_date === d).length;
                const done = rows.filter(
                  (r: any) => r.roadshow_date === d && r.stage !== 'prospect'
                ).length;
                const on = d === selected;
                return (
                  <Link
                    key={d}
                    href={`/admin/roadshow?jour=${d}`}
                    className={`min-h-[56px] shrink-0 rounded-xl border px-4 py-2 text-left transition-colors ${
                      on ? 'border-brass bg-brass/10' : 'hairline hover:border-white/30'
                    }`}
                  >
                    <span className={`block text-sm ${on ? 'text-brass' : 'text-bone'}`}>
                      {new Date(d).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="block text-[11px] text-bone-faint">
                      {done}/{n}
                      {d === todayKey ? " · aujourd'hui" : ''}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <h1 className="mt-5 font-display text-3xl italic text-bone">{labelFor(selected!)}</h1>
            <p className="mt-1 text-sm text-bone-dim">
              {new Date(selected!).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            <RoadshowDay
              stops={stops}
              setStageAction={setStage}
              addNoteAction={addNote}
              me={me}
            />

            <p className="mt-10 border-t hairline pt-4 text-xs leading-relaxed text-bone-faint">
              Ce que tu coches ici est écrit dans le pipeline, et ce que Julien coche, tu le vois.
              Pour sortir un lieu de la tournée ou le déplacer d&rsquo;un jour à l&rsquo;autre,
              ouvre sa fiche et change sa date de tournée.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
