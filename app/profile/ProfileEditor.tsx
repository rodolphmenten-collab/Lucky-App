'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/lib/types';

export function ProfileEditor({
  profile,
  currentVenue,
  currentCheckInId,
  connectionCount,
}: {
  profile: Profile;
  currentVenue: { name: string; slug: string } | null;
  currentCheckInId: string | null;
  connectionCount: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [visible, setVisible] = useState(profile.visible);
  const [saving, setSaving] = useState(false);

  async function toggleVisibility() {
    setSaving(true);
    const next = !visible;
    const { error } = await supabase.from('profiles').update({ visible: next }).eq('id', profile.id);
    if (!error) setVisible(next);
    setSaving(false);
  }

  async function leaveVenue() {
    if (!currentCheckInId) return;
    await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId: currentCheckInId }),
    });
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-ink-700">
          {profile.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-display text-2xl italic text-bone">
            {profile.first_name}
            {profile.age ? `, ${profile.age}` : ''}
          </p>
          <p className="text-xs text-bone-dim">{[profile.job, profile.city].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/matches" className="rounded-2xl border hairline p-4">
          <p className="font-display text-xl text-bone">{connectionCount}</p>
          <p className="mt-1 text-xs text-bone-faint">Connections</p>
        </Link>
        <div className="rounded-2xl border hairline p-4">
          <p className="font-display text-sm text-bone">{currentVenue?.name ?? 'Not checked in'}</p>
          <p className="mt-1 text-xs text-bone-faint">Current venue</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border hairline p-4">
        <div>
          <p className="text-sm text-bone">Visible here</p>
          <p className="mt-0.5 text-xs text-bone-faint">
            {visible ? 'Others at your venue can see you.' : 'You’re invisible in People Here.'}
          </p>
        </div>
        <button
          onClick={toggleVisibility}
          disabled={saving}
          className={`relative h-7 w-12 rounded-full transition-colors ${visible ? 'bg-brass' : 'bg-ink-700'}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-bone transition-transform ${
              visible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {currentVenue && (
        <button
          onClick={leaveVenue}
          className="mt-4 w-full rounded-full border hairline py-3 text-xs tracking-wide text-bone-dim hover:border-white/30"
        >
          Leave {currentVenue.name}
        </button>
      )}

      <div className="mt-10 flex justify-between text-xs text-bone-faint">
        <Link href="/onboarding" className="underline">
          Edit details
        </Link>
        <button onClick={signOut} className="underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
