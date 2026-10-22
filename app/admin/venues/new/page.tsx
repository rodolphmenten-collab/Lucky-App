import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { createVenueRecord, VENUE_TYPES } from '@/lib/venues';


async function createVenue(formData: FormData) {
  'use server';
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) return;

  const service = createServiceClient();

  const { data: created } = await createVenueRecord(service, {
    name: formData.get('name') as string,
    city: formData.get('city') as string,
    type: formData.get('type') as string,
    plan: formData.get('plan') as string,
    contactName: formData.get('contactName') as string,
    contactEmail: formData.get('contactEmail') as string,
  });

  // Rattache l'établissement à sa fiche CRM quand il vient du pipeline : la
  // fiche garde son journal et bascule sur la facturation réelle, au lieu de
  // devenir un doublon mort à côté du vrai client.
  const crmId = formData.get('crmId') as string | null;
  if (crmId && created?.id) {
    await service.from('crm_venues').update({ venue_id: created.id, stage: 'signe' }).eq('id', crmId);
    await service.from('crm_notes').insert({
      crm_venue_id: crmId,
      author_email: user.email,
      body: `Établissement créé dans Lucky (${created.slug}). Pensez à corriger les coordonnées GPS depuis sa fiche, sinon la vérification de présence ne fonctionnera pas.`,
    });
    revalidatePath(`/admin/crm/${crmId}`);
    redirect(`/admin/venues/${created.id}`);
  }

  redirect('/admin/etablissements');
}

export default async function NewVenuePage({
  searchParams,
}: {
  searchParams?: { crm?: string };
}) {
  // Venant du pipeline : on reprend ce qui a déjà été saisi au rendez-vous
  // plutôt que de le retaper.
  let prefill: any = null;
  if (searchParams?.crm) {
    const service = createServiceClient();
    const { data } = await service
      .from('crm_venues')
      .select('id, name, city, type, contact_name, contact_email, expected_plan')
      .eq('id', searchParams.crm)
      .maybeSingle();
    prefill = data;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Admin</p>
      <h1 className="mt-2 font-display text-3xl italic text-bone">Nouvel établissement</h1>
      <p className="mt-2 text-sm text-bone-dim">
        Crée uniquement l&rsquo;établissement. Une fois prêt, envoie l&rsquo;invitation depuis
        la liste des établissements.
      </p>

      {prefill && (
        <p className="mt-4 rounded-2xl border border-brass/40 bg-brass/5 p-4 text-sm text-bone-dim">
          Créé depuis la fiche <span className="text-brass">{prefill.name}</span> du pipeline —
          les informations du rendez-vous sont déjà reprises. L&rsquo;établissement est créé avec
          des coordonnées GPS à 0 : corrige-les depuis sa fiche, sinon aucun client ne pourra
          valider sa présence.
        </p>
      )}

      <form action={createVenue} className="mt-8 space-y-4">
        {prefill && <input type="hidden" name="crmId" value={prefill.id} />}
        <p className="pt-2 text-xs uppercase tracking-wide text-bone-faint">Établissement</p>
        <Field name="name" label="Nom de l'établissement" required defaultValue={prefill?.name} />
        <Field name="city" label="Ville" required defaultValue={prefill?.city} />
        <div>
          <label className="mb-1 block text-xs text-bone-faint">Type</label>
          <select
            name="type"
            required
            defaultValue={prefill?.type ?? 'bar'}
            className="w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
          >
            {VENUE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-bone-faint">Plan</label>
          <select
            name="plan"
            defaultValue={prefill?.expected_plan ?? 'basique'}
            className="w-full rounded-full border hairline bg-ink-900 px-5 py-3 text-sm text-bone"
          >
            <option value="basique">Basique — 99€</option>
            <option value="essentiel">Essentiel — 149€</option>
            <option value="premium">Premium — 299€</option>
          </select>
        </div>

        <p className="pt-4 text-xs uppercase tracking-wide text-bone-faint">Contact</p>
        <Field name="contactName" label="Nom du contact" required defaultValue={prefill?.contact_name} />
        <Field name="contactEmail" label="Email du contact" type="email" required defaultValue={prefill?.contact_email} />

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-bone px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Créer l&rsquo;établissement
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-bone-faint">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-full border hairline bg-transparent px-5 py-3 text-sm text-bone placeholder:text-bone-faint focus:border-brass"
      />
    </div>
  );
}
