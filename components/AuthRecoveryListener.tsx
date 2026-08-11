'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Supabase's password-recovery emails deliver an implicit-flow session as a URL hash
 * fragment (#access_token=...&type=recovery) rather than the ?code= query param our
 * /auth/callback route handles. Hash fragments never reach the server, so nothing
 * server-side can process them — only client-side JS can. The Supabase browser client
 * auto-detects and consumes these hash tokens on load (detectSessionInUrl, on by
 * default) and fires a distinct 'PASSWORD_RECOVERY' auth event when it does. This
 * component just listens for that event, from anywhere in the app, and routes the
 * person to set a new password.
 */
export function AuthRecoveryListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/venue-set-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
