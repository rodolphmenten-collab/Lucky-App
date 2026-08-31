import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_VIEW_COOKIE_NAME } from '@/lib/adminViewing';

export async function POST() {
  cookies().delete(ADMIN_VIEW_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
