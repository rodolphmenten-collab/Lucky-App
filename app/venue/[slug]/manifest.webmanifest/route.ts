import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Manifeste d'installation propre à chaque lieu.
 *
 * Une application installée ne porte qu'un seul nom, celui de son manifeste.
 * Un manifeste unique aurait donc écrit « Lucky » sur l'écran d'accueil de
 * chaque personne, ce qui ruine la marque blanche au moment le plus visible.
 * Servi depuis la page du lieu, ce manifeste fait apparaître l'icône au nom du
 * lieu scanné — et l'ouvre directement sur sa salle.
 *
 * Limite assumée : quelqu'un qui installe depuis un second lieu garde l'icône
 * du premier. C'est le prix de la marque blanche sur une application unique.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const service = createServiceClient();
  const { data: venue } = await service
    .from('venues')
    .select('name')
    .eq('slug', params.slug)
    .maybeSingle();

  const nom = venue?.name ?? 'Sur place';

  return NextResponse.json(
    {
      name: nom,
      short_name: nom.length > 12 ? nom.slice(0, 12) : nom,
      description: 'Les personnes présentes ici, maintenant.',
      start_url: `/venue/${params.slug}`,
      scope: '/',
      display: 'standalone',
      background_color: '#0B0A08',
      theme_color: '#0B0A08',
      orientation: 'portrait',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
