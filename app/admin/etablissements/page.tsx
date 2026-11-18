import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { etiquetteLieu } from '@/lib/etiquetteLieu';
import { ImpersonateButton } from '@/components/ImpersonateButton';
import { AdminNav } from '@/components/admin/AdminNav';
import { sendVenueInvite } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * Les établissements réellement créés dans Lucky — ceux qui ont un QR, une
 * carte et une facturation. La prospection vit dans le pipeline, pas ici.
 */
export default async function VenuesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();
  const [{ data: venues }, { count: pendingReports }] = await Promise.all([
    service
      .from('venues')
      .select(
        'id, slug, name, city, type, plan, contact_name, contact_email, invited_at, created_at, ' +
          'subscription_status, trial_ends_at, commitment_months, soiree_paid_at, soiree_amount_cents, ' +
          'crm_venues(id, contract_signed_at, commitment_months, soiree_offerte)'
      )
      .order('created_at', { ascending: false }),
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <AdminNav current="venues" pendingReports={pendingReports ?? 0} />

        <div className="mt-8 flex items-center justify-between">
          <h1 className="font-display text-2xl italic text-bone">Établissements</h1>
          <Link
            href="/admin/venues/new"
            className="min-h-[44px] rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-white/30"
          >
            + Nouvel établissement
          </Link>
        </div>

        <div className="mt-4 divide-y hairline rounded-2xl border hairline">
          {(venues ?? []).map((v: any) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm text-bone">{v.name}</p>
                <p className="font-mono text-[11px] text-bone-faint">
                  {v.city} · {v.type} · {v.plan} · /venue/{v.slug}
                </p>
                {v.contact_name && (
                  <p className="mt-1 text-xs text-bone-dim">
                    {v.contact_name} · {v.contact_email}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <EtatBadge venue={v} />
                {v.invited_at && (
                  <span className="text-[11px] text-signal-live">
                    Invité le {new Date(v.invited_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
                <ImpersonateButton venueId={v.id} />
                {!v.invited_at && v.contact_email && (
                  <form action={sendVenueInvite}>
                    <input type="hidden" name="venueId" value={v.id} />
                    <button
                      type="submit"
                      className="rounded-full border hairline px-3 py-1.5 text-[11px] text-bone-dim hover:border-brass hover:text-brass"
                    >
                      Envoyer l&rsquo;invitation
                    </button>
                  </form>
                )}
                <Link
                  href={ficheHref(v) + '#abonnement'}
                  className="rounded-full border hairline px-3 py-1.5 text-[11px] text-bone-dim hover:border-brass hover:text-brass"
                >
                  Abonnement
                </Link>
                <Link href={ficheHref(v)} className="text-xs text-brass underline">
                  Ouvrir la fiche
                </Link>
              </div>
            </div>
          ))}
          {(!venues || venues.length === 0) && (
            <p className="px-5 py-6 text-center text-sm text-bone-faint">Aucun établissement pour l&rsquo;instant.</p>
          )}
        </div>
      </div>
    </main>
  );
}

/** La fiche unique quand elle existe, sinon la redirection s'en charge. */
function ficheHref(v: any): string {
  const crmId = Array.isArray(v.crm_venues) ? v.crm_venues[0]?.id : v.crm_venues?.id;
  return crmId ? `/admin/crm/${crmId}` : `/admin/venues/${v.id}`;
}

/** La fiche CRM d'un établissement, quand elle existe. */
function fiche(v: any): any {
  return Array.isArray(v.crm_venues) ? v.crm_venues[0] : v.crm_venues;
}

function EtatBadge({ venue }: { venue: any }) {
  const crm = fiche(venue);
  const e = etiquetteLieu({
    contratSigneLe: crm?.contract_signed_at ?? null,
    plan: venue.plan ?? null,
    // L'engagement enregistré à l'encaissement fait foi ; celui de la fiche ne
    // sert que tant que rien n'a été payé.
    engagementMois: venue.commitment_months ?? crm?.commitment_months ?? null,
    soireeOfferte: crm?.soiree_offerte ?? null,
    soireePayeeLe: venue.soiree_paid_at ?? null,
    soireeMontantCents: venue.soiree_amount_cents ?? null,
    statutAbonnement: venue.subscription_status ?? null,
  });

  if (!e) {
    return (
      <span className="rounded-full border border-dashed border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-bone-faint/60">
        Contrat non signé
      </span>
    );
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${e.classe}`}>
      {e.libelle}
    </span>
  );
}
