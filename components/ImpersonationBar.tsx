'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ImpersonationBar() {
  const [venueName, setVenueName] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setVenueName(window.localStorage.getItem('lucky_impersonating_venue'));
  }, []);

  async function stopImpersonating() {
    setRestoring(true);
    window.localStorage.removeItem('lucky_admin_backup_session');
    window.localStorage.removeItem('lucky_impersonating_venue');

    // Signing out and sending them back to /admin-login is simpler and far more
    // reliable than trying to restore the exact prior session token-for-token —
    // that approach kept hitting timing/cookie edge cases. One extra login beats
    // an unreliable "restore".
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login?next=/admin';
  }

  if (!venueName) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-brass px-4 py-2 text-xs font-medium text-ink">
      <span>Vous gérez le compte de {venueName} en leur nom.</span>
      <button
        onClick={stopImpersonating}
        disabled={restoring}
        className="rounded-full bg-ink px-3 py-1 text-[11px] text-bone hover:bg-ink-800"
      >
        {restoring ? '…' : 'Arrêter et me reconnecter'}
      </button>
    </div>
  );
}
