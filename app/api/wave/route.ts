import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Plus de notification ici : ouvrir une conversation ne prévient personne.
  // C'est le premier message qui fait signe, et /api/send-message s'en charge.

  return NextResponse.json({ matched, matchId });
}
