import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { isPlanKey } from '@/lib/stripe';
import { createVenueCheckoutSession } from '@/lib/billing';
import { sendEmail, emailShell } from '@/lib/email';

/**
 * Génère le lien de paiement d'un établissement, et l'envoie par email si
 * demandé. Réservé aux admins plateforme : c'est une vente négociée, le lieu
 * ne choisit pas son plan tout seul.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { venueId, plan, send } = await request.json();
  if (!venueId || !isPlanKey(plan)) {
    return NextResponse.json({ error: 'venueId ou plan invalide' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: venue } = await service
    .from('venues')
    .select('id, name, contact_email, contact_name, stripe_customer_id')
    .eq('id', venueId)
    .maybeSingle();

  if (!venue) return NextResponse.json({ error: 'Établissement introuvable' }, { status: 404 });

  const { url, error } = await createVenueCheckoutSession(service, venue, plan);
  if (error || !url) return NextResponse.json({ error: error ?? 'Échec' }, { status: 400 });

  if (!send) return NextResponse.json({ url, emailed: false });

  if (!venue.contact_email) {
    return NextResponse.json({ url, emailed: false, error: 'Pas d’email de contact — lien à transmettre à la main.' });
  }

  const firstName = (venue.contact_name || '').split(' ')[0] || '';
  const emailResult = await sendEmail({
    to: venue.contact_email,
    subject: `Activer l’abonnement Lucky de ${venue.name}`,
    html: emailShell(`
      <h1 style="font-size:22px; margin: 0 0 16px;">Activer l’abonnement de ${venue.name}</h1>
      <p style="font-size:14px; line-height:1.6; color:#333;">
        ${firstName ? `Bonjour ${firstName},` : 'Bonjour,'}
      </p>
      <p style="font-size:14px; line-height:1.6; color:#333;">
        Voici le lien pour activer l’abonnement Lucky de ${venue.name}. Le premier mois est
        offert : votre carte est enregistrée maintenant, le premier prélèvement intervient
        dans 30 jours. Vous pouvez résilier à tout moment avant cette date.
      </p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display:inline-block; background:#0B0A08; color:#F4EFE6; padding:12px 24px; border-radius:999px; text-decoration:none; font-size:14px; font-weight:600;">
          Activer l’abonnement
        </a>
      </p>
      <p style="font-size:12px; line-height:1.6; color:#777;">
        Paiement sécurisé par Stripe. Les prix sont indiqués hors taxes ; la TVA applicable
        est ajoutée sur la facture.
      </p>
    `),
  });

  return NextResponse.json({ url, emailed: emailResult.ok, emailError: emailResult.ok ? null : emailResult.error });
}
