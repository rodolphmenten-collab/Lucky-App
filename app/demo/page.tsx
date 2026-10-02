import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoPlayer } from './DemoPlayer';

/**
 * Page d'atterrissage du QR des flyers de prospection.
 *
 * Le lecteur est un patron debout derrière son comptoir, pas un prospect
 * assis devant un ordinateur : la démo passe avant l'argumentaire, et les
 * moyens de rappeler sont des liens qu'on déclenche d'un pouce (tel:, wa.me)
 * plutôt qu'un numéro à recopier.
 */
export const metadata: Metadata = {
  title: 'Lucky — la démo en 30 secondes',
  description:
    'Ce que vos clients voient, et ce que ça met dans votre caisse. Démo de Lucky pour les bars, restaurants et hôtels.',
};

const PHONE = '+33688354676';
const PHONE_DISPLAY = '06 88 35 46 76';

export default function DemoPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-10">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Lucky</p>
      <h1 className="mt-3 text-center font-display text-3xl italic leading-tight text-bone">
        Ce que vos clients voient.
      </h1>
      <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-relaxed text-bone-dim">
        Trente secondes, et vous saurez exactement ce que Lucky change chez vous — jusqu’à l’euro.
      </p>

      <div className="mt-8">
        <DemoPlayer />
      </div>

      {/* ---- Rappel ------------------------------------------------------ */}
      <section className="mt-12 rounded-3xl border border-brass/30 bg-brass/[0.04] p-6 text-center">
        <p className="font-display text-xl italic text-bone">30 jours d’essai, offerts.</p>
        <p className="mt-2 text-xs leading-relaxed text-bone-dim">
          Sans engagement, résiliable à tout moment. On installe tout : votre compte, votre QR code,
          la page de votre établissement et votre carte.
        </p>

        <a
          href={`tel:${PHONE}`}
          className="mt-6 block w-full rounded-full bg-bone py-3.5 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Appeler Rodolph · {PHONE_DISPLAY}
        </a>
        <a
          href={`https://wa.me/${PHONE.replace('+', '')}?text=${encodeURIComponent(
            'Bonjour Rodolph, je vous contacte au sujet de Lucky pour mon établissement.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full rounded-full border border-brass/40 py-3.5 text-sm text-brass hover:border-brass"
        >
          Écrire sur WhatsApp
        </a>

        <p className="mt-5 text-[11px] text-bone-faint">À partir de 99 € HT / mois</p>
      </section>

      <div className="mt-8 space-y-3 text-center">
        <Link href="/" className="block text-xs text-bone-dim underline decoration-bone/20">
          Voir l’offre complète et les tarifs
        </Link>
        <p className="text-[10px] leading-relaxed text-bone-faint">
          Les écrans ci-dessus sont une reconstitution de l’application : mêmes parcours, mêmes
          informations, avec des exemples fictifs à la place de vrais clients.
        </p>
      </div>
    </main>
  );
}
