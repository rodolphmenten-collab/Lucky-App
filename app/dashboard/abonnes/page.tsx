import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { getAdminViewingVenueId } from '@/lib/adminViewing';
import { ExportAbonnes } from './ExportAbonnes';

export const dynamic = 'force-dynamic';

/**
 * Les personnes qui ont accepté de recevoir les actualités de CE lieu.
 *
 * La liste n'est pas une base d'utilisateurs Lucky : elle ne contient que ceux
 * qui ont explicitement coché la case nommant cet établissement, et elle se
 * vide d'elle-même quand ils se retirent.
 */
export default async function AbonnesPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/venue-login?next=/dashboard/abonnes');

  // Un administrateur de la plateforme qui visualise un lieu n'est pas, lui,
  // dans venue_admins : sans ce cas, l'écran lui répondrait introuvable au
  // moment précis où il veut montrer la fonctionnalité.
  const vuAdmin = getAdminViewingVenueId();
  const estAdminPlateforme = await isPlatformAdminEmail(user.email);

  let venue: { id: string; name: string } | null = null;
  let abonnes: any[] | null = null;

  if (vuAdmin && estAdminPlateforme) {
    const service = createServiceClient();
    const { data: v } = await service
      .from('venues')
      .select('id, name')
      .eq('id', vuAdmin)
      .maybeSingle();
    if (!v) notFound();
    venue = v;

    const { data } = await service
      .from('venue_follows')
      .select('consented_at, user_id')
      .eq('venue_id', v.id)
      .is('withdrawn_at', null)
      .order('consented_at', { ascending: false });

    // En visualisation, on affiche le volume et les dates mais pas les
    // adresses : la liste appartient au lieu, pas à la plateforme.
    abonnes = (data ?? []).map((a: any) => ({
      first_name: '—',
      email: 'masqué en visualisation',
      consented_at: a.consented_at,
    }));
  } else {
    const { data: liens } = await supabase
      .from('venue_admins')
      .select('venue_id, venues(id, name)')
      .eq('user_id', user.id);
    if (!liens || liens.length === 0) notFound();

    const lien = searchParams.venue
      ? liens.find((l: any) => l.venue_id === searchParams.venue)
      : liens[0];
    if (!lien) notFound();
    venue = (lien as any).venues;

    // Appel avec le client de l'utilisateur, et non le client de service : la
    // fonction lit l'identité de l'appelant pour vérifier qu'il administre bien
    // ce lieu avant de joindre les e-mails.
    const { data } = await supabase.rpc('venue_followers', { p_venue_id: venue!.id });
    abonnes = data;
  }

  if (!venue) notFound();
  const enVisualisation = Boolean(vuAdmin && estAdminPlateforme);

  const lignes: { prenom: string; email: string; date: string }[] = (abonnes ?? []).map(
    (a: any) => ({ prenom: a.first_name ?? '', email: a.email ?? '', date: a.consented_at })
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard?venue=${venue.id}`}
          className="font-mono text-xs uppercase tracking-[0.2em] text-brass"
        >
          ← {venue.name}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl italic text-bone">Vos abonnés</h1>
            <p className="mt-2 text-sm text-bone-dim">
              {lignes.length === 0
                ? "Personne n'a encore accepté de recevoir vos actualités."
                : `${lignes.length} personne${lignes.length > 1 ? 's' : ''} ont accepté de recevoir vos actualités.`}
            </p>
          </div>
          {lignes.length > 0 && !enVisualisation && (
            <ExportAbonnes venueId={venue.id} venueName={venue.name} />
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-brass/30 bg-brass/5 p-5">
          <p className="text-sm leading-relaxed text-bone-dim">
            Ces personnes vous ont donné leur accord à vous, en vous nommant. Dès que vous
            exportez cette liste, vous en devenez responsable : n&rsquo;écrivez que sur vos
            actualités, prévoyez un lien de désinscription dans chaque envoi, et retirez de vos
            envois toute personne qui disparaît de cette liste.
          </p>
        </div>

        {lignes.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border hairline">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-800">
                <tr className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  <th className="px-5 py-3">Prénom</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Accord donné le</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={`${l.email}-${i}`} className="border-t hairline">
                    <td className="px-5 py-3 text-bone">{l.prenom}</td>
                    <td className="px-5 py-3 text-bone-dim">{l.email}</td>
                    <td className="px-5 py-3 text-bone-faint">
                      {new Date(l.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
