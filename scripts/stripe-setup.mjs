/**
 * Lucky — création du catalogue Stripe.
 *
 * Autonome : aucune dépendance npm, uniquement l'API REST de Stripe via fetch.
 *
 *   STRIPE_SECRET_KEY=sk_test_xxx node setup-stripe.mjs
 *   STRIPE_SECRET_KEY=sk_live_xxx node setup-stripe.mjs
 *
 * Idempotent : relançable sans rien dupliquer. Un produit, un prix ou un
 * coupon déjà présent est réutilisé tel quel.
 *
 * Les prix sont HT (tax_behavior: exclusive) : la TVA s'ajoute par-dessus.
 * C'est le point que l'interface de Stripe fait rater le plus souvent — un
 * prix créé à la main passe facilement en TTC, et 99 € HT devient 82,50 € HT.
 */

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('\n  STRIPE_SECRET_KEY manquante.\n');
  console.error('  Usage : STRIPE_SECRET_KEY=sk_test_xxx node setup-stripe.mjs\n');
  process.exit(1);
}

const MODE = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
const SITE = process.env.SITE_URL || 'https://lucky-app.io';

const PLANS = [
  { key: 'basique',   nom: 'Lucky — Basique',   montant: 9900,  supports: 10, env: 'STRIPE_PRICE_BASIQUE' },
  { key: 'essentiel', nom: 'Lucky — Essentiel', montant: 14900, supports: 25, env: 'STRIPE_PRICE_ESSENTIEL' },
  { key: 'premium',   nom: 'Lucky — Premium',   montant: 29900, supports: 40, env: 'STRIPE_PRICE_PREMIUM' },
];

// Remise à vie : le coupon reste appliqué tant que l'abonnement vit.
const COUPONS = [
  { id: 'engagement-6-mois',  nom: 'Engagement 6 mois (-10 %)',  pct: 10 },
  { id: 'engagement-12-mois', nom: 'Engagement 12 mois (-20 %)', pct: 20 },
];

const EVENEMENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
];

/** Encodage formulaire façon Stripe : metadata[cle]=valeur, recurring[interval]=month. */
function encoder(obj, prefixe = '', sortie = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const cle = prefixe ? `${prefixe}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') encoder(item, `${cle}[${i}]`, sortie);
        else sortie.push(`${encodeURIComponent(`${cle}[${i}]`)}=${encodeURIComponent(item)}`);
      });
    } else if (typeof v === 'object') {
      encoder(v, cle, sortie);
    } else {
      sortie.push(`${encodeURIComponent(cle)}=${encodeURIComponent(v)}`);
    }
  }
  return sortie.join('&');
}

async function api(methode, chemin, params) {
  const options = {
    method: methode,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (params) options.body = encoder(params);
  const rep = await fetch(`https://api.stripe.com/v1${chemin}`, options);
  const data = await rep.json();
  if (!rep.ok) {
    const err = new Error(data?.error?.message || `HTTP ${rep.status}`);
    err.code = data?.error?.code;
    err.statut = rep.status;
    throw err;
  }
  return data;
}

console.log(`\n  Mode ${MODE}\n`);
if (MODE === 'LIVE') {
  console.log('  Compte réel : les objets créés serviront à facturer vos clients.\n');
}

const envs = [];

// --------------------------------------------------------------------------
// Produits et prix
// --------------------------------------------------------------------------
const tousProduits = await api('GET', '/products?limit=100&active=true');

for (const plan of PLANS) {
  let produit = tousProduits.data.find((p) => p.metadata?.lucky_plan === plan.key);

  if (!produit) {
    produit = await api('POST', '/products', {
      name: plan.nom,
      description: `Abonnement mensuel Lucky — ${plan.supports} supports QR inclus`,
      metadata: { lucky_plan: plan.key, supports: String(plan.supports) },
    });
  }

  const prix = await api('GET', `/prices?product=${produit.id}&active=true&limit=100`);
  let tarif = prix.data.find(
    (p) =>
      p.unit_amount === plan.montant &&
      p.currency === 'eur' &&
      p.recurring?.interval === 'month' &&
      p.tax_behavior === 'exclusive'
  );

  const existait = Boolean(tarif);
  if (!tarif) {
    tarif = await api('POST', '/prices', {
      product: produit.id,
      unit_amount: plan.montant,
      currency: 'eur',
      recurring: { interval: 'month' },
      tax_behavior: 'exclusive',
      metadata: { lucky_plan: plan.key },
    });
  }

  console.log(
    `  ${plan.key.padEnd(10)} ${tarif.id.padEnd(32)} ${(plan.montant / 100).toFixed(2).padStart(7)} € HT/mois  ${existait ? '(existant)' : '(créé)'}`
  );
  envs.push(`${plan.env}=${tarif.id}`);
}

// --------------------------------------------------------------------------
// Coupons d'engagement
// --------------------------------------------------------------------------
console.log('');
for (const c of COUPONS) {
  try {
    await api('GET', `/coupons/${c.id}`);
    console.log(`  ${c.id.padEnd(22)} -${c.pct} %  (existant)`);
  } catch (err) {
    if (err.statut !== 404) throw err;
    await api('POST', '/coupons', {
      id: c.id,
      name: c.nom,
      percent_off: c.pct,
      duration: 'forever',
      currency: 'eur',
    });
    console.log(`  ${c.id.padEnd(22)} -${c.pct} %  (créé, à vie)`);
  }
}

// --------------------------------------------------------------------------
// Webhook
//
// Le secret de signature n'est renvoyé qu'à la création. S'il existe déjà, il
// faut le relire dans le dashboard ou supprimer le endpoint pour le recréer.
// --------------------------------------------------------------------------
console.log('');
const url = `${SITE}/api/stripe/webhook`;
const hooks = await api('GET', '/webhook_endpoints?limit=100');
const existant = hooks.data.find((h) => h.url === url);

if (existant) {
  console.log(`  webhook ${url}  (existant — secret non relisible ici)`);
} else {
  const hook = await api('POST', '/webhook_endpoints', {
    url,
    enabled_events: EVENEMENTS,
    description: 'Lucky — abonnements des lieux',
  });
  console.log(`  webhook ${url}  (créé)`);
  envs.push(`STRIPE_WEBHOOK_SECRET=${hook.secret}`);
}

// --------------------------------------------------------------------------
console.log('\n  ---------------------------------------------------------');
console.log('  À coller dans les variables d’environnement Netlify :\n');
console.log(envs.map((l) => `  ${l}`).join('\n'));
console.log('\n  Puis, une fois Stripe Tax configuré :  STRIPE_AUTOMATIC_TAX=true');
console.log('  ---------------------------------------------------------\n');
