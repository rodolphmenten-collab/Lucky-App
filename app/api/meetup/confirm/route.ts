import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { insertWithUniqueCode } from '@/lib/luckyCodes';
import { sendPushToUser } from '@/lib/push';

/**
 * « On se rencontre » — double confirmation.
 *
 * Premier appel : crée une rencontre en attente (le code existe déjà mais n'est
 * montré qu'une fois confirmé). Appel par l'autre personne : la rencontre passe
 * à confirmée, et c'est ce moment-là qui compte comme une rencontre réelle dans
 * le dashboard de l'établissement.
 *
 * Idempotent : rappeler la route ne crée jamais de doublon.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, venue_id')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const service = createServiceClient();

  const { data: existing } = await service
    .from('meetups')
    .select('id, status, requested_by, code, confirmed_at')
    .eq('match_id', matchId)
    .maybeSingle();

  // Déjà confirmée, ou déjà demandée par moi : rien à faire.
  if (existing && (existing.status === 'confirmed' || existing.requested_by === user.id)) {
    return NextResponse.json({ meetup: existing });
  }

  if (existing) {
    const { data: confirmed, error } = await service
      .from('meetups')
      .update({ status: 'confirmed', confirmed_by: user.id, confirmed_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    notify(service, otherId, user.id, matchId, 'confirmed');
    return NextResponse.json({ meetup: confirmed });
  }

  const { data: created, error } = await insertWithUniqueCode<Record<string, unknown>>(
    'meetups',
    service,
    {
      match_id: matchId,
      venue_id: match.venue_id,
      requested_by: user.id,
      status: 'pending',
    },
    'L'
  );

  if (error) {
    // Course entre les deux personnes qui tapent au même instant : la
    // contrainte unique sur match_id a tranché, on renvoie la rencontre gagnante.
    const { data: raced } = await service
      .from('meetups')
      .select('id, status, requested_by, code, confirmed_at')
      .eq('match_id', matchId)
      .maybeSingle();

    if (raced) return NextResponse.json({ meetup: raced });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  notify(service, otherId, user.id, matchId, 'requested');
  return NextResponse.json({ meetup: created });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notify(service: any, toUser: string, fromUser: string, matchId: string, kind: 'requested' | 'confirmed') {
  (async () => {
    try {
      const { data: sender } = await service.from('profiles').select('first_name').eq('id', fromUser).maybeSingle();
      const name = sender?.first_name ?? 'Quelqu’un';
      await sendPushToUser(service, toUser, {
        title: kind === 'requested' ? `${name} propose de vous rencontrer` : 'Rencontre confirmée',
        body:
          kind === 'requested'
            ? 'Confirmez pour débloquer votre code.'
            : `${name} a confirmé. Votre code est dans la conversation.`,
        url: `/chat/${matchId}`,
      });
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  })();
}
