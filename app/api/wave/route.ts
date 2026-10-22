import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/push';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { toUserId, venueId } = await request.json();
  if (!toUserId || !venueId) {
    return NextResponse.json({ error: 'Missing toUserId/venueId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .rpc('send_wave', { p_to_user: toUserId, p_venue_id: venueId })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const matched = (data as any).matched;
  const matchId = (data as any).match_id;

  // Push notifications are best-effort: never let a failure here affect the
  // wave/match response the person is waiting on.
  (async () => {
    try {
      const service = createServiceClient();
      const { data: sender } = await service.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      const senderName = sender?.first_name ?? 'Someone';

      if (matched) {
        const { data: other } = await service.from('profiles').select('first_name').eq('id', toUserId).maybeSingle();
        await Promise.all([
          sendPushToUser(service, toUserId, {
            title: 'Vous avez un match 🎉',
            body: `${senderName} et vous, c'est réciproque.`,
            url: `/chat/${matchId}`,
          }),
          sendPushToUser(service, user.id, {
            title: 'Vous avez un match 🎉',
            body: `${other?.first_name ?? 'Quelqu\u2019un'} et vous, c'est réciproque.`,
            url: `/chat/${matchId}`,
          }),
        ]);
      } else {
        // Titre = le nom du lieu : c'est ce que la personne reconnait sur son
        // ecran verrouille, et la plateforme n'a pas a s'y nommer.
        const { data: lieu } = await service
          .from('venues')
          .select('name')
          .eq('id', venueId)
          .maybeSingle();
        await sendPushToUser(service, toUserId, {
          title: lieu?.name ?? 'Un signe',
          body: `${senderName} vous a fait signe 👋`,
          url: '/matches',
        });
      }
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  })();

  return NextResponse.json({ matched, matchId });
}
