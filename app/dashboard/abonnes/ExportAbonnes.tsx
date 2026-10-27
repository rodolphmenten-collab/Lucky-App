'use client';

export function ExportAbonnes({ venueId, venueName }: { venueId: string; venueName: string }) {
  return (
    <a
      href={`/api/dashboard/abonnes?venue=${venueId}`}
      className="flex min-h-[44px] items-center rounded-full bg-bone px-5 text-sm font-medium text-ink hover:bg-brass-bright"
      download={`abonnes-${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`}
    >
      Exporter en CSV
    </a>
  );
}
