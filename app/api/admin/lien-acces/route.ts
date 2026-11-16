import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail, emailShell } from '@/lib/email';

/**
 * Renvoyer un lien d'activation ou de réinitialisation à un membre de l'équipe.
 *
 * Sans cela, quelqu'un qui n'a pas encore choisi son mot de passe — ou dont le
 * lien d'invitation a expiré — se retrouve devant un formulaire qui lui demande
 * un mot de passe qu'il n'a jamais créé, et n'a aucun moyen de s'en sortir seul.
 *
 * La réponse est volontairement la même que l'adresse soit connue ou non : cette
 * page est publique, elle ne doit pas servir à deviner qui est administrateur.
 */
export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: null }));
  const adresse = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!adresse) {
    return NextResponse.json({ error: 'Adresse manquante.' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: admin } = await service
    .from('platform_admins')
    .select('id')
    .ilike('email', adresse)
    .maybeSingle();

  if (admin) {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(
      '/admin-set-password'
    )}`;

    const { data: userList } = await service.auth.admin.listUsers();
    const existe = userList?.users?.some((u: any) => u.email?.toLowerCase() === adresse);

    const { data: lien, error } = await service.auth.admin.generateLink(
      existe
        ? { type: 'recovery', email: adresse, options: { redirectTo } }
        : { type: 'invite', email: adresse, options: { redirectTo } }
    );

    if (!error && lien?.properties?.action_link) {
      await sendEmail({
        to: adresse,
        subject: 'Votre accès au back-office Lucky',
        html: emailShell(`
          <h1 style="font-size:22px; margin: 0 0 16px;">Choisissez votre mot de passe</h1>
          <p style="font-size:14px; line-height:1.6; color:#333;">
            Vous avez demandé un lien pour accéder au back-office Lucky.
          </p>
          <p style="margin: 24px 0;">
            <a href="${lien.properties.action_link}" style="display:inline-block; background:#0B0A08; color:#F4EFE6; padding:12px 24px; border-radius:999px; text-decoration:none; font-size:14px; font-weight:600;">
              Choisir mon mot de passe
            </a>
          </p>
          <p style="font-size:13px; line-height:1.6; color:#666;">
            Ce lien est valable une heure. Si vous n'êtes pas à l'origine de cette
            demande, ignorez ce message.
          </p>
        `),
      });
    } else if (error) {
      console.error('Lien d’accès admin : génération impossible —', error.message);
    }
  }

  return NextResponse.json({ ok: true });
}
