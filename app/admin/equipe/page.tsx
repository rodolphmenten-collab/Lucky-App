import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';
import LigneAdmin from '@/components/admin/LigneAdmin';
import { addAdmin } from '../actions';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  'deja-membre': 'Cette adresse est déjà dans l’équipe.',
  'compte-existant': 'Un autre compte Lucky utilise déjà cette adresse.',
  auth: 'Le compte de connexion n’a pas pu être modifié. Rien n’a changé.',
};

export default async function EquipePage({
  searchParams,
}: {
  searchParams?: { err?: string; ok?: string };
}) {
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

        {searchParams?.err && (
          <p className="mt-4 rounded-2xl border border-red-400/40 bg-red-400/5 px-5 py-3 text-sm text-red-300">
            {MESSAGES[searchParams.err] ?? 'La modification n’a pas abouti.'}
          </p>
        )}
        {searchParams?.ok && (
          <p className="mt-4 rounded-2xl border border-brass/40 bg-brass/5 px-5 py-3 text-sm text-bone">
            Adresse mise à jour : connexion, accès au back-office, lieux et notes suivent.
          </p>
        )}

        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(admins ?? []).map((a: any) => (
            <LigneAdmin
              key={a.id}
              admin={a}
              estMoi={a.email.toLowerCase() === user.email?.toLowerCase()}
            />
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
