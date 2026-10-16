import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { subscriptionStatusLabel } from '@/lib/billing';
import { PLANS } from '@/lib/stripe';
import {
  SOURCE_LABELS,
  daysUntil,
  formatEuros,
  formatEurosPrecise,
  stageLabel,
} from '@/lib/crm';
import { StagePicker } from '@/components/admin/StagePicker';
import { VenuePanel } from '@/components/admin/VenuePanel';
import { BillingPanel } from '@/components/admin/BillingPanel';
import { setStage, addNote, setNextAction, updateCrmVenue, updateVenueSettings } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function CrmVenuePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();

  const [{ data: c }, { data: admins }] = await Promise.all([
    service.from('crm_venues').select('*').eq('id', params.id).maybeSingle(),
    service.from('platform_admins').select('email').order('added_at'),
  ]);

  if (!c) notFound();

  const [{ data: notes }, { data: venue }] = await Promise.all([
    service
      .from('crm_notes')
      .select('id, author_email, body, stage_from, stage_to, created_at')
      .eq('crm_venue_id', c.id)
      .order('created_at', { ascending: false }),
    c.venue_id
      ? service
          .from('venues')
          .select(
            'id, slug, plan, subscription_status, trial_ends_at, current_period_end, checkout_sent_at, contact_email, latitude, longitude, verification_radius_m, checkin_duration_minutes, average_ticket_cents'
          )
          .eq('id', c.venue_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Ce que Lucky a rapporté à ce lieu : le seul argument qui tienne en
  // renouvellement, et le seul qu'on ne puisse pas contester.
  let generatedCents = 0;
  let servedCount = 0;
  if (c.venue_id) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: orders } = await service
      .from('lucky_orders')
      .select('price_cents, net_price_cents, status')
      .eq('venue_id', c.venue_id)
      .eq('status', 'served')
      .gte('created_at', since);
    servedCount = (orders ?? []).length;
    generatedCents = (orders ?? []).reduce(
      (s: number, o: any) => s + (o.net_price_cents ?? o.price_cents ?? 0),
      0
    );
  }

  const trialDays = venue?.trial_ends_at ? daysUntil(venue.trial_ends_at) : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lucky-app.io';

  // Un etablissement cree depuis le pipeline part a 0,0. Si la fiche de
  // prospection a de vraies coordonnees, on les propose plutot que de laisser
  // le patron chercher : c'est la panne la plus silencieuse du produit.
  const gpsManquant = !!venue && !venue.latitude && !venue.longitude;
  const coordsFiche = c.latitude != null && c.longitude != null;
  const latValue = gpsManquant && coordsFiche ? c.latitude : venue?.latitude;
  const lonValue = gpsManquant && coordsFiche ? c.longitude : venue?.longitude;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
          ← Pipeline
        </Link>

        <h1 className="mt-4 font-display text-3xl italic text-bone">{c.name}</h1>
        <p className="mt-1 font-mono text-[11px] text-bone-faint">
          {[c.city, c.type, c.source ? (SOURCE_LABELS[c.source] ?? c.source) : null].filter(Boolean).join(' · ')}
          {' · '}
          {stageLabel(c.stage)} depuis le {new Date(c.stage_changed_at).toLocaleDateString('fr-FR')}
        </p>

        <StagePicker crmId={c.id} current={c.stage} action={setStage} />

        {/* Client actif : on montre ce qu'il paie et ce qu'il gagne, côte à côte. */}
        {venue && (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile
              label="Abonnement"
              value={subscriptionStatusLabel(venue.subscription_status)}
              sub={
                venue.subscription_status === 'trialing' && trialDays !== null
                  ? `Fin d'essai dans ${Math.max(0, trialDays)} j`
                  : venue.plan
                    ? `${formatEuros(PLANS[venue.plan as keyof typeof PLANS]?.monthlyCentsExclTax ?? 0)}/mois`
                    : undefined
              }
            />
            <Tile label="CA généré · 30 j" value={formatEuros(generatedCents)} sub={`${servedCount} bons servis`} />
            <Tile
              label="Fiche établissement"
              value="Ouvrir"
              href={`/admin/venues/${venue.id}`}
            />
          </section>
        )}

        {/* ---------------------------------------------------------------
            Prochaine action. Juste sous les étapes : c'est ce qu'on remplit
            en sortant du rendez-vous, avant d'oublier.
        --------------------------------------------------------------- */}
        <section className="mt-8 rounded-2xl border border-brass/40 bg-brass/5 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Prochaine action</p>
          <form action={setNextAction} className="mt-3 flex flex-wrap gap-3">
            <input type="hidden" name="crmId" value={c.id} />
            <input
              name="next_action"
              defaultValue={c.next_action ?? ''}
              placeholder="Rappeler pour la signature"
              className="min-h-[48px] flex-1 rounded-xl border hairline bg-transparent px-4 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
            />
            <input
              type="date"
              name="next_action_at"
              defaultValue={c.next_action_at ?? ''}
              className="min-h-[48px] rounded-xl border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
            >
              Enregistrer
            </button>
          </form>
        </section>

        {/* ---------------------------------------------------------------
            Tout ce qui n'existe qu'une fois le lieu devenu client : le QR,
            les reglages de presence, l'abonnement. Une seule fiche par lieu,
            du premier cafe jusqu'au prelevement.
        --------------------------------------------------------------- */}
        {venue && (
          <>
            <h2 className="mt-10 font-display text-xl italic text-bone">Établissement</h2>

            <div className="mt-4 rounded-2xl border hairline p-5">
              <VenuePanel slug={venue.slug} siteUrl={siteUrl} />
            </div>

            <form action={updateVenueSettings} className="mt-4 rounded-2xl border hairline p-5">
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="crmId" value={c.id} />

              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
                Position et présence
              </p>

              {gpsManquant && (
                <p className="mt-3 rounded-xl border border-brass/40 bg-brass/5 p-3 text-xs leading-relaxed text-bone-dim">
                  Les coordonnées de l&rsquo;établissement sont à 0,0 : personne ne peut valider
                  sa présence ici.
                  {coordsFiche
                    ? ' Celles relevées en prospection sont déjà pré-remplies ci-dessous — vérifie-les et enregistre.'
                    : ' Relève-les sur place ou depuis Google Maps.'}
                </p>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input name="latitude" label="Latitude" type="number" defaultValue={latValue} />
                <Input name="longitude" label="Longitude" type="number" defaultValue={lonValue} />
                <Input
                  name="radius"
                  label="Rayon de vérification (m)"
                  type="number"
                  defaultValue={venue.verification_radius_m}
                />
                <Input
                  name="duration"
                  label="Déconnexion automatique (min)"
                  type="number"
                  defaultValue={venue.checkin_duration_minutes}
                />
                <label className="block sm:col-span-2">
                  <span className="text-xs text-bone-faint">Formule facturée</span>
                  <select
                    name="plan"
                    defaultValue={venue.plan ?? 'basique'}
                    className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
                  >
                    {Object.values(PLANS).map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label} — {formatEurosPrecise(p.monthlyCentsExclTax)}/mois
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
              >
                Enregistrer les réglages
              </button>
            </form>

            <div id="abonnement" className="mt-4 rounded-2xl border hairline p-5">
              <BillingPanel
                venueId={venue.id}
                currentPlan={venue.plan ?? 'basique'}
                status={venue.subscription_status ?? 'none'}
                statusLabel={subscriptionStatusLabel(venue.subscription_status)}
                contactEmail={venue.contact_email ?? c.contact_email ?? null}
                trialEndsAt={venue.trial_ends_at ?? null}
                currentPeriodEnd={venue.current_period_end ?? null}
                checkoutSentAt={venue.checkout_sent_at ?? null}
              />
            </div>
          </>
        )}

        {/* ---------------------------------------------------------------
            Le journal.
        --------------------------------------------------------------- */}
        <h2 className="mt-10 font-display text-xl italic text-bone">Journal</h2>
        <form action={addNote} className="mt-3">
          <input type="hidden" name="crmId" value={c.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Ce qui s'est dit, ce qu'il faut retenir…"
            className="w-full rounded-2xl border hairline bg-transparent p-4 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
          />
          <button
            type="submit"
            className="mt-2 min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            Ajouter la note
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {(notes ?? []).map((n: any) => (
            <div key={n.id} className="rounded-2xl border hairline p-4">
              <p className="font-mono text-[11px] text-bone-faint">
                {n.author_email.split('@')[0]} · {new Date(n.created_at).toLocaleString('fr-FR')}
                {n.stage_to && ' · changement d’étape'}
              </p>
              <p className={`mt-1 text-sm ${n.stage_to ? 'text-brass' : 'text-bone'}`}>{n.body}</p>
            </div>
          ))}
          {(!notes || notes.length === 0) && (
            <p className="rounded-2xl border hairline px-5 py-8 text-center text-sm text-bone-faint">
              Rien dans le journal pour l&rsquo;instant.
            </p>
          )}
        </div>

        {/* ---------------------------------------------------------------
            La fiche complète, en bas : on la remplit à tête reposée.
        --------------------------------------------------------------- */}
        <h2 className="mt-12 font-display text-xl italic text-bone">Fiche</h2>
        <form action={updateCrmVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="crmId" value={c.id} />
          <Input name="name" label="Nom" defaultValue={c.name} required />
          <Input name="city" label="Ville" defaultValue={c.city} />
          <Input name="type" label="Type (bar, restaurant, hotel)" defaultValue={c.type} />
          <Input name="category" label="Catégorie (brasserie, café…)" defaultValue={c.category} />
          <label className="block">
            <span className="text-xs text-bone-faint">Pays</span>
            <select
              name="country"
              defaultValue={c.country ?? ''}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              <option value="">Non renseigné</option>
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
            </select>
          </label>
          <Input name="address" label="Adresse" defaultValue={c.address} />
          <Input name="contact_name" label="Contact" defaultValue={c.contact_name} />
          <Input name="contact_role" label="Rôle du contact" defaultValue={c.contact_role} />
          <Input name="contact_email" label="Email" type="email" defaultValue={c.contact_email} />
          <Input name="contact_phone" label="Téléphone" type="tel" defaultValue={c.contact_phone} />
          <Input name="tables_count" label="Nombre de tables" type="number" defaultValue={c.tables_count} />
          <Input name="roadshow_date" label="Date de tournée (vide = hors tournée)" type="date" defaultValue={c.roadshow_date} />
          <Input name="roadshow_label" label="Nom de la journée" defaultValue={c.roadshow_label} />

          <label className="block">
            <span className="text-xs text-bone-faint">Formule pressentie</span>
            <select
              name="expected_plan"
              defaultValue={c.expected_plan ?? ''}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              <option value="">À définir</option>
              {Object.values(PLANS).map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} — {formatEurosPrecise(p.monthlyCentsExclTax)}/mois
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-bone-faint">Qui porte ce lieu</span>
            <select
              name="owner_email"
              defaultValue={c.owner_email ?? ''}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              <option value="">Non attribué</option>
              {(admins ?? []).map((a: any) => (
                <option key={a.email} value={a.email}>
                  {a.email}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-bone-faint">Source</span>
            <select
              name="source"
              defaultValue={c.source ?? 'roadshow'}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          {c.stage === 'perdu' && (
            <Input name="lost_reason" label="Raison de la perte" defaultValue={c.lost_reason} />
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
            >
              Enregistrer la fiche
            </button>
          </div>
        </form>

        {!c.venue_id && c.stage === 'signe' && (
          <p className="mt-8 rounded-2xl border border-brass/40 bg-brass/5 p-5 text-sm text-bone-dim">
            Ce lieu est signé mais n&rsquo;a pas encore d&rsquo;établissement dans Lucky.{' '}
            <Link href={`/admin/venues/new?crm=${c.id}`} className="text-brass underline">
              Le créer maintenant
            </Link>{' '}
            — il faut ses coordonnées GPS pour que la vérification de présence fonctionne.
          </p>
        )}
      </div>
    </main>
  );
}

function Tile({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <>
      <p className="text-[11px] text-bone-faint">{label}</p>
      <p className="mt-1.5 font-display text-xl text-bone">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-bone-dim">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-2xl border hairline p-4 hover:border-brass/50">
      {inner}
    </Link>
  ) : (
    <div className="rounded-2xl border hairline p-4">{inner}</div>
  );
}

function Input({
  name,
  label,
  defaultValue,
  type = 'text',
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-bone-faint">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none"
      />
    </label>
  );
}
