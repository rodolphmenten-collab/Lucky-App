/**
 * Crée dans Stripe les trois produits d'abonnement Lucky et leurs prix mensuels,
 * puis affiche les variables d'environnement à coller dans Netlify.
 *
 * À lancer une fois en mode test, une fois en mode live :
 *
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs
 *
 * Idempotent : un produit déjà créé par ce script est réutilisé (repéré par ses
 * metadata), et un prix identique n'est pas recréé. On peut le relancer sans
 * polluer le catalogue.
 *
 * Les prix sont HT (tax_behavior: exclusive) : la TVA est ajoutée par Stripe Tax
 * au moment du paiement, ce qui est la convention B2B française.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY manquante.');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-08-26.dahlia' });

const PLANS = [
  { key: 'basique', name: 'Lucky — Basique', amount: 9900, env: 'STRIPE_PRICE_BASIQUE' },
  { key: 'essentiel', name: 'Lucky — Essentiel', amount: 14900, env: 'STRIPE_PRICE_ESSENTIEL' },
  { key: 'premium', name: 'Lucky — Premium', amount: 29900, env: 'STRIPE_PRICE_PREMIUM' },
];

const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
console.log(`\nMode ${mode}\n`);

const output = [];

for (const plan of PLANS) {
  const existing = await stripe.products.search({
    query: `metadata['lucky_plan']:'${plan.key}'`,
    limit: 1,
  });

  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: plan.name,
      description: `Abonnement mensuel Lucky — plan ${plan.key}`,
      metadata: { lucky_plan: plan.key },
    }));

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const match = prices.data.find(
    (p) =>
      p.unit_amount === plan.amount &&
      p.currency === 'eur' &&
      p.recurring?.interval === 'month' &&
      p.tax_behavior === 'exclusive'
  );

  const price =
    match ??
    (await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'eur',
      recurring: { interval: 'month' },
      tax_behavior: 'exclusive',
      metadata: { lucky_plan: plan.key },
    }));

  console.log(
    `${plan.key.padEnd(10)} ${product.id}  ${price.id}  ${(plan.amount / 100).toFixed(2)} € HT/mois ${
      match ? '(existant)' : '(créé)'
    }`
  );
  output.push(`${plan.env}=${price.id}`);
}

console.log('\nÀ coller dans les variables d’environnement Netlify :\n');
console.log(output.join('\n'));
console.log('\nPuis, une fois Stripe Tax activé : STRIPE_AUTOMATIC_TAX=true\n');
