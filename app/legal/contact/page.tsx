import Link from 'next/link';

export const metadata = { title: 'Contact et mentions légales | Lucky' };

/**
 * Page de contact et mentions légales.
 *
 * Document autonome et accessible sans compte : identité de l'éditeur, adresse
 * postale, et les adresses de contact selon le motif. Les partenaires de
 * paiement veulent pouvoir identifier le commerçant et le joindre sans passer
 * par un formulaire.
 */
export default function Contact() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l&rsquo;accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Contact</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Nous joindre</h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 18/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <h2 className="text-base font-semibold text-bone">Éditeur du service</h2>
          <p className="mt-2">
            <strong className="text-bone">LUCKY</strong>, société par actions simplifiée au capital de 200
            euros, immatriculée au Registre du commerce et des sociétés de Paris sous le numéro
            132&nbsp;148&nbsp;941.
          </p>
          <p className="mt-2">
            Siège social : 8 bis rue Abel, 75012 Paris, France.
            <br />
            Site : <span className="text-bone">lucky-app.io</span>
          </p>
          <p className="mt-2">
            Directeur de la publication : le représentant légal de LUCKY.
            <br />
            Hébergement : Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis.
            Base de données hébergée dans l&rsquo;Union européenne.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Qui écrire, selon le motif</h2>
          <table className="mt-3 w-full text-left text-xs">
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="py-2 pr-4 text-bone">Question générale, établissement, facturation</td>
                <td className="py-2">
                  <a href="mailto:hello@lucky-app.io" className="text-brass underline">
                    hello@lucky-app.io
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-bone">Signaler un comportement ou un contenu</td>
                <td className="py-2">
                  <a href="mailto:signalement@lucky-app.io" className="text-brass underline">
                    signalement@lucky-app.io
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-bone">Données personnelles, exercice de vos droits</td>
                <td className="py-2">
                  <a href="mailto:privacy@lucky-app.io" className="text-brass underline">
                    privacy@lucky-app.io
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-bone">Demandes des autorités, réquisitions judiciaires</td>
                <td className="py-2">
                  <a href="mailto:legal@lucky-app.io" className="text-brass underline">
                    legal@lucky-app.io
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3">
            Nous répondons sous cinq (5) jours ouvrés. Les signalements urgents sont traités le jour même.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">En cas de danger immédiat</h2>
          <p className="mt-2">
            Prévenez d&rsquo;abord le personnel de l&rsquo;établissement, puis composez le 17 (police) ou le 112
            (urgences européennes). Nous traitons des comptes, pas des urgences.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Nos autres documents</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <Link href="/legal/utilisateurs" className="text-brass underline">
                Conditions générales d&rsquo;utilisation
              </Link>
            </li>
            <li>
              <Link href="/legal/etablissements" className="text-brass underline">
                Conditions générales de vente — établissements
              </Link>
            </li>
            <li>
              <Link href="/legal/usage" className="text-brass underline">
                Politique d&rsquo;usage acceptable
              </Link>
            </li>
            <li>
              <Link href="/legal/confidentialite" className="text-brass underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/legal/remboursement" className="text-brass underline">
                Politique de remboursement
              </Link>
            </li>
            <li>
              <Link href="/legal/autorites" className="text-brass underline">
                Réponse aux demandes des autorités
              </Link>
            </li>
            <li>
              <Link href="/tarifs" className="text-brass underline">
                Tarifs
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
