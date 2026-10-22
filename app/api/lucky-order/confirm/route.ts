import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * « Servi 🥂 » — la seule validation du circuit, et elle est faite par un
 * client, pas par le staff. C'est ce qui fait passer la commande en CA
 * certifié.
 *
 * La confirmation revient à CELUI QUI OFFRE, pas à celui qui reçoit : c'est
 * lui qui est au comptoir, qui présente le bon et qui voit le verre partir.
 * Le receveur, lui, a souvent déjà rangé son téléphone — lui demander un tap,
 * c'était laisser le CA du lieu dépendre de quelqu'un qui ne regarde pas.
 *
 * L'annulation reste ouverte aux deux : celui qui reçoit doit pouvoir refuser
 * un verre qu'il n'a pas voulu.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { orderId, action } = await request.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const service = createServiceClient();

  const { data: order } = await service
    .from('lucky_orders')
    .select('id, from_user, to_user, status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || (order.from_user !== user.id && order.to_user !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Ce bon a déjà été traité' }, { status: 400 });
  }

  // Confirmer que le verre a été servi n'appartient qu'à celui qui l'offre.
  // Contrôle côté serveur et pas seulement à l'écran : un bouton caché se
  // contourne, une règle ici, non.
  if (action !== 'cancel' && order.from_user !== user.id) {
    return NextResponse.json(
      { error: 'Seule la personne qui offre peut confirmer que le verre a été servi.' },
      { status: 403 }
    );
  }

  if (action === 'cancel') {
    const { data: cancelled, error } = await service
      .from('lucky_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ order: cancelled });
  }

  const { data: served, error } = await service
    .from('lucky_orders')
    .update({
      status: 'served',
      served_at: new Date().toISOString(),
      served_confirmed_by: user.id,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: served });
}
