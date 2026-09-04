'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ensureUploadableImage } from '@/lib/imageUpload';
import { Button } from '@/components/ui/Button';
import { SHOP_PRODUCTS, SHOP_CATEGORIES, type ShopProduct } from '@/lib/products';

interface VenueLite {
  id: string;
  name: string;
  cover_photo_url: string | null;
}

interface OrderRow {
  id: string;
  product_name: string;
  quantity: number;
  custom_text: string | null;
  status: string;
  created_at: string;
}

export function ShopView({ venue, orders }: { venue: VenueLite; orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ShopProduct | null>(null);
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
          Commandez des supports imprimés pour votre établissement, avec votre logo et
          votre propre texte. Ceci envoie une demande — nous confirmons le prix et la
          livraison par email.
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

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl border hairline transition-colors hover:border-brass"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-bone px-3 py-1 font-mono text-xs font-semibold text-ink">
                  {p.price}
                </span>
              </div>
              <div className="p-5">
                <p className="font-display text-lg italic text-bone">{p.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-bone-dim">{p.description}</p>
                <button
                  onClick={() => setSelected(p)}
                  className="mt-4 w-full rounded-full bg-bone py-2.5 text-xs font-medium tracking-wide text-ink transition-colors hover:bg-brass-bright"
                >
                  Commander
                </button>
              </div>
            </div>
          ))}
        </div>

        {orders.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl italic text-bone">Vos commandes</h2>
            <div className="mt-4 divide-y hairline rounded-2xl border hairline">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm text-bone">
                      {o.quantity}× {o.product_name}
                    </p>
                    {o.custom_text && <p className="mt-0.5 text-xs text-bone-faint">&ldquo;{o.custom_text}&rdquo;</p>}
                  </div>
                  <span className="rounded-full border hairline px-3 py-1 text-[11px] text-bone-dim">
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <OrderModal
          product={selected}
          venue={venue}
          onClose={() => setSelected(null)}
          onSubmitted={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

function OrderModal({
  product,
  venue,
  onClose,
  onSubmitted,
}: {
  product: ShopProduct;
  venue: VenueLite;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [quantity, setQuantity] = useState('25');
  const [customText, setCustomText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(venue.cover_photo_url);
  const [convertingLogo, setConvertingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setConvertingLogo(true);
    const uploadable = await ensureUploadableImage(file);
    setConvertingLogo(false);
    setLogoFile(uploadable);
    setLogoPreview(URL.createObjectURL(uploadable));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.set('venueId', venue.id);
    formData.set('productId', product.id);
    formData.set('productName', product.name);
    formData.set('quantity', String(Number(quantity) || 1));
    if (product.allowsCustomText && customText) formData.set('customText', customText);
    if (logoFile) formData.set('logoFile', logoFile);

    const res = await fetch('/api/venue-order', {
      method: 'POST',
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Une erreur est survenue.');
      return;
    }

    onSubmitted();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl border hairline bg-ink-900 sm:rounded-3xl">
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-ink-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/80 text-bone backdrop-blur"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <p className="font-display text-xl italic text-bone">{product.name}</p>
          <p className="mt-1 text-xs text-bone-dim">{product.description}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
            <label className="mb-1 block text-xs text-bone-faint">Quantité</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone focus:border-brass"
            />
          </div>

          {product.allowsCustomText && (
            <div>
              <label className="mb-1 block text-xs text-bone-faint">Texte personnalisé sur le support</label>
              <textarea
                placeholder="ex. Scannez pour voir qui est là ce soir"
                rows={2}
                maxLength={120}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full rounded-2xl border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs text-bone-faint">Logo</label>
            <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border hairline bg-ink-800 text-[11px] text-bone-faint">
              {convertingLogo ? (
                '…'
              ) : logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                'Ajouter un logo'
              )}
              <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
            </label>
            <p className="mt-2 text-[11px] text-bone-faint">
              Utilise par défaut la photo de couverture de votre établissement si vous n’en
              téléversez pas.
            </p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Envoi…' : 'Passer la commande'}
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}
