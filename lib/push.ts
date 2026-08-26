import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails('mailto:hello@lucky-app.io', publicKey, privateKey);
  configured = true;
}

/**
 * Sends a push notification to every device the given user has registered.
 * Silently does nothing if push isn't configured (missing VAPID keys) or the
 * user has no registered devices — never throws, since a missed notification
 * should never break the calling action (sending a wave, a message, etc).
 */
export async function sendPushToUser(
  supabaseService: any,
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();
  if (!configured) return;

  const { data: subs } = await supabaseService
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // A 404/410 means the subscription is dead (browser data cleared, app
        // uninstalled, etc.) — clean it up so we stop trying.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabaseService.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push send failed:', err?.message ?? err);
        }
      }
    })
  );
}
