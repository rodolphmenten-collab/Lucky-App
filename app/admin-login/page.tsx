'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');

  // Première connexion ou mot de passe oublié : même geste, même écran.
  // Quelqu'un qui vient d'être ajouté à l'équipe arrive souvent ici sans avoir
  // ouvert le lien de son e-mail d'invitation, et se retrouvait coincé devant
  // un mot de passe qu'il n'avait jamais choisi.
  const [envoi, setEnvoi] = useState<'idle' | 'envoi' | 'envoye'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });

    if (signInErr) {
      setStatus('error');
      setError('Email ou mot de passe incorrect.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  async function envoyerLien() {
    if (!email) {
      setStatus('error');
      setError('Indiquez d’abord votre adresse e-mail.');
      return;
    }
    setEnvoi('envoi');
    setError('');
    await fetch('/api/admin/lien-acces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);
    setEnvoi('envoye');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Logo size={36} />
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Admin</p>
      <h1 className="mt-4 font-display text-3xl italic text-bone">Accès au back-office.</h1>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        Réservé à l&rsquo;équipe Lucky. Connectez-vous avec votre adresse et le mot de passe
        que vous avez choisi en activant votre accès.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="votre adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <Button type="submit" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Connexion…' : 'Se connecter'}
        </Button>
        {status === 'error' && <p className="text-xs text-red-400">{error}</p>}
      </form>

      {envoi === 'envoye' ? (
        <p className="mt-6 rounded-2xl border border-brass/40 bg-brass/5 px-5 py-4 text-xs leading-relaxed text-bone">
          Si cette adresse fait partie de l&rsquo;équipe, un lien vient d&rsquo;y être envoyé.
          Ouvrez-le pour choisir votre mot de passe, puis revenez ici.
        </p>
      ) : (
        <button
          type="button"
          onClick={envoyerLien}
          disabled={envoi === 'envoi'}
          className="mt-6 w-full text-center text-xs leading-relaxed text-bone-faint underline underline-offset-4 hover:text-bone-dim"
        >
          {envoi === 'envoi'
            ? 'Envoi…'
            : 'Première connexion, ou mot de passe oublié ? Recevoir un lien'}
        </button>
      )}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-bone-faint">
        Vous gérez un établissement partenaire ? C&rsquo;est la même adresse et le même mot
        de passe : un seul compte, plusieurs rôles.
      </p>
    </main>
  );
}
