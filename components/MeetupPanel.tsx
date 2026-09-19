'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { formatPrice } from '@/lib/luckyCodes';

export interface Meetup {
  id: string;
  match_id: string;
  code: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  requested_by: string;
  confirmed_at: string | null;
}

export interface LuckyOrder {
  id: string;
  match_id: string;
  from_user: string;
  to_user: string;
  item_name: string;
  price_cents: number;
  discount_percent: number;
  net_price_cents: number | null;
  code: string;
  status: 'pending' | 'served' | 'cancelled';
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  price_cents: number;
  net_price_cents: number;
  category: string;
}

// Le net est figé à la commande ; les anciennes lignes n'en ont pas.
function netOf(order: LuckyOrder): number {
  return order.net_price_cents ?? order.price_cents;
}

/**
 * Le pont entre la connexion numérique et le comptoir.
 *
 * Rien n'est demandé au personnel : le client confirme la rencontre, choisit
 * éventuellement un verre dans la carte du lieu, et montre le bon qui s'affiche
 * sur son téléphone. Le montant est déjà connu (il vient de la carte), la
 * réception est confirmée par la personne qui reçoit le verre.
 */
export function MeetupPanel({
  matchId,
  currentUserId,
  otherName,
  perkLabel,
  discountPercent,
  initialMeetup,
  initialOrders,
}: {
  matchId: string;
  currentUserId: string;
  otherName: string;
  perkLabel: string | null;
  discountPercent: number;
  initialMeetup: Meetup | null;
  initialOrders: LuckyOrder[];
}) {
  const supabase = createClient();
  const { t } = useLanguage();
  const [meetup, setMeetup] = useState<Meetup | null>(initialMeetup);
  const [orders, setOrders] = useState<LuckyOrder[]>(initialOrders);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [menuError, setMenuError] = useState(false);
  const [voucher, setVoucher] = useState<LuckyOrder | null>(null);

  const copy = t.meetup;

  // Temps réel : la rencontre et les bons doivent apparaître chez l'autre
  // sans rafraîchissement (même logique que les messages).
  useEffect(() => {
    const channel = supabase
      .channel(`meetup:${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetups', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const incoming = payload.new as Meetup | undefined;
          // Un DELETE (cascade sur le match) renvoie un payload vide : on ignore.
          if (incoming?.id) setMeetup(incoming);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lucky_orders', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const incoming = payload.new as LuckyOrder | undefined;
          if (!incoming?.id) return;
          setOrders((prev) => {
            const without = prev.filter((o) => o.id !== incoming.id);
            return [...without, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  async function confirmMeetup() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/meetup/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (res.ok && data.meetup) setMeetup(data.meetup as Meetup);
    } finally {
      setBusy(false);
    }
  }

  async function openPicker() {
    setShowPicker(true);
    if (menu) return;
    try {
      const res = await fetch(`/api/venue-menu?matchId=${matchId}`);
      const data = await res.json();
      if (res.ok) setMenu(data.items as MenuItem[]);
      else setMenuError(true);
    } catch {
      setMenuError(true);
    }
  }

  async function offer(item: MenuItem) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/lucky-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, itemId: item.id }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        const order = data.order as LuckyOrder;
        setOrders((prev) => [...prev.filter((o) => o.id !== order.id), order]);
        setShowPicker(false);
        setVoucher(order);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resolveOrder(order: LuckyOrder, action: 'served' | 'cancel') {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/lucky-order/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        const updated = data.order as LuckyOrder;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        if (voucher?.id === updated.id) setVoucher(null);
      }
    } finally {
      setBusy(false);
    }
  }

  const confirmed = meetup?.status === 'confirmed';
  const waitingOnOther = meetup?.status === 'pending' && meetup.requested_by === currentUserId;
  const waitingOnMe = meetup?.status === 'pending' && meetup.requested_by !== currentUserId;
  const liveOrders = orders.filter((o) => o.status !== 'cancelled');

  return (
    <div className="mt-4 space-y-3">
      {/* ---- Rencontre ---------------------------------------------------- */}
      {!meetup && (
        <button
          onClick={confirmMeetup}
          disabled={busy}
          className="w-full rounded-2xl border hairline bg-ink-800 px-5 py-4 text-sm text-bone transition-colors hover:border-brass hover:text-brass disabled:opacity-50"
        >
          {copy.meetCta}
        </button>
      )}

      {waitingOnOther && (
        <p className="rounded-2xl border hairline bg-ink-800 px-5 py-4 text-center text-xs text-bone-dim">
          {copy.waitingOnOther(otherName)}
        </p>
      )}

      {waitingOnMe && (
        <div className="rounded-2xl border border-brass/40 bg-brass/5 px-5 py-4 text-center">
          <p className="text-sm text-bone">{copy.otherProposed(otherName)}</p>
          <button
            onClick={confirmMeetup}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
          >
            {copy.confirmMeet}
          </button>
        </div>
      )}

      {confirmed && meetup && (
        <div className="rounded-2xl border border-brass/40 bg-brass/5 px-5 py-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">{copy.codeLabel}</p>
          <p className="mt-1 font-display text-3xl tracking-[0.2em] text-bone">{meetup.code}</p>
          {discountPercent > 0 && (
            <p className="mt-2 text-xs text-bone-dim">
              {copy.perkPrefix} <span className="text-brass">{copy.discountLine(discountPercent)}</span>
            </p>
          )}
          {perkLabel && (
            <p className="mt-1 text-xs text-bone-dim">
              {discountPercent > 0 ? copy.andAlso : copy.perkPrefix}{' '}
              <span className="text-brass">{perkLabel}</span>
            </p>
          )}
          {discountPercent === 0 && !perkLabel && (
            <p className="mt-2 text-xs text-bone-faint">{copy.showAtBar}</p>
          )}
        </div>
      )}

      {/* ---- Offrir un verre ----------------------------------------------
          Toujours disponible : offrir un verre est souvent ce qui déclenche la
          rencontre, pas ce qui la suit. La commande se rattache à la rencontre
          si elle existe déjà. */}
      {
        <button
          onClick={openPicker}
          disabled={busy}
          className="w-full rounded-2xl border hairline bg-ink-800 px-5 py-4 text-sm text-bone transition-colors hover:border-brass hover:text-brass disabled:opacity-50"
        >
          {copy.offerCta}
        </button>
      }

      {/* ---- Bons en cours ------------------------------------------------ */}
      {liveOrders.map((order) => {
        const mine = order.from_user === currentUserId;
        return (
          <div key={order.id} className="rounded-2xl border hairline bg-ink-800 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-bone">
                  {mine ? copy.youOffered(otherName) : copy.offeredYou(otherName)}
                </p>
                <p className="mt-0.5 text-xs text-bone-dim">
                  {order.item_name} ·{' '}
                  {order.discount_percent > 0 && (
                    <span className="text-bone-faint line-through">{formatPrice(order.price_cents)}</span>
                  )}{' '}
                  <span className="text-bone">{formatPrice(netOf(order))}</span>
                  {order.discount_percent > 0 && (
                    <span className="text-brass"> · -{order.discount_percent}%</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setVoucher(order)}
                className="shrink-0 font-mono text-sm tracking-[0.15em] text-brass underline decoration-brass/40"
              >
                {order.code}
              </button>
            </div>

            {order.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => resolveOrder(order, 'served')}
                  disabled={busy}
                  className="flex-1 rounded-full bg-bone px-4 py-2 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
                >
                  {copy.markReceived}
                </button>
                <button
                  onClick={() => resolveOrder(order, 'cancel')}
                  disabled={busy}
                  className="rounded-full border hairline px-4 py-2 text-xs text-bone-faint disabled:opacity-50"
                >
                  {copy.cancel}
                </button>
              </div>
            )}

            {order.status === 'served' && (
              <p className="mt-2 text-xs text-brass">{copy.served}</p>
            )}
          </div>
        );
      })}

      {/* ---- Sélecteur de carte (portal : sinon piégé par l'animation) ----- */}
      {showPicker &&
        createPortal(
          <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 sm:items-center sm:p-6">
            <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl border hairline bg-ink-900 p-6 sm:rounded-3xl">
              <p className="font-display text-xl italic text-bone">{copy.offerTitle(otherName)}</p>
              <p className="mt-1 text-xs text-bone-faint">
                {discountPercent > 0 ? copy.offerSubtitleDiscount(discountPercent) : copy.offerSubtitle}
              </p>

              <div className="mt-5 space-y-2">
                {menu === null && !menuError && (
                  <p className="py-6 text-center text-xs text-bone-faint">{copy.loadingMenu}</p>
                )}
                {(menuError || (menu && menu.length === 0)) && (
                  <p className="py-6 text-center text-xs text-bone-faint">{copy.noMenu}</p>
                )}
                {menu?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => offer(item)}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-xl border hairline px-4 py-3 text-left text-sm text-bone transition-colors hover:border-brass hover:text-brass disabled:opacity-50"
                  >
                    <span>{item.name}</span>
                    <span className="shrink-0 pl-3 text-right font-mono text-xs">
                      {item.net_price_cents < item.price_cents && (
                        <span className="text-bone-faint line-through">{formatPrice(item.price_cents)}</span>
                      )}{' '}
                      <span className="text-brass">{formatPrice(item.net_price_cents)}</span>
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowPicker(false)}
                className="mt-5 w-full rounded-full border hairline py-2.5 text-xs text-bone-dim"
              >
                {copy.close}
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ---- Le bon à montrer au bar -------------------------------------- */}
      {voucher &&
        createPortal(
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-6">
            <div className="w-full max-w-sm rounded-3xl border border-brass/40 bg-ink-900 p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">{copy.voucherLabel}</p>
              <p className="mt-4 font-display text-5xl tracking-[0.2em] text-bone">{voucher.code}</p>
              <p className="mt-4 text-sm text-bone">{voucher.item_name}</p>

              <div className="mt-4 rounded-2xl border border-brass/40 bg-brass/5 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass">
                  {copy.amountToCharge}
                </p>
                <p className="mt-1 font-display text-2xl text-bone">{formatPrice(netOf(voucher))}</p>
                {voucher.discount_percent > 0 && (
                  <p className="mt-1 text-[11px] text-bone-dim">
                    {copy.insteadOf} <span className="line-through">{formatPrice(voucher.price_cents)}</span> ·
                    <span className="text-brass"> -{voucher.discount_percent}% Lucky</span>
                  </p>
                )}
              </div>

              <p className="mt-6 text-xs leading-relaxed text-bone-faint">{copy.voucherHint}</p>
              <button
                onClick={() => setVoucher(null)}
                className="mt-6 w-full rounded-full border hairline py-2.5 text-xs text-bone-dim"
              >
                {copy.close}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
