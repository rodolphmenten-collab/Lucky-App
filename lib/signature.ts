import { createHash, randomBytes } from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Signature électronique simple, tenue en interne.
 *
 * Pas de prestataire : le lieu ouvre un lien unique, relit le PDF qu'on lui a
 * envoyé, tape son nom et valide. Ce qui tient lieu de preuve, c'est le
 * faisceau qu'on enregistre — empreinte du document, horodatage, adresse IP,
 * navigateur, adresse e-mail destinataire — et qu'on réimprime sur une page
 * ajoutée au PDF, lisible par les deux parties.
 *
 * Ce que ça ne fait pas : la force probante d'un prestataire qualifié, qui
 * atteste lui-même de l'identité du signataire. Pour un contrat courant à
 * quelques centaines d'euros, le faisceau ci-dessous est l'usage ; pour un
 * engagement important, un prestataire reste le bon choix.
 */

/** Un jeton d'URL : 32 octets, assez pour n'être ni deviné ni énuméré. */
export function nouveauToken(): string {
  return randomBytes(32).toString('base64url');
}

export function empreinte(pdf: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(pdf)).digest('hex');
}

/** L'empreinte en groupes de huit : illisible d'un bloc, vérifiable ainsi. */
export function empreinteLisible(hex: string): string {
  return (hex.match(/.{1,8}/g) ?? []).join(' ');
}

export function ipDepuisEntetes(headers: Headers): string {
  // Netlify pose la vraie adresse ici ; x-forwarded-for peut contenir une
  // liste, dont le premier élément est le client.
  const direct = headers.get('x-nf-client-connection-ip');
  if (direct) return direct;
  const chaine = headers.get('x-forwarded-for');
  if (chaine) return chaine.split(',')[0].trim();
  return 'inconnue';
}

export interface Preuve {
  signePar: string;
  signeLe: string;
  ip: string;
  userAgent: string;
  destinataire: string;
  sha256: string;
  lieu: string;
}

/**
 * Ajoute au PDF d'origine une dernière page qui raconte la signature.
 *
 * On ajoute plutôt qu'on ne regénère : le document signé doit contenir, octet
 * pour octet, celui qui a été lu.
 */
export async function ajouterPagePreuve(pdfOrigine: Uint8Array, p: Preuve): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfOrigine);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { l: 595.28, h: 841.89 };
  const MARGE = 56;
  const NOIR = rgb(0.1, 0.1, 0.1);
  const GRIS = rgb(0.45, 0.45, 0.45);

  const page = doc.addPage([A4.l, A4.h]);
  let y = A4.h - MARGE;

  const ligne = (texte: string, taille = 9.5, font = normal, couleur = NOIR) => {
    page.drawText(texte, { x: MARGE, y, size: taille, font, color: couleur });
    y -= taille * 1.6;
  };

  ligne('PREUVE DE SIGNATURE ÉLECTRONIQUE', 10, gras);
  y -= 8;
  ligne(
    "Ce document atteste de l'acceptation du contrat qui précède par voie électronique.",
    8.5,
    normal,
    GRIS
  );
  y -= 16;

  const champs: [string, string][] = [
    ['Document', `Contrat Lucky — ${p.lieu}`],
    ['Signé par', p.signePar],
    ['Adresse destinataire', p.destinataire],
    ['Date et heure', p.signeLe],
    ['Adresse IP', p.ip],
    ['Navigateur', p.userAgent.slice(0, 110)],
  ];

  for (const [libelle, valeur] of champs) {
    page.drawText(libelle, { x: MARGE, y, size: 8, font: normal, color: GRIS });
    page.drawText(valeur, { x: MARGE + 130, y, size: 9, font: normal, color: NOIR });
    y -= 20;
  }

  y -= 6;
  page.drawText('Empreinte SHA-256 du document signé', {
    x: MARGE, y, size: 8, font: normal, color: GRIS,
  });
  y -= 16;
  for (const bloc of (empreinteLisible(p.sha256).match(/(?:\S+\s){8}|.+$/g) ?? [])) {
    page.drawText(bloc.trim(), { x: MARGE, y, size: 8.5, font: normal, color: NOIR });
    y -= 13;
  }

  y -= 18;
  page.drawLine({
    start: { x: MARGE, y }, end: { x: A4.l - MARGE, y },
    thickness: 0.8, color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  for (const texte of [
    "Toute modification du document invaliderait l'empreinte ci-dessus : elle est calculée sur le",
    'contrat tel qu’il a été présenté au signataire, avant l’ajout de cette page.',
  ]) {
    page.drawText(texte, { x: MARGE, y, size: 8, font: normal, color: GRIS });
    y -= 12;
  }

  return doc.save();
}
