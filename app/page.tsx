'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Logo } from '@/components/Logo';
import { ProductShowcase } from '@/components/ProductShowcase';
import { Reveal } from '@/components/Reveal';
import { FAQ } from '@/components/FAQ';
import { landingCopy, type Lang } from '@/lib/i18n/landing';

const VENUE_TYPES = [
  'Hotels', 'Restaurants', 'Bars', 'Rooftops', 'Beach Clubs', 'Coworkings', 'Events',
];

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    const saved = window.localStorage.getItem('here-lang') as Lang | null;
    if (saved === 'en' || saved === 'fr') setLang(saved);
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    window.localStorage.setItem('here-lang', next);
  }

  const t = landingCopy[lang];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Top nav */}
      <div className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 pt-8">
        <Logo size={48} showWordmark />
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onChange={changeLang} />
          <Link
            href="/venue-login"
            className="rounded-full border hairline px-4 py-2 text-xs tracking-wide text-bone-dim transition-colors hover:border-brass hover:text-brass"
          >
            {t.logIn}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto flex min-h-[85vh] max-w-5xl flex-col justify-center px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brass/10 blur-[140px]" />
        </div>

        <p className="animate-fade_up font-mono text-xs uppercase tracking-[0.3em] text-brass">
          {t.eyebrow}
        </p>

        <h1 className="mt-6 max-w-3xl animate-fade_up font-display text-5xl italic leading-[1.05] text-bone text-balance sm:text-7xl">
          {t.heroTitle}
        </h1>

        <p className="mt-6 max-w-lg animate-fade_up text-lg text-bone-dim text-balance">
          {t.heroSubtitle}
        </p>

        <div className="mt-10 flex animate-fade_up flex-wrap items-center gap-4">
          <a
            href="mailto:hello@lucky-app.io"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-medium tracking-wide text-ink transition-colors duration-200 hover:bg-brass-bright"
          >
            {t.ctaPrimary}
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium tracking-wide text-bone transition-colors duration-200 hover:border-brass"
          >
            {t.ctaSecondary}
          </a>
        </div>

        <p className="mt-20 max-w-md animate-fade_up font-display text-xl italic text-bone-dim/80 text-balance">
          {t.heroQuote}
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{t.howItWorksEyebrow}</p>
        <div className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {t.steps.map((step, i) => (
            <Reveal key={step.mark} delay={i * 120}>
              <p className="font-display text-2xl italic text-brass">{step.mark}</p>
              <h3 className="mt-3 font-display text-2xl text-bone">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{t.previewEyebrow}</p>
          <h2 className="mt-4 font-display text-4xl italic leading-tight text-bone text-balance">
            {t.previewTitle}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-bone-dim">{t.previewBody}</p>
        </div>
        <ProductShowcase rows={t.showcaseRows as any} lang={lang} />
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{t.pricingEyebrow}</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl italic leading-tight text-bone text-balance">
          {t.pricingTitle}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {t.plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 120}>
              <div
                className={`flex h-full flex-col rounded-3xl border p-6 ${
                  'highlighted' in plan && plan.highlighted ? 'border-brass bg-brass/5' : 'hairline'
                }`}
              >
                <p className="font-display text-2xl italic text-bone">{plan.name}</p>
                <p className="mt-1 text-xs text-bone-faint">{plan.idealFor}</p>
                <p className="mt-4 font-display text-3xl text-bone">
                  {plan.price}
                  <span className="text-sm text-bone-faint">{lang === 'fr' ? '/mois' : '/mo'}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-bone-dim">
                      <span className="text-brass">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@lucky-app.io"
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                    'highlighted' in plan && plan.highlighted
                      ? 'bg-bone text-ink hover:bg-brass-bright'
                      : 'border hairline text-bone-dim hover:border-white/30'
                  }`}
                >
                  {t.choosePlan} {plan.name}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Venue types */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-16">
        <div className="flex flex-wrap gap-2">
          {VENUE_TYPES.map((tType) => (
            <span key={tType} className="rounded-full border hairline px-4 py-2 text-xs text-bone-dim">
              {tType}
            </span>
          ))}
        </div>
      </section>

      <FAQ eyebrow={t.faqEyebrow} title={t.faqTitle} items={t.faqItems as any} />

      {/* Get in touch */}
      <section className="mx-auto max-w-2xl border-t hairline px-6 py-28 text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{t.requestEyebrow}</p>
          <h2 className="mt-4 font-display text-4xl italic leading-tight text-bone text-balance">
            {t.requestTitle}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-bone-dim">{t.requestBody}</p>
          <div className="mt-8">
            <a
              href="mailto:hello@lucky-app.io"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-medium tracking-wide text-ink transition-colors duration-200 hover:bg-brass-bright"
            >
              hello@lucky-app.io
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="border-t hairline px-6 py-10">
        <p className="font-mono text-xs text-bone-faint">Lucky — {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
