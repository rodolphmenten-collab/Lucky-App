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

  // La base vient de la variable publique, pas de request.url : sur Netlify,
  // l'URL de la requête porte parfois le nom d'hôte interne du déploiement, et
  // le gérant se retrouvait renvoyé ailleurs que sur sa page de signature —
  // avec l'impression que rien ne s'était passé, alors que tout était
  // enregistré.
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  // Chaque redirection porte un paramètre unique. Sans lui, le navigateur et
  // le cache de l'hébergeur renvoyaient la page telle qu'elle avait été
  // servie avant la signature : le gérant signait, la page se rechargeait à
  // l'identique, et il croyait que rien ne s'était passé.
  const retour = (params_: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...params_, t: Date.now().toString(36) });
    return NextResponse.redirect(
      new URL(`/signer/${params.token}?${q.toString()}`, base),
      303
    );
  };

  const { data: s } = await service
    .from('contrat_signatures')
    .select('*')
    .eq('token', params.token)
    .maybeSingle();

  if (!s || s.annule_le) return retour({ err: 'lien' });
  if (s.signe_le) return retour(); // déjà signé : la page le dira

  const form = await request.formData();
  const nom = String(form.get('nom') ?? '').trim();
  const accepte = form.get('accepte') === 'on';

  if (nom.length < 3) return retour({ err: 'nom' });
  if (!accepte) return retour({ err: 'accepte' });

  const { data: c } = await service
    .from('crm_venues')
    .select('id, name, contact_email')
    .eq('id', s.crm_venue_id)
    .maybeSingle();
  if (!c) return retour({ err: 'lien' });

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
    cadreLieu: s.cadre_lieu ?? null,
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
    return retour({ err: 'serveur' });
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

  // Côté Lucky, les adresses des signataires viennent de variables
  // d'environnement qui peuvent être vides. Une adresse vide ferait
  // silencieusement disparaître la notification : le lieu recevrait son
  // contrat signé, et nous ne saurions pas qu'il l'a signé. On replie donc sur
  // les administrateurs de la plateforme, qui existent toujours.
  const cotLucky = LUCKY_SIGNATAIRES.map((x) => x.email.trim()).filter(Boolean);
  if (cotLucky.length === 0) {
    const { data: admins } = await service.from('platform_admins').select('email');
    for (const a of admins ?? []) {
      const e = String(a.email ?? '').trim();
      if (e) cotLucky.push(e);
    }
  }

  // Deux envois distincts, et non un seul à tout le monde. Le gérant ne doit
  // pas lire une notification interne, ni découvrir dans l'en-tête à qui nous
  // transmettons son contrat. C'est aussi ce qui garantit qu'il reçoit bien le
  // sien quand son adresse est aussi celle d'un administrateur : une adresse
  // répétée dans un même envoi est refusée par le fournisseur.
  const equipe = cotLucky.filter(
    (e) => e.toLowerCase() !== s.destinataire_email.toLowerCase()
  );

  const dateCourte = maintenant.toLocaleDateString('fr-FR');

  const auClient = await sendEmail({
    to: s.destinataire_email,
    subject: `Votre contrat Lucky — ${c.name}`,
    html: emailShell(`
      <p style="font-size:16px; margin:0 0 16px;">Votre contrat est signé.</p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
        Merci ${nom}. Vous trouverez en pièce jointe le contrat définitif pour
        <strong>${c.name}</strong>, signé le ${dateCourte}. Il porte en dernière page la preuve
        de votre signature — date, heure et empreinte du document. Conservez-le.
      </p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
        Nous revenons vers vous pour préparer vos supports et caler la mise en route.
      </p>
      <p style="font-size:12px; color:#666; line-height:1.6; margin:0;">
        Empreinte SHA-256 du contrat : <span style="font-family:monospace;">${empreinteLisible(s.pdf_sha256)}</span>
      </p>
    `),
    attachments: piece,
  });
  if (!auClient.ok) console.error('[signer] e-mail au client', auClient.error);

  if (equipe.length > 0) {
    const aLequipe = await sendEmail({
      to: equipe,
      subject: `Contrat signé — ${c.name}`,
      html: emailShell(`
        <p style="font-size:16px; margin:0 0 16px;">Le contrat est signé.</p>
        <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
          Signé par <strong>${nom}</strong> le ${dateCourte} pour <strong>${c.name}</strong>,
          depuis ${s.destinataire_email}. Le document définitif est en pièce jointe.
        </p>
        <p style="font-size:12px; color:#666; line-height:1.6; margin:0;">
          Empreinte SHA-256 du contrat : <span style="font-family:monospace;">${empreinteLisible(s.pdf_sha256)}</span>
        </p>
      `),
      attachments: piece,
    });
    if (!aLequipe.ok) console.error("[signer] e-mail à l'équipe", aLequipe.error);
  }

  return retour();
}
