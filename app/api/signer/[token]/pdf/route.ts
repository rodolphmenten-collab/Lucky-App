import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Le PDF du contrat, servi au signataire par son lien.
 *
 * Le jeton tient lieu d'autorisation : il est tiré au sort sur 32 octets et
 * n'est transmis qu'au destinataire. Une fois signé, c'est le document final,
 * page de preuve comprise, qui est servi.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const service = createServiceClient();
  const { data: s } = await service
    .from('contrat_signatures')
    .select('pdf_base64, pdf_signe_base64, annule_le, crm_venue_id')
    .eq('token', params.token)
    .maybeSingle();

  if (!s || s.annule_le) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });

  const { data: c } = await service
    .from('crm_venues')
    .select('name')
    .eq('id', s.crm_venue_id)
    .maybeSingle();

  const pdf = Buffer.from(s.pdf_signe_base64 ?? s.pdf_base64, 'base64');

  // Un en-tête HTTP est une suite d'octets : un seul caractère au-delà de 255
  // ferait rejeter la réponse entière, d'où le nom réduit à l'ASCII.
  const ascii =
    `Contrat Lucky - ${c?.name ?? ''}.pdf`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/["\\]/g, '') || 'contrat.pdf';

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"`,
      'Cache-Control': 'no-store',
    },
  });
}
