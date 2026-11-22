import Link from 'next/link';

export const metadata = { title: 'Terms of Service | Lucky' };

/**
 * Version anglaise des CGU.
 *
 * Meme principe que /legal/acceptable-use : deux documents complets et
 * separes, aucun melange de langues dans l'un ou l'autre, et le francais fait
 * foi. Le middleware envoie ici le visiteur dont le navigateur ne demande pas
 * le francais.
 */
export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Back to home
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Terms</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Terms of Service</h1>
      <p className="mt-3 text-xs text-bone-faint">
        Last updated: 22/11/2026 ·{' '}
        <Link href="/legal/utilisateurs?fr=1" className="text-brass underline">
          Version française
        </Link>
      </p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <h2 className="text-base font-semibold text-bone">Publisher</h2>
          <p className="mt-2">
            Lucky is published by LUCKY, a French simplified joint-stock company (SAS) with a share capital of
            EUR 200, registered with the Paris Trade and Companies Register under number 132 148 941, with its
            registered office at 8 bis rue Abel, 75012 Paris, France. Contact: hello@lucky-app.io.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 1 — Purpose and acceptance</h2>
          <p className="mt-2">
            These Terms of Service (the &laquo;&nbsp;Terms&nbsp;&raquo;) govern access to and use of the Lucky
            service by any natural person (the &laquo;&nbsp;User&nbsp;&raquo;). Access to a Lucky room (the
            &laquo;&nbsp;Room&nbsp;&raquo;), after scanning a QR code inside a partner venue, is conditional on
            the express and prior acceptance of these Terms. Such acceptance is a mandatory prerequisite to any
            use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 2 — Conditions of access</h2>
          <p className="mt-2">
            Use of the service is restricted to persons aged 18 or over. By creating a profile, the User
            certifies that they are at least 18 years old and warrants the accuracy of the information
            provided, in particular their first name, age and photograph, which must be a recent and accurate
            photograph of the User themselves.
          </p>
          <p className="mt-2">
            Impersonation, the creation of a fake profile, or the communication of misleading information is
            strictly prohibited and may result in the immediate suspension of the account, without prejudice to
            any legal proceedings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 3 — How the service works</h2>
          <p className="mt-2">
            Once their physical presence has been verified by location signal inside a partner venue, Lucky
            allows the User to view the profiles of other Users who are also present and have chosen to make
            their profile visible, and to send them a message directly within the application. The recipient is
            free to reply or not to reply.
          </p>
          <p className="mt-2">
            Until they receive a reply, a User may send only one message to any given person. This limit is
            enforced server-side. Its purpose is to prevent persistence, and it cannot be circumvented.
          </p>
          <p className="mt-2">
            A User may at any time block another person, who then stops being visible to them and can no longer
            reach them, or report that person to the Lucky team. The applicable rules of conduct are set out in
            the Acceptable Use Policy, available at lucky-app.io/legal/acceptable-use.
          </p>
          <p className="mt-2">
            Presence verification relies on the location data transmitted by the User&rsquo;s device when
            connecting and at regular intervals thereafter. This verification is a reasonable technical measure
            and does not constitute an absolute guarantee of accuracy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 4 — Rules of conduct</h2>
          <p className="mt-2">
            The rules of use are set out in the{' '}
            <Link href="/legal/acceptable-use" className="text-brass underline">
              Acceptable Use Policy
            </Link>
            , which forms an integral part of these Terms. In summary, the User undertakes not to, when using
            the service:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Use the service for human trafficking, including sexual exploitation, or to aid, abet, facilitate
              or encourage such conduct or any form of abuse;
            </li>
            <li>
              Use the service for child sexual exploitation and abuse (CSEA) in any form, including the
              production, solicitation, possession, distribution or promotion of child sexual abuse material
              (CSAM), or any attempt to contact a minor for sexual purposes;
            </li>
            <li>
              Commit, prepare, facilitate, threaten or glorify sexual violence — rape, sexual assault, or any
              sexual act imposed without free and informed consent;
            </li>
            <li>
              Create, request, share or threaten to share intimate images or videos of a person without their
              consent, including computer-generated or altered content;
            </li>
            <li>Harass, threaten, insult or pester another User;</li>
            <li>
              Post or transmit unlawful, violent, pornographic, discriminatory or defamatory content;
            </li>
            <li>
              Use the service for commercial, advertising or unauthorised solicitation purposes;
            </li>
            <li>
              Create several profiles, or a profile in the name of a third party without their consent;
            </li>
            <li>Circumvent or attempt to circumvent presence verification mechanisms;</li>
            <li>
              Harm, in any way whatsoever, the safety or integrity of another User.
            </li>
          </ul>
          <div className="mt-4 rounded-xl border border-brass/40 bg-brass/5 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Zero tolerance</p>
            <p className="mt-3 text-bone">
              <strong className="text-bone">The service may not be used:</strong>
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-bone">
              <li>
                for human trafficking, including sexual exploitation, or to aid, abet or encourage abuse;
              </li>
              <li>
                for child sexual exploitation and abuse (CSEA) in any form, including the production,
                solicitation, possession, distribution or promotion of child sexual abuse material (CSAM), or
                any attempt to contact a minor for sexual purposes;
              </li>
              <li>
                to commit, prepare, facilitate, threaten or glorify sexual violence — rape, sexual assault, or
                any sexual act imposed without free and informed consent;
              </li>
              <li>
                to create, request, share or threaten to share intimate images or videos of a person without
                their consent, including computer-generated or altered content.
              </li>
            </ul>
            <p className="mt-3 text-bone">
              Any account we have serious reason to believe is used for such purposes is deleted immediately,
              without notice, and reported to the competent authorities — in France, the Ministry of the
              Interior&rsquo;s PHAROS platform.
            </p>
          </div>
          <p className="mt-2">
            Any breach of these undertakings may result in the immediate suspension or deletion of the
            User&rsquo;s account, without notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">
            Article 5 — Meetings and interactions between Users: essential warning
          </h2>
          <p className="mt-2 font-medium text-bone">
            The User expressly acknowledges and accepts the following before any use of the service:
          </p>
          <p className="mt-2">
            Lucky is a connection tool based on declared physical presence. LUCKY carries out no in-depth
            identity verification, no criminal record or background checks, and gives no guarantee whatsoever
            as to the real identity, intentions, behaviour or reliability of other Users.
          </p>
          <p className="mt-2">
            Any interaction, exchange or meeting between Users, whether physical or not, takes place under
            their sole and entire responsibility. LUCKY and the partner venue in which the connection took
            place are not parties to any such interaction and disclaim all liability for its consequences,
            including in the event of bodily, material or non-material harm.
          </p>
          <p className="mt-2">
            It is for each User to exercise ordinary caution when meeting a person they came to know through
            the service, in particular at a first physical meeting (choosing a public place, telling someone
            close to them, and so on).
          </p>
          <p className="mt-2">
            The service provides Users with features to report and block another User. These features are tools
            made available and cannot give rise to any liability on the part of LUCKY under an obligation of
            supervision or of result.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 6 — Reporting, blocking and moderation</h2>
          <p className="mt-2">
            Any User may report or block another User directly from the application. LUCKY reserves the right
            to review any report and to suspend or delete, at its sole discretion, any account whose behaviour
            breaches these Terms or the law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 7 — Visibility and account deletion</h2>
          <p className="mt-2">
            The User may at any time make their profile invisible, leave a Room, or request the deletion of
            their account and data in accordance with the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 8 — Personal data</h2>
          <p className="mt-2">
            The processing of the User&rsquo;s personal data is described in Lucky&rsquo;s{' '}
            <a href="/legal/confidentialite" className="text-brass hover:underline">
              Privacy Policy
            </a>
            . In short, exact location coordinates, the content of private exchanges and blocking data between
            Users are never disclosed to the partner venue, which only has access to aggregated and anonymised
            statistics.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 9 — Limitation of liability</h2>
          <p className="mt-2">
            The service is provided &laquo;&nbsp;as is&nbsp;&raquo;. LUCKY does not warrant that the service
            will be error-free or available without interruption. To the extent permitted by law, LUCKY may
            only be held liable in the event of proven fault directly attributable to LUCKY in the provision of
            the service, excluding any damage resulting from the behaviour of another User or of a third party.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 10 — Changes to the Terms</h2>
          <p className="mt-2">
            LUCKY may amend these Terms at any time. Any substantial change will be brought to the
            User&rsquo;s attention, and their acceptance may be required again.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">Article 11 — Governing law</h2>
          <p className="mt-2">
            These Terms are governed by French law. For any claim, the User may contact hello@lucky-app.io.
            Failing an amicable resolution, the competent courts shall be those designated by the ordinary
            rules of law applicable to consumers.
          </p>
        </section>

        <section>
          <p className="text-xs text-bone-faint">
            This is a translation provided for convenience. The{' '}
            <Link href="/legal/utilisateurs?fr=1" className="text-brass underline">
              French version
            </Link>{' '}
            is the binding text; in the event of any discrepancy, the French version prevails.
          </p>
        </section>
      </div>
    </main>
  );
}
