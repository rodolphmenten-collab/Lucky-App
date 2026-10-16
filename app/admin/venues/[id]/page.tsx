import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * L'ancienne fiche établissement a fusionné avec la fiche du pipeline : un
 * lieu n'a plus qu'une page, du prospect au client qui paie.
 *
 * Cette route reste, et redirige. Les liens déjà envoyés, les favoris et les
 * anciens signets continuent de tomber au bon endroit.
 */
export default async function LegacyVenuePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();
  const { data: crm } = await service
    .from('crm_venues')
    .select('id')
    .eq('venue_id', params.id)
    .maybeSingle();

  if (crm?.id) redirect(`/admin/crm/${crm.id}`);

  // Un établissement sans fiche CRM ne devrait plus exister (la migration les
  // a tous repris), mais plutôt que de tomber sur une page blanche, on en crée
  // une à la volée.
  const { data: venue } = await service
    .from('venues')
    .select('id, name, city, type, plan, contact_name, contact_email, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!venue) notFound();

  const { data: created } = await service
    .from('crm_venues')
    .insert({
      venue_id: venue.id,
      name: venue.name,
      city: venue.city,
      type: venue.type,
      contact_name: venue.contact_name,
      contact_email: venue.contact_email,
      stage: 'signe',
      source: 'existant',
      expected_plan: venue.plan,
    })
    .select('id')
    .maybeSingle();

  redirect(created?.id ? `/admin/crm/${created.id}` : '/admin/etablissements');
}
