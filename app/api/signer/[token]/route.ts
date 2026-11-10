import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ajouterPagePreuve, ipDepuisEntetes, empreinteLisible } from '@/lib/signature';
import { sendEmail, emailShell } from '@/lib/email';
import { LUCKY_SIGNATAIRES } from '@/lib/contrat';

export const dynamic = 'force-dynamic';

/**
 * La signature elle-même.
 *
 * Un formulaire HTML ordinaire : pas de JavaScript à charger, rien à installer
 * pour le gérant qui signe depuis son téléphone entre deux services.
 */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  const service = createServiceClient();
  const retour = (q: string) =>
    NextResponse.redirect(new URL(`/signer/${params.token}${q}`, request.url), 303);

  const { data: s } = await service
    .from('contrat_signatures')
    .select('*')
    .eq('token', params.token)
    .maybeSingle();

  if (!s || s.annule_le) return retour('?err=lien');
  if (s.signe_le) return retour(''); // déjà signé : la page le dira

  const form = await request.formData();
  const nom = String(form.get('nom') ?? '').trim();
  const accepte = form.get('accepte') === 'on';

  if (nom.length < 3) return retour('?err=nom');
  if (!accepte) return retour('?err=accepte');

  const { data: c } = await service
    .from('crm_venues')
    .select('id, name, contact_email')
    .eq('id', s.crm_venue_id)
    .maybeSingle();
  if (!c) return retour('?err=lien');

  const maintenant = new Date();
  const ip = ipDepuisEntetes(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'inconnu';

  const pdfSigne = await ajouterPagePreuve(Buffer.from(s.pdf_base64, 'base64'), {
    signePar: nom,
    signeLe: maintenant.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) + ' (Paris)',
    ip,
    userAgent,
    destinataire: s.destinataire_email,
    sha256: s.pdf_sha256,
    lieu: c.name,
  });

  // La trace d'abord : si l'e-mail échoue ensuite, la signature existe quand
  // même et le document reste téléchargeable depuis le lien.
  const { error: erreurSignature } = await service
    .from('contrat_signatures')
    .update({
      signe_le: maintenant.toISOString(),
      signe_par: nom,
      signe_ip: ip,
      signe_user_agent: userAgent,
      pdf_signe_base64: Buffer.from(pdfSigne).toString('base64'),
    })
    .eq('id', s.id);

  if (erreurSignature) {
    console.error('[signer] enregistrement', erreurSignature);
    return retour('?err=serveur');
  }

  const { error: erreurCrm } = await service
    .from('crm_venues')
    .update({ contract_signed_at: maintenant.toISOString() })
    .eq('id', c.id);
  if (erreurCrm) console.error('[signer] contract_signed_at', erreurCrm);

  await service.from('crm_notes').insert({
    crm_venue_id: c.id,
    author_email: s.destinataire_email,
    kind: 'signature',
    body: `Contrat signé en ligne par ${nom}`,
  });

  const piece = [{ filename: `Contrat Lucky - ${c.name}.pdf`, content: Buffer.from(pdfSigne).toString('base64') }];
  const destinataires = [s.destinataire_email, ...LUCKY_SIGNATAIRES.map((x) => x.email.trim())];

  const envoi = await sendEmail({
    to: destinataires,
    subject: `Contrat signé — ${c.name}`,
    html: emailShell(`
      <p style="font-size:16px; margin:0 0 16px;">Le contrat est signé.</p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
        Signé par <strong>${nom}</strong> le ${maintenant.toLocaleDateString('fr-FR')} pour <strong>${c.name}</strong>.
        Le document définitif est en pièce jointe : il porte la page de preuve de la signature.
      </p>
      <p style="font-size:12px; color:#666; line-height:1.6; margin:0;">
        Empreinte SHA-256 du contrat : <span style="font-family:monospace;">${empreinteLisible(s.pdf_sha256)}</span>
      </p>
    `),
    attachments: piece,
  });
  if (!envoi.ok) console.error('[signer] email', envoi.error);

  return retour('');
}
