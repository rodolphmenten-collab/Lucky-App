import Link from 'next/link';

const TABS = [
  { key: 'pipeline', href: '/admin', label: 'Pipeline' },
  { key: 'venues', href: '/admin/etablissements', label: 'Établissements' },
  { key: 'moderation', href: '/admin/moderation', label: 'Modération' },
  { key: 'equipe', href: '/admin/equipe', label: 'Équipe' },
] as const;

export function AdminNav({
  current,
  pendingReports = 0,
}: {
  current: 'pipeline' | 'venues' | 'moderation' | 'equipe';
  pendingReports?: number;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Lucky · back-office</p>
      <nav className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
              current === t.key
                ? 'border-brass bg-brass/10 text-brass'
                : 'hairline text-bone-dim hover:border-white/30'
            }`}
          >
            {t.label}
            {t.key === 'moderation' && pendingReports > 0 && (
              <span className="ml-2 rounded-full bg-red-400/20 px-2 py-0.5 text-[10px] text-red-400">
                {pendingReports}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
