import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { diagnostiquer, signatureConfiguree } from '@/lib/yousign';

export const dynamic = 'force-dynamic';

/** Dit quel environnement Yousign accepte la clé posée sur ce déploiement. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!signatureConfiguree()) {
    return NextResponse.json({ error: "Aucune clé Yousign sur ce déploiement." }, { status: 503 });
  }

  return NextResponse.json({ resultats: await diagnostiquer() });
}
