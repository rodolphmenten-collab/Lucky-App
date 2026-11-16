import { unsuspendAccount } from '../actions';

/**
 * Les comptes actuellement suspendus.
 *
 * Deux raisons de les afficher ici plutôt que de les laisser disparaître :
 * une suspension qu'on ne voit plus ne se lève jamais, et quand quelqu'un
 * conteste dans les trente jours, il faut pouvoir retrouver la décision et
 * son motif sans ouvrir la base.
 */
export function SuspendedList({
  comptes,
}: {
  comptes: Array<{
    id: string;
    first_name: string | null;
    city: string | null;
    photo_url: string | null;
    suspended_at: string | null;
    suspended_reason: string | null;
    suspended_by: string | null;
  }>;
}) {
  if (comptes.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl italic text-bone">Comptes suspendus</h2>
      <div className="mt-4 divide-y hairline rounded-2xl border hairline">
        {comptes.map((c) => (
          <form key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <input type="hidden" name="targetUser" value={c.id} />
            <div className="flex min-w-0 items-center gap-3">
              {c.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photo_url} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 flex-none rounded-full border hairline" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-bone">
                  {c.first_name ?? 'Profil'}
                  {c.city ? <span className="text-bone-dim"> · {c.city}</span> : null}
                </p>
                {c.suspended_reason && (
                  <p className="mt-0.5 text-xs text-bone-dim">{c.suspended_reason}</p>
                )}
                <p className="mt-0.5 font-mono text-[11px] text-bone-faint">
                  {c.suspended_at ? new Date(c.suspended_at).toLocaleString('fr-FR') : ''}
                  {c.suspended_by ? ` · ${c.suspended_by}` : ''}
                </p>
              </div>
            </div>
            <button
              formAction={unsuspendAccount}
              className="min-h-[44px] rounded-full border border-brass/50 px-4 text-[11px] text-brass"
            >
              Lever la suspension
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
