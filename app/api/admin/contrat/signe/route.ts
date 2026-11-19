import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Le contrat tel qu'il a ete signe, depuis la fiche du lieu.
 *
 * Le signataire garde son lien, et nous un e-mail avec la piece jointe. Mais un
 * an plus tard, au moment d'un renouvellement ou d'un litige, personne ne
 * retrouve ni le lien ni l'e-mail : le seul endroit ou on pense a chercher est
 * la fiche de l'etablissement. Le document est deja en base, figer tel qu'il a
 * ete envoye — il ne manquait qu'une porte d'entree cote interne.
 *
 * On ne reconstruit rien : un contrat regenere aujourd'hui depuis la fiche ne
 * serait pas celui que le gerant a signe, les conditions ayant pu changer
 * entre-temps.
 */
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
  const { data: s } = await service
    .from('contrat_signatures')
    .select('pdf_base64, pdf_signe_base64, signe_le, crm_venue_id')
    .eq('id', id)
    .maybeSingle();

  if (!s) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const { data: c } = await service
    .from('crm_venues')
    .select('name')
    .eq('id', s.crm_venue_id)
    .maybeSingle();

  const brut = s.pdf_signe_base64 ?? s.pdf_base64;
  if (!brut) return NextResponse.json({ error: 'Aucun document enregistre' }, { status: 404 });

  // Un en-tete HTTP est une suite d'octets : un seul caractere au-dela de 255
  // ferait rejeter la reponse entiere, d'ou le nom reduit a l'ASCII.
  const joli = `Contrat Lucky - ${c?.name ?? ''}${s.signe_le ? ' - signe' : ''}.pdf`;
  const ascii =
    joli
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/["\\]/g, '') || 'contrat.pdf';

  return new NextResponse(Buffer.from(brut, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(joli)}`,
      'Cache-Control': 'no-store',
    },
  });
}
