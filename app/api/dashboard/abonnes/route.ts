import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Échappement CSV : une virgule ou un guillemet dans un prénom casse le fichier. */
function champ(v: string): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const venueId = new URL(request.url).searchParams.get('venue');
  if (!venueId) return NextResponse.json({ error: 'Lieu manquant' }, { status: 400 });

  const { data: lien } = await supabase
    .from('venue_admins')
    .select('venue_id')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (!lien) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  const { data: abonnes } = await supabase.rpc('venue_followers', { p_venue_id: venueId });

  const lignes = [
    ['prenom', 'email', 'accord_donne_le'].join(','),
    ...(abonnes ?? []).map((a: any) =>
      [
        champ(a.first_name ?? ''),
        champ(a.email ?? ''),
        champ(new Date(a.consented_at).toISOString().slice(0, 10)),
      ].join(',')
    ),
  ];

  // BOM UTF-8 : sans lui, Excel affiche « Benoît » en « BenoÃ®t ».
  const csv = '﻿' + lignes.join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="abonnes.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
