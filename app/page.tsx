import { Button } from '@/components/ui/Button';

const VENUE_TYPES = [
  'Hotels', 'Restaurants', 'Bars', 'Rooftops', 'Beach Clubs', 'Coworkings', 'Events',
];

const HOW_IT_WORKS = [
  {
    mark: 'I.',
    title: 'Walk in',
    body: 'Scan the code at reception, the bar, or your table. No app store, no download.',
  },
  {
    mark: 'II.',
    title: 'Say why you\u2019re open',
    body: 'Dating. Business. Social. Or just looking \u2014 you choose what you\u2019re visible for, and to whom.',
  },
  {
    mark: 'III.',
    title: 'See who\u2019s actually here',
    body: 'Not who checked in six hours ago. Who\u2019s in the room with you, right now, verified.',
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
          Now in Rome, Paris, London &amp; Mykonos
        </p>

        <h1 className="mt-6 max-w-3xl animate-fade_up font-display text-5xl italic leading-[1.05] text-bone text-balance sm:text-7xl">
          Meet the people already around you.
        </h1>

        <p className="mt-6 max-w-lg animate-fade_up text-lg text-bone-dim text-balance">
          Dating. Business. Social. Right here, right now.
        </p>

        <div className="mt-10 flex animate-fade_up flex-wrap items-center gap-4">
          <Button href="/onboarding">See who&rsquo;s here</Button>
          <Button href="#venues" variant="outline">
            For venues
          </Button>
        </div>

        <p className="mt-20 max-w-md animate-fade_up font-display text-xl italic text-bone-dim/80 text-balance">
          The people you want to meet might already be in the room.
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

      {/* Verified presence */}
      <section className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <div className="grid gap-12 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Verified presence</p>
            <h2 className="mt-4 font-display text-4xl italic leading-tight text-bone text-balance">
              Not a check-in from six hours ago.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-bone-dim">
              Every profile you see is confirmed present through location and
              activity signals, re-verified as the evening goes on. When someone
              leaves, they disappear from the room \u2014 no stale ghosts, no guessing.
            </p>
          </div>
          <div className="rounded-3xl border hairline bg-ink-800 p-8">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg italic text-bone">Hotel de Russie</span>
              <span className="font-mono text-xs text-bone-faint">Rome</span>
            </div>
            <p className="mt-1 font-mono text-xs text-bone-faint">43 people here \u00b7 17 open to meeting</p>
            <div className="mt-6 space-y-3">
              {[
                { name: 'G.', role: 'Fashion \u00b7 Milan', live: true },
                { name: 'M.', role: 'Founder \u00b7 New York', live: true },
                { name: 'A.', role: 'Architect \u00b7 Paris', live: false },
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

      {/* For venues */}
      <section id="venues" className="mx-auto max-w-5xl border-t hairline px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">For venues</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl italic leading-tight text-bone text-balance">
          The social network of the place you&rsquo;re in.
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-bone-dim">
          A QR code at your door turns every service into a living room.
          Guests connect while they&rsquo;re with you \u2014 not after they&rsquo;ve left for
          somewhere else.
        </p>
        <div className="mt-10 flex flex-wrap gap-2">
          {VENUE_TYPES.map((t) => (
            <span key={t} className="rounded-full border hairline px-4 py-2 text-xs text-bone-dim">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-10">
          <Button href="/dashboard" variant="outline">
            Venue dashboard
          </Button>
        </div>
      </section>

      <footer className="border-t hairline px-6 py-10">
        <p className="font-mono text-xs text-bone-faint">Here \u2014 {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
