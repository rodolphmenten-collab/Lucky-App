'use client';

import { useState } from 'react';

/**
 * Ajout express d'un lieu. Quatre champs, pas un de plus : sur le trottoir en
 * sortant d'un bar, on a le nom, la ville, un prénom et un numéro. Le reste se
 * complète plus tard depuis la fiche.
 */
export function QuickAddVenue({
  action,
  defaultOwner,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultOwner: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink transition-colors hover:bg-brass-bright"
      >
        + Ajouter un lieu
      </button>
    );
  }

  return (
    <form
      action={action}
      className="w-full rounded-2xl border border-brass/40 bg-brass/5 p-4"
      onReset={() => setOpen(false)}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field name="name" placeholder="Nom du lieu" required autoFocus />
        <Field name="city" placeholder="Ville" />
        <Field name="contact_name" placeholder="Contact sur place" />
        <Field name="contact_phone" placeholder="Téléphone" type="tel" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          name="source"
          defaultValue="roadshow"
          className="min-h-[48px] rounded-full border hairline bg-ink-800 px-5 text-sm text-bone"
        >
          <option value="roadshow">Roadshow</option>
          <option value="terrain">Terrain</option>
          <option value="reseau">Réseau</option>
          <option value="inbound">Formulaire site</option>
          <option value="autre">Autre</option>
        </select>
        <input type="hidden" name="owner_email" value={defaultOwner} />
        <button
          type="submit"
          className="min-h-[48px] rounded-full bg-bone px-6 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Créer et ouvrir la fiche
        </button>
        <button type="reset" className="min-h-[48px] px-4 text-sm text-bone-dim">
          Annuler
        </button>
      </div>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  return (
    <input
      {...props}
      className="min-h-[48px] w-full rounded-xl border hairline bg-transparent px-4 text-sm text-bone placeholder:text-bone-faint focus:border-brass focus:outline-none"
    />
  );
}
