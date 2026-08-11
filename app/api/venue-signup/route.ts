import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createVenueRecord } from '@/lib/venues';

export async function POST(request: Request) {
  const { email, password, venueName, city, venueType, plan } = await request.json();

  if (!email || !password || !venueName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const service = createServiceClient();

  // Refuse if this email is already registered — send them to sign in instead.
  const { data: existingUsers } = await service.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.some(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (alreadyExists) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Try signing in instead.' },
      { status: 409 }
    );
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation — password + this API route is the verification step
  });

  if (createError || !created?.user) {
    return NextResponse.json({ error: createError?.message ?? 'Could not create account' }, { status: 400 });
  }

  const { data: venue, error: venueError } = await createVenueRecord(service, {
    name: venueName,
    city,
    type: venueType,
    plan,
  });

  if (venueError || !venue) {
    return NextResponse.json({ error: venueError?.message ?? 'Could not create venue' }, { status: 400 });
  }

  await service.from('venue_admins').insert({ venue_id: venue.id, user_id: created.user.id, role: 'owner' });

  return NextResponse.json({ ok: true, venueSlug: venue.slug });
}
