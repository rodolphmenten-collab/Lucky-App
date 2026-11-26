import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendEmail, emailShell } from '@/lib/email';

/**
 * Signalement d'un profil.
 *
 * Un signalement vaut blocage immédiat. Demander à quelqu'un qui vient de subir
 * un comportement déplacé d'accomplir un second geste pour ne plus voir la
 * personne, c'est lui faire porter la charge au pire moment. Le blocage est
 * donc posé ici, côté serveur, et pas laissé à la main du client : il tient
 * même si l'app est fermée aussitôt après.
 *
 * La sanction, elle, reste humaine : le signalement part en revue, il ne
 * suspend personne automatiquement — sauf pour deux motifs.
 *
 * Une photo montrant un mineur dans un contexte sexuel, ou l'image intime
 * d'une personne diffusee sans son accord, ne peuvent pas rester visibles le
 * temps qu'un humain se connecte. Pour ces deux motifs, le compte est suspendu
 * immediatement — ce qui retire la photo de toutes les salles — et l'URL de
 * l'image est copiee dans le signalement avant de disparaitre avec le compte,
 * parce que sans elle on ne pourrait rien transmettre aux autorites ensuite.
 * La revue humaine garde son role : decider de la suite, pas conditionner le
 * retrait.
 */
const MOTIFS_URGENTS = new Set(['csae', 'ncii']);

/** Douze mois : de quoi repondre a une requisition sans garder l'image pour toujours. */
const CONSERVATION_PREUVE_MOIS = 12;
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { reportedId, reason, details } = await request.json();
  if (!reportedId || !reason) {
    return NextResponse.json({ error: 'Missing reportedId/reason' }, { status: 400 });
  }
  if (reportedId === user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
  }

  const urgent = MOTIFS_URGENTS.has(String(reason));
  const service = createServiceClient();

  // La photo est lue avant toute suspension : apres, le profil n'est plus
  // lisible par les requetes ordinaires et la preuve serait perdue.
  let photoAuSignalement: string | null = null;
  if (urgent) {
    const { data: vise } = await service
      .from('profiles')
      .select('photo_url')
      .eq('id', reportedId)
      .maybeSingle();
    photoAuSignalement = vise?.photo_url ?? null;
  }

  const expiration = new Date();
  expiration.setMonth(expiration.getMonth() + CONSERVATION_PREUVE_MOIS);

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason,
    details: details ?? null,
    priority: urgent ? 'urgent' : 'standard',
    photo_url_at_report: photoAuSignalement,
    evidence_expires_at: urgent ? expiration.toISOString() : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Suspension immediate pour les deux motifs urgents. Un compte deja suspendu
  // n'est pas re-suspendu : on ne reecrit pas la raison d'une decision deja
  // prise par un moderateur.
  if (urgent) {
    const { error: erreurSuspension } = await service
      .from('profiles')
      .update({
        suspended_at: new Date().toISOString(),
        suspended_reason: `Signalement ${reason} — suspension automatique en attente de revue`,
        suspended_by: 'systeme',
      })
      .eq('id', reportedId)
      .is('suspended_at', null);
    if (erreurSuspension) console.error('Signalement urgent : suspension impossible —', erreurSuspension.message);
  }

  // Blocage réciproque immédiat. Le doublon n'est pas une erreur : quelqu'un
  // qui signale une personne déjà bloquée doit obtenir une réponse normale.
  const { error: blockError } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: reportedId });
  if (blockError && !blockError.message.includes('duplicate')) {
    console.error('Signalement : blocage impossible —', blockError.message);
  }

  // L'alerte part en arrière-plan : un e-mail qui tarde ne doit pas retenir
  // l'écran de quelqu'un qui est en train de se protéger.
  void (async () => {
    try {
      const [{ data: admins }, { data: signale }, { data: auteur }] = await Promise.all([
        service.from('platform_admins').select('email'),
        service.from('profiles').select('first_name, city').eq('id', reportedId).maybeSingle(),
        service.from('profiles').select('first_name').eq('id', user.id).maybeSingle(),
      ]);

      const destinataires = (admins ?? []).map((a: any) => a.email).filter(Boolean);
      if (destinataires.length === 0) return;

      const corps = emailShell(`
        <h1 style="font-size:20px; margin:0 0 12px;">Profil signalé</h1>
        <p style="font-size:14px; line-height:1.6; margin:0 0 8px;">
          <strong>${signale?.first_name ?? 'Profil inconnu'}</strong>${signale?.city ? ` · ${signale.city}` : ''}
          a été signalé par <strong>${auteur?.first_name ?? 'un membre'}</strong>.
        </p>
        <p style="font-size:14px; line-height:1.6; margin:0 0 8px;">Motif : ${reason}</p>
        ${details ? `<p style="font-size:14px; line-height:1.6; margin:0 0 8px;">Précisions : ${details}</p>` : ''}
        ${
          urgent
            ? `<p style="font-size:14px; line-height:1.6; margin:16px 0 0; padding:12px; background:#fdecea; border-radius:8px; color:#8a1c12;">
                 <strong>Motif à traitement prioritaire.</strong> Le compte a été suspendu
                 automatiquement et la photo n'est plus visible. L'image a été conservée dans le
                 signalement comme élément de preuve. À examiner sans délai, puis à transmettre
                 aux autorités compétentes depuis l'écran de modération si le contenu est confirmé.
               </p>`
            : `<p style="font-size:13px; color:#666; line-height:1.6; margin:16px 0 0;">
                 Le blocage est déjà actif entre ces deux personnes. Aucune suspension n'a été appliquée :
                 c'est à vous de décider.
               </p>`
        }
      `);

      await Promise.all(
        destinataires.map((to: string) =>
          sendEmail({
            to,
            subject: urgent
              ? 'Lucky — URGENT : signalement de contenu à caractère sexuel'
              : 'Lucky — un profil vient d’être signalé',
            html: corps,
          })
        )
      );
    } catch (err) {
      console.error('Signalement : alerte non envoyée —', err);
    }
  })();

  return NextResponse.json({ ok: true, blocked: true, suspended: urgent });
}
