import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../lib/email';

/**
 * Récapitulatif quotidien des relances CRM.
 *
 * Le bloc « À faire » de l'accueil admin ne sert qu'à celui qui ouvre l'admin.
 * Une relance due un mardi se voit le vendredi. Ce récap renverse la charge :
 * chacun reçoit le matin la liste de ce qui lui revient, avec un lien direct
 * sur chaque fiche.
 *
 * Un seul mail par personne et par jour, pas un mail par tâche — au-delà de
 * deux ou trois relances, une boîte qui déborde se trie moins bien qu'une
 * liste. Les lignes sans propriétaire tombent sur l'adresse de repli, pour que
 * personne ne compte sur un mail qui n'est parti à personne.
 *
 * Elle tourne toutes les heures et ne fait quelque chose qu'à HEURE_ENVOI
 * heure de Paris : le cron Netlify est en UTC et l'heure d'été déplacerait
 * l'envoi de soixante minutes deux fois par an. La garde contre le doublon,
 * elle, n'est pas dans l'horaire mais dans crm_digest_log : l'insert (email,
 * jour) précède l'envoi, donc un second passage ne peut pas renvoyer.
 *
 * Comme relance-bons, elle n'échoue jamais bruyamment : un récap manqué est
 * un petit problème, une tâche planifiée en erreur en boucle en est un gros.
 */

const HEURE_ENVOI = 8;
const FUSEAU = 'Europe/Paris';

function jourParis(d: Date): string {
  // en-CA donne YYYY-MM-DD, la même forme que la colonne date de Postgres.
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(d);
}

function heureParis(d: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: FUSEAU, hour: '2-digit', hour12: false }).format(d)
  );
}

function jourFr(iso: string): string {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

export default async function relancesDuJour(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const repli = process.env.CRM_RELANCES_FALLBACK_EMAIL || 'rodolph@lucky-app.io';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lucky-app.io').replace(/\/$/, '');

  if (!supabaseUrl || !serviceKey) {
    console.warn('relances-du-jour : Supabase non configuré, rien à faire.');
    return new Response('supabase manquant', { status: 200 });
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn('relances-du-jour : RESEND_API_KEY absente, aucun envoi possible.');
    return new Response('resend manquant', { status: 200 });
  }

  const maintenant = new Date();
  // ?maintenant=1 permet de déclencher un envoi hors de l'heure prévue depuis
  // le tableau Netlify, pour vérifier le rendu sans attendre le lendemain.
  const forcer = new URL(req.url).searchParams.get('maintenant') === '1';
  if (!forcer && heureParis(maintenant) !== HEURE_ENVOI) {
    return new Response('hors créneau', { status: 200 });
  }

  const aujourdhui = jourParis(maintenant);
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: lignes, error } = await supabase
    .from('crm_venues')
    .select('id, name, city, next_action, next_action_at, owner_email, stage')
    .neq('stage', 'perdu')
    .not('next_action_at', 'is', null)
    .lte('next_action_at', aujourdhui)
    .order('next_action_at', { ascending: true })
    .limit(500);

  if (error) {
    console.error('relances-du-jour : lecture impossible —', error.message);
    return new Response('erreur lecture', { status: 200 });
  }
  if (!lignes || lignes.length === 0) {
    return new Response('aucune relance due', { status: 200 });
  }

  const parPersonne = new Map<string, typeof lignes>();
  for (const l of lignes) {
    const destinataire = (l.owner_email || '').trim().toLowerCase() || repli;
    const dejaLa = parPersonne.get(destinataire);
    if (dejaLa) dejaLa.push(l);
    else parPersonne.set(destinataire, [l]);
  }

  let envoyes = 0;
  let deja = 0;

  for (const [email, taches] of parPersonne) {
    // L'insert d'abord : s'il passe, c'est à nous d'envoyer, et un autre
    // passage ne le refera pas. S'il échoue en doublon, le récap est parti.
    const { error: errLog } = await supabase
      .from('crm_digest_log')
      .insert({ email, sent_on: aujourdhui, nb_taches: taches.length });

    if (errLog) {
      deja += 1;
      continue;
    }

    const enRetard = taches.filter((t) => t.next_action_at < aujourdhui).length;
    const lis = taches
      .map((t) => {
        const retard = t.next_action_at < aujourdhui;
        const date = retard
          ? `<span style="color:#c0392b;">${jourFr(t.next_action_at)} · en retard</span>`
          : `<span style="color:#999;">aujourd'hui</span>`;
        return `<li style="margin-bottom:12px;line-height:1.5;">
          <a href="${siteUrl}/admin/crm/${t.id}" style="color:#1a1a1a;font-weight:600;text-decoration:underline;">${t.name}</a>
          ${t.city ? `<span style="color:#999;"> · ${t.city}</span>` : ''}
          <br /><span style="color:#444;">${t.next_action || 'Relance'}</span>
          <br /><span style="font-size:12px;">${date}</span>
        </li>`;
      })
      .join('');

    const titre =
      taches.length === 1 ? '1 relance aujourd’hui' : `${taches.length} relances aujourd’hui`;

    const corps = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
        <p style="color:#B08D57;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Lucky · CRM</p>
        <p style="font-size:18px;font-weight:600;margin:0 0 4px;">${titre}</p>
        ${enRetard > 0 ? `<p style="color:#c0392b;font-size:13px;margin:0 0 20px;">dont ${enRetard} en retard</p>` : '<p style="margin:0 0 20px;"></p>'}
        <ul style="padding-left:18px;margin:0;">${lis}</ul>
        <p style="margin:28px 0 0;">
          <a href="${siteUrl}/admin" style="color:#B08D57;font-size:13px;">Ouvrir le CRM</a>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
        <p style="color:#999;font-size:11px;line-height:1.5;">
          Récapitulatif interne envoyé une fois par jour aux porteurs de relances.
        </p>
      </div>
    `;

    const res = await sendEmail({ to: email, subject: `${titre} · Lucky`, html: corps });
    if (res.ok) envoyes += 1;
    else console.error('relances-du-jour : envoi échoué pour', email, '—', res.error);
  }

  const resume = `relances-du-jour : ${lignes.length} relance(s) due(s), ${envoyes} récap(s) envoyé(s), ${deja} déjà parti(s).`;
  console.log(resume);
  return new Response(resume, { status: 200 });
}

export const config: Config = {
  // Toutes les heures : la tâche décide elle-même si l'heure de Paris est la
  // bonne, ce qu'un cron en UTC ne saurait pas faire au changement d'heure.
  schedule: '5 * * * *',
};
