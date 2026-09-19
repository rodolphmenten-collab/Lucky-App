import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { getAdminViewingVenueId } from '@/lib/adminViewing';
import { MenuEditor } from './MenuEditor';

export default async function DashboardMenuPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/carte');

  const viewingVenueId = getAdminViewingVenueId();
  const isAdmin = await isPlatformAdminEmail(user.email);
  const service = createServiceClient();

  let venue: { id: string; name: string; perk_label: string | null; average_ticket_cents: number | null } | null =
    null;

  if (viewingVenueId && isAdmin) {
    const { data } = await service
      .from('venues')
      .select('id, name, perk_label, average_ticket_cents')
      .eq('id', viewingVenueId)
      .maybeSingle();
    venue = data;
  } else {
    const { data: adminRows } = await supabase
      .from('venue_admins')
      .select('venue_id, venues(id, name, perk_label, average_ticket_cents)')
      .eq('user_id', user.id);

    if (!adminRows || adminRows.length === 0) redirect('/dashboard');

    venue = searchParams.venue
      ? ((adminRows.find((r: any) => r.venues.id === searchParams.venue) as any)?.venues ?? null)
      : ((adminRows[0] as any).venues ?? null);
  }

  if (!venue) notFound();

  const { data: items } = await service
    .from('venue_menu_items')
    .select('id, name, price_cents, category, sort_order')
    .eq('venue_id', venue.id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return <MenuEditor venue={venue} initialItems={items ?? []} />;
}
