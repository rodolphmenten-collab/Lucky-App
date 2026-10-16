'use server';

/**
 * Actions du CRM. Toutes passent par le même contrôle : seul un platform admin
 * écrit, et le client service role n'est utilisé qu'après cette vérification.
 *
 * Chaque changement d'étape écrit aussi une ligne dans le journal. Le but n'est
 * pas la traçabilité pour la traçabilité : c'est que l'autre associé puisse
 * reprendre un lieu six semaines plus tard sans avoir à demander.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { isStage, stageLabel } from '@/lib/crm';
import { sendEmail, emailShell } from '@/lib/email';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) return null;
  return user;
}

function refresh(id?: string) {
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/crm/${id}`);
}

export async function setStage(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const id = formData.get('crmId') as string;
  const stage = formData.get('stage') as string;
  if (!id || !isStage(stage)) return;

  const service = createServiceClient();
  const { data: before } = await service.from('crm_venues').select('stage').eq('id', id).maybeSingle();
  if (before?.stage === stage) return;

  await service.from('crm_venues').update({ stage }).eq('id', id);
  await service.from('crm_notes').insert({
    crm_venue_id: id,
    author_email: user.email,
    body: `${stageLabel(before?.stage)} → ${stageLabel(stage)}`,
    stage_from: before?.stage ?? null,
    stage_to: stage,
  });

  refresh(id);
}

export async function addNote(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const id = formData.get('crmId') as string;
  const body = (formData.get('body') as string)?.trim();
  if (!id || !body) return;

  const service = createServiceClient();
  await service.from('crm_notes').insert({ crm_venue_id: id, author_email: user.email, body });
  // Une note est une preuve de vie : elle remonte la fiche dans le pipeline.
  await service.from('crm_venues').update({ updated_at: new Date().toISOString() }).eq('id', id);

  refresh(id);
}

export async function setNextAction(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const id = formData.get('crmId') as string;
  if (!id) return;

  const action = ((formData.get('next_action') as string) || '').trim();
  const date = ((formData.get('next_action_at') as string) || '').trim();

  const service = createServiceClient();
  await service
    .from('crm_venues')
    .update({ next_action: action || null, next_action_at: date || null })
    .eq('id', id);

  refresh(id);
}

export async function updateCrmVenue(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const id = formData.get('crmId') as string;
  if (!id) return;

  const text = (k: string) => ((formData.get(k) as string) || '').trim() || null;
  const tables = parseInt((formData.get('tables_count') as string) || '', 10);

  const service = createServiceClient();
  await service
    .from('crm_venues')
    .update({
      name: text('name') ?? undefined,
      city: text('city'),
      type: text('type'),
      address: text('address'),
      contact_name: text('contact_name'),
      contact_role: text('contact_role'),
      contact_email: text('contact_email'),
      contact_phone: text('contact_phone'),
      source: text('source'),
      expected_plan: text('expected_plan'),
      owner_email: text('owner_email'),
      tables_count: Number.isFinite(tables) ? tables : null,
      lost_reason: text('lost_reason'),
    })
    .eq('id', id);

  refresh(id);
}

/**
 * Suppression d'une fiche du pipeline.
 *
 * Garde-fou volontaire : on refuse de supprimer une fiche rattachee a un
 * etablissement reel. Ces fiches portent la facturation et l'historique d'un
 * client ; les effacer depuis le pipeline serait trop facile et irreversible.
 * Pour celles-la, il faut passer par la fiche etablissement.
 *
 * Les notes partent avec la fiche (cascade), ce qui est voulu : une fiche de
 * test ne doit pas laisser de trainee.
 */
export async function deleteCrmVenue(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const id = formData.get('crmId') as string;
  if (!id) return;

  const service = createServiceClient();
  const { data: row } = await service
    .from('crm_venues')
    .select('id, venue_id')
    .eq('id', id)
    .maybeSingle();

  if (!row || row.venue_id) return;

  await service.from('crm_venues').delete().eq('id', id);
  revalidatePath('/admin');
}

export async function quickAddVenue(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return;

  const name = ((formData.get('name') as string) || '').trim();
  if (!name) return;

  const service = createServiceClient();
  const { data } = await service
    .from('crm_venues')
    .insert({
      name,
      city: ((formData.get('city') as string) || '').trim() || null,
      contact_name: ((formData.get('contact_name') as string) || '').trim() || null,
      contact_phone: ((formData.get('contact_phone') as string) || '').trim() || null,
      source: ((formData.get('source') as string) || 'roadshow').trim(),
      stage: 'prospect',
      owner_email: user.email,
      created_by: user.email,
    })
    .select('id')
    .maybeSingle();

  revalidatePath('/admin');
  if (data?.id) redirect(`/admin/crm/${data.id}`);
}

// ---------------------------------------------------------------------------
// Actions historiques du back-office (invitations, équipe, signalements),
// déplacées ici quand /admin est devenu le pipeline.
// ---------------------------------------------------------------------------

function inviteEmailHtml(firstName: string, venueName: string, actionLink: string) {
  return emailShell(`
    <h1 style="font-size:22px; margin: 0 0 16px;">Bienvenue chez Lucky, ${firstName} !</h1>
    <p style="font-size:14px; line-height:1.6; color:#333;">
      Nous sommes ravis d'accueillir <strong>${venueName}</strong> au sein du réseau Lucky.
    </p>
    <p style="font-size:14px; line-height:1.6; color:#333;">
      Grâce à vous, les personnes présentes chez vous pourront se découvrir et
      entrer en contact les unes avec les autres, en toute confiance, pendant
      qu'elles profitent de votre établissement.
    </p>
    <p style="font-size:14px; line-height:1.6; color:#333;">
      Pour activer votre compte et accéder à votre tableau de bord, il ne vous
      reste qu'à choisir un mot de passe :
    </p>
    <p style="margin: 24px 0;">
      <a href="${actionLink}" style="display:inline-block; background:#0B0A08; color:#F4EFE6; padding:12px 24px; border-radius:999px; text-decoration:none; font-size:14px; font-weight:600;">
        Activer mon compte
      </a>
    </p>
    <p style="font-size:14px; color:#333;">À très vite,<br />L'équipe Lucky</p>
  `);
}
export async function sendVenueInvite(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) return;

  const venueId = formData.get('venueId') as string;
  const service = createServiceClient();

  const { data: venue } = await service
    .from('venues')
    .select('id, name, contact_name, contact_email')
    .eq('id', venueId)
    .maybeSingle();

  if (!venue || !venue.contact_email) return;

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent('/venue-set-password')}`;

  const { data: userList } = await service.auth.admin.listUsers();
  const existingUser = userList?.users?.find(
    (u: any) => u.email?.toLowerCase() === venue.contact_email.toLowerCase()
  );

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink(
    existingUser
      ? { type: 'recovery', email: venue.contact_email, options: { redirectTo } }
      : { type: 'invite', email: venue.contact_email, options: { redirectTo } }
  );

  if (linkError || !linkData?.properties?.action_link) return;

  const userId = existingUser?.id ?? linkData.user?.id;
  if (userId) {
    await service.from('venue_admins').insert({ venue_id: venue.id, user_id: userId, role: 'owner' }).select().maybeSingle();
  }

  const firstName = (venue.contact_name || '').split(' ')[0] || 'là-bas';

  await sendEmail({
    to: venue.contact_email,
    subject: `Bienvenue chez Lucky, ${firstName} !`,
    html: inviteEmailHtml(firstName, venue.name, linkData.properties.action_link),
  });

  await service.from('venues').update({ invited_at: new Date().toISOString() }).eq('id', venueId);
  revalidatePath('/admin/etablissements');
}

export async function addAdmin(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) return;

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return;

  const service = createServiceClient();
  await service.from('platform_admins').insert({ email }).select().maybeSingle();

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent('/admin-set-password')}`;

  const { data: userList } = await service.auth.admin.listUsers();
  const existingUser = userList?.users?.find((u: any) => u.email?.toLowerCase() === email);

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink(
    existingUser
      ? { type: 'recovery', email, options: { redirectTo } }
      : { type: 'invite', email, options: { redirectTo } }
  );

  if (!linkError && linkData?.properties?.action_link) {
    await sendEmail({
      to: email,
      subject: 'Vous avez maintenant accès au back-office Lucky',
      html: emailShell(`
        <h1 style="font-size:22px; margin: 0 0 16px;">Bienvenue dans l'équipe Lucky</h1>
        <p style="font-size:14px; line-height:1.6; color:#333;">
          Vous avez été ajouté(e) comme administrateur(trice) du back-office Lucky par ${user.email}.
        </p>
        <p style="font-size:14px; line-height:1.6; color:#333;">
          Pour activer votre accès, choisissez un mot de passe :
        </p>
        <p style="margin: 24px 0;">
          <a href="${linkData.properties.action_link}" style="display:inline-block; background:#0B0A08; color:#F4EFE6; padding:12px 24px; border-radius:999px; text-decoration:none; font-size:14px; font-weight:600;">
            Activer mon accès
          </a>
        </p>
      `),
    });
  }

  revalidatePath('/admin/equipe');
}

export async function removeAdmin(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) return;

  const adminId = formData.get('adminId') as string;
  const service = createServiceClient();
  await service.from('platform_admins').delete().eq('id', adminId);
  revalidatePath('/admin/equipe');
}

export async function reviewReport(formData: FormData) {
  const id = formData.get('reportId') as string;
  const service = createServiceClient();
  await service.from('reports').update({ status: 'reviewed' }).eq('id', id);
  revalidatePath('/admin/moderation');
}

export async function dismissReport(formData: FormData) {
  const id = formData.get('reportId') as string;
  const service = createServiceClient();
  await service.from('reports').update({ status: 'dismissed' }).eq('id', id);
  revalidatePath('/admin/moderation');
}
