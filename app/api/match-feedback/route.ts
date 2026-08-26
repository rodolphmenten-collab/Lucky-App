import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId, met } = await request.json();
  if (!matchId || typeof met !== 'boolean') {
    return NextResponse.json({ error: 'Missing matchId or met' }, { status: 400 });
  }

  const { error } = await supabase
    .from('match_feedback')
    .upsert({ match_id: matchId, user_id: user.id, met }, { onConflict: 'match_id,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
