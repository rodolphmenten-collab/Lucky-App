import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Attentes successives avant de reessayer un envoi refuse, en millisecondes.
 *
 * Resend plafonne a dix requetes par seconde. Ce plafond ne se voit jamais en
 * demonstration, mais une tablee qui scanne le QR en meme temps le depasse en
 * une fraction de seconde : lors d'un essai a quarante-quatre demandes
 * simultanees, dix-huit personnes recevaient une erreur et non leur code.
 *
 * Chaque attente est tiree au hasard entre la valeur ci-dessous et le double :
 * sans ce desordre, toutes les demandes refusees reviennent ensemble a la
 * milliseconde pres et se font refuser ensemble. Au total, une rafale se
 * repartit sur quelques secondes, ce qui la ramene sous le plafond.
 */
const ATTENTES_MS = [300, 900, 2000];

/**
 * Temps maximal que l'on s'autorise a passer en reprises, en millisecondes.
 *
 * La fonction serverless est coupee au bout de dix secondes. Une coupure ne
 * renvoie rien du tout : pas de message, pas d'explication, l'ecran reste
 * muet. Mieux vaut donc renoncer a la derniere reprise et repondre « patientez
 * quelques secondes », qui au moins dit quoi faire. Mesure a l'appui : sur une
 * rafale de quarante-cinq demandes simultanees, la plus lente atteignait 9,4
 * secondes avant ce garde-fou.
 */
const BUDGET_REPRISES_MS = 5_500;

/** Un refus temporaire : trop de monde en meme temps, ou un incident passager. */
function reessayable(status: number) {
  return status === 429 || status >= 500;
}

async function envoyerLeCode(apiKey: string, corps: unknown) {
  let dernier = { status: 0, texte: '' };
  const depart = Date.now();

  for (let essai = 0; essai <= ATTENTES_MS.length; essai++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corps),
    });

    if (res.ok) return { envoye: true, essais: essai + 1, status: 200, texte: '' };

    dernier = { status: res.status, texte: await res.text() };
    if (!reessayable(res.status) || essai === ATTENTES_MS.length) break;

    const base = ATTENTES_MS[essai];
    const attente = base + Math.floor(Math.random() * base);
    if (Date.now() - depart + attente > BUDGET_REPRISES_MS) break;
    await new Promise((r) => setTimeout(r, attente));
  }

  return { envoye: false, essais: ATTENTES_MS.length + 1, ...dernier };
}

export async function POST(request: Request) {
  const { email, venueSlug } = await request.json();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const service = createServiceClient();

  // Marque blanche : pour la personne qui scanne, le service appartient au lieu.
  // L'e-mail part donc au nom du lieu quand on sait lequel. Le domaine
  // d'expedition, lui, reste celui de la plateforme : le changer demanderait un
  // domaine verifie par etablissement.
  let expediteur = 'Votre code';
  if (venueSlug) {
    const { data: v } = await service
      .from('venues')
      .select('name')
      .eq('slug', venueSlug)
      .maybeSingle();
    if (v?.name) expediteur = v.name;
  }

  // Ask Supabase's own auth system to generate a real OTP for this email — we just
  // don't let Supabase send the email itself (that's the part whose template kept
  // failing to save). `email_otp` is the same 6-digit code verifyOtp() expects.
  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { shouldCreateUser: true },
  });

  if (error || !data?.properties?.email_otp) {
    // Le message de Supabase est en anglais et parle de validation d'adresse :
    // la personne qui vient de taper son e-mail de travers merite une phrase
    // qui lui dise quoi faire.
    console.error('send-code: code non genere', error?.message);
    return NextResponse.json(
      { error: "Cette adresse e-mail ne semble pas valide. Verifiez-la et reessayez.", code: 'email_invalide' },
      { status: 400 }
    );
  }

  const code = data.properties.email_otp;
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return NextResponse.json({ error: 'Email sending is not configured (missing RESEND_API_KEY).' }, { status: 500 });
  }

  const envoi = await envoyerLeCode(resendApiKey, {
      from: `${expediteur} <${fromAddress}>`,
      to: email,
      subject: `Votre code de connexion : ${code}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
          <p style="color:#8A8478; font-size:12px; letter-spacing:2px; text-transform:uppercase;">Connexion</p>
          <h1 style="color:#0B0A08; font-size:24px;">Votre code</h1>
          <p style="font-size:32px; font-weight:600; letter-spacing:8px; color:#0B0A08;">${code}</p>
          <p style="color:#666; font-size:13px;">Ce code expire rapidement et ne sert qu'une fois.</p>
          <!-- Sans cette ligne, un e-mail arrivant au nom du lieu depuis un
               domaine inconnu ressemble a une tentative d'hameconnage. Elle
               coute une ligne grise et evite le doute. -->
          <p style="color:#999; font-size:11px; margin-top:28px; border-top:1px solid #eee; padding-top:14px;">
            Propulsé par Lucky ·
            <a href="https://lucky-app.io/legal/confidentialite" style="color:#999;">Politique de confidentialité</a>
          </p>
        </div>
      `,
  });

  if (!envoi.envoye) {
    // Le message du fournisseur ne dit rien a la personne qui attend son code,
    // et dire "erreur 429" a quelqu'un debout dans un bar ne l'aide pas. On
    // renvoie un code que l'ecran sait traduire, et on garde le detail dans les
    // journaux pour nous.
    console.error('send-code: envoi refuse', envoi.status, envoi.texte.slice(0, 300));
    const sature = reessayable(envoi.status);
    return NextResponse.json(
      {
        error: sature
          ? 'Trop de demandes en meme temps. Patientez quelques secondes et redemandez votre code.'
          : "Nous n'avons pas pu envoyer le code. Verifiez l'adresse et reessayez.",
        code: sature ? 'email_sature' : 'email_echec',
      },
      { status: sature ? 429 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
