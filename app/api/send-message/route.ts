import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/push';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId, content } = await request.json();
  if (!matchId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing matchId/content' }, { status: 400 });
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: user.id, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  (async () => {
    try {
      const service = createServiceClient();
      const { data: sender } = await service.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      await sendPushToUser(service, otherId, {
        title: sender?.first_name ?? 'New message',
        body: content.trim().slice(0, 100),
        url: `/chat/${matchId}`,
      });
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  })();

  return NextResponse.json({ message });
}
