import { createServiceClient } from '@/lib/supabase/server';
import { LUCKY_SIGNATAIRES } from '@/lib/contrat';

export const dynamic = 'force-dynamic';
// Aucune lecture ne doit venir d'un cache : entre deux affichages de cette
// page, le gérant a pu signer.
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * La page que voit le gérant quand il clique sur le lien reçu par e-mail.
 *
 * Volontairement courte : le document, son nom, une case, un bouton. Tout le
 * reste — preuve, horodatage, envoi du document final — se passe derrière.
 */
export default async function SignerPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { err?: string; t?: string };
}) {
  const service = createServiceClient();
  const { data: s } = await service
    .from('contrat_signatures')
    .select('crm_venue_id, destinataire_email, signataire_attendu, signe_le, signe_par, annule_le')
    .eq('token', params.token)
    .maybeSingle();

  const contact = LUCKY_SIGNATAIRES[0]?.email.trim() ?? 'contact@lucky-app.io';

  if (!s || s.annule_le) {
    return (
      <Cadre>
        <h1 className="text-xl font-semibold text-bone">Ce lien n’est plus valide</h1>
        <p className="mt-3 text-sm text-bone-dim">
          Il a peut-être été remplacé par une version corrigée du contrat. Écrivez-nous à{' '}
          <a href={`mailto:${contact}`} className="text-brass underline">{contact}</a> et nous vous
          renvoyons le bon.
        </p>
      </Cadre>
    );
  }

  const { data: c } = await service
    .from('crm_venues')
    .select('name')
    .eq('id', s.crm_venue_id)
    .maybeSingle();

  // Avant signature et après, ce n'est pas le même document. L'URL porte donc
  // l'horodatage de la signature : sans lui, le lien de téléchargement renvoie
  // la version qu'un cache a retenue pendant la relecture — le contrat non
  // signé, servi au signataire qui vient justement de le signer.
  const pdf = s.signe_le
    ? `/api/signer/${params.token}/pdf?signe=${encodeURIComponent(s.signe_le)}`
    : `/api/signer/${params.token}/pdf`;

  if (s.signe_le) {
    const quand = new Date(s.signe_le).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });

    return (
      <Cadre>
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/70">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
            <path
              d="M4.5 12.5l5 5 10-11"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            />
          </svg>
        </div>

        <h1 className="mt-6 font-display text-3xl italic text-bone">Votre contrat est signé.</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          {c?.name} est désormais partenaire Lucky. Vous n’avez plus rien à faire.
        </p>

        <dl className="mt-7 divide-y hairline rounded-2xl border hairline text-sm">
          <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
            <dt className="text-bone-faint">Signé par</dt>
            <dd className="text-right text-bone">{s.signe_par}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
            <dt className="text-bone-faint">Le</dt>
            <dd className="text-right text-bone">{quand}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
            <dt className="text-bone-faint">Copie envoyée à</dt>
            <dd className="break-all text-right text-bone">{s.destinataire_email}</dd>
          </div>
        </dl>

        <a
          href={pdf}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-bone px-5 text-sm font-medium text-ink"
        >
          Télécharger le contrat signé
        </a>

        <div className="mt-8 border-t hairline pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">La suite</p>
          <ol className="mt-3 space-y-3 text-sm leading-relaxed text-bone-dim">
            <li>
              <span className="text-bone">Vous recevez le contrat par e-mail.</span> Il porte la page
              de preuve de votre signature — horodatage et empreinte du document. Conservez-le.
            </li>
            <li>
              <span className="text-bone">Nous préparons vos supports.</span> Les plaques au nom de
              votre établissement sont fabriquées et installées avec vous.
            </li>
            <li>
              <span className="text-bone">Nous vous recontactons</span> pour caler la mise en route et
              répondre à vos questions.
            </li>
          </ol>
          <p className="mt-6 text-xs leading-relaxed text-bone-faint">
            Une question, une erreur dans le contrat ? Écrivez-nous à{' '}
            <a href={`mailto:${contact}`} className="text-brass underline">
              {contact}
            </a>
            .
          </p>
        </div>
      </Cadre>
    );
  }

  const messages: Record<string, string> = {
    nom: 'Merci d’indiquer votre nom et prénom.',
    accepte: 'Il faut cocher la case pour signer.',
    serveur: 'Un problème est survenu. Réessayez dans un instant.',
    lien: 'Ce lien n’est plus valide.',
  };
  const erreur = searchParams.err ? messages[searchParams.err] : null;

  return (
    <Cadre large>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">Lucky</p>
      <h1 className="mt-3 text-xl font-semibold text-bone">Votre contrat — {c?.name}</h1>
      <p className="mt-2 text-sm text-bone-dim">
        Relisez le document ci-dessous, puis signez en bas de page.
      </p>

      <object data={pdf} type="application/pdf" className="mt-6 h-[60vh] w-full rounded-lg bg-white">
        <p className="p-4 text-sm text-ink">
          <a href={pdf} className="underline">Ouvrir le contrat (PDF)</a>
        </p>
      </object>

      <p className="mt-2 text-right text-xs">
        <a href={pdf} target="_blank" rel="noopener noreferrer" className="text-brass underline">
          Ouvrir dans un nouvel onglet
        </a>
      </p>

      <form action={`/api/signer/${params.token}`} method="post" className="mt-8 space-y-4">
        <div>
          <label htmlFor="nom" className="block text-sm text-bone">
            Votre nom et prénom
          </label>
          <input
            id="nom"
            name="nom"
            required
            minLength={3}
            defaultValue={s.signataire_attendu ?? ''}
            className="mt-2 w-full rounded-lg border border-brass/30 bg-ink px-4 py-3 text-bone outline-none focus:border-brass"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-bone-dim">
          <input
            type="checkbox"
            name="accepte"
            required
            className="mt-1 h-5 w-5 flex-shrink-0 accent-brass"
          />
          <span>
            Je reconnais avoir lu le contrat et les conditions générales, et je les accepte. Je signe
            électroniquement au nom de {c?.name}.
          </span>
        </label>

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}

        <button
          type="submit"
          className="min-h-[48px] w-full rounded-full bg-brass px-6 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Signer le contrat
        </button>

        <p className="text-xs text-bone-faint">
          En signant, la date, l’heure, votre adresse IP et votre navigateur sont enregistrés et
          ajoutés au document comme preuve de signature. Vous recevrez le contrat définitif par e-mail.
        </p>
      </form>
    </Cadre>
  );
}

function Cadre({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <main className="min-h-screen bg-ink px-4 py-10">
      <div className={`mx-auto ${large ? 'max-w-[760px]' : 'max-w-[480px]'}`}>
        <div className="rounded-2xl border border-brass/25 bg-brass/[0.03] p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
