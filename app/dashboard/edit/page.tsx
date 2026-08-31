import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { getAdminViewingVenueId } from '@/lib/adminViewing';
import { VenueEditForm } from './VenueEditForm';

export default async function DashboardEditPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/edit');

  const viewingVenueId = getAdminViewingVenueId();
  const isAdmin = await isPlatformAdminEmail(user.email);

  if (viewingVenueId && isAdmin) {
    const service = createServiceClient();
    const { data: venue } = await service.from('venues').select('*').eq('id', viewingVenueId).maybeSingle();
    if (!venue) notFound();
    return <VenueEditForm venue={venue} />;
  }

  const { data: adminRows } = await supabase
    .from('venue_admins')
    .select('venue_id, venues(*)')
    .eq('user_id', user.id);

  if (!adminRows || adminRows.length === 0) redirect('/dashboard');

  const venue = searchParams.venue
    ? (adminRows.find((r: any) => r.venues.id === searchParams.venue) as any)?.venues
    : (adminRows[0] as any).venues;

  if (!venue) notFound();

  return <VenueEditForm venue={venue} />;
}
