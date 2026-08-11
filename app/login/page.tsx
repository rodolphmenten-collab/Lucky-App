'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? 'error' : 'sent');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Sign in</p>
      <h1 className="mt-4 font-display text-3xl italic text-bone">Enter the room.</h1>
      <p className="mt-3 text-sm text-bone-dim">
        We&rsquo;ll email you a one-time link. No password to remember.
      </p>

      {status === 'sent' ? (
        <p className="mt-8 rounded-2xl border hairline bg-ink-800 p-5 text-sm text-bone-dim">
          Check <span className="text-bone">{email}</span> for your link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
          />
          <Button type="submit" disabled={status === 'sending'} className="w-full">
            {status === 'sending' ? 'Sending\u2026' : 'Send magic link'}
          </Button>
          {status === 'error' && (
            <p className="text-xs text-red-400">Something went wrong \u2014 try again.</p>
          )}
        </form>
      )}
    </main>
  );
}
