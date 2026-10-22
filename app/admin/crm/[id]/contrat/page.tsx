import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { preparerContrat, manquantsLucky, LUCKY } from '@/lib/contrat';
import { BarreContrat } from './BarreContrat';

export const dynamic = 'force-dynamic';

/**
 * Les conditions particulières, remplies avec les données du lieu.
 *
 * Mise en page pour l'impression : c'est le navigateur qui produit le PDF,
 * via « Enregistrer au format PDF ». Pas de rendu PDF côté serveur, qui
 * imposerait un navigateur sans écran dans la fonction et de la pagination à
 * la main pour un gain nul — ici la page tient sur une feuille, et on voit
 * exactement ce qu'on envoie avant de l'envoyer.
 */
export default async function ContratPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/crm/${params.id}/contrat`);
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();
  const { data: c } = await service.from('crm_venues').select('*').eq('id', params.id).maybeSingle();
  if (!c) notFound();

  const k = preparerContrat(c);
  const trousLucky = manquantsLucky();

  return (
    <main className="contrat-page min-h-screen bg-ink px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-[800px]">
        <BarreContrat crmId={c.id} nomLieu={c.name} manquants={k.manquants} manquantsLucky={trousLucky} />

        {/* La feuille. Fond blanc et texte noir : un contrat se lit et s'imprime. */}
        <article className="rounded-lg bg-white px-12 py-14 text-[13px] leading-relaxed text-neutral-900 shadow-2xl print:rounded-none print:px-0 print:py-0 print:shadow-none">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Contrat d&rsquo;abonnement — lieux partenaires
          </p>
          <h1 className="mt-4 text-center text-2xl font-semibold">Conditions particulières</h1>

          <p className="mt-10 font-medium">Entre les soussignés :</p>

          <p className="mt-3">
            <span className="font-medium">{LUCKY.raisonSociale}</span>, {LUCKY.formeSociale}, au capital de{' '}
            {LUCKY.capital} euros, immatriculée au RCS de {LUCKY.rcsVille} sous le numéro {LUCKY.siren},
            dont le siège social est {LUCKY.siege}, représentée par {LUCKY.representant} en qualité de{' '}
            {LUCKY.qualite}, ci-après «&nbsp;Lucky&nbsp;».
          </p>

          <p className="mt-4">
            <span className="font-medium">{k.lieu.raisonSociale}</span>, {k.lieu.formeSociale}, immatriculée au
            RCS de {k.lieu.rcsVille} sous le numéro {k.lieu.siren}, dont le siège social est {k.lieu.siege},
            exploitant l&rsquo;établissement <span className="font-medium">{k.lieu.enseigne}</span> situé{' '}
            {k.lieu.adresseEtablissement}, représentée par {k.lieu.signataire} en qualité de {k.lieu.qualite},
            ci-après «&nbsp;le Lieu&nbsp;».
          </p>

          <table className="mt-10 w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-neutral-800">
                <th className="py-2 text-left font-medium">Élément</th>
                <th className="py-2 text-left font-medium">Valeur retenue</th>
              </tr>
            </thead>
            <tbody>
              <Ligne libelle="Formule souscrite" valeur={`${k.formule.label} — ${k.formule.mensuelHT} / mois HT`} />
              <Ligne
                libelle="Nombre de supports installés"
                valeur={
                  k.supports.installes != null
                    ? `${k.supports.installes} (dont ${Math.min(k.supports.installes, k.supports.inclus)} inclus dans la formule)`
                    : '____'
                }
              />
              <Ligne libelle="Supports personnalisés" valeur={k.supports.personnalises ? 'Oui' : 'Non'} />
              <Ligne libelle="Durée d’engagement" valeur={k.engagement.label} />
              <Ligne libelle="Remise applicable" valeur={`${k.engagement.remise} %`} />
              <Ligne
                libelle="Montant mensuel HT après remise"
                valeur={`${k.engagement.mensuelApresRemise} / mois`}
              />
              <Ligne libelle="Début de la période d’essai" valeur={k.dates.debutEssai} />
              <Ligne
                libelle="Premier prélèvement"
                valeur={`${k.dates.premierPrelevement} (30 jours après le début de l’essai)`}
              />
              <Ligne libelle="Contact opérationnel du Lieu" valeur={k.lieu.contactOperationnel} />
            </tbody>
          </table>

          <p className="mt-10">
            Le Lieu reconnaît avoir pris connaissance des conditions générales d&rsquo;abonnement,
            annexées au présent contrat et consultables à l&rsquo;adresse{' '}
            <span className="font-medium">lucky-app.io/legal/etablissements</span>, et les accepter sans
            réserve. Les trente premiers jours sont gratuits et le Lieu peut mettre fin au contrat à tout
            moment pendant cette période, par simple email, sans justification ni frais.
          </p>

          <p className="mt-8">
            Fait à ______________________, le {k.dates.fait}, en deux exemplaires.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-12">
            <div>
              <p className="text-[12px] font-medium">Pour le Lieu</p>
              <p className="mt-1 text-[11px] text-neutral-600">
                Signature précédée de la mention «&nbsp;lu et approuvé&nbsp;»
              </p>
              <div className="mt-2 h-28 border border-neutral-300" />
            </div>
            <div>
              <p className="text-[12px] font-medium">Pour Lucky</p>
              <p className="mt-1 text-[11px] text-neutral-600">
                {LUCKY.representant}, {LUCKY.qualite}
              </p>
              <div className="mt-2 h-28 border border-neutral-300" />
            </div>
          </div>

          <p className="mt-10 border-t border-neutral-200 pt-4 text-[10.5px] leading-relaxed text-neutral-500">
            Les conditions générales d&rsquo;abonnement font partie intégrante du contrat. Ce document
            n&rsquo;a pas été validé par un avocat.
          </p>
        </article>

        <div className="h-10 print:hidden" />
      </div>
    </main>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <tr className="border-b border-neutral-200">
      <td className="py-2.5 pr-6 align-top text-neutral-600">{libelle}</td>
      <td className="py-2.5 align-top font-medium">{valeur}</td>
    </tr>
  );
}
