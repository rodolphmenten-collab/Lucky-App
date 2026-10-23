import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { preparerContrat, LUCKY, type Contrat } from '@/lib/contrat';

/**
 * Les conditions particulières, en PDF.
 *
 * La page web imprimable suffisait pour relire avant envoi, mais pas pour
 * signer : les prestataires de signature électronique n'acceptent qu'un PDF.
 * Il est donc produit ici, côté serveur, sans navigateur sans écran — le
 * document tient sur une page et sa mise en page est connue d'avance.
 *
 * Les polices sont les standards PDF : aucune police à embarquer, un fichier
 * léger, et des accents corrects (encodage WinAnsi).
 */

const A4 = { l: 595.28, h: 841.89 };
const MARGE = 56;
const LARGEUR = A4.l - MARGE * 2;

const NOIR = rgb(0.09, 0.09, 0.09);
const GRIS = rgb(0.42, 0.42, 0.42);
const TRAIT = rgb(0.78, 0.78, 0.78);

interface Curseur {
  page: PDFPage;
  y: number;
}

function mots(texte: string, font: PDFFont, taille: number, largeur: number): string[] {
  const lignes: string[] = [];
  let courante = '';
  for (const mot of texte.split(' ')) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (font.widthOfTextAtSize(essai, taille) > largeur && courante) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = essai;
    }
  }
  if (courante) lignes.push(courante);
  return lignes;
}

/** « 18, inclus dans la formule » se lit mieux que « 18 (dont 18 inclus) ». */
function libelleSupports(k: Contrat): string {
  const n = k.supports.installes;
  if (n == null) return '____';
  if (n <= k.supports.inclus) return `${n}, inclus dans la formule`;
  return `${n} (${k.supports.inclus} inclus, ${n - k.supports.inclus} facturés en plus)`;
}

export async function construireContratPdf(crm: any): Promise<Uint8Array> {
  const k: Contrat = preparerContrat(crm);

  const doc = await PDFDocument.create();
  doc.setTitle(`Contrat d'abonnement Lucky — ${k.lieu.enseigne}`);
  doc.setCreator('Lucky');

  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);

  const c: Curseur = { page: doc.addPage([A4.l, A4.h]), y: A4.h - MARGE };

  const ecrire = (
    texte: string,
    { taille = 9.5, font = normal, couleur = NOIR, interligne = 1.45, x = MARGE, largeur = LARGEUR } = {}
  ) => {
    for (const ligne of mots(texte, font, taille, largeur)) {
      if (c.y < MARGE + 40) {
        c.page = doc.addPage([A4.l, A4.h]);
        c.y = A4.h - MARGE;
      }
      c.page.drawText(ligne, { x, y: c.y, size: taille, font, color: couleur });
      c.y -= taille * interligne;
    }
  };

  const espace = (n: number) => { c.y -= n; };

  // ---- en-tête ----
  const titre = "CONTRAT D'ABONNEMENT — LIEUX PARTENAIRES";
  c.page.drawText(titre, {
    x: (A4.l - normal.widthOfTextAtSize(titre, 8)) / 2,
    y: c.y, size: 8, font: normal, color: GRIS,
  });
  c.y -= 26;
  const sous = 'Conditions particulières';
  c.page.drawText(sous, {
    x: (A4.l - gras.widthOfTextAtSize(sous, 17)) / 2,
    y: c.y, size: 17, font: gras, color: NOIR,
  });
  c.y -= 36;

  // ---- parties ----
  ecrire('Entre les soussignés :', { font: gras, taille: 10 });
  espace(8);

  ecrire(
    `${LUCKY.raisonSociale}, ${LUCKY.formeSociale}, au capital de ${LUCKY.capital} euros, ` +
    `immatriculée au RCS de ${LUCKY.rcsVille} sous le numéro ${LUCKY.siren}, dont le siège social ` +
    `est ${LUCKY.siege}, représentée par ${LUCKY.representant} en qualité de ${LUCKY.qualite}, ` +
    `ci-après « Lucky ».`
  );
  espace(10);

  ecrire(
    `${k.lieu.raisonSociale}, ${k.lieu.formeSociale}, immatriculée au RCS de ${k.lieu.rcsVille} ` +
    `sous le numéro ${k.lieu.siren}, dont le siège social est ${k.lieu.siege}, exploitant ` +
    `l'établissement ${k.lieu.enseigne} situé ${k.lieu.adresseEtablissement}, représentée par ` +
    `${k.lieu.signataire} en qualité de ${k.lieu.qualite}, ci-après « le Lieu ».`
  );
  espace(26);

  // ---- tableau ----
  const lignes: [string, string][] = [
    ['Formule souscrite', `${k.formule.label} — ${k.formule.mensuelHT} / mois HT`],
    ['Nombre de supports installés', libelleSupports(k)],
    ['Supports personnalisés', k.supports.personnalises ? 'Oui' : 'Non'],
    ["Durée d'engagement", k.engagement.label],
    ['Remise applicable', `${k.engagement.remise} %`],
    ['Montant mensuel HT après remise', `${k.engagement.mensuelApresRemise} / mois`],
    ["Début de la période d'essai", k.dates.debutEssai],
    ['Premier prélèvement', `${k.dates.premierPrelevement} (30 jours après)`],
    ['Contact opérationnel du Lieu', k.lieu.contactOperationnel],
  ];

  const COL = MARGE + 230;
  c.page.drawLine({
    start: { x: MARGE, y: c.y + 12 }, end: { x: A4.l - MARGE, y: c.y + 12 },
    thickness: 1, color: NOIR,
  });
  espace(2);

  for (const [libelle, valeur] of lignes) {
    const hauteurValeur = mots(valeur, gras, 9.5, A4.l - MARGE - COL).length * 9.5 * 1.45;
    const depart = c.y;
    ecrire(libelle, { taille: 9.5, couleur: GRIS, largeur: COL - MARGE - 12 });
    const apresLibelle = c.y;
    c.y = depart;
    ecrire(valeur, { taille: 9.5, font: gras, x: COL, largeur: A4.l - MARGE - COL });
    c.y = Math.min(apresLibelle, c.y) - 6;
    c.page.drawLine({
      start: { x: MARGE, y: c.y + 8 }, end: { x: A4.l - MARGE, y: c.y + 8 },
      thickness: 0.5, color: TRAIT,
    });
    espace(4);
    void hauteurValeur;
  }

  espace(22);

  ecrire(
    "Le Lieu reconnaît avoir pris connaissance des conditions générales d'abonnement, annexées au " +
    "présent contrat et consultables à l'adresse lucky-app.io/legal/etablissements, et les accepter " +
    "sans réserve. Les trente premiers jours sont gratuits : le Lieu peut mettre fin au contrat à " +
    "tout moment pendant cette période, par simple email, sans justification ni frais."
  );
  espace(18);

  ecrire(`Fait à ______________________, le ${k.dates.fait}, en deux exemplaires.`, { taille: 10 });
  espace(30);

  // ---- signatures ----
  const yCadre = c.y - 90;
  const largeurCadre = (LARGEUR - 30) / 2;

  c.page.drawText('Pour le Lieu', { x: MARGE, y: c.y, size: 9.5, font: gras, color: NOIR });
  c.page.drawText('Signature précédée de « lu et approuvé »', {
    x: MARGE, y: c.y - 13, size: 7.5, font: normal, color: GRIS,
  });
  c.page.drawRectangle({
    x: MARGE, y: yCadre, width: largeurCadre, height: 72,
    borderColor: TRAIT, borderWidth: 0.8,
  });

  // Ancre de signature : le prestataire lit ce marqueur dans le texte du PDF
  // et place le champ exactement dessus. Ecrit en blanc sur blanc — invisible
  // a la lecture et a l'impression, mais present dans le texte extrait.
  // C'est plus sur que des coordonnees calculees a la main : le jour ou la
  // mise en page bouge, le champ suit tout seul.
  c.page.drawText('{{s1|signature|170|60}}', {
    x: MARGE + 6, y: yCadre + 52, size: 7,
    font: normal, color: rgb(1, 1, 1),
  });

  const x2 = MARGE + largeurCadre + 30;
  c.page.drawText('Pour Lucky', { x: x2, y: c.y, size: 9.5, font: gras, color: NOIR });
  c.page.drawText(`${LUCKY.representant}, ${LUCKY.qualite}`, {
    x: x2, y: c.y - 13, size: 7.5, font: normal, color: GRIS,
  });
  c.page.drawRectangle({
    x: x2, y: yCadre, width: largeurCadre, height: 72,
    borderColor: TRAIT, borderWidth: 0.8,
  });

  c.y = yCadre - 26;
  ecrire(
    "Les conditions générales d'abonnement font partie intégrante du contrat.",
    { taille: 7.5, couleur: GRIS }
  );

  return doc.save();
}
