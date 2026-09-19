import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatThread } from './ChatThread';

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: { matchId: string };
  searchParams: { justMatched?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, created_at, venues(name, slug, perk_label)')
    .eq('id', params.matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) notFound();

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: other } = await supabase
    .from('profiles')
    .select('id, first_name, photo_url, photos, age, city, job, bio, intentions, interests')
    .eq('id', otherId)
    .single();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, content, created_at')
    .eq('match_id', match.id)
    .order('created_at', { ascending: true });

  const { data: existingFeedback } = await supabase
    .from('match_feedback')
    .select('id')
    .eq('match_id', match.id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Rencontre et bons en cours : lus avec le client utilisateur, les policies
  // RLS restreignent déjà aux participants du match.
  const [{ data: meetup }, { data: orders }] = await Promise.all([
    supabase
      .from('meetups')
      .select('id, match_id, code, status, requested_by, confirmed_at')
      .eq('match_id', match.id)
      .maybeSingle(),
    supabase
      .from('lucky_orders')
      .select('id, match_id, from_user, to_user, item_name, price_cents, code, status, created_at')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true }),
  ]);

  return (
    <ChatThread
      matchId={match.id}
      currentUserId={user.id}
      other={other}
      venueName={(match as any).venues?.name}
      venueSlug={(match as any).venues?.slug}
      initialMessages={messages ?? []}
      justMatched={searchParams.justMatched === '1'}
      matchCreatedAt={match.created_at}
      feedbackGiven={Boolean(existingFeedback)}
      perkLabel={(match as any).venues?.perk_label ?? null}
      initialMeetup={(meetup as any) ?? null}
      initialOrders={(orders as any) ?? []}
    />
  );
}
