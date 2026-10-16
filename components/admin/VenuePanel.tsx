'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Le volet « établissement » de la fiche : le lien public et son QR.
 *
 * Le QR est regénéré à l'affichage depuis le slug, il n'est stocké nulle part.
 * C'est voulu : un QR est une image de l'URL, pas une donnée. Tant que le slug
 * ne change pas, celui-ci et celui que le patron a imprimé sont le même.
 */
export function VenuePanel({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const url = `${siteUrl.replace(/\/$/, '')}/venue/${slug}`;

  function download() {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lucky-qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div ref={ref} className="shrink-0 rounded-xl bg-bone p-3">
        <QRCodeSVG value={url} size={132} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-bone-faint">Page publique du lieu</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all font-mono text-xs text-brass underline"
        >
          {url}
        </a>
        <p className="mt-3 text-[11px] leading-relaxed text-bone-faint">
          Le QR pointe vers cette page. À imprimer pour l&rsquo;accueil, le bar, les tables ou
          les chambres.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={download}
            className="min-h-[44px] rounded-full border hairline px-5 text-xs text-bone-dim hover:border-brass hover:text-brass"
          >
            Télécharger le QR
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(url)}
            className="min-h-[44px] rounded-full border hairline px-5 text-xs text-bone-dim hover:border-brass hover:text-brass"
          >
            Copier le lien
          </button>
        </div>
      </div>
    </div>
  );
}
