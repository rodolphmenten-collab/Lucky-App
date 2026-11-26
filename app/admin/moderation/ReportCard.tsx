'use client';

import { useState } from 'react';
import { suspendAccount, deleteAccount } from '../actions';

type Profil = {
  id: string;
  first_name: string | null;
  age: number | null;
  city: string | null;
  job: string | null;
  photo_url: string | null;
  suspended_at: string | null;
} | null;

/**
 * Une carte de signalement.
 *
 * Elle est pensée pour être utilisable à une main, un samedi soir, sur un
 * téléphone : on voit qui est signalé, on voit s'il récidive, et les deux
 * gestes graves — suspendre, supprimer — demandent une confirmation explicite
 * avant de partir. On n'a pas voulu d'un bouton rouge qu'on effleure par
 * accident en scrollant.
 */
export function ReportCard({
  id,
  motif,
  details,
  createdAt,
  signale,
  signalePar,
  signalements,
  reviewAction,
  dismissAction,
  urgent = false,
  escaladeLe = null,
  escaladeVers = null,
  escaladeAction,
}: {
  id: string;
  motif: string;
  urgent?: boolean;
  escaladeLe?: string | null;
  escaladeVers?: string | null;
  escaladeAction?: (formData: FormData) => void;
  details: string | null;
  createdAt: string;
  signale: Profil;
  signalePar: Profil;
  signalements: number;
  reviewAction: (formData: FormData) => void;
  dismissAction: (formData: FormData) => void;
}) {
  const [confirmation, setConfirmation] = useState<'suspend' | 'delete' | null>(null);
  const [motifSanction, setMotifSanction] = useState('');

  const dejaSuspendu = Boolean(signale?.suspended_at);

  return (
    <div className={`rounded-2xl border px-5 py-4 ${urgent ? 'border-red-500/50 bg-red-500/5' : 'hairline'}`}>
      {/* Un signalement prioritaire a deja produit ses effets avant d'arriver
          ici. Le dire en tete evite qu'un moderateur refasse le geste, ou pire,
          croie qu'il reste a le faire. */}
      {urgent && (
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-400">
          Prioritaire · compte suspendu et photo retirée automatiquement
        </p>
      )}
      <div className="flex items-start gap-3">
        {signale?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signale.photo_url}
            alt=""
            className="h-14 w-14 flex-none rounded-full object-cover"
          />
        ) : (
          <div className="h-14 w-14 flex-none rounded-full border hairline" />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm text-bone">
            {signale?.first_name ?? 'Profil supprimé'}
            {signale?.age ? <span className="text-bone-dim"> · {signale.age} ans</span> : null}
            {signale?.city ? <span className="text-bone-dim"> · {signale.city}</span> : null}
          </p>
          {signale?.job && <p className="mt-0.5 text-xs text-bone-faint">{signale.job}</p>}

          <p className={`mt-2 text-sm ${urgent ? 'text-red-400' : 'text-brass'}`}>{motif}</p>
          {details && <p className="mt-1 text-xs leading-relaxed text-bone-dim">{details}</p>}

          <p className="mt-2 font-mono text-[11px] text-bone-faint">
            {new Date(createdAt).toLocaleString('fr-FR')} · signalé par{' '}
            {signalePar?.first_name ?? 'un membre'}
            {signalements > 1 && (
              <span className="text-red-400"> · {signalements} signalements sur ce compte</span>
            )}
            {dejaSuspendu && <span className="text-red-400"> · compte déjà suspendu</span>}
          </p>
        </div>
      </div>

        {/* Transmission aux autorites. Nos CGU s'y engagent pour les contenus
            pedocriminels : l'horodatage ici est ce qui transforme l'engagement
            en fait verifiable. */}
        {urgent && escaladeAction && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
            {escaladeLe ? (
              <p className="text-[11px] leading-relaxed text-bone-dim">
                Transmis à <span className="text-bone">{escaladeVers}</span> le{' '}
                {new Date(escaladeLe).toLocaleString('fr-FR')}.
              </p>
            ) : (
              <form className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="reportId" value={id} />
                <label className="text-[11px] text-bone-dim">Transmis à</label>
                <select
                  name="destinataire"
                  defaultValue="PHAROS"
                  className="min-h-[36px] rounded-full border hairline bg-ink-800 px-3 text-[11px] text-bone"
                >
                  <option value="PHAROS">PHAROS (ministère de l&rsquo;Intérieur)</option>
                  <option value="Police / gendarmerie">Police ou gendarmerie</option>
                  <option value="Procureur de la République">Procureur de la République</option>
                </select>
                <button
                  formAction={escaladeAction}
                  className="min-h-[36px] rounded-full border border-red-500/50 px-4 text-[11px] text-red-300"
                >
                  Enregistrer la transmission
                </button>
              </form>
            )}
          </div>
        )}


      {confirmation === null && (
        <div className="mt-4 flex flex-wrap gap-2">
          <form>
            <input type="hidden" name="reportId" value={id} />
            <button
              formAction={dismissAction}
              className="min-h-[44px] rounded-full border hairline px-4 text-[11px] text-bone-dim"
            >
              Ignorer
            </button>
          </form>
          <form>
            <input type="hidden" name="reportId" value={id} />
            <button
              formAction={reviewAction}
              className="min-h-[44px] rounded-full border border-brass/50 px-4 text-[11px] text-brass"
            >
              Marquer comme traité
            </button>
          </form>
          {signale && !dejaSuspendu && (
            <button
              onClick={() => setConfirmation('suspend')}
              className="min-h-[44px] rounded-full border border-red-500/40 px-4 text-[11px] text-red-400"
            >
              Suspendre
            </button>
          )}
          {signale && (
            <button
              onClick={() => setConfirmation('delete')}
              className="min-h-[44px] rounded-full border border-red-500/40 px-4 text-[11px] text-red-400"
            >
              Supprimer
            </button>
          )}
        </div>
      )}

      {confirmation !== null && (
        <form className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-4">
          <input type="hidden" name="reportId" value={id} />
          <input type="hidden" name="targetUser" value={signale?.id ?? ''} />

          <p className="text-xs leading-relaxed text-bone">
            {confirmation === 'suspend' ? (
              <>
                <strong className="text-red-400">Suspendre {signale?.first_name}.</strong> Le compte
                disparaît des salles, ne peut plus entrer dans un lieu ni écrire. Réversible depuis
                cet écran.
              </>
            ) : (
              <>
                <strong className="text-red-400">Supprimer {signale?.first_name}.</strong> Le compte
                et ses données sont effacés définitivement. Cette action est irréversible.
              </>
            )}
          </p>

          <input
            name="reason"
            value={motifSanction}
            onChange={(e) => setMotifSanction(e.target.value)}
            placeholder="Motif (conservé au journal)"
            className="mt-3 w-full rounded-full border hairline bg-transparent px-4 py-2.5 text-xs text-bone placeholder:text-bone-faint"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="min-h-[44px] rounded-full border hairline px-4 text-[11px] text-bone-dim"
            >
              Annuler
            </button>
            <button
              formAction={confirmation === 'suspend' ? suspendAccount : deleteAccount}
              className="min-h-[44px] rounded-full bg-red-500/90 px-4 text-[11px] font-medium text-white"
            >
              {confirmation === 'suspend' ? 'Confirmer la suspension' : 'Supprimer définitivement'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
