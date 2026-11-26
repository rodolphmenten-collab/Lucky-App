import Link from 'next/link';

export const metadata = { title: 'Acceptable Use Policy | Lucky' };

/**
 * Version anglaise de la politique d'usage acceptable.
 *
 * Le service est francais et ses documents juridiques font foi en francais.
 * Mais ceux qui les lisent le plus attentivement ne sont pas nos utilisateurs :
 * ce sont les partenaires de paiement et les reseaux de cartes, qui examinent
 * la page en anglais et doivent pouvoir verifier eux-memes que telle
 * interdiction y figure. Une page francaise avec un seul paragraphe anglais les
 * oblige a traduire, et une traduction automatique ne vaut pas engagement.
 *
 * Cette page dit donc exactement la meme chose que /legal/usage, en anglais, et
 * les deux se citent l'une l'autre. En cas de divergence, la version francaise
 * prevaut — c'est ecrit en toutes lettres en bas de page.
 */
export default function AcceptableUsePolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Back to home
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Rules of use</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Acceptable Use Policy</h1>
      <p className="mt-3 text-xs text-bone-faint">
        Last updated: 22/11/2026 ·{' '}
        <Link href="/legal/usage?fr=1" className="text-brass underline">
          Version française
        </Link>
      </p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        <section>
          <p>
            Lucky connects people who are present at the same time in the same venue. The service only works
            if everyone feels safe using it. The rules below apply to every user, without exception, and
            supplement our{' '}
            <Link href="/legal/terms" className="text-brass underline">
              Terms of Service
            </Link>
            . They are published by LUCKY, a French simplified joint-stock company (SAS) with a share capital
            of EUR 200, registered with the Paris Trade and Companies Register under number 132 148 941, with
            its registered office at 8 bis rue Abel, 75012 Paris, France.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">1. Who may use Lucky</h2>
          <p className="mt-2">
            The service is restricted to adults aged 18 or over. Every user certifies their age when creating
            a profile. Any account we have serious reason to believe belongs to a minor is suspended
            immediately, without notice, and its data is deleted.
          </p>
          <p className="mt-2">
            A profile must represent a real person, carry that person&rsquo;s own name, and show a recent and
            accurate photograph of them. One profile per person.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">2. What is prohibited</h2>
          <p className="mt-2">On Lucky, it is prohibited:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              to use the service for human trafficking, including sexual exploitation, or to aid, abet,
              facilitate or encourage such conduct or any form of abuse;
            </li>
            <li>
              to use the service for child sexual exploitation and abuse (CSEA) in any form, including the
              production, solicitation, possession, distribution or promotion of child sexual abuse material
              (CSAM), or any attempt to contact a minor for sexual purposes;
            </li>
            <li>
              to commit, prepare, facilitate, threaten or glorify sexual violence — rape, sexual assault, or
              any sexual act imposed without free and informed consent;
            </li>
            <li>
              to create, request, share or threaten to share intimate images or videos of a person without
              their consent (non-consensual intimate imagery, sometimes called &laquo;&nbsp;revenge
              porn&nbsp;&raquo;), including computer-generated or altered content;
            </li>
            <li>to harass, threaten, insult, intimidate or pester another person;</li>
            <li>
              to keep contacting someone who does not reply, or to reach out again after having been blocked;
            </li>
            <li>
              to post or send sexual, pornographic, violent, hateful, discriminatory or defamatory content;
            </li>
            <li>
              to solicit or offer sexual services, whether paid or not — Lucky is not a sexual dating service
              and will not become one;
            </li>
            <li>
              to impersonate someone, create a fake profile, or use another person&rsquo;s photograph;
            </li>
            <li>
              to use the service for commercial, advertising, canvassing, data-collection or promotional
              purposes;
            </li>
            <li>
              to ask for money, offer an investment, or request banking details — there is no transaction
              between users on Lucky;
            </li>
            <li>
              to circumvent presence verification, automate access to the service, or scrape its data;
            </li>
            <li>
              to share outside the app the content of a private conversation, or another person&rsquo;s
              photograph or information, without their consent.
            </li>
          </ul>
        </section>

        <section>
          <div className="rounded-xl border border-brass/40 bg-brass/5 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Zero tolerance</p>
            <p className="mt-3 text-bone">
              <strong className="text-bone">Lucky may not be used:</strong>
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
                to commit, prepare, facilitate, threaten or glorify sexual violence — rape, sexual assault,
                or any sexual act imposed without free and informed consent;
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
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">3. What we have put in place</h2>
          <p className="mt-2">
            <strong className="text-bone">Presence is verified.</strong> You only see people confirmed to be
            in the same venue at the same time, through a location signal re-checked over the course of the
            evening. When someone leaves, they disappear from the room.
          </p>
          <p className="mt-2">
            <strong className="text-bone">One message until the other person replies.</strong> Anyone may
            write first, but nobody can send message after message to someone who is not replying. This limit
            is enforced by our servers, not by the app alone.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Blocking and reporting in one tap.</strong> From a conversation or
            a profile, anyone can block a person — who then disappears from their room and can no longer
            reach them — or report them to our team.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Conversations are private.</strong> The partner venue has no access
            to them: technically, it cannot read the messages exchanged on its premises.
          </p>
          <p className="mt-2">
            <strong className="text-bone">Conversations are text only.</strong> Users cannot send images,
            videos or files to one another.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">4. Reporting behaviour</h2>
          <p className="mt-2">
            Every report is reviewed by our team. Write to{' '}
            <a href="mailto:signalement@lucky-app.io" className="text-brass underline">
              signalement@lucky-app.io
            </a>{' '}
            if you would rather contact us directly, stating the venue, the time and, if you can, a
            screenshot.
          </p>
          <p className="mt-2">
            In case of immediate danger, alert the venue&rsquo;s staff first, or call 17 (police) or 112
            (European emergency number). We deal with accounts, not emergencies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">5. What we do when the rules are broken</h2>
          <p className="mt-2">
            Depending on the seriousness of the conduct and whether it is repeated, we may issue a warning,
            restrict access to the service, suspend the account, or delete it permanently.
          </p>
          <p className="mt-2">
            Unsolicited sexual content, sexual solicitation, established harassment, a threat, impersonation,
            or anything suggesting that the user is a minor leads to immediate deletion of the account,
            without prior warning.
          </p>
          <p className="mt-2">
            Two breaches do not follow that path and are handled by our servers before any human
            review: a report of a photo showing a minor in a sexual context, and a report of an
            intimate image shared without the person&rsquo;s consent. In both cases the account is
            suspended and the photo stops being visible at the moment of the report, the image is
            preserved for twelve months as evidence, and the case is reviewed as a priority.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border hairline">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-bone-faint">
                <tr>
                  <th className="px-3 py-2 font-normal">Breach</th>
                  <th className="px-3 py-2 font-normal">What we do</th>
                  <th className="px-3 py-2 font-normal">Authorities</th>
                </tr>
              </thead>
              <tbody className="text-bone-dim">
                <tr className="border-t hairline">
                  <td className="px-3 py-2 align-top">
                    Child sexual exploitation and abuse (CSEA, CSAM)
                  </td>
                  <td className="px-3 py-2 align-top">
                    Immediate removal of the content and immediate suspension of the account, then
                    permanent deletion once confirmed
                  </td>
                  <td className="px-3 py-2 align-top text-bone">Always reported</td>
                </tr>
                <tr className="border-t hairline">
                  <td className="px-3 py-2 align-top">Non-consensual intimate imagery</td>
                  <td className="px-3 py-2 align-top">
                    Immediate removal of the content and immediate suspension of the account, then
                    permanent deletion once confirmed
                  </td>
                  <td className="px-3 py-2 align-top text-bone">Always reported</td>
                </tr>
                <tr className="border-t hairline">
                  <td className="px-3 py-2 align-top">Sexual violence, human trafficking</td>
                  <td className="px-3 py-2 align-top">
                    Permanent deletion of the account, without notice
                  </td>
                  <td className="px-3 py-2 align-top text-bone">Always reported</td>
                </tr>
                <tr className="border-t hairline">
                  <td className="px-3 py-2 align-top">
                    Harassment, threats, unsolicited sexual content, impersonation, account
                    belonging to a minor
                  </td>
                  <td className="px-3 py-2 align-top">
                    Immediate deletion of the account, without prior warning
                  </td>
                  <td className="px-3 py-2 align-top">
                    Referred where the facts may amount to a criminal offence
                  </td>
                </tr>
                <tr className="border-t hairline">
                  <td className="px-3 py-2 align-top">Other breaches of these rules</td>
                  <td className="px-3 py-2 align-top">
                    Warning, restricted access, suspension or deletion depending on seriousness and
                    repetition
                  </td>
                  <td className="px-3 py-2 align-top">
                    Referred where the facts may amount to a criminal offence
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            &laquo;&nbsp;Always reported&nbsp;&raquo; means that we refer the case to the competent
            authorities as soon as the content is confirmed, without the victim having to ask — in
            France, the Ministry of the Interior&rsquo;s PHAROS platform. We preserve the relevant
            material and a record of that referral. Requests from authorities are handled according
            to the procedure described in our{' '}
            <Link href="/legal/autorites" className="text-brass underline">
              law enforcement response guidelines
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-bone">6. Challenging a decision</h2>
          <p className="mt-2">
            If your account has been suspended or deleted and you believe the decision is unjustified, write
            to{' '}
            <a href="mailto:hello@lucky-app.io" className="text-brass underline">
              hello@lucky-app.io
            </a>
            . We review the case and reply within thirty (30) days.
          </p>
        </section>

        <section>
          <p className="text-xs text-bone-faint">
            This is a translation provided for convenience. The{' '}
            <Link href="/legal/usage?fr=1" className="text-brass underline">
              French version
            </Link>{' '}
            is the binding text; in the event of any discrepancy, the French version prevails.
          </p>
        </section>
      </div>
    </main>
  );
}
