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
  planMonthlyCents,
  stageLabel,
} from '@/lib/crm';
import { StagePicker } from '@/components/admin/StagePicker';
import { VenuePanel } from '@/components/admin/VenuePanel';
import { GpsPicker } from '@/components/admin/GpsPicker';
import { BillingPanel } from '@/components/admin/BillingPanel';
import { MenuEditor } from '@/app/dashboard/carte/MenuEditor';
import { VENUE_TYPES } from '@/lib/venues';
import { FicheTabs, ongletDepuisUrl } from '@/components/admin/FicheTabs';
import { CoverPhotoPanel } from '@/components/admin/CoverPhotoPanel';
import { ShopView } from '@/app/dashboard/shop/ShopView';
import { getVenueOrders } from '@/lib/attribution';
import { setStage, addNote, setNextAction, updateCrmVenue, updateVenueSettings } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function CrmVenuePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { erreur?: string; ignore?: string; onglet?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  if (!(await isPlatformAdminEmail(user.email))) redirect('/admin');

  const service = createServiceClient();

  const [{ data: c }, { data: admins }, { data: groupes }] = await Promise.all([
    service.from('crm_venues').select('*').eq('id', params.id).maybeSingle(),
    service.from('platform_admins').select('email').order('added_at'),
    service.from('crm_venues').select('id, name').eq('is_group', true).order('name'),
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
          // select('*') et pas une liste de colonnes : une colonne ajoutée par
          // migration et oubliée ici revenait `undefined` sans erreur — c'est
          // ce qui est arrivé à `commitment_months`, affiché vide alors qu'il
          // était en base.
          .from('venues')
          .select('*')
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

  // La carte du lieu, pour l'éditer sans se connecter à sa place.
  const { data: menuRows } = c.venue_id
    ? await service
        .from('venue_menu_items')
        .select('id, name, price_cents, category, sort_order')
        .eq('venue_id', c.venue_id)
        .eq('active', true)
        .order('sort_order', { ascending: true })
    : { data: [] as any[] };
  const menuItems = (menuRows ?? []) as { id: string; name: string; price_cents: number; category: string }[];

  const trialDays = venue?.trial_ends_at ? daysUntil(venue.trial_ends_at) : null;

  // Les lieux rattaches, quand cette fiche est elle-meme un groupe.
  const { data: membres } = c.is_group
    ? await service
        .from('crm_venues')
        .select('id, name, city, stage, venue_id, expected_plan')
        .eq('group_id', c.id)
        .order('name')
    : { data: [] as any[] };

  const groupeParent = c.group_id
    ? (groupes ?? []).find((g: any) => g.id === c.group_id) ?? null
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lucky-app.io';

  const onglet = ongletDepuisUrl(searchParams?.onglet);

  // Le detail des consommations n'est charge que sur l'onglet qui l'affiche :
  // inutile d'interroger la base pour un ecran qu'on ne regarde pas.
  const commandes =
    venue && onglet === 'carte' ? await getVenueOrders(service, venue.id, 30) : [];

  // Commandes de supports physiques, pour la boutique de l'onglet QR.
  const { data: commandesSupports } =
    venue && onglet === 'qr'
      ? await service
          .from('venue_orders')
          .select('*')
          .eq('venue_id', venue.id)
          .order('created_at', { ascending: false })
      : { data: [] };

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

        {groupeParent && (
          <p className="mt-2 text-xs text-bone-dim">
            Groupe —{' '}
            <Link href={`/admin/crm/${groupeParent.id}`} className="text-brass underline">
              {groupeParent.name}
            </Link>
          </p>
        )}

        {searchParams?.erreur && (
          <p className="mt-4 rounded-2xl border border-red-400/50 bg-red-400/10 p-4 text-sm text-red-300">
            L&rsquo;enregistrement a échoué, rien n&rsquo;a été sauvegardé :{' '}
            <span className="font-mono text-xs">{searchParams.erreur}</span>
          </p>
        )}
        {searchParams?.ignore && (
          <p className="mt-4 rounded-2xl border border-brass/50 bg-brass/10 p-4 text-sm text-bone-dim">
            Enregistré, mais ces champs n&rsquo;existent pas encore en base et ont été ignorés :{' '}
            <span className="font-mono text-xs text-brass">{searchParams.ignore}</span>. Passe la
            migration correspondante pour les activer.
          </p>
        )}

        <StagePicker crmId={c.id} current={c.stage} action={setStage} />

        <FicheTabs crmId={c.id} actif={onglet} />

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
              href={`/admin/crm/${c.id}?onglet=informations`}
            />
          </section>
        )}

{onglet === 'suivi' && (
          <>
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
          </>
        )}


{onglet === 'suivi' && (
          <>
        {/* ---------------------------------------------------------------
            Les lieux du groupe. Un groupe n'a ni QR ni abonnement : ce qu'on
            veut voir ici, c'est son poids — combien de lieux, et combien ils
            pesent ensemble.
        --------------------------------------------------------------- */}
        {c.is_group && (
          <>
            <h2 className="mt-10 font-display text-xl italic text-bone">
              Lieux du groupe ({(membres ?? []).length})
            </h2>
            {(membres ?? []).length > 0 && (
              <p className="mt-1 text-xs text-bone-dim">
                {formatEuros(
                  (membres ?? []).reduce(
                    (t: number, m: any) => t + planMonthlyCents(m.expected_plan),
                    0
                  )
                )}
                /mois si tout le groupe signe.
              </p>
            )}
            <div className="mt-3 divide-y hairline rounded-2xl border hairline">
              {(membres ?? []).map((m: any) => (
                <Link
                  key={m.id}
                  href={`/admin/crm/${m.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-bone">{m.name}</span>
                    <span className="block font-mono text-[11px] text-bone-faint">{m.city}</span>
                  </span>
                  <span className="shrink-0 rounded-full border hairline px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-bone-dim">
                    {stageLabel(m.stage)}
                  </span>
                </Link>
              ))}
              {(membres ?? []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-bone-faint">
                  Aucun lieu rattaché. Ouvre la fiche d&rsquo;un lieu et choisis ce groupe dans
                  « Rattaché au groupe ».
                </p>
              )}
            </div>
          </>
        )}
          </>
        )}


        {/* ---------------------------------------------------------------
            Tout ce qui n'existe qu'une fois le lieu devenu client : le QR,
            les reglages de presence, l'abonnement. Une seule fiche par lieu,
            du premier cafe jusqu'au prelevement.
        --------------------------------------------------------------- */}
        {/* Onglets qui dependent d'un etablissement cree. Sans lui, on ne cache
            pas l'onglet : on explique ce qui manque et on donne le geste
            suivant, plutot que de laisser l'utilisateur chercher. */}
        {!venue && ['carte', 'abonnement', 'position', 'qr'].includes(onglet) && (
          <div className="mt-6 rounded-2xl border hairline p-8 text-center">
            <p className="font-display text-xl italic text-bone">
              Pas encore d&rsquo;établissement
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-dim">
              {onglet === 'carte' && 'La carte et la remise se renseignent une fois le lieu créé dans Lucky.'}
              {onglet === 'abonnement' && 'L’abonnement et le lien de paiement s’activent une fois le lieu créé dans Lucky.'}
              {onglet === 'position' && 'Les coordonnées GPS et le rayon de présence se règlent une fois le lieu créé dans Lucky.'}
              {onglet === 'qr' && 'Le QR code est généré à la création du lieu dans Lucky.'}
            </p>
            <Link
              href={`/admin/venues/new?crm=${c.id}`}
              className="mt-6 inline-flex min-h-[48px] items-center rounded-full border border-brass/50 px-6 text-sm text-brass hover:bg-brass/10"
            >
              Créer l&rsquo;établissement
            </Link>
            <p className="mt-4 text-xs text-bone-faint">
              Il faut ses coordonnées GPS pour que la vérification de présence fonctionne.
            </p>
          </div>
        )}

        {venue && (
          <>
            {onglet === 'qr' && (
              <>
                <div className="mt-6 rounded-2xl border hairline p-5">
                  <VenuePanel slug={venue.slug} siteUrl={siteUrl} />
                </div>

                {/* Commander les supports est le prolongement direct du QR.
                    Il fallait jusqu'ici se connecter a la place du lieu pour
                    passer commande, ce qui n'a aucun sens en rendez-vous. */}
                <div className="mt-4 rounded-2xl border hairline p-5">
                  <ShopView
                    embedded
                    venue={{ id: venue.id, name: venue.name, cover_photo_url: venue.cover_photo_url ?? null }}
                    orders={(commandesSupports ?? []) as any}
                  />
                </div>
              </>
            )}

            {onglet === 'position' && (
            <form action={updateVenueSettings} className="mt-6 rounded-2xl border hairline p-5">
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
                <GpsPicker defaultLat={String(latValue ?? '')} defaultLon={String(lonValue ?? '')} />
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
            )}

            {onglet === 'abonnement' && (
            <div id="abonnement" className="mt-6 rounded-2xl border hairline p-5">
              <BillingPanel
                venueId={venue.id}
                currentPlan={venue.plan ?? 'basique'}
                currentCommitment={venue.commitment_months ?? c.commitment_months ?? null}
                status={venue.subscription_status ?? 'none'}
                statusLabel={subscriptionStatusLabel(venue.subscription_status)}
                contactEmail={venue.contact_email ?? c.contact_email ?? null}
                trialEndsAt={venue.trial_ends_at ?? null}
                currentPeriodEnd={venue.current_period_end ?? null}
                checkoutSentAt={venue.checkout_sent_at ?? null}
              />
            </div>
            )}

            {onglet === 'carte' && (
              <>
                {/* La carte du lieu et son avantage. C'est ce qui chiffre le CA
                    généré : sans prix saisis, une rencontre ne vaut rien à
                    l'écran. Jusqu'ici il fallait se connecter à la place du lieu
                    pour y accéder, ce qui en faisait une étape oubliée. */}
                <MenuEditor
                  embedded
                  venue={{
                    id: venue.id,
                    name: venue.name,
                    perk_label: venue.perk_label ?? null,
                    average_ticket_cents: venue.average_ticket_cents ?? null,
                    lucky_discount_percent: venue.lucky_discount_percent ?? null,
                  }}
                  initialItems={menuItems}
                />

                {/* Le detail derriere le total. Un chiffre seul ne se verifie
                    pas : face a un patron qui le conteste, il faut pouvoir
                    montrer ligne a ligne ce qui le compose — et reperer les
                    bons restes en attente, qui ne comptent pas. */}
                <h3 className="mt-10 font-display text-lg italic text-bone">
                  Consommations tracées · 30 jours
                </h3>
                <p className="mt-1 text-xs text-bone-dim">
                  {commandes.length} bon{commandes.length > 1 ? 's' : ''} émis ·{' '}
                  {commandes.filter((o) => o.status === 'served').length} servis ·{' '}
                  {commandes.filter((o) => o.status === 'pending').length} en attente
                </p>

                <div className="mt-3 divide-y hairline overflow-hidden rounded-2xl border hairline">
                  {commandes.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-bone">{o.item_name}</p>
                        <p className="font-mono text-[11px] text-bone-faint">
                          {new Date(o.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {o.code}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm text-bone">
                          {formatEurosPrecise(o.net_price_cents ?? o.price_cents)}
                        </p>
                        <p
                          className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                            o.status === 'served'
                              ? 'text-signal-live'
                              : o.status === 'pending'
                                ? 'text-brass'
                                : 'text-bone-faint'
                          }`}
                        >
                          {o.status === 'served'
                            ? 'servi'
                            : o.status === 'pending'
                              ? 'en attente'
                              : 'annulé'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {commandes.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-bone-faint">
                      Aucune consommation tracée sur les trente derniers jours.
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

{onglet === 'suivi' && (
          <>
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
          </>
        )}


{onglet === 'informations' && (
          <>
        {/* ---------------------------------------------------------------
            La fiche complète, en bas : on la remplit à tête reposée.
        --------------------------------------------------------------- */}
        <h2 className="mt-12 font-display text-xl italic text-bone">Fiche</h2>
        <form action={updateCrmVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="crmId" value={c.id} />
          {/* Un lieu de test se comporte comme un vrai — sinon le test ne
              prouve rien — mais il sort de tous les compteurs. */}
          <label className="col-span-full flex items-center gap-3 rounded-xl border hairline bg-ink-800 px-4 py-3">
            <input
              type="checkbox"
              name="is_test"
              defaultChecked={!!c.is_test}
              className="h-4 w-4 accent-brass"
            />
            <span className="text-sm text-bone">
              Lieu de test
              <span className="ml-2 text-xs text-bone-faint">
                exclu du MRR, des essais et du pipeline
              </span>
            </span>
          </label>
          <Input name="name" label="Nom" defaultValue={c.name} required />
          <Input name="city" label="Ville" defaultValue={c.city} />
          <label className="block">
            <span className="text-xs text-bone-faint">Type de lieu</span>
            <select
              name="type"
              defaultValue={c.type ?? ''}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              <option value="">Non renseigné</option>
              {VENUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
              {/* Les fiches de prospection d'avant la liste fermée portent des
                  types saisis à la main. On les garde plutôt que de les écraser
                  silencieusement au premier enregistrement. */}
              {c.type && !VENUE_TYPES.some((t) => t.value === c.type) && (
                <option value={c.type}>{c.type} (ancienne saisie)</option>
              )}
            </select>
          </label>
          <Input
            name="category"
            label="Précision libre (brasserie de quartier, club privé…)"
            defaultValue={c.category}
          />
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
          {/* Le nombre de supports détermine la formule : c'est une couverture
              de salle qu'on vend, pas une liste de fonctions. En dessous d'un
              certain nombre, le QR n'est pas scanné et le lieu ne voit rien
              venir. */}
          <Input
            name="supports_count"
            label="Supports installés (détermine la formule)"
            type="number"
            defaultValue={c.supports_count}
          />
          <label className="block">
            <span className="text-xs text-bone-faint">Durée d&rsquo;engagement</span>
            <select
              name="commitment_months"
              defaultValue={c.commitment_months ? String(c.commitment_months) : ''}
              className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
            >
              <option value="">À définir</option>
              <option value="3">3 mois — plein tarif</option>
              <option value="6">6 mois — remise de 10 %</option>
              <option value="12">12 mois — remise de 20 %</option>
            </select>
          </label>
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

          {!c.venue_id && (
            <label className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                name="is_group"
                defaultChecked={!!c.is_group}
                className="h-5 w-5 accent-[#C9A46A]"
              />
              <span className="text-sm text-bone-dim">
                Cette fiche est un groupe, pas un lieu
                <span className="block text-[11px] text-bone-faint">
                  Un groupe se prospecte comme un lieu mais n&rsquo;a ni QR ni abonnement propre.
                </span>
              </span>
            </label>
          )}

          {!c.is_group && (
            <label className="block sm:col-span-2">
              <span className="text-xs text-bone-faint">Rattaché au groupe</span>
              <select
                name="group_id"
                defaultValue={c.group_id ?? ''}
                className="mt-1 min-h-[48px] w-full rounded-xl border hairline bg-ink-800 px-4 text-sm text-bone"
              >
                <option value="">Indépendant</option>
                {(groupes ?? []).map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          )}

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

            {/* La photo d'ambiance se pose ici, avec le reste de l'identite du
                lieu : c'est la premiere chose que voit quelqu'un qui scanne. */}
            {venue && (
              <div className="mt-8 rounded-2xl border hairline p-5">
                <CoverPhotoPanel venueId={venue.id} currentUrl={venue.cover_photo_url ?? null} />
              </div>
            )}
          </>
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
