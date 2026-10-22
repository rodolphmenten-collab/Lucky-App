import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { subscriptionStatusLabel } from '@/lib/billing';
import {
  ACTIVE_STAGES,
  STAGE_SHORT,
  SOURCE_LABELS,
  computeFounderKpis,
  daysUntil,
  formatEuros,
  isStage,
  planMonthlyCents,
  roiRatio,
  toDateKey,
} from '@/lib/crm';
import { AdminNav } from '@/components/admin/AdminNav';
import { PipelineBoard, type BoardCard } from '@/components/admin/PipelineBoard';
import { QuickAddVenue } from '@/components/admin/QuickAddVenue';
import { setStage, quickAddVenue, deleteCrmVenue } from './actions';

export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 30;

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <p className="font-display text-2xl italic text-bone">Accès non autorisé.</p>
        <p className="mt-3 text-sm text-bone-dim">
          Ce compte ne fait pas partie de l&rsquo;équipe admin Lucky.
        </p>
      </main>
    );
  }

  const me = (user.email ?? '').toLowerCase();
  const service = createServiceClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: crm },
    { data: venues },
    { count: userCount },
    { count: activeCheckIns },
    { data: orders },
    { count: meetupsConfirmed },
    { count: pendingReports },
  ] = await Promise.all([
    service
      .from('crm_venues')
      // `*` et pas une liste de colonnes : une colonne ajoutee par une
      // migration pas encore passee ne doit pas faire disparaitre les 133
      // lignes du pipeline. Les champs absents retombent simplement sur null.
      .select('*')
      .order('updated_at', { ascending: false }),
    service
      .from('venues')
      .select('id, slug, name, plan, subscription_status, trial_ends_at, created_at'),
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .in('presence_status', ['verified_now', 'recently_verified']),
    service
      .from('lucky_orders')
      .select('price_cents, net_price_cents, status')
      .gte('created_at', since),
    service
      .from('meetups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('confirmed_at', since),
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const crmRows = crm ?? [];
  const venueRows = venues ?? [];
  // Typé explicitement : sans cela TypeScript infère `{}` pour les valeurs et
  // perd subscription_status et trial_ends_at au moment de la lecture.
  const venueById = new Map<string, any>((venueRows ?? []).map((v: any) => [v.id as string, v]));

  const kpis = computeFounderKpis(venueRows as any, crmRows as any);

  // CA généré pour les lieux : uniquement les bons réellement servis, remise déduite.
  const served = (orders ?? []).filter((o: any) => o.status === 'served');
  const revenueGeneratedCents = served.reduce(
    (sum: number, o: any) => sum + (o.net_price_cents ?? o.price_cents ?? 0),
    0
  );
  const roi = roiRatio(revenueGeneratedCents, kpis.mrrCents);

  const todayKey = toDateKey(new Date());
  const dueRows = crmRows
    .filter((c: any) => c.stage !== 'perdu' && c.next_action_at && c.next_action_at <= todayKey)
    .sort((a: any, b: any) => (a.next_action_at < b.next_action_at ? -1 : 1));

  // Le board est un composant client : on lui passe des lignes simples,
  // deja fusionnees avec l'etat d'abonnement du lieu quand il existe.
  // Nom du groupe parent, resolu une fois pour toutes plutot qu'une requete
  // par carte.
  const nomParGroupe = new Map<string, string>(
    crmRows.filter((c: any) => c.is_group).map((c: any) => [c.id as string, c.name as string])
  );

  const cards: BoardCard[] = crmRows.map((c: any) => {
    const v = c.venue_id ? venueById.get(c.venue_id) : null;
    return {
      id: c.id,
      venueId: c.venue_id ?? null,
      name: c.name,
      city: c.city ?? null,
      type: c.type ?? null,
      source: c.source ?? null,
      contactName: c.contact_name ?? null,
      contactPhone: c.contact_phone ?? null,
      country: c.country ?? null,
      category: c.category ?? null,
      ownerEmail: c.owner_email ?? null,
      expectedPlan: c.expected_plan ?? null,
      stage: c.stage,
      nextAction: c.next_action ?? null,
      nextActionAt: c.next_action_at ?? null,
      subscriptionStatus: v?.subscription_status ?? null,
      isGroup: !!c.is_group,
      isTest: !!c.is_test,
      groupName: c.group_id ? (nomParGroupe.get(c.group_id) ?? null) : null,
    };
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <AdminNav current="pipeline" pendingReports={pendingReports ?? 0} />

        {/* ------------------------------------------------------------------
            Cockpit. Ce qui est facturé en haut, ce qui est probable en dessous,
            jamais additionné.
        ------------------------------------------------------------------ */}
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            label="MRR"
            value={formatEuros(kpis.mrrCents)}
            sub={`${kpis.payingVenues} lieu${kpis.payingVenues > 1 ? 'x' : ''} payant${kpis.payingVenues > 1 ? 's' : ''} · ${formatEuros(kpis.arrCents)} ARR`}
            tone="strong"
          />
          <Kpi
            label="Essais en cours"
            value={formatEuros(kpis.trialMrrCents)}
            sub={
              kpis.trialVenues === 0
                ? 'Aucun essai'
                : `${kpis.trialVenues} lieu${kpis.trialVenues > 1 ? 'x' : ''}${kpis.trialsEndingIn7Days > 0 ? ` · ${kpis.trialsEndingIn7Days} se termine${kpis.trialsEndingIn7Days > 1 ? 'nt' : ''} sous 7 j` : ''}`
            }
            tone={kpis.trialsEndingIn7Days > 0 ? 'warn' : 'default'}
          />
          <Kpi
            label={`CA généré pour les lieux · ${WINDOW_DAYS} j`}
            value={formatEuros(revenueGeneratedCents)}
            sub={
              roi === null
                ? `${served.length} bon${served.length > 1 ? 's' : ''} servi${served.length > 1 ? 's' : ''}`
                : `${roi.toFixed(1)} € générés pour 1 € d'abonnement`
            }
            tone="strong"
          />
          <Kpi
            label="Pipeline pondéré"
            value={formatEuros(kpis.weightedPipelineMrrCents)}
            sub={`${kpis.pipelineVenues} lieu${kpis.pipelineVenues > 1 ? 'x' : ''} ouverts · ${formatEuros(kpis.pipelineMrrCents)} brut`}
          />
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi small label="Rencontres confirmées" value={String(meetupsConfirmed ?? 0)} sub={`${WINDOW_DAYS} derniers jours`} />
          <Kpi small label="Présences en ce moment" value={String(activeCheckIns ?? 0)} />
          <Kpi small label="Utilisateurs" value={String(userCount ?? 0)} />
          <Kpi
            small
            label="À régler"
            value={String(kpis.pastDueVenues + kpis.signedNotBilled)}
            sub={
              [
                kpis.pastDueVenues > 0 ? `${kpis.pastDueVenues} impayé${kpis.pastDueVenues > 1 ? 's' : ''}` : null,
                kpis.signedNotBilled > 0 ? `${kpis.signedNotBilled} signé${kpis.signedNotBilled > 1 ? 's' : ''} non facturé${kpis.signedNotBilled > 1 ? 's' : ''}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Rien en souffrance'
            }
            tone={kpis.pastDueVenues > 0 ? 'alert' : 'default'}
          />
        </section>

        {/* ------------------------------------------------------------------
            Les relances dues. Première chose qu'on regarde le matin.
        ------------------------------------------------------------------ */}
        {dueRows.length > 0 && (
          <section className="mt-8 rounded-2xl border border-brass/40 bg-brass/5 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
              À faire {kpis.actionsOverdue > 0 && `· ${kpis.actionsOverdue} en retard`}
            </p>
            <ul className="mt-3 space-y-2">
              {dueRows.slice(0, 8).map((c: any) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Link href={`/admin/crm/${c.id}`} className="text-bone underline decoration-brass/40">
                    {c.name}
                  </Link>
                  <span className="text-bone-dim">{c.next_action}</span>
                  <span
                    className={`font-mono text-[11px] ${c.next_action_at < todayKey ? 'text-red-400' : 'text-bone-faint'}`}
                  >
                    {new Date(c.next_action_at).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ------------------------------------------------------------------
            Pipeline en colonnes. Le detail du glisser-deposer est dans
            PipelineBoard : il doit marcher au doigt, donc rien de natif.
        ------------------------------------------------------------------ */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl italic text-bone">Pipeline</h2>
          <QuickAddVenue action={quickAddVenue} defaultOwner={me} />
        </div>

        <PipelineBoard
          cards={cards}
          setStageAction={setStage}
          deleteAction={deleteCrmVenue}
          me={me}
        />

      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = 'default',
  small = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'strong' | 'warn' | 'alert';
  small?: boolean;
}) {
  const border =
    tone === 'strong'
      ? 'border-brass/40'
      : tone === 'alert'
        ? 'border-red-400/40'
        : tone === 'warn'
          ? 'border-brass/25'
          : 'hairline';
  return (
    <div className={`rounded-2xl border ${border} p-4 sm:p-5`}>
      <p className="text-[11px] leading-tight text-bone-faint">{label}</p>
      <p className={`mt-2 font-display text-bone ${small ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-tight text-bone-dim">{sub}</p>}
    </div>
  );
}

