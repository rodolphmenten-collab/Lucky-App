import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Marque une conversation comme lue.
 *
 * Appelée à l'ouverture du fil, et de nouveau quand un message arrive pendant
 * qu'il est ouvert : dans ce cas il est lu au moment même où il apparaît.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });

  // On vérifie l'appartenance à la conversation : sans ça, n'importe qui
  // pourrait semer des lignes de lecture sur des conversations étrangères.
  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('match_reads')
    .upsert(
      { match_id: matchId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: 'match_id,user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
