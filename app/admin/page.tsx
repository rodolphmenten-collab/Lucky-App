import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { createVenueRecord } from '@/lib/venues';

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  if (!isPlatformAdminEmail(user.email)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <p className="font-display text-2xl italic text-bone">Not authorized.</p>
        <p className="mt-3 text-sm text-bone-dim">
          This account isn&rsquo;t in ADMIN_EMAILS. Add it to your environment variables to
          get access to the back-office.
        </p>
      </main>
    );
  }

  // Service role: admin overview needs to see across every venue, bypassing RLS.
  const service = createServiceClient();

  const [
    { count: venueCount },
    { count: userCount },
    { count: activeCheckIns },
    { data: reports },
    { data: venues },
    { data: leads },
  ] =
    await Promise.all([
      service.from('venues').select('*', { count: 'exact', head: true }),
      service.from('profiles').select('*', { count: 'exact', head: true }),
      service
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .in('presence_status', ['verified_now', 'recently_verified']),
      service
        .from('reports')
        .select('id, reason, details, status, created_at, reporter_id, reported_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20),
      service.from('venues').select('id, slug, name, city, type, plan, created_at').order('created_at', { ascending: false }),
      service
        .from('venue_leads')
        .select('id, contact_name, contact_email, venue_name, venue_city, venue_type, plan_interest, message, status, created_at')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Admin</p>
        <h1 className="mt-2 font-display text-3xl italic text-bone">Back-office</h1>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard label="Venues" value={venueCount ?? 0} />
          <StatCard label="Users" value={userCount ?? 0} />
          <StatCard label="Active check-ins" value={activeCheckIns ?? 0} />
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="font-display text-xl italic text-bone">Venues</h2>
          <Link
            href="/admin/venues/new"
            className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-white/30"
          >
            + New venue
          </Link>
        </div>

        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(venues ?? []).map((v: any) => (
            <div key={v.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-bone">{v.name}</p>
                <p className="font-mono text-[11px] text-bone-faint">
                  {v.city} · {v.type} · {v.plan} · /venue/{v.slug}
                </p>
              </div>
              <Link href={`/admin/venues/${v.id}`} className="text-xs text-brass underline">
                Edit
              </Link>
            </div>
          ))}
          {(!venues || venues.length === 0) && (
            <p className="px-5 py-6 text-center text-sm text-bone-faint">No venues yet.</p>
          )}
        </div>

        <h2 className="mt-12 font-display text-xl italic text-bone">New venue requests</h2>
        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(leads ?? []).map((l: any) => (
            <form key={l.id} action={allowLeadAccess} className="flex items-center justify-between gap-4 px-5 py-4">
              <input type="hidden" name="leadId" value={l.id} />
              <div>
                <p className="text-sm text-bone">
                  {l.venue_name} {l.venue_city ? `— ${l.venue_city}` : ''}
                </p>
                <p className="mt-1 text-xs text-bone-dim">
                  {l.contact_name} · {l.contact_email} · {l.venue_type ?? 'n/a'} · plan: {l.plan_interest ?? 'n/a'}
                </p>
                {l.message && <p className="mt-1 text-xs text-bone-faint">{l.message}</p>}
                <p className="mt-1 font-mono text-[11px] text-bone-faint">
                  {new Date(l.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-bone px-4 py-2 text-[11px] font-medium text-ink hover:bg-brass-bright"
              >
                Allow access
              </button>
            </form>
          ))}
          {(!leads || leads.length === 0) && (
            <p className="px-5 py-6 text-center text-sm text-bone-faint">No pending requests.</p>
          )}
        </div>

        <h2 className="mt-12 font-display text-xl italic text-bone">Pending reports</h2>
        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(reports ?? []).map((r: any) => (
            <form key={r.id} action={reviewReport} className="flex items-center justify-between gap-4 px-5 py-4">
              <input type="hidden" name="reportId" value={r.id} />
              <div>
                <p className="text-sm text-bone">{r.reason}</p>
                {r.details && <p className="mt-1 text-xs text-bone-dim">{r.details}</p>}
                <p className="mt-1 font-mono text-[11px] text-bone-faint">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  formAction={dismissReport}
                  className="rounded-full border hairline px-3 py-1.5 text-[11px] text-bone-dim"
                >
                  Dismiss
                </button>
                <button
                  formAction={reviewReport}
                  className="rounded-full border border-brass/50 px-3 py-1.5 text-[11px] text-brass"
                >
                  Mark reviewed
                </button>
              </div>
            </form>
          ))}
          {(!reports || reports.length === 0) && (
            <p className="px-5 py-6 text-center text-sm text-bone-faint">No pending reports.</p>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border hairline p-5">
      <p className="font-display text-3xl text-bone">{value}</p>
      <p className="mt-1 text-xs text-bone-faint">{label}</p>
    </div>
  );
}

async function reviewReport(formData: FormData) {
  'use server';
  const id = formData.get('reportId') as string;
  const service = createServiceClient();
  await service.from('reports').update({ status: 'reviewed' }).eq('id', id);
  revalidatePath('/admin');
}

async function dismissReport(formData: FormData) {
  'use server';
  const id = formData.get('reportId') as string;
  const service = createServiceClient();
  await service.from('reports').update({ status: 'dismissed' }).eq('id', id);
  revalidatePath('/admin');
}

async function markLeadHandled(formData: FormData) {
  'use server';
  const id = formData.get('leadId') as string;
  const service = createServiceClient();
  await service.from('venue_leads').update({ status: 'handled' }).eq('id', id);
  revalidatePath('/admin');
}

async function allowLeadAccess(formData: FormData) {
  'use server';
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) return;

  const leadId = formData.get('leadId') as string;
  const service = createServiceClient();

  const { data: lead } = await service.from('venue_leads').select('*').eq('id', leadId).maybeSingle();
  if (!lead) return;

  const { data: venue, error: venueError } = await createVenueRecord(service, {
    name: lead.venue_name,
    city: lead.venue_city,
    type: lead.venue_type,
    plan: lead.plan_interest,
  });

  if (venueError || !venue) return;

  // Find or create the contact's account, then ALWAYS trigger a sign-in email —
  // whether they're brand new or already had a personal account (e.g. from testing
  // the consumer app themselves). This guarantees they're notified either way.
  const { data: userList } = await service.auth.admin.listUsers();
  let userId = userList?.users?.find((u: any) => u.email?.toLowerCase() === lead.contact_email.toLowerCase())?.id;

  if (!userId) {
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email: lead.contact_email,
      email_confirm: true,
    });
    if (createError) return;
    userId = created?.user?.id;
  }

  if (userId) {
    await service.from('venue_admins').insert({ venue_id: venue.id, user_id: userId, role: 'owner' });
  }

  // Send the actual notification email (magic-link sign-in), via whatever SMTP
  // provider is configured in Supabase (Resend, in this project's case).
  await service.auth.signInWithOtp({
    email: lead.contact_email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    },
  });

  await service.from('venue_leads').update({ status: 'handled' }).eq('id', leadId);
  revalidatePath('/admin');
}
