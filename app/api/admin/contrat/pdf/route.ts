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

  // Un en-tete HTTP est une suite d'octets : un seul caractere au-dela de 255
  // — un tiret cadratin, par exemple — fait rejeter la reponse entiere, pas
  // seulement le nom de fichier. D'ou un nom ASCII ici, et le vrai nom
  // accentue dans filename*, que les navigateurs preferent quand il est la.
  const joli = `Contrat Lucky - ${c.name}.pdf`;
  const ascii =
    joli
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/["\\]/g, '') || 'contrat.pdf';

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(joli)}`,
      'Cache-Control': 'no-store',
    },
  });
}
