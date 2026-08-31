'use client';

import { useState } from 'react';

export function ImpersonateButton({ venueId }: { venueId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleView() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/view-venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleView}
        disabled={loading}
        className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-bone-dim hover:border-brass hover:text-brass"
      >
        {loading ? '…' : 'Se connecter à leur place'}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
