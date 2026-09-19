'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface MenuItemRow {
  id: string | null;
  name: string;
  priceEuros: string;
  category: string;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'drink', label: 'Verre' },
  { value: 'bottle', label: 'Bouteille' },
  { value: 'food', label: 'Plat / snack' },
  { value: 'other', label: 'Autre' },
];

function toCents(euros: string): number {
  const n = Number(euros.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function MenuEditor({
  venue,
  initialItems,
}: {
  venue: {
    id: string;
    name: string;
    perk_label: string | null;
    average_ticket_cents: number | null;
    lucky_discount_percent: number | null;
  };
  initialItems: { id: string; name: string; price_cents: number; category: string }[];
}) {
  const [items, setItems] = useState<MenuItemRow[]>(
    initialItems.length > 0
      ? initialItems.map((i) => ({
          id: i.id,
          name: i.name,
          priceEuros: (i.price_cents / 100).toFixed(2),
          category: i.category,
        }))
      : [{ id: null, name: '', priceEuros: '', category: 'drink' }]
  );
  const [perkLabel, setPerkLabel] = useState(venue.perk_label ?? '');
  const [discountPercent, setDiscountPercent] = useState(String(venue.lucky_discount_percent ?? 0));
  const [averageTicket, setAverageTicket] = useState(
    venue.average_ticket_cents ? (venue.average_ticket_cents / 100).toFixed(2) : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discountPct = Math.max(0, Math.min(100, Math.round(Number(discountPercent) || 0)));

  function update(index: number, patch: Partial<MenuItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setSaved(false);
  }

  function addRow() {
    setItems((prev) => [...prev, { id: null, name: '', priceEuros: '', category: 'drink' }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          perkLabel,
          discountPercent: Math.max(0, Math.min(100, Math.round(Number(discountPercent) || 0))),
          averageTicketCents: averageTicket.trim() === '' ? null : toCents(averageTicket),
          items: items
            .filter((i) => i.name.trim().length > 0)
            .map((i) => ({
              id: i.id,
              name: i.name,
              priceCents: toCents(i.priceEuros),
              category: i.category,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Échec de l’enregistrement.');
        return;
      }
      setItems(
        (data.items ?? []).map((i: { id: string; name: string; price_cents: number; category: string }) => ({
          id: i.id,
          name: i.name,
          priceEuros: (i.price_cents / 100).toFixed(2),
          category: i.category,
        }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-xs text-bone-faint hover:text-bone">
          &larr; Dashboard
        </Link>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">Carte &amp; avantage</p>
        <h1 className="mt-2 font-display text-3xl italic text-bone">{venue.name}</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          Ce que vous saisissez ici est ce que vos clients peuvent s’offrir depuis Lucky. C’est aussi
          ce qui permet de chiffrer le CA généré sans que votre équipe ait quoi que ce soit à taper :
          le prix vient d’ici, pas d’une saisie au comptoir.
        </p>

        {/* ---- Avantage --------------------------------------------------- */}
        <section className="mt-10 rounded-2xl border border-brass/30 bg-brass/[0.03] p-6">
          <p className="text-sm text-bone">Avantage rencontre</p>
          <p className="mt-2 text-xs leading-relaxed text-bone-dim">
            Affiché avec le code quand deux personnes confirment s’être rencontrées chez vous. C’est
            ce qui leur donne une raison de montrer le code au bar — sans avantage, personne ne le
            sort, et vous ne voyez rien passer.
          </p>
          <input
            value={perkLabel}
            onChange={(e) => {
              setPerkLabel(e.target.value);
              setSaved(false);
            }}
            placeholder="ex. le 2e verre offert"
            maxLength={120}
            className="mt-4 w-full rounded-xl border hairline bg-transparent px-4 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
          />
        </section>

        {/* ---- Remise Lucky ----------------------------------------------- */}
        <section className="mt-8 rounded-2xl border border-brass/30 bg-brass/[0.03] p-6">
          <p className="text-sm text-bone">Remise Lucky</p>
          <p className="mt-2 text-xs leading-relaxed text-bone-dim">
            Appliquée automatiquement à tout ce qui est commandé via Lucky — c’est la remise
            convenue à la signature. Elle est affichée au client avant qu’il commande, et inscrite
            sur le bon qu’il présente au bar : votre équipe lit le prix à encaisser, elle ne le
            calcule pas.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              value={discountPercent}
              onChange={(e) => {
                setDiscountPercent(e.target.value);
                setSaved(false);
              }}
              placeholder="15"
              inputMode="numeric"
              className="w-24 rounded-xl border hairline bg-transparent px-4 py-2.5 text-right text-sm text-bone placeholder:text-bone-faint focus:border-brass"
            />
            <span className="text-xs text-bone-faint">% de remise</span>
          </div>
          <p className="mt-3 text-[11px] text-bone-faint">
            Une remise modifiée ne réécrit pas les commandes déjà passées : chaque bon garde le taux
            en vigueur au moment où il a été émis.
          </p>
        </section>

        {/* ---- Carte ------------------------------------------------------ */}
        <section className="mt-8">
          <p className="text-sm text-bone">La carte proposée dans Lucky</p>
          <p className="mt-2 text-xs leading-relaxed text-bone-dim">
            Quelques lignes suffisent : ce qu’on s’offre spontanément. La colonne de droite montre ce
            que le client verra, remise déduite. Un article retiré n’efface jamais les commandes déjà
            passées.
          </p>

          <div className="mt-5 space-y-2">
            {items.map((row, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={row.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder="Spritz"
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-xl border hairline bg-transparent px-4 py-2.5 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
                />
                <input
                  value={row.priceEuros}
                  onChange={(e) => update(index, { priceEuros: e.target.value })}
                  placeholder="9,00"
                  inputMode="decimal"
                  className="w-24 rounded-xl border hairline bg-transparent px-3 py-2.5 text-right text-sm text-bone placeholder:text-bone-faint focus:border-brass"
                />
                <span className="w-20 shrink-0 self-center text-right font-mono text-xs text-brass">
                  {row.priceEuros.trim() === ''
                    ? ''
                    : `${((toCents(row.priceEuros) * (100 - discountPct)) / 100 / 100)
                        .toFixed(2)
                        .replace('.', ',')} €`}
                </span>
                <select
                  value={row.category}
                  onChange={(e) => update(index, { category: e.target.value })}
                  className="w-28 rounded-xl border hairline bg-ink-800 px-3 py-2.5 text-xs text-bone-dim focus:border-brass"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeRow(index)}
                  className="shrink-0 px-2 text-bone-faint hover:text-red-400"
                  aria-label="Retirer"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="mt-3 rounded-full border hairline px-4 py-2 text-xs text-bone-dim hover:border-brass hover:text-brass"
          >
            + Ajouter une ligne
          </button>
        </section>

        {/* ---- Panier moyen ----------------------------------------------- */}
        <section className="mt-8 rounded-2xl border hairline p-6">
          <p className="text-sm text-bone">Panier moyen par personne</p>
          <p className="mt-2 text-xs leading-relaxed text-bone-dim">
            Sert uniquement à estimer ce que pèsent les rencontres qui n’ont pas donné lieu à une
            commande dans Lucky. Toujours affiché comme une estimation, jamais mélangé au CA certifié.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              value={averageTicket}
              onChange={(e) => {
                setAverageTicket(e.target.value);
                setSaved(false);
              }}
              placeholder="24,00"
              inputMode="decimal"
              className="w-32 rounded-xl border hairline bg-transparent px-4 py-2.5 text-right text-sm text-bone placeholder:text-bone-faint focus:border-brass"
            />
            <span className="text-xs text-bone-faint">€ par personne</span>
          </div>
        </section>

        {error && <p className="mt-6 text-xs text-red-400">{error}</p>}

        <div className="mt-8 flex items-center gap-4">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          {saved && <span className="text-xs text-brass">Enregistré.</span>}
        </div>
      </div>
    </main>
  );
}
