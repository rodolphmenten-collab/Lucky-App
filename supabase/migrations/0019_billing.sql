-- ============================================================================
-- 0019 — Abonnements établissements (Stripe)
--
-- Le lien de paiement est envoyé par la plateforme depuis le back-office : la
-- vente est négociée (plan, remise Lucky), elle n'est pas en self-service. On
-- stocke donc le minimum côté Lucky et Stripe reste la source de vérité de
-- l'état de l'abonnement — les webhooks recopient ici ce qu'il faut pour
-- afficher et, plus tard, suspendre un lieu impayé.
-- ============================================================================

alter table venues add column if not exists stripe_customer_id text;
alter table venues add column if not exists stripe_subscription_id text;

-- Reprend les valeurs de Stripe telles quelles (trialing, active, past_due,
-- canceled, incomplete, unpaid…) plus 'none' tant que rien n'a été envoyé.
alter table venues add column if not exists subscription_status text not null default 'none';

alter table venues add column if not exists trial_ends_at timestamptz;
alter table venues add column if not exists current_period_end timestamptz;
alter table venues add column if not exists checkout_sent_at timestamptz;

create unique index if not exists venues_stripe_customer_idx
  on venues (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists venues_subscription_status_idx on venues (subscription_status);

-- ----------------------------------------------------------------------------
-- Journal des événements Stripe reçus.
--
-- Sert à deux choses : rejouer/déboguer une facturation sans fouiller le
-- dashboard Stripe, et garantir l'idempotence — Stripe peut livrer deux fois
-- le même événement, la contrainte unique sur event_id empêche de le traiter
-- deux fois.
-- ----------------------------------------------------------------------------
create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  type text not null,
  venue_id uuid references venues (id) on delete set null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_venue_idx on billing_events (venue_id, created_at desc);

-- Aucune policy : table strictement serveur, lue et écrite en service role
-- uniquement. RLS activé ferme donc l'accès à tout le monde d'autre.
alter table billing_events enable row level security;
