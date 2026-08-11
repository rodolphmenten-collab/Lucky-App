'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

const VENUE_TYPES = ['Hotel', 'Restaurant', 'Bar', 'Rooftop', 'Beach Club', 'Coworking', 'Event'];

export default function VenueSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    venueName: '',
    city: '',
    venueType: 'Hotel',
    plan: 'essentiel',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const res = await fetch('/api/venue-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus('error');
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    // Account + venue created server-side — now establish the browser session.
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInErr) {
      setStatus('error');
      setError('Account created, but sign-in failed — try signing in manually.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Get started</p>
      <h1 className="mt-4 font-display text-3xl italic text-bone">Create your venue account.</h1>
      <p className="mt-3 text-sm text-bone-dim">
        Already have an account?{' '}
        <Link href="/venue-login" className="text-brass underline">
          Log in
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          placeholder="Work email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <input
          required
          placeholder="Venue name"
          value={form.venueName}
          onChange={(e) => update('venueName', e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <select
          value={form.venueType}
          onChange={(e) => update('venueType', e.target.value)}
          className="w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
        >
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={form.plan}
          onChange={(e) => update('plan', e.target.value)}
          className="w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
        >
          <option value="basique">Basique — 99€/mo</option>
          <option value="essentiel">Essentiel — 149€/mo</option>
          <option value="premium">Premium — 299€/mo</option>
        </select>

        {status === 'error' && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </main>
  );
}
