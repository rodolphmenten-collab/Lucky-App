-- ============================================================================
-- 0017 — Attribution du chiffre d'affaires généré par Lucky
--
-- Principe : aucune saisie côté staff. La trace est produite dans l'app, au
-- moment où le client agit, et le montant vient de la carte du lieu (saisie
-- une seule fois par le patron dans son dashboard).
--
--   1. « On se rencontre »  -> meetups        : la connexion devient une rencontre réelle
--   2. « J'offre un verre » -> lucky_orders   : un bon avec un code, montant connu
--   3. « Reçu »             -> order.served   : le verre a bien été servi -> CA certifié
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CARTE DU LIEU — saisie une fois par l'établissement, sert de référentiel prix
-- ----------------------------------------------------------------------------
create table if not exists venue_menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  price_cents int not null check (price_cents >= 0 and price_cents <= 1000000),
  category text not null default 'drink' check (category in ('drink', 'bottle', 'food', 'other')),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists venue_menu_items_venue_idx on venue_menu_items (venue_id, active, sort_order);

-- Avantage Lucky affiché avec le code de rencontre (c'est lui qui donne au client
-- une raison de montrer le code), et panier moyen pour l'estimation du CA non tracé.
alter table venues add column if not exists perk_label text;
alter table venues add column if not exists average_ticket_cents int;

-- ----------------------------------------------------------------------------
-- RENCONTRES — une connexion Lucky qui devient une vraie rencontre
-- ----------------------------------------------------------------------------
do $$ begin
  create type meetup_status as enum ('pending', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists meetups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches (id) on delete cascade,
  venue_id uuid not null references venues (id) on delete cascade,
  code text not null unique,
  requested_by uuid not null references auth.users (id) on delete cascade,
  confirmed_by uuid references auth.users (id) on delete set null,
  status meetup_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists meetups_venue_idx on meetups (venue_id, status, confirmed_at);

-- ----------------------------------------------------------------------------
-- COMMANDES LUCKY — le verre offert depuis la carte du lieu
--
-- pending : le bon est émis, le client va le montrer au bar
-- served  : la réception a été confirmée dans l'app -> compté en CA certifié
-- ----------------------------------------------------------------------------
do $$ begin
  create type lucky_order_status as enum ('pending', 'served', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists lucky_orders (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  meetup_id uuid references meetups (id) on delete set null,
  venue_id uuid not null references venues (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  item_id uuid references venue_menu_items (id) on delete set null,
  -- name/price figés à la commande : la carte peut changer, pas l'historique du CA
  item_name text not null,
  price_cents int not null check (price_cents >= 0),
  code text not null unique,
  status lucky_order_status not null default 'pending',
  created_at timestamptz not null default now(),
  served_at timestamptz,
  served_confirmed_by uuid references auth.users (id) on delete set null,
  constraint lucky_orders_not_self check (from_user <> to_user)
);

create index if not exists lucky_orders_venue_idx on lucky_orders (venue_id, status, created_at);
create index if not exists lucky_orders_match_idx on lucky_orders (match_id, created_at);

-- ----------------------------------------------------------------------------
-- RLS — lecture par les participants (le temps réel en dépend).
-- Toutes les écritures passent par les routes API en service role, qui
-- vérifient explicitement l'autorisation (cf. leçon : jamais d'écriture
-- autorisée côté client).
-- ----------------------------------------------------------------------------
alter table venue_menu_items enable row level security;
alter table meetups enable row level security;
alter table lucky_orders enable row level security;

drop policy if exists "menu is readable by signed-in users" on venue_menu_items;
create policy "menu is readable by signed-in users"
  on venue_menu_items for select
  to authenticated
  using (active);

drop policy if exists "venue admins read their menu" on venue_menu_items;
create policy "venue admins read their menu"
  on venue_menu_items for select
  to authenticated
  using (exists (
    select 1 from venue_admins va
    where va.venue_id = venue_menu_items.venue_id and va.user_id = auth.uid()
  ));

drop policy if exists "participants read their meetup" on meetups;
create policy "participants read their meetup"
  on meetups for select
  to authenticated
  using (exists (
    select 1 from matches m
    where m.id = meetups.match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ));

drop policy if exists "participants read their orders" on lucky_orders;
create policy "participants read their orders"
  on lucky_orders for select
  to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- ----------------------------------------------------------------------------
-- REALTIME — le bon et la rencontre doivent apparaître chez l'autre sans refresh
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table lucky_orders;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table meetups;
exception when duplicate_object then null; end $$;
