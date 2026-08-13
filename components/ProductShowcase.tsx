function RoomMockup() {
  const people = [
    { name: 'Elena', tag: 'Business', classes: 'border-blue-600/50 bg-blue-700/20 text-blue-300' },
    { name: 'Marco', tag: 'Social', classes: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' },
    { name: 'Sofia', tag: 'Dating', classes: 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-300' },
  ];
  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Le Senequier · 3 people here</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {people.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl border hairline bg-ink-700">
            <div className="aspect-[4/5] bg-gradient-to-br from-ink-700 to-ink-900" />
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

function ChatMockup() {
  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Elena</p>
      <div className="mt-3 space-y-2">
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-ink-700 px-3 py-2 text-xs text-bone">
          On se croise au bar dans 10 min ?
        </div>
        <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-brass/20 px-3 py-2 text-right text-xs text-bone">
          Parfait, j'y suis — table près de la terrasse
        </div>
        <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-ink-700 px-3 py-2 text-xs text-bone">
          👋 à tout de suite
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const stats = [
    { label: 'Présents', value: '18' },
    { label: "Check-ins aujourd'hui", value: '64' },
    { label: 'Taux de connexion', value: '71%' },
  ];
  return (
    <div className="rounded-2xl border hairline bg-ink-800 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brass">Dashboard · Le Senequier</p>
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
}: {
  rows: { eyebrow: string; title: string; body: string }[];
}) {
  const mockups = [<RoomMockup key="room" />, <ChatMockup key="chat" />, <DashboardMockup key="dash" />];

  return (
    <div className="mt-16 space-y-20">
      {rows.map((row, i) => (
        <div
          key={row.eyebrow}
          className={`flex flex-col items-center gap-10 md:flex-row ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
        >
          <div className="md:w-1/2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{row.eyebrow}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-bone">{row.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">{row.body}</p>
          </div>
          <div className="md:w-1/2">
            <div className="rounded-3xl border hairline bg-ink-900/60 p-3 shadow-2xl">{mockups[i]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
