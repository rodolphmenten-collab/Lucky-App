import { Reveal } from './Reveal';

function RoomMockup({ lang }: { lang: 'en' | 'fr' }) {
  const people = [
    {
      name: 'Vincent',
      tag: 'Business',
      classes: 'border-blue-600/50 bg-blue-700/20 text-blue-300',
      photo: 'https://images.unsplash.com/photo-1648474484044-bb82df2f5a1f?w=300&h=375&fit=crop&q=80',
    },
    {
      name: 'Elena',
      tag: 'Social',
      classes: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
      photo: 'https://images.unsplash.com/photo-1758874384556-cc2b9dcbb6e0?w=300&h=375&fit=crop&q=80',
    },
    {
      name: 'Sofia',
      tag: 'Dating',
      classes: 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-300',
      photo: 'https://images.unsplash.com/photo-1726758254279-6a39c11bdcd5?w=300&h=375&fit=crop&q=80',
    },
  ];
  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">
        {lang === 'fr' ? 'Le Senequier · 3 personnes présentes' : 'Le Senequier · 3 people here'}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {people.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl border hairline bg-ink-700">
            <div
              className="aspect-[4/5] bg-cover bg-center"
              style={{ backgroundImage: `url(${p.photo})` }}
            />
            <div className="p-2">
              <p className="text-xs text-bone">{p.name}</p>
              <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[8px] ${p.classes}`}>
                {p.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMockup({ lang }: { lang: 'en' | 'fr' }) {
  const messages =
    lang === 'fr'
      ? ['On se croise au bar dans 10 min ?', "Parfait, j'y suis — table près de la terrasse", '👋 à tout de suite']
      : ['Meet at the bar in 10 min?', "Perfect, I'm there — table near the terrace", '👋 see you in a bit'];

  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Elena</p>
      <div className="mt-3 space-y-2">
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-ink-700 px-3 py-2 text-xs text-bone">
          {messages[0]}
        </div>
        <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-brass/20 px-3 py-2 text-right text-xs text-bone">
          {messages[1]}
        </div>
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-ink-700 px-3 py-2 text-xs text-bone">
          {messages[2]}
        </div>
      </div>
    </div>
  );
}

function DashboardMockup({ lang }: { lang: 'en' | 'fr' }) {
  const stats =
    lang === 'fr'
      ? [
          { label: 'Présents', value: '18' },
          { label: "Check-ins aujourd'hui", value: '64' },
          { label: 'Taux de connexion', value: '71%' },
        ]
      : [
          { label: 'People here', value: '18' },
          { label: 'Check-ins today', value: '64' },
          { label: 'Connection rate', value: '71%' },
        ];
  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">
        {lang === 'fr' ? 'Dashboard · Le Senequier' : 'Dashboard · Le Senequier'}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border hairline p-2.5">
            <p className="font-display text-lg text-bone">{s.value}</p>
            <p className="mt-0.5 text-[9px] leading-tight text-bone-faint">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-1">
        {[40, 65, 50, 80, 95, 70, 55].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-brass/40" style={{ height: `${h * 0.4}px` }} />
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase({
  rows,
  lang,
}: {
  rows: { eyebrow: string; title: string; body: string }[];
  lang: 'en' | 'fr';
}) {
  const mockups = [
    <RoomMockup key="room" lang={lang} />,
    <ChatMockup key="chat" lang={lang} />,
    <DashboardMockup key="dash" lang={lang} />,
  ];

  return (
    <div className="mt-16 space-y-20">
      {rows.map((row, i) => (
        <div
          key={row.eyebrow}
          className={`flex flex-col items-center gap-10 md:flex-row ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
        >
          <Reveal delay={0} className="md:w-1/2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{row.eyebrow}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-bone">{row.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">{row.body}</p>
          </Reveal>
          <Reveal delay={150} className="md:w-1/2">
            <div className="rounded-3xl border hairline bg-ink-900/60 p-3 shadow-2xl">{mockups[i]}</div>
          </Reveal>
        </div>
      ))}
    </div>
  );
}
