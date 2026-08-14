import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from './OnboardingForm';
import { OnboardingHeader } from './OnboardingHeader';

export default async function OnboardingPage({ searchParams }: { searchParams: { next?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No auth redirect here on purpose: an unauthenticated visitor fills the profile
  // form first, then verifies their email at the end (see OnboardingForm) — this is
  // the intentional "profile first, email last" order for a smoother first-touch flow.
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    : { data: null };
  const isEdit = Boolean(profile);

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16">
      <OnboardingHeader isEdit={isEdit} />
      <OnboardingForm userId={user?.id ?? null} existingProfile={profile ?? undefined} next={searchParams.next} />
    </main>
  );
}
