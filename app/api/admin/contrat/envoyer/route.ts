import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { preparerContrat, manquantsLucky } from '@/lib/contrat';
import { construireContratPdf } from '@/lib/contratPdf';
import { nouveauToken, empreinte } from '@/lib/signature';
import { sendEmail, emailShell } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Envoie le contrat à signer — sans prestataire.
 *
 * Le PDF est figé ici, enregistré tel quel avec son empreinte, et le lieu
 * reçoit un lien unique vers la page de signature. Rien n'est reconstruit
 * ensuite : ce qui est signé est ce qui a été envoyé.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const service = createServiceClient();
  const { data: c } = await service.from('crm_venues').select('*').eq('id', id).maybeSingle();
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Un contrat incomplet parti chez le signataire ne se rattrape qu'en
  // l'annulant devant le client : on revérifie ici, pas seulement à l'écran.
  const k = preparerContrat(c);
  const trous = [...k.manquants, ...manquantsLucky()];
  if (trous.length > 0) {
    return NextResponse.json({ error: `Contrat incomplet : il manque ${trous.join(', ')}.` }, { status: 400 });
  }

  const email = (c.contact_email ?? '').trim();
  if (!email) {
    return NextResponse.json(
      { error: "Aucune adresse e-mail de contact sur la fiche : c'est là que part la demande de signature." },
      { status: 400 }
    );
  }

  const pdf = await construireContratPdf(c);
  const token = nouveauToken();

  // Un seul lien vivant à la fois : les précédents, non signés, sont annulés.
  // Deux liens valides pour le même contrat, c'est deux versions possibles.
  const { error: erreurAnnulation } = await service
    .from('contrat_signatures')
    .update({ annule_le: new Date().toISOString() })
    .eq('crm_venue_id', id)
    .is('signe_le', null)
    .is('annule_le', null);
  if (erreurAnnulation) {
    console.error('[contrat/envoyer] annulation', erreurAnnulation);
    return NextResponse.json({ error: erreurAnnulation.message }, { status: 500 });
  }

  const { error: erreurInsert } = await service.from('contrat_signatures').insert({
    crm_venue_id: id,
    token,
    destinataire_email: email,
    signataire_attendu: c.signer_name,
    pdf_base64: Buffer.from(pdf).toString('base64'),
    pdf_sha256: empreinte(pdf),
    envoye_par: user.email,
  });
  if (erreurInsert) {
    console.error('[contrat/envoyer] insert', erreurInsert);
    return NextResponse.json({ error: erreurInsert.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lucky-app.io';
  const lien = `${base}/signer/${token}`;

  const envoi = await sendEmail({
    to: email,
    subject: `Votre contrat Lucky — ${c.name}`,
    html: emailShell(`
      <p style="font-size:16px; margin:0 0 16px;">Bonjour,</p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
        Voici le contrat ${k.estSoiree ? 'de prestation pour votre soirée' : "d'abonnement"} Lucky
        pour <strong>${c.name}</strong>. Vous pouvez le relire et le signer en ligne, en une minute.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${lien}" style="display:inline-block; background:#B08D57; color:#111; text-decoration:none; padding:14px 24px; border-radius:999px; font-weight:600;">Lire et signer le contrat</a>
      </p>
      <p style="font-size:13px; color:#666; line-height:1.6; margin:0;">
        Ce lien vous est personnel. Une fois signé, vous recevrez le contrat définitif par e-mail.
      </p>
    `),
  });

  if (!envoi.ok) {
    // Le lien existe mais personne ne l'a reçu : le dire plutôt que de laisser
    // croire que le contrat est parti.
    console.error('[contrat/envoyer] email', envoi.error);
    return NextResponse.json(
      { error: "Le lien a été créé mais l'e-mail n'est pas parti. Réessayez, ou transmettez le lien à la main.", lien },
      { status: 502 }
    );
  }

  const { error: erreurDate } = await service
    .from('crm_venues')
    .update({ contract_sent_at: new Date().toISOString() })
    .eq('id', id);
  if (erreurDate) console.error('[contrat/envoyer] contract_sent_at', erreurDate);

  return NextResponse.json({ ok: true, email, lien });
}
