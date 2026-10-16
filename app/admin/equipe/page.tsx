import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import { addAdmin, removeAdmin } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EquipePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();
  const [{ data: admins }, { count: pendingReports }] = await Promise.all([
    service.from('platform_admins').select('id, email, added_at').order('added_at', { ascending: true }),
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <AdminNav current="equipe" pendingReports={pendingReports ?? 0} />
        <h1 className="mt-8 font-display text-2xl italic text-bone">Équipe</h1>
        <p className="mt-2 text-xs text-bone-faint">
          Toute personne listée ici accède au back-office et au pipeline, et peut être
          désignée comme responsable d&rsquo;un lieu.
        </p>

        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(admins ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-bone">{a.email}</p>
                <p className="mt-0.5 font-mono text-[11px] text-bone-faint">
                  Ajouté le {new Date(a.added_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {a.email.toLowerCase() !== user.email?.toLowerCase() && (
                <form action={removeAdmin}>
                  <input type="hidden" name="adminId" value={a.id} />
                  <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                    Retirer
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <form action={addAdmin} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="collegue@lucky-app.io"
            className="min-h-[48px] flex-1 rounded-full border hairline bg-transparent px-5 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            Ajouter
          </button>
        </form>
      </div>
    </main>
  );
}
