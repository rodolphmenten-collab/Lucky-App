'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WaveBackButton({ fromUserId, venueId }: { fromUserId: string; venueId: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'sending'>('idle');

  async function handleWaveBack() {
    if (state !== 'idle') return;
    setState('sending');
    const res = await fetch('/api/wave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: fromUserId, venueId }),
    });
    const data = await res.json();
    if (data.matched) {
      router.push(`/chat/${data.matchId}?justMatched=1`);
      return;
    }
    setState('idle');
  }

  return (
    <button
      onClick={handleWaveBack}
      disabled={state !== 'idle'}
      className="rounded-full bg-brass px-4 py-2 text-xs font-semibold text-ink hover:bg-brass-bright"
    >
      {state === 'sending' ? '…' : 'Wave back'}
    </button>
  );
}
