'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { INTENTION_META } from '@/lib/intentions';
import type { Intention, Profile } from '@/lib/types';

const ALL_INTENTIONS: Intention[] = ['dating', 'business', 'social', 'looking'];

export function OnboardingForm({
  userId,
  existingProfile,
  next,
}: {
  userId: string | null;
  existingProfile?: Profile;
  next?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(existingProfile);

  // 'profile' collects the details; 'verify' only appears for someone who wasn't
  // already signed in, right at the end, so they've invested effort before being
  // asked for their email.
  const [step, setStep] = useState<'profile' | 'verify'>('profile');

  const [firstName, setFirstName] = useState(existingProfile?.first_name ?? '');
  const [age, setAge] = useState(existingProfile?.age ? String(existingProfile.age) : '');
  const [city, setCity] = useState(existingProfile?.city ?? '');
  const [job, setJob] = useState(existingProfile?.job ?? '');
  const [bio, setBio] = useState(existingProfile?.bio ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(existingProfile?.linkedin_url ?? '');
  const [intentions, setIntentions] = useState<Intention[]>(existingProfile?.intentions ?? []);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingProfile?.photo_url ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState('');

  function toggleIntention(i: Intention) {
    setIntentions((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveProfile(uid: string, skipIfExists: boolean) {
    if (skipIfExists) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
      if (existing) return { error: null };
    }

    let photoUrl: string | null = existingProfile?.photo_url ?? null;
    if (photoFile) {
      const path = `${uid}/${Date.now()}-${photoFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, photoFile, {
        upsert: true,
      });
      if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` };
      photoUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      id: uid,
      first_name: firstName,
      age: age ? Number(age) : null,
      city: city || null,
      job: job || null,
      bio: bio || null,
      photo_url: photoUrl,
      linkedin_url: linkedinUrl || null,
      intentions,
      visible: existingProfile?.visible ?? true,
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(payload);
    return { error: upsertErr?.message ?? null };
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || intentions.length === 0) {
      setError('Add your name and at least one reason you\u2019re here.');
      return;
    }
    setError(null);

    if (userId) {
      setSubmitting(true);
      const { error: saveErr } = await saveProfile(userId, false);
      setSubmitting(false);
      if (saveErr) {
        setError(saveErr);
        return;
      }
      router.push(next || '/profile');
      return;
    }

    setStep('verify');
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifyStatus('sending');
    setVerifyError('');
    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setVerifyStatus('error');
      setVerifyError(data.error ?? 'Something went wrong.');
      return;
    }
    setVerifyStatus('sent');
    setCodeSent(true);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifyStatus('verifying');
    setVerifyError('');

    const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (verifyErr) {
      setVerifyStatus('error');
      setVerifyError(verifyErr.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setVerifyStatus('error');
      setVerifyError('Could not confirm your session — try again.');
      return;
    }

    const { error: saveErr } = await saveProfile(user.id, true);
    if (saveErr) {
      setVerifyStatus('error');
      setVerifyError(saveErr);
      return;
    }

    router.push(next || '/profile');
    router.refresh();
  }

  if (step === 'verify') {
    return (
      <div className="mt-10">
        <p className="text-sm text-bone-dim">
          Almost there — we just need to confirm it&rsquo;s really you.
        </p>

        {codeSent ? (
          <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
            <p className="rounded-2xl border hairline bg-ink-800 p-5 text-sm text-bone-dim">
              Check <span className="text-bone">{email}</span> and enter the code below.
            </p>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-center text-lg tracking-[0.3em] text-bone placeholder:text-bone-faint focus:border-brass"
            />
            <Button type="submit" disabled={verifyStatus === 'verifying' || code.length < 6} className="w-full">
              {verifyStatus === 'verifying' ? 'Verifying\u2026' : 'Continue'}
            </Button>
            {verifyStatus === 'error' && <p className="text-xs text-red-400">{verifyError}</p>}
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setVerifyStatus('idle');
                setCode('');
                setVerifyError('');
              }}
              className="w-full text-center text-xs text-bone-faint underline"
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
            />
            <Button type="submit" disabled={verifyStatus === 'sending'} className="w-full">
              {verifyStatus === 'sending' ? 'Sending\u2026' : 'Send code'}
            </Button>
            {verifyStatus === 'error' && (
              <p className="text-xs text-red-400">{verifyError || 'Something went wrong.'}</p>
            )}
            <button
              type="button"
              onClick={() => setStep('profile')}
              className="w-full text-center text-xs text-bone-faint underline"
            >
              &larr; Back
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleProfileSubmit} className="mt-10 space-y-6">
      <div className="flex items-center gap-4">
        <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border hairline bg-ink-800 text-xs text-bone-faint">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            'Photo'
          )}
          <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
        </label>
        <p className="text-xs text-bone-faint">A real, recent photo of your face.</p>
      </div>

      <input
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="Age"
          type="number"
          min={18}
          max={100}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
        />
      </div>

      <input
        placeholder="Job / company"
        value={job}
        onChange={(e) => setJob(e.target.value)}
        className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
      />

      <textarea
        placeholder="Short bio (optional)"
        value={bio}
        maxLength={280}
        onChange={(e) => setBio(e.target.value)}
        rows={2}
        className="w-full rounded-2xl border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
      />

      <input
        type="url"
        placeholder="LinkedIn profile (optional)"
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
      />

      <div>
        <p className="mb-3 text-sm text-bone">What are you here for?</p>
        <div className="flex flex-wrap gap-2">
          {ALL_INTENTIONS.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => toggleIntention(i)}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-colors ${
                intentions.includes(i)
                  ? 'border-brass bg-brass/10 text-brass'
                  : 'hairline text-bone-dim hover:border-white/30'
              }`}
            >
              {INTENTION_META[i].symbol} {INTENTION_META[i].label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving\u2026' : isEdit ? 'Save changes' : 'Continue'}
      </Button>
    </form>
  );
}
