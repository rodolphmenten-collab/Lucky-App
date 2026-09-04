'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SHOP_PRODUCTS, SHOP_CATEGORIES, type ShopProduct } from '@/lib/products';

interface VenueLite {
  id: string;
  name: string;
  cover_photo_url: string | null;
}

export function ShopView({ venue }: { venue: VenueLite }) {
  const [category, setCategory] = useState<ShopProduct['category'] | 'all'>('all');
  const filteredProducts = category === 'all' ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter((p) => p.category === category);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-xs text-bone-faint hover:text-bone-dim">
          &larr; Retour au dashboard
        </Link>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-brass">Boutique</p>
        <h1 className="mt-2 font-display text-3xl italic text-bone">Supports physiques pour {venue.name}</h1>
        <p className="mt-2 text-sm text-bone-dim">
          Une sélection de supports QR code fabriqués en France par nos partenaires. Chaque
          produit s&rsquo;achète directement chez le fournisseur — vraies photos, vrais prix,
          livraison sous quelques jours.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {SHOP_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-colors ${
                category === c.id ? 'border-brass text-brass' : 'hairline text-bone-dim hover:border-white/30'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredProducts.map((p) => (
            <a
              key={p.id}
              href={p.supplierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-2xl border hairline p-5 transition-colors hover:border-brass"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg italic text-bone">{p.name}</p>
                  <span className="shrink-0 rounded-full bg-bone px-3 py-1 font-mono text-xs font-semibold text-ink">
                    {p.price}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-bone-dim">{p.description}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t hairline pt-4">
                <span className="text-[11px] text-bone-faint">Fabriqué par {p.supplierName}</span>
                <span className="text-xs text-brass transition-transform group-hover:translate-x-0.5">
                  Voir le produit ↗
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-8 text-[11px] text-bone-faint">
          Lucky ne fabrique pas ces supports lui-même — ils sont vendus et livrés directement
          par {SHOP_PRODUCTS[0]?.supplierName ?? 'nos partenaires'}. Pour le QR code de votre
          établissement, téléchargez-le depuis votre tableau de bord principal.
        </p>
      </div>
    </main>
  );
}
