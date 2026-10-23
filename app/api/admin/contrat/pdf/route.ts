import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { construireContratPdf } from '@/lib/contratPdf';

export const dynamic = 'force-dynamic';

/** Le même PDF que celui envoyé à la signature — pour le relire avant d'envoyer. */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const service = createServiceClient();
  const { data: c } = await service.from('crm_venues').select('*').eq('id', id).maybeSingle();
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const pdf = await construireContratPdf(c);
  const nom = `Contrat Lucky — ${c.name}`.replace(/[^\wÀ-ſ —-]/g, '');

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nom}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
