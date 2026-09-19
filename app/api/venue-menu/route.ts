import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * Carte du lieu pour le sélecteur « J'offre un verre ».
 * Servie à partir du match, pour ne renvoyer que la carte du lieu où la
 * personne se trouve réellement.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const matchId = new URL(request.url).searchParams.get('matchId');
  if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, venue_id')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: items } = await service
    .from('venue_menu_items')
    .select('id, name, price_cents, category')
    .eq('venue_id', match.venue_id)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return NextResponse.json({ items: items ?? [] });
}
