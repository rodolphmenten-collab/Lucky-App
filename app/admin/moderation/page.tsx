import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import { reviewReport, dismissReport } from '../actions';
import { ReportCard } from './ReportCard';
import { SuspendedList } from './SuspendedList';

export const dynamic = 'force-dynamic';

const MOTIFS: Record<string, string> = {
  inappropriate: 'Comportement inapproprié',
  harassment: 'Harcèlement ou insultes',
  fake: 'Faux profil',
  other: 'Autre',
};

export default async function ModerationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();
  const { data: reports } = await service
    .from('reports')
    .select('id, reason, details, status, created_at, reporter_id, reported_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  // On va chercher les profils en une fois : sans les noms et les photos,
  // l'écran ne permet pas de décider, il permet seulement de classer.
  const ids = Array.from(
    new Set((reports ?? []).flatMap((r: any) => [r.reported_id, r.reporter_id]).filter(Boolean))
  );
  const { data: profils } = ids.length
    ? await service
        .from('profiles')
        .select('id, first_name, age, city, job, photo_url, suspended_at')
        .in('id', ids)
    : { data: [] as any[] };
  const parId = new Map<string, any>((profils ?? []).map((p: any) => [p.id, p]));

  // Combien de fois ce compte a déjà été signalé : la récidive change la
  // sanction, et c'est l'information qui manquait le plus pour trancher.
  const { data: tousSignalements } = ids.length
    ? await service.from('reports').select('reported_id').in('reported_id', ids)
    : { data: [] as any[] };
  const compte = new Map<string, number>();
  for (const r of tousSignalements ?? []) {
    compte.set(r.reported_id, (compte.get(r.reported_id) ?? 0) + 1);
  }

  const { data: suspendus } = await service
    .from('profiles')
    .select('id, first_name, city, photo_url, suspended_at, suspended_reason, suspended_by')
    .not('suspended_at', 'is', null)
    .order('suspended_at', { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <AdminNav current="moderation" pendingReports={reports?.length ?? 0} />
        <h1 className="mt-8 font-display text-2xl italic text-bone">Signalements en attente</h1>
        <p className="mt-2 text-xs leading-relaxed text-bone-faint">
          Le blocage entre les deux personnes est déjà actif : il s&rsquo;applique au moment du
          signalement, sans attendre cet écran. Ce qui se décide ici, c&rsquo;est la sanction.
        </p>

        <div className="mt-4 space-y-3">
          {(reports ?? []).map((r: any) => (
            <ReportCard
              key={r.id}
              id={r.id}
              motif={MOTIFS[r.reason] ?? r.reason}
              details={r.details}
              createdAt={r.created_at}
              signale={parId.get(r.reported_id) ?? null}
              signalePar={parId.get(r.reporter_id) ?? null}
              signalements={compte.get(r.reported_id) ?? 1}
              reviewAction={reviewReport}
              dismissAction={dismissReport}
            />
          ))}
          {(!reports || reports.length === 0) && (
            <p className="rounded-2xl border hairline px-5 py-8 text-center text-sm text-bone-faint">
              Aucun signalement en attente.
            </p>
          )}
        </div>

        <SuspendedList comptes={suspendus ?? []} />
      </div>
    </main>
  );
}
