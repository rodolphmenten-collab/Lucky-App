'use client';

import { useState } from 'react';
import { Reveal } from './Reveal';

export function FAQ({ eyebrow, title, items }: { eyebrow: string; title: string; items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-3xl border-t hairline px-6 py-28">
      <Reveal>
        <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-brass">{eyebrow}</p>
        <h2 className="mt-4 text-center font-display text-4xl italic leading-tight text-bone text-balance">
          {title}
        </h2>
      </Reveal>

      <div className="mt-12 divide-y hairline">
        {items.map((item, i) => (
          <Reveal key={item.q} delay={i * 60}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-sm text-bone">{item.q}</span>
              <span
                className={`shrink-0 font-mono text-lg text-brass transition-transform duration-300 ${
                  open === i ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-sm leading-relaxed text-bone-dim">{item.a}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
