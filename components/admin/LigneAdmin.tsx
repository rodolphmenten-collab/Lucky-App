'use client';

import { useState } from 'react';
import { updateAdminEmail, removeAdmin } from '@/app/admin/actions';

/**
 * Une ligne de l'équipe, repliée sur l'adresse et dépliable pour la changer.
 *
 * Le champ n'est ouvert que sur demande : neuf fois sur dix on vient ici pour
 * ajouter ou retirer quelqu'un, pas pour corriger une adresse, et un champ
 * toujours ouvert invite à la faute de frappe sur la clé qui ouvre le
 * back-office.
 */
export default function LigneAdmin({
  admin,
  estMoi,
}: {
  admin: { id: string; email: string; added_at: string };
  estMoi: boolean;
}) {
  const [edition, setEdition] = useState(false);

  if (edition) {
    return (
      <form action={updateAdminEmail} className="flex flex-wrap items-center gap-2 px-5 py-4">
        <input type="hidden" name="adminId" value={admin.id} />
        <input
          type="email"
          name="email"
          required
          autoFocus
          defaultValue={admin.email}
          className="min-h-[40px] flex-1 rounded-full border hairline bg-transparent px-4 text-sm text-bone focus:border-brass focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-[40px] rounded-full bg-bone px-5 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => setEdition(false)}
          className="px-2 text-xs text-bone-faint hover:text-bone"
        >
          Annuler
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-sm text-bone">{admin.email}</p>
        <p className="mt-0.5 font-mono text-[11px] text-bone-faint">
          Ajouté le {new Date(admin.added_at).toLocaleDateString('fr-FR')}
          {estMoi && ' · vous'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => setEdition(true)}
          className="text-xs text-bone-faint underline decoration-brass/40 hover:text-bone"
        >
          Modifier
        </button>
        {!estMoi && (
          <form action={removeAdmin}>
            <input type="hidden" name="adminId" value={admin.id} />
            <button type="submit" className="text-xs text-red-400 hover:text-red-300">
              Retirer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
