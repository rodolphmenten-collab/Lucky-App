import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/stripe/webhook est exclu : il est authentifié par la signature Stripe
    // sur le corps brut, pas par une session, et n'a rien à rafraîchir.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
