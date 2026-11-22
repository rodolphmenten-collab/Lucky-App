import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Les pages juridiques existent en deux versions complètes et séparées : la
 * française, qui fait foi, et l'anglaise. Aucune des deux ne mélange les
 * langues — un client français ne doit pas tomber sur un paragraphe anglais au
 * milieu de ses conditions.
 *
 * Reste à amener chacun sur la bonne. Celui qui arrive avec un navigateur qui
 * ne demande pas le français est renvoyé vers la version anglaise : c'est le
 * cas d'un partenaire de paiement ou d'un établissement étranger à qui on a
 * transmis le lien français, et qui autrement lirait un document qu'il ne
 * comprend pas.
 *
 * La redirection ne doit jamais tourner en boucle avec le lien « Version
 * française » de la page anglaise : ce lien porte `?fr=1`, qui court-circuite
 * la détection et dépose un cookie pour que le choix tienne ensuite.
 */
const VERSIONS_ANGLAISES: Record<string, string> = {
  '/legal/usage': '/legal/acceptable-use',
  '/legal/utilisateurs': '/legal/terms',
};

const COOKIE_LANGUE = 'lucky_legal_lang';

function demandeLeFrancais(entete: string | null): boolean {
  if (!entete) return false;
  // « fr », « fr-FR », « fr-BE », et aussi « en-US,fr;q=0.8 » : il suffit que le
  // francais figure parmi les langues acceptees pour qu'on le serve.
  return /(^|,)\s*fr\b/i.test(entete);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const versionAnglaise = VERSIONS_ANGLAISES[pathname];

  if (versionAnglaise) {
    const choixExplicite = searchParams.get('fr') === '1';
    const dejaChoisi = request.cookies.get(COOKIE_LANGUE)?.value === 'fr';

    if (choixExplicite || dejaChoisi) {
      const reponse = NextResponse.next();
      if (choixExplicite) {
        reponse.cookies.set(COOKIE_LANGUE, 'fr', { path: '/', maxAge: 60 * 60 * 24 * 365 });
      }
      return reponse;
    }

    if (!demandeLeFrancais(request.headers.get('accept-language'))) {
      const url = request.nextUrl.clone();
      url.pathname = versionAnglaise;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/stripe/webhook est exclu : il est authentifié par la signature Stripe
    // sur le corps brut, pas par une session, et n'a rien à rafraîchir.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
