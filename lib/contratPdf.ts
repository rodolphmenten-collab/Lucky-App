import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  preparerContrat,
  LUCKY,
  LUCKY_SIGNATAIRES,
  representantsLucky,
  type Contrat,
} from '@/lib/contrat';
import { CGV_ETABLISSEMENTS } from '@/lib/cgvEtablissements';

/**
 * Où se trouve le cadre réservé à la signature du Lieu.
 *
 * On le renvoie avec le document parce que le PDF signé doit porter le nom du
 * signataire dans ce cadre, et non dans la seule page de preuve : un cadre
 * resté vide se lit comme un contrat non signé, quoi qu'en dise l'annexe.
 * Recalculer ces coordonnées au moment de la signature serait fragile — la
 * mise en page dépend du contenu. On les mémorise donc à la construction.
 */
export interface CadreLieu {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

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

export async function construireContratPdf(
  crm: any
): Promise<{ pdf: Uint8Array; cadreLieu: CadreLieu }> {
  const k: Contrat = preparerContrat(crm);

  const doc = await PDFDocument.create();
  doc.setTitle(
    k.estSoiree
      ? `Contrat de prestation Lucky — soirée — ${k.lieu.enseigne}`
      : `Contrat d'abonnement Lucky — ${k.lieu.enseigne}`,
  );
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
  const titre = k.estSoiree
    ? 'CONTRAT DE PRESTATION — SOIRÉE'
    : "CONTRAT D'ABONNEMENT — LIEUX PARTENAIRES";
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
    `est ${LUCKY.siege}, représentée par ${representantsLucky()}, ` +
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
  // Deux trames : la soirée est une vente unique, elle n'a ni engagement, ni
  // remise, ni essai, ni prélèvement différé. Reprendre les lignes de
  // l'abonnement en les laissant vides donnerait un contrat qui parle de
  // mensualités pour une prestation d'un soir.
  const lignes: [string, string][] = k.estSoiree
    ? [
        [
          'Prestation',
          `${k.formule.label} — Lucky actif pour une soirée${k.soiree.offerte ? ' (offerte)' : ''}`,
        ],
        ['Date de la soirée', k.soiree.date],
        ['Nombre de supports installés', libelleSupports(k)],
        ['Supports personnalisés', k.supports.personnalises ? 'Oui' : 'Non'],
        ...(k.soiree.remise > 0
          ? ([
              ['Tarif public HT', k.soiree.plein],
              ['Remise consentie', `${k.soiree.remise} %`],
            ] as [string, string][])
          : []),
        [k.soiree.remise > 0 ? 'Montant HT après remise' : 'Montant HT', k.soiree.montantHT],
        [`TVA (${k.engagement.tauxTva} %)`, k.soiree.tva],
        ['Montant TTC à régler', k.soiree.ttc],
        [
          'Modalité de paiement',
          k.soiree.offerte ? 'Sans contrepartie financière' : 'À la signature, en une fois',
        ],
        ['Contact opérationnel du Lieu', k.lieu.contactOperationnel],
      ]
    : [
        ['Formule souscrite', `${k.formule.label} — ${k.formule.mensuelHT} / mois HT`],
        ['Nombre de supports installés', libelleSupports(k)],
        ['Supports personnalisés', k.supports.personnalises ? 'Oui' : 'Non'],
        ["Durée d'engagement", k.engagement.label],
        ['Remise applicable', `${k.engagement.remise} %`],
        ['Montant mensuel HT après remise', `${k.engagement.mensuelApresRemise} / mois`],
        [`TVA (${k.engagement.tauxTva} %)`, `${k.engagement.mensuelTva} / mois`],
        ['Montant mensuel TTC prélevé', `${k.engagement.mensuelTtc} / mois`],
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

  if (k.estSoiree) {
    ecrire(
      "Le présent contrat a pour objet une prestation ponctuelle : Lucky est actif dans " +
      "l'établissement pour la seule soirée indiquée ci-dessus. Il ne vaut ni abonnement ni " +
      "engagement de durée, ne se renouvelle pas par tacite reconduction, et prend fin de " +
      "plein droit à l'issue de la soirée, sans formalité ni préavis de part ni d'autre."
    );
    espace(10);
    ecrire(
      (k.soiree.offerte
        ? "Cette soirée est offerte par Lucky : aucune somme n'est due par le Lieu. Les supports installés restent "
        : "Le montant est dû en une seule fois à la signature. Les supports installés restent ") +
      "acquis au Lieu. Le Lieu reconnaît avoir pris connaissance des conditions générales " +
      "consultables à l'adresse lucky-app.io/legal/etablissements et les accepter sans " +
      "réserve ; en cas de divergence, les présentes conditions particulières prévalent."
    );
  } else {
    ecrire(
      "Le Lieu reconnaît avoir pris connaissance des conditions générales d'abonnement, annexées au " +
      "présent contrat et consultables à l'adresse lucky-app.io/legal/etablissements, et les accepter " +
      "sans réserve."
    );
    espace(10);
    // La gratuité des trente premiers jours est la contrepartie de
    // l'engagement, pas un essai libre : le dire ici, en toutes lettres, est
    // ce qui évite qu'un lieu enchaîne les soirées offertes puis s'en aille.
    ecrire(
      `Les trente premiers jours ne sont pas facturés. Cette gratuité est consentie en contrepartie ` +
      `de l'engagement de ${k.engagement.label} souscrit ci-dessus : elle ne constitue pas une ` +
      `période d'essai libre et n'ouvre pas de droit de rétractation. Le Service est pleinement actif ` +
      `pendant cette période et le premier prélèvement intervient à son issue.`
    );
    espace(10);
    ecrire(
      "Le contrat ne peut être résilié avant le terme de l'engagement. En cas de rupture par le Lieu " +
      "avant ce terme, y compris pendant les trente premiers jours, les mensualités restant à courir " +
      "deviennent exigibles, déduction faite des sommes déjà réglées. Cette clause ne joue pas si la " +
      "rupture est imputable à Lucky, ni en cas de cessation d'activité justifiée du Lieu."
    );
  }
  espace(18);

  ecrire(
    `Fait à ${k.lieu.ville ?? '______________________'}, le ${k.dates.fait}, en deux exemplaires.`,
    { taille: 10 }
  );
  espace(30);

  // ---- signatures ----
  // Trois cadres : le Lieu, puis les deux fondateurs.
  //
  // Côté Lucky, le contrat est émis depuis l'espace authentifié d'un
  // fondateur : l'envoi vaut signature, et les deux cadres sont donc remplis
  // ici, à la construction du document. Côté Lieu, le cadre reste vide et
  // renvoie à la page de preuve, ajoutée au moment où le gérant signe en
  // ligne — elle porte l'horodatage, l'adresse IP et l'empreinte.
  const signeLe = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
  });
  const CADRES = [
    {
      titre: 'Pour le Lieu',
      sous: `${k.lieu.signataire}, ${k.lieu.qualite}`,
      rempli: null as string[] | null,
    },
    ...LUCKY_SIGNATAIRES.map((sg, i) => ({
      titre: i === 0 ? 'Pour Lucky' : ' ',
      sous: `${sg.nom}, ${sg.qualite}`,
      rempli: [sg.nom, 'Signé électroniquement', `le ${signeLe}`] as string[] | null,
    })),
  ];

  const ECART = 18;
  const largeurCadre = (LARGEUR - ECART * (CADRES.length - 1)) / CADRES.length;

  // Le bloc de signatures ne se coupe pas : titre, sous-titre, cadre de 72
  // points et la ligne de rappel en dessous. S'il ne tient pas dans ce qui
  // reste, il part sur la page suivante en entier — sinon les cadres
  // débordent sous le bord de la page, ce qui est passé inaperçu jusqu'au
  // jour où le texte au-dessus s'est allongé.
  const HAUTEUR_SIGNATURES = 150;
  if (c.y - HAUTEUR_SIGNATURES < MARGE) {
    c.page = doc.addPage([A4.l, A4.h]);
    c.y = A4.h - MARGE;
  }

  const yCadre = c.y - 90;

  let cadreLieu: CadreLieu | null = null;

  CADRES.forEach((cadre, i) => {
    const x = MARGE + i * (largeurCadre + ECART);
    if (i === 0) {
      cadreLieu = {
        page: doc.getPages().indexOf(c.page),
        x,
        y: yCadre,
        w: largeurCadre,
        h: 72,
      };
    }

    if (cadre.titre.trim()) {
      c.page.drawText(cadre.titre, { x, y: c.y, size: 9.5, font: gras, color: NOIR });
    }
    for (const ligne of mots(cadre.sous, normal, 7.5, largeurCadre)) {
      c.page.drawText(ligne, { x, y: c.y - 13, size: 7.5, font: normal, color: GRIS });
      break; // une seule ligne : le cadre est etroit, le nom complet tient
    }

    c.page.drawRectangle({
      x, y: yCadre, width: largeurCadre, height: 72,
      borderColor: TRAIT, borderWidth: 0.8,
    });

    if (cadre.rempli) {
      // Signature déjà apposée : nom en gras, puis la mention et la date.
      c.page.drawText(cadre.rempli[0], {
        x: x + 8, y: yCadre + 46, size: 9, font: gras, color: NOIR,
      });
      c.page.drawText(cadre.rempli[1], {
        x: x + 8, y: yCadre + 31, size: 7.5, font: normal, color: GRIS,
      });
      c.page.drawText(cadre.rempli[2], {
        x: x + 8, y: yCadre + 20, size: 7.5, font: normal, color: GRIS,
      });
    } else {
      for (const [j, ligne] of ['Signature électronique —', 'voir la page de preuve', 'en fin de document'].entries()) {
        c.page.drawText(ligne, {
          x: x + 8, y: yCadre + 44 - j * 11, size: 7.5, font: normal, color: GRIS,
        });
      }
    }
  });

  c.y = yCadre - 26;
  ecrire(
    k.estSoiree
      ? 'Prestation ponctuelle — sans abonnement ni reconduction.'
      : "Les conditions générales d'abonnement font partie intégrante du contrat.",
    { taille: 7.5, couleur: GRIS }
  );

  annexerCgv(doc, normal, gras);

  return {
    pdf: await doc.save(),
    cadreLieu: cadreLieu ?? { page: 0, x: MARGE, y: 0, w: 0, h: 0 },
  };
}

/**
 * Les conditions générales, annexées au contrat.
 *
 * Renvoyer à une URL ne suffit pas : le document signé doit contenir ce que le
 * signataire a accepté, y compris si la page publique change ensuite.
 */
function annexerCgv(doc: PDFDocument, normal: PDFFont, gras: PDFFont) {
  const BAS = 64;
  let page = doc.addPage([A4.l, A4.h]);
  let y = A4.h - MARGE;

  const sautSiBesoin = (hauteur: number) => {
    if (y - hauteur < BAS) {
      page = doc.addPage([A4.l, A4.h]);
      y = A4.h - MARGE;
    }
  };

  const bloc = (
    texte: string,
    { taille = 8.5, font = normal, interligne = 11.5, retrait = 0, couleur = NOIR } = {}
  ) => {
    const lignes = mots(texte, font, taille, LARGEUR - retrait);
    sautSiBesoin(lignes.length * interligne);
    for (const ligne of lignes) {
      page.drawText(ligne, { x: MARGE + retrait, y, size: taille, font, color: couleur });
      y -= interligne;
    }
  };

  bloc('ANNEXE — CONDITIONS GÉNÉRALES DE VENTE ET D\'UTILISATION', { taille: 11, font: gras, interligne: 16 });
  y -= 4;
  bloc(
    "Les présentes conditions font partie intégrante du contrat. En cas de divergence, les conditions " +
    "particulières qui précèdent prévalent.",
    { taille: 8, couleur: GRIS }
  );
  y -= 14;

  for (const article of CGV_ETABLISSEMENTS) {
    sautSiBesoin(40);
    y -= 6;
    bloc(article.titre, { taille: 9.5, font: gras, interligne: 13 });
    y -= 3;

    for (const b of article.blocs) {
      if (b.sous) {
        y -= 4;
        bloc(b.sous, { taille: 8.5, font: gras, interligne: 12 });
        y -= 2;
      } else if (b.fort) {
        bloc(b.fort, { font: gras });
        y -= 5;
      } else if (b.liste) {
        for (const item of b.liste) {
          const lignes = mots(item, normal, 8.5, LARGEUR - 14);
          sautSiBesoin(lignes.length * 11.5);
          lignes.forEach((ligne, i) => {
            if (i === 0) {
              page.drawText('—', { x: MARGE, y, size: 8.5, font: normal, color: GRIS });
            }
            page.drawText(ligne, { x: MARGE + 14, y, size: 8.5, font: normal, color: NOIR });
            y -= 11.5;
          });
          y -= 2;
        }
        y -= 3;
      } else if (b.p) {
        bloc(b.p);
        y -= 5;
      }
    }
  }
}
