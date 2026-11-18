import Link from 'next/link';
import { CGV_ETABLISSEMENTS, type BlocCgv } from '@/lib/cgvEtablissements';

export const metadata = { title: 'Conditions Générales — Établissements | Lucky' };

/**
 * Les CGV établissements.
 *
 * Le texte ne vit pas ici : il vient de lib/cgvEtablissements, qui sert aussi
 * à les annexer au contrat en PDF. Une seule source, donc deux documents qui
 * ne peuvent pas se contredire — c'est exactement ce qu'un client oppose le
 * jour où il conteste.
 */
export default function CGVEtablissements() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-bone-faint hover:text-bone-dim">
        &larr; Retour à l&rsquo;accueil
      </Link>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Conditions générales</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">
        Conditions Générales de Vente et d&rsquo;Utilisation — Établissements
      </h1>
      <p className="mt-3 text-xs text-bone-faint">Dernière mise à jour : 18/11/2026</p>

      <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-bone-dim">
        {CGV_ETABLISSEMENTS.map((article) => (
          <section key={article.titre}>
            <h2 className="text-base font-semibold text-bone">{article.titre}</h2>
            {article.blocs.map((bloc, i) => (
              <Bloc key={i} bloc={bloc} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

function Bloc({ bloc }: { bloc: BlocCgv }) {
  if (bloc.sous) {
    return <h3 className="mt-6 text-sm font-semibold text-bone">{bloc.sous}</h3>;
  }
  if (bloc.fort) {
    return <p className="mt-2 font-medium text-bone">{bloc.fort}</p>;
  }
  if (bloc.liste) {
    return (
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        {bloc.liste.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className="mt-2">{bloc.p}</p>;
}
