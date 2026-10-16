import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import { reviewReport, dismissReport } from '../actions';

export const dynamic = 'force-dynamic';

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

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <AdminNav current="moderation" pendingReports={reports?.length ?? 0} />
        <h1 className="mt-8 font-display text-2xl italic text-bone">Signalements en attente</h1>

        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(reports ?? []).map((r: any) => (
            <form key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <input type="hidden" name="reportId" value={r.id} />
              <div>
                <p className="text-sm text-bone">{r.reason}</p>
                {r.details && <p className="mt-1 text-xs text-bone-dim">{r.details}</p>}
                <p className="mt-1 font-mono text-[11px] text-bone-faint">
                  {new Date(r.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  formAction={dismissReport}
                  className="min-h-[44px] rounded-full border hairline px-4 text-[11px] text-bone-dim"
                >
                  Ignorer
                </button>
                <button
                  formAction={reviewReport}
                  className="min-h-[44px] rounded-full border border-brass/50 px-4 text-[11px] text-brass"
                >
                  Marquer comme traité
                </button>
              </div>
            </form>
          ))}
          {(!reports || reports.length === 0) && (
            <p className="px-5 py-8 text-center text-sm text-bone-faint">Aucun signalement en attente.</p>
          )}
        </div>
      </div>
    </main>
  );
}
