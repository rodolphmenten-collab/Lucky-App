import Link from 'next/link';
import { formatEuros } from '@/lib/crm';
import type { AttributionStats, TodayOrder } from '@/lib/attribution';

/**
 * La performance du lieu, telle qu'il la voit depuis son propre compte.
 *
 * Elle existait déjà, mais seulement derrière « visualiser comme le lieu » :
 * pour répondre à « et ça donne quoi chez eux ? » il fallait changer de
 * contexte, puis revenir. Les mêmes chiffres sont ici, dans la fiche, à côté
 * du suivi commercial — c'est là qu'on en a besoin pendant un appel.
 */
export function PerformancePanel({
  venueName,
  venueId,
  stats,
  attribution,
  todayOrders,
  abonnes,
}: {
  venueName: string;
  venueId: string;
  stats: any;
  attribution: AttributionStats | null;
  todayOrders: TodayOrder[];
  abonnes: number;
}) {
  const temps = [
    { label: 'Présents en ce moment', valeur: stats?.people_here_now ?? 0 },
    { label: 'Vérifiés maintenant', valeur: stats?.verified_now ?? 0 },
    { label: "Check-ins aujourd'hui", valeur: stats?.checkins_today ?? 0 },
    { label: 'Visiteurs uniques', valeur: stats?.unique_visitors_today ?? 0 },
    { label: "Waves aujourd'hui", valeur: stats?.waves_today ?? 0 },
    { label: "Matches aujourd'hui", valeur: stats?.matches_today ?? 0 },
  ];

  const jours = attribution?.windowDays ?? 30;
  const fenetre = [
    { label: 'Rencontres confirmées', valeur: String(attribution?.meetupsConfirmed ?? 0) },
    { label: 'Bons servis', valeur: String(attribution?.ordersServed ?? 0) },
    { label: 'Bons en attente', valeur: String(attribution?.ordersPending ?? 0) },
    {
      label: 'CA certifié',
      valeur: formatEuros(attribution?.revenueCertifiedCents ?? 0),
      fort: true,
    },
    { label: 'CA en attente', valeur: formatEuros(attribution?.revenuePendingCents ?? 0) },
    { label: 'Remise accordée', valeur: formatEuros(attribution?.discountGrantedCents ?? 0) },
  ];

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border hairline p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">En ce moment</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {temps.map((t) => (
            <div key={t.label} className="rounded-xl border hairline bg-ink-800 p-4">
              <p className="font-display text-2xl text-bone">{t.valeur}</p>
              <p className="mt-1 text-xs leading-snug text-bone-faint">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border hairline p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Sur {jours} jours
          </p>
          {attribution?.meetupsWithoutOrder ? (
            <p className="text-xs text-bone-faint">
              {attribution.meetupsWithoutOrder} rencontre
              {attribution.meetupsWithoutOrder > 1 ? 's' : ''} sans consommation
            </p>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fenetre.map((f) => (
            <div key={f.label} className="rounded-xl border hairline bg-ink-800 p-4">
              <p className={`font-display text-2xl ${f.fort ? 'text-brass' : 'text-bone'}`}>
                {f.valeur}
              </p>
              <p className="mt-1 text-xs leading-snug text-bone-faint">{f.label}</p>
            </div>
          ))}
        </div>
        {/* Le CA estimé repose sur un ticket moyen saisi à la main : il est
            donné à part pour qu'on ne le confonde pas avec le CA certifié,
            qui lui est tracké bon par bon. */}
        {attribution?.averageTicketCents ? (
          <p className="mt-4 text-xs leading-relaxed text-bone-faint">
            CA estimé {formatEuros(attribution.revenueEstimatedCents)} sur la base d&rsquo;un
            ticket moyen de {formatEuros(attribution.averageTicketCents)} — à distinguer du CA
            certifié ci-dessus, qui est tracké bon par bon.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border hairline p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Abonnés</p>
            <p className="mt-2 font-display text-2xl text-bone">{abonnes}</p>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-bone-faint">
            Personnes ayant accepté de recevoir les actualités de {venueName}. La liste et son
            export sont dans le compte du lieu — elle lui appartient, elle n&rsquo;est pas
            consultable ici.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border hairline p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
          Bons émis aujourd&rsquo;hui
        </p>
        {todayOrders.length === 0 ? (
          <p className="mt-3 text-sm text-bone-dim">Aucun bon aujourd&rsquo;hui.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border hairline">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-800">
                <tr className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Article</th>
                  <th className="px-4 py-2">Net</th>
                  <th className="px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {todayOrders.map((o) => (
                  <tr key={o.id} className="border-t hairline">
                    <td className="px-4 py-2 font-mono text-xs text-brass">{o.code}</td>
                    <td className="px-4 py-2 text-bone">{o.item_name}</td>
                    <td className="px-4 py-2 text-bone-dim">
                      {formatEuros(o.net_price_cents ?? o.price_cents)}
                    </td>
                    <td className="px-4 py-2 text-bone-faint">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-bone-faint">
        Ces chiffres sont ceux que le lieu voit dans son propre compte.{' '}
        <Link href={`/admin/venues/${venueId}`} className="underline hover:text-bone-dim">
          Visualiser comme le lieu
        </Link>{' '}
        pour voir l&rsquo;écran exactement comme lui.
      </p>
    </div>
  );
}
