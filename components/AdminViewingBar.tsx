'use client';

import { useState } from 'react';

export function AdminViewingBar({ venueName }: { venueName: string }) {
  const [loading, setLoading] = useState(false);

  async function stop() {
    setLoading(true);
    await fetch('/api/admin/stop-viewing', { method: 'POST' });
    window.location.href = '/admin';
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-brass px-4 py-2 text-xs font-medium text-ink">
      <span>Vous gérez le compte de {venueName} en leur nom.</span>
      <button
        onClick={stop}
        disabled={loading}
        className="rounded-full bg-ink px-3 py-1 text-[11px] text-bone hover:bg-ink-800"
      >
        {loading ? '…' : 'Arrêter et revenir en admin'}
      </button>
    </div>
  );
}
