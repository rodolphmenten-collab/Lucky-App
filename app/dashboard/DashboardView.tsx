'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { AdminViewingBar } from '@/components/AdminViewingBar';
import { formatPrice } from '@/lib/luckyCodes';
import type { AttributionStats, TodayOrder } from '@/lib/attribution';

interface Stats {
  people_here_now: number;
  verified_now: number;
  checkins_today: number;
  unique_visitors_today: number;
  waves_today: number;
  matches_today: number;
}

interface VenueLite {
  id: string;
  slug: string;
  name: string;
  city: string;
  plan: string;
}

export function DashboardView({
  venue,
  stats,
  venues,
  attribution,
  todayOrders = [],
  isAdminViewing = false,
}: {
  venue: VenueLite;
  stats: Stats | null;
  venues: VenueLite[];
  attribution: AttributionStats | null;
  todayOrders?: TodayOrder[];
  isAdminViewing?: boolean;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const venueUrl = `${siteUrl}/venue/${venue.slug}`;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  const connectionRate =
    stats && stats.checkins_today > 0
      ? Math.round((stats.matches_today / stats.checkins_today) * 100)
      : 0;

  function downloadQr() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${venue.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: 'Présents en ce moment', value: stats?.people_here_now ?? 0 },
    { label: 'Vérifiés maintenant', value: stats?.verified_now ?? 0 },
    { label: "Check-ins aujourd'hui", value: stats?.checkins_today ?? 0 },
    { label: "Visiteurs uniques aujourd'hui", value: stats?.unique_visitors_today ?? 0 },
    { label: "Waves aujourd'hui", value: stats?.waves_today ?? 0 },
    { label: "Matches aujourd'hui", value: stats?.matches_today ?? 0 },
  ];

  return (
    <main className="min-h-screen px-6 py-12">
      {isAdminViewing && <AdminViewingBar venueName={venue.name} />}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Dashboard</p>
            <h1 className="mt-2 font-display text-3xl italic text-bone">{venue.name}</h1>
            <p className="mt-1 text-xs text-bone-faint">
              {venue.city} · plan {venue.plan}
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/dashboard/edit?venue=${venue.id}`}
                className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-brass hover:text-brass"
              >
                Modifier le profil
              </Link>
              <Link
                href={`/dashboard/carte?venue=${venue.id}`}
                className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-brass hover:text-brass"
              >
                Carte &amp; avantage
              </Link>
              <Link
                href={`/dashboard/shop?venue=${venue.id}`}
                className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-brass hover:text-brass"
              >
                Boutique
              </Link>
              {!isAdminViewing && (
                <Link
                  href="/dashboard/account"
                  className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim hover:border-brass hover:text-brass"
                >
                  Compte
                </Link>
              )}
            </div>
          </div>
          {venues.length > 1 && (
            <p className="text-xs text-bone-faint">{venues.length} établissements liés à ce compte</p>
          )}
          {!isAdminViewing && (
            <button
              onClick={handleSignOut}
              className="ml-4 shrink-0 rounded-full border border-red-400/40 px-4 py-2 text-xs tracking-wide text-red-400 hover:bg-red-400/10"
            >
              Se déconnecter
            </button>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border hairline p-5">
              <p className="font-display text-3xl text-bone">{c.value}</p>
              <p className="mt-1 text-xs text-bone-faint">{c.label}</p>
            </div>
          ))}
          <div className="rounded-2xl border hairline p-5">
            <p className="font-display text-3xl text-brass">{connectionRate}%</p>
            <p className="mt-1 text-xs text-bone-faint">Taux de connexion aujourd'hui</p>
          </div>
        </div>

        {attribution && (
          <section className="mt-12 rounded-2xl border border-brass/30 bg-brass/[0.03] p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl italic text-bone">Ce que Lucky a généré ici</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-faint">
                {attribution.windowDays} derniers jours
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border hairline p-5">
                <p className="font-display text-3xl text-bone">{attribution.meetupsConfirmed}</p>
                <p className="mt-1 text-xs text-bone-faint">Rencontres confirmées</p>
                <p className="mt-2 text-[11px] leading-relaxed text-bone-faint">
                  Des connexions que les deux personnes ont confirmé avoir transformées en vraie
                  rencontre, ici. {attribution.meetupsConfirmedToday} aujourd’hui.
                </p>
              </div>

              <div className="rounded-xl border border-brass/40 p-5">
                <p className="font-display text-3xl text-brass">
                  {formatPrice(attribution.revenueCertifiedCents)}
                </p>
                <p className="mt-1 text-xs text-bone-faint">CA certifié</p>
                <p className="mt-2 text-[11px] leading-relaxed text-bone-faint">
                  {attribution.ordersServed} commande{attribution.ordersServed > 1 ? 's' : ''} passée
                  {attribution.ordersServed > 1 ? 's' : ''} dans Lucky et confirmée
                  {attribution.ordersServed > 1 ? 's' : ''} reçue{attribution.ordersServed > 1 ? 's' : ''}.
                  Montants issus de votre carte, aucune saisie manuelle.
                </p>
              </div>

              <div className="rounded-xl border hairline p-5">
                <p className="font-display text-3xl text-bone-dim">
                  {attribution.averageTicketCents
                    ? `~ ${formatPrice(attribution.revenueEstimatedCents)}`
                    : '—'}
                </p>
                <p className="mt-1 text-xs text-bone-faint">CA estimé</p>
                <p className="mt-2 text-[11px] leading-relaxed text-bone-faint">
                  {attribution.averageTicketCents ? (
                    <>
                      {attribution.meetupsWithoutOrder} rencontre
                      {attribution.meetupsWithoutOrder > 1 ? 's' : ''} sans commande Lucky, valorisée
                      {attribution.meetupsWithoutOrder > 1 ? 's' : ''} à votre panier moyen (
                      {formatPrice(attribution.averageTicketCents)}). C’est une estimation, pas une
                      mesure.
                    </>
                  ) : (
                    <>
                      Renseignez votre panier moyen dans « Carte &amp; avantage » pour estimer ce que
                      pèsent les {attribution.meetupsWithoutOrder} rencontres sans commande Lucky.
                    </>
                  )}
                </p>
              </div>
            </div>

            {attribution.discountGrantedCents > 0 && (
              <p className="mt-4 text-xs text-bone-dim">
                Remise Lucky consentie sur la période : {formatPrice(attribution.discountGrantedCents)}.
                Le CA ci-dessus est net, c'est ce qui est réellement entré en caisse.
              </p>
            )}

            {attribution.ordersPending > 0 && (
              <p className="mt-4 text-xs text-bone-dim">
                {attribution.ordersPending} bon{attribution.ordersPending > 1 ? 's' : ''} émis (
                {formatPrice(attribution.revenuePendingCents)}) en attente de confirmation de
                réception — pas encore compté.
              </p>
            )}

            {/* ---- Recoupement caisse ------------------------------------- */}
            <div className="mt-6 border-t hairline pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-bone">Bons du jour</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-faint">
                  à recouper en fin de service
                </p>
              </div>

              {todayOrders.length === 0 ? (
                <p className="mt-3 text-xs text-bone-faint">Aucun bon émis aujourd’hui.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-bone-faint">
                      <tr>
                        <th className="py-2 pr-3 font-normal">Heure</th>
                        <th className="py-2 pr-3 font-normal">Code</th>
                        <th className="py-2 pr-3 font-normal">Article</th>
                        <th className="py-2 pr-3 text-right font-normal">Carte</th>
                        <th className="py-2 pr-3 text-right font-normal">Encaissé</th>
                        <th className="py-2 font-normal">État</th>
                      </tr>
                    </thead>
                    <tbody className="text-bone-dim">
                      {todayOrders.map((o) => (
                        <tr key={o.id} className="border-t hairline">
                          <td className="py-2 pr-3 font-mono">
                            {new Date(o.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2 pr-3 font-mono tracking-[0.1em] text-brass">{o.code}</td>
                          <td className="py-2 pr-3 text-bone">{o.item_name}</td>
                          <td className="py-2 pr-3 text-right">{formatPrice(o.price_cents)}</td>
                          <td className="py-2 pr-3 text-right text-bone">
                            {formatPrice(o.net_price_cents ?? o.price_cents)}
                            {o.discount_percent > 0 && (
                              <span className="text-bone-faint"> (-{o.discount_percent}%)</span>
                            )}
                          </td>
                          <td className="py-2">
                            {o.status === 'served' && <span className="text-brass">servi</span>}
                            {o.status === 'pending' && <span className="text-bone-faint">en attente</span>}
                            {o.status === 'cancelled' && <span className="text-bone-faint">annulé</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="mt-5 border-t hairline pt-4 text-[11px] leading-relaxed text-bone-faint">
              Rien n’est demandé à votre équipe de salle : le bon affiche le code, l’article et le
              prix remisé à encaisser. Le bar lit, sert, met sur l’addition. Aucune saisie, aucun
              accès à ce dashboard — ce tableau est là pour que vous recoupiez vous-même en fin de
              service.
            </p>
          </section>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border hairline p-6">
            <p className="text-sm text-bone">QR de l’établissement</p>
            <p className="mt-1 text-xs text-bone-faint">
              À imprimer pour l’accueil, le bar, les tables ou les chambres. Pointe vers {venueUrl || `/venue/${venue.slug}`}.
            </p>
            <div ref={qrRef} className="mt-5 inline-block rounded-xl bg-bone p-4">
              <QRCodeSVG value={venueUrl || `https://example.com/venue/${venue.slug}`} size={160} />
            </div>
            <button
              onClick={downloadQr}
              className="mt-4 block rounded-full border hairline px-5 py-2.5 text-xs tracking-wide text-bone-dim hover:border-white/30"
            >
              Télécharger le QR code
            </button>
          </div>

          <div className="rounded-2xl border hairline p-6">
            <p className="text-sm text-bone">Confidentialité</p>
            <p className="mt-3 text-xs leading-relaxed text-bone-dim">
              Ce dashboard n’affiche que des chiffres agrégés. {venue.name} ne peut pas voir
              les coordonnées individuelles, le contenu des messages, ni qui a bloqué qui — ces informations
              sont exclues de chaque table que ce dashboard lit, au niveau de la base de
              données, pas seulement cachées dans l’interface.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
