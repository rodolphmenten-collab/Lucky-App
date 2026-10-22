import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import * as webpush from 'web-push';

/**
 * Relance des bons oubliés.
 *
 * Depuis que seul celui qui offre confirme le service, le CA certifié du lieu
 * tient à un seul tap. Au comptoir, un verre dans chaque main, ce tap se perd.
 * Cette tâche repasse derrière : un bon encore en attente au bout de dix
 * minutes déclenche une notification à celui qui l'a offert, une seule fois.
 *
 * Elle parle directement à Supabase plutôt que d'appeler une route de l'app :
 * une route de cron, c'est une URL publique de plus à protéger, et ici elle
 * n'apporterait rien — les clés nécessaires sont déjà dans l'environnement
 * Netlify.
 *
 * Si les clés VAPID ou Supabase manquent, la tâche ne fait rien et le dit.
 * Elle ne doit jamais échouer bruyamment : une relance manquée est un petit
 * problème, une tâche planifiée qui part en erreur en boucle en est un gros.
 */

const DELAI_MINUTES = 10;

// Au-delà, le service est fini et la relance n'a plus de sens : on marque le
// bon comme relancé sans notifier, pour ne pas réveiller quelqu'un le
// lendemain matin à propos d'un verre de la veille.
const TROP_TARD_HEURES = 3;

export default async function relanceBons() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('relance-bons : Supabase non configuré, rien à faire.');
    return new Response('supabase manquant', { status: 200 });
  }
  if (!vapidPublic || !vapidPrivate) {
    console.warn('relance-bons : clés VAPID absentes, aucune notification possible.');
    return new Response('vapid manquant', { status: 200 });
  }

  webpush.setVapidDetails('mailto:hello@lucky-app.io', vapidPublic, vapidPrivate);
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const maintenant = Date.now();
  const seuil = new Date(maintenant - DELAI_MINUTES * 60 * 1000).toISOString();
  const tropTard = new Date(maintenant - TROP_TARD_HEURES * 3600 * 1000).toISOString();

  const { data: bons, error } = await supabase
    .from('lucky_orders')
    .select('id, from_user, item_name, created_at')
    .eq('status', 'pending')
    .is('reminder_sent_at', null)
    .lt('created_at', seuil)
    .limit(200);

  if (error) {
    console.error('relance-bons : lecture impossible —', error.message);
    return new Response('erreur lecture', { status: 200 });
  }
  if (!bons || bons.length === 0) {
    return new Response('aucun bon à relancer', { status: 200 });
  }

  let notifies = 0;
  let perimes = 0;

  for (const bon of bons) {
    const perime = bon.created_at < tropTard;

    if (!perime) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', bon.from_user);

      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: 'Le verre a-t-il été servi ?',
              body: `Votre bon pour ${bon.item_name} est toujours en attente. Un geste et c'est clos.`,
              url: '/matches',
            })
          );
          notifies += 1;
        } catch (err: any) {
          // 404/410 : abonnement mort (données du navigateur effacées). On le
          // nettoie plutôt que de réessayer à chaque passage.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('relance-bons : envoi échoué —', err?.message ?? err);
          }
        }
      }
    } else {
      perimes += 1;
    }

    // Marqué dans tous les cas : relancé une fois, ou trop tard pour le faire.
    // Sans ça, un bon jamais confirmé serait repris à chaque passage.
    await supabase
      .from('lucky_orders')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', bon.id);
  }

  const resume = `relance-bons : ${bons.length} bon(s) traité(s), ${notifies} notification(s), ${perimes} trop ancien(s).`;
  console.log(resume);
  return new Response(resume, { status: 200 });
}

export const config: Config = {
  // Toutes les cinq minutes : assez fin pour que la relance tombe pendant que
  // la personne est encore dans le lieu, assez rare pour ne rien coûter.
  schedule: '*/5 * * * *',
};
