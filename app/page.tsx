import { VenueLeadForm } from '@/components/VenueLeadForm';

const VENUE_TYPES = [
  'Hotels', 'Restaurants', 'Bars', 'Rooftops', 'Beach Clubs', 'Coworkings', 'Events',
];

const HOW_IT_WORKS = [
  {
    mark: 'I.',
    title: 'Your QR, everywhere',
    body: 'One code at reception, the bar, or every table. Guests scan it — no app to download, no friction.',
  },
  {
    mark: 'II.',
    title: 'Verified presence',
    body: 'Not a check-in from six hours ago. Location and activity signals confirm who is actually still on-site.',
  },
  {
    mark: 'III.',
    title: 'Your venue, alive',
    body: 'Guests connect with each other while they are with you — Dating, Business, or Social — not after they have left.',
  },
];

const PLANS = [
  {
    id: 'basique',
    name: 'Basique',
    price: '99€',
    tagline: 'Get discovered on-site',
    features: [
      '1 venue QR code',
      'Logo + cover photo',
      'Core presence stats',
      'Up to 50 concurrent guests',
      'Email support',
    ],
  },
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: '149€',
    tagline: 'For venues that want the full picture',
    highlighted: true,
    features: [
      'Everything in Basique',
      'Full photo gallery',
      'Advanced stats — peak hours, connection rate',
      'Custom presence duration',
      'Up to 200 concurrent guests',
      'Email + chat support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '299€',
    tagline: 'Multi-zone, fully branded',
    features: [
      'Everything in Essentiel',
      'QR code per zone (bar, lobby, terrace…)',
      'Fully custom page design',
      'Unlimited concurrent guests',
      'Monthly reports & data export',
      'Dedicated onboarding support',
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 pt-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brass/10 blur-[140px]" />
        </div>

        <p className="animate-fade_up font-mono text-xs uppercase tracking-[0.3em] text-brass">
          For hotels, restaurants, bars & beach clubs
        </p>

        <h1 className="mt-6 max-w-3xl animate-fade_up font-display text-5xl italic leading-[1.05] text-bone text-balance sm:text-7xl">
          Turn your venue into the room everyone wants to be in.
        </h1>

        <p className="mt-6 max-w-lg animate-fade_up text-lg text-bone-dim text-balance">
          A QR code at your door. Verified guests connecting with each other — Dating, Business, Social — while they&rsquo;re with you.
        </p>

        <div className="mt-10 flex animate-fade_up flex-wrap items-center gap-4">
          <a
            href="#request-access"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-bone px-6 py-3 text-sm font-medium tracking-wide text-ink transition-colors duration-200 hover:bg-brass-bright"
          >
            Get your venue set up
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium tracking-wide text-bone transition-colors duration-200 hover:border-brass"
          >
            See pricing
          </a>
        </div>

        <p className="mt-20 max-w-md animate-fade_up font-display text-xl italic text-bone-dim/80 text-balance">
          The people your guests want to meet might already be in the room.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">How it works</p>
        <div className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.mark}>
              <p className="font-display text-2xl italic text-brass">{step.mark}</p>
              <h3 className="mt-3 font-display text-2xl text-bone">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <div className="grid gap-12 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">What guests see</p>
            <h2 className="mt-4 font-display text-4xl italic leading-tight text-bone text-balance">
              Not a check-in from six hours ago.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-bone-dim">
              Every profile is confirmed present through location and activity
              signals, re-verified as the evening goes on. When someone leaves,
              they disappear from the room — no stale ghosts, no guessing.
            </p>
          </div>
          <div className="rounded-3xl border hairline bg-ink-800 p-8">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg italic text-bone">Hotel de Russie</span>
              <span className="font-mono text-xs text-bone-faint">Rome</span>
            </div>
            <p className="mt-1 font-mono text-xs text-bone-faint">43 people here · 17 open to meeting</p>
            <div className="mt-6 space-y-3">
              {[
                { name: 'G.', role: 'Fashion · Milan', live: true },
                { name: 'M.', role: 'Founder · New York', live: true },
                { name: 'A.', role: 'Architect · Paris', live: false },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between border-t hairline pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <p className="text-sm text-bone">{p.name}</p>
                    <p className="font-mono text-[11px] text-bone-faint">{p.role}</p>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-bone-dim">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.live ? 'bg-signal-live' : 'bg-signal-fading'}`} />
                    {p.live ? 'Here now' : 'Recently here'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Pricing</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl italic leading-tight text-bone text-balance">
          Simple plans, no setup fees.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-3xl border p-6 ${
                plan.highlighted ? 'border-brass bg-brass/5' : 'hairline'
              }`}
            >
              <p className="font-display text-2xl italic text-bone">{plan.name}</p>
              <p className="mt-1 text-xs text-bone-faint">{plan.tagline}</p>
              <p className="mt-4 font-display text-3xl text-bone">
                {plan.price}
                <span className="text-sm text-bone-faint">/mo</span>
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
                href="#request-access"
                className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                  plan.highlighted
                    ? 'bg-bone text-ink hover:bg-brass-bright'
                    : 'border hairline text-bone-dim hover:border-white/30'
                }`}
              >
                Choose {plan.name}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Venue types */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-16">
        <div className="flex flex-wrap gap-2">
          {VENUE_TYPES.map((t) => (
            <span key={t} className="rounded-full border hairline px-4 py-2 text-xs text-bone-dim">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Request access */}
      <section id="request-access" className="mx-auto max-w-2xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Get started</p>
        <h2 className="mt-4 font-display text-4xl italic leading-tight text-bone text-balance">
          Let&rsquo;s set up your venue.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-bone-dim">
          Tell us about your venue and we&rsquo;ll set up your account, your QR code,
          and your page — usually within a day.
        </p>
        <div className="mt-10">
          <VenueLeadForm />
        </div>
      </section>

      <footer className="border-t hairline px-6 py-10">
        <p className="font-mono text-xs text-bone-faint">Here — {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
