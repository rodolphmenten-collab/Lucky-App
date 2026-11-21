import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { venueId, lat, lng, zoneId } = await request.json();
  if (!venueId || typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Missing venueId/lat/lng' }, { status: 400 });
  }

  const { data, error } = await supabase
    .rpc('check_in', {
      p_venue_id: venueId,
      p_lat: lat,
      p_lng: lng,
      p_method: 'gps',
      p_zone_id: zoneId ?? null,
    })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // La distance mesuree remonte jusqu'a l'ecran. Sans elle, un refus ne dit
  // rien : « trop loin » peut vouloir dire dix metres de derive GPS comme un
  // point de lieu reste sur une autre adresse, et les deux se corrigent
  // autrement. Le chiffre tranche en une seconde, sur place.
  const distance = (data as any).distance_meters;

  return NextResponse.json({
    checkInId: (data as any).check_in_id,
    status: (data as any).status,
    withinRadius: (data as any).within_radius,
    distance: distance === null || distance === undefined ? null : Math.round(Number(distance)),
  });
}
