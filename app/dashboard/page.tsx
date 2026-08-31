import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { getAdminViewingVenueId } from '@/lib/adminViewing';
import { DashboardView } from './DashboardView';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const viewingVenueId = getAdminViewingVenueId();
  const isAdmin = await isPlatformAdminEmail(user.email);

  if (viewingVenueId && isAdmin) {
    const service = createServiceClient();
    const { data: venue } = await service
      .from('venues')
      .select('id, slug, name, city, plan')
      .eq('id', viewingVenueId)
      .maybeSingle();

    if (!venue) {
      return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
          <p className="font-display text-2xl italic text-bone">Établissement introuvable.</p>
        </main>
      );
    }

    const { data: stats } = await service.rpc('venue_dashboard_stats', { p_venue_id: venue.id }).maybeSingle();

    return <DashboardView venue={venue} stats={stats as any} venues={[venue]} isAdminViewing />;
  }

  const { data: adminRows } = await supabase
    .from('venue_admins')
    .select('venue_id, role, venues(id, slug, name, city, plan)')
    .eq('user_id', user.id);

  if (!adminRows || adminRows.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <p className="font-display text-2xl italic text-bone">No venue linked to this account.</p>
        <p className="mt-3 text-sm text-bone-dim">
          Ask your Here contact to add you as a venue admin, or seed a demo venue_admins
          row pointing at your user id for testing.
        </p>
      </main>
    );
  }

  const venue = (adminRows[0] as any).venues;
  const { data: stats } = await supabase.rpc('venue_dashboard_stats', { p_venue_id: venue.id }).maybeSingle();

  return <DashboardView venue={venue} stats={stats as any} venues={adminRows.map((r: any) => r.venues)} />;
}
