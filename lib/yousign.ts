/**
 * Envoi d'un contrat à la signature électronique (Yousign / YouTrust, API v3).
 *
 * Quatre appels : on crée la demande, on y joint le PDF, on déclare le
 * signataire, puis on active — c'est l'activation qui déclenche l'e-mail.
 *
 * Le champ de signature n'est pas positionné par des coordonnées mais par une
 * ancre écrite dans le PDF (voir lib/contratPdf.ts). Des coordonnées calculées
 * à la main se décalent dès que la mise en page change, et on ne s'en aperçoit
 * qu'en regardant le document déjà envoyé au client.
 *
 * La clé n'est jamais lue ailleurs qu'ici, et jamais renvoyée au navigateur.
 */

const BASE = process.env.YOUSIGN_API_BASE ?? 'https://api-sandbox.yousign.app/v3';

export class ErreurSignature extends Error {}

function cle(): string {
  const k = process.env.YOUSIGN_API_KEY;
  if (!k) {
    throw new ErreurSignature(
      "La signature électronique n'est pas configurée : il manque la clé API dans les variables d'environnement."
    );
  }
  return k;
}

async function appel(chemin: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE}${chemin}`, {
    ...init,
    headers: { Authorization: `Bearer ${cle()}`, ...(init.headers ?? {}) },
  });

  const texte = await res.text();
  if (!res.ok) {
    // On remonte le message du prestataire : « document sans champ de
    // signature » ou « e-mail invalide » se corrigent en trente secondes,
    // à condition de savoir lequel des deux c'est.
    throw new ErreurSignature(`Yousign (${res.status}) : ${texte.slice(0, 400)}`);
  }
  return texte ? JSON.parse(texte) : {};
}

export interface Signataire {
  prenom: string;
  nom: string;
  email: string;
}

export interface ResultatEnvoi {
  id: string;
  ancresDetectees: number;
  environnementBacASable: boolean;
}

export async function envoyerPourSignature(
  pdf: Uint8Array,
  nomDocument: string,
  signataire: Signataire
): Promise<ResultatEnvoi> {
  // 1. la demande
  const demande = await appel('/signature_requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: nomDocument,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
    }),
  });

  // 2. le document, avec lecture des ancres
  const formulaire = new FormData();
  formulaire.append('file', new Blob([pdf as any], { type: 'application/pdf' }), `${nomDocument}.pdf`);
  formulaire.append('nature', 'signable_document');
  formulaire.append('parse_anchors', 'true');

  const document = await appel(`/signature_requests/${demande.id}/documents`, {
    method: 'POST',
    body: formulaire,
  });

  const ancres = Number(document.total_anchors ?? 0);
  if (ancres < 1) {
    throw new ErreurSignature(
      "Le PDF ne contient aucun champ de signature exploitable. L'envoi est annulé — " +
      'mieux vaut ça qu\'un contrat que le lieu ne pourrait pas signer.'
    );
  }

  // 3. le signataire — l'ancre s1 lui est rattachée par son rang
  await appel(`/signature_requests/${demande.id}/signers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      info: {
        first_name: signataire.prenom,
        last_name: signataire.nom,
        email: signataire.email,
        locale: 'fr',
      },
      signature_level: 'electronic_signature',
      signature_authentication_mode: 'no_otp',
    }),
  });

  // 4. activation : c'est elle qui envoie l'e-mail au signataire
  await appel(`/signature_requests/${demande.id}/activate`, { method: 'POST' });

  return {
    id: demande.id,
    ancresDetectees: ancres,
    environnementBacASable: BASE.includes('sandbox'),
  };
}

export function signatureConfiguree(): boolean {
  return Boolean(process.env.YOUSIGN_API_KEY);
}
