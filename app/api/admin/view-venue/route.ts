import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { ADMIN_VIEW_COOKIE_NAME } from '@/lib/adminViewing';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { venueId } = await request.json();
  if (!venueId) return NextResponse.json({ error: 'Missing venueId' }, { status: 400 });

  cookies().set(ADMIN_VIEW_COOKIE_NAME, venueId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4,
  });

  return NextResponse.json({ ok: true });
}
