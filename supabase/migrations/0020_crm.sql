-- ============================================================================
-- 0020 — CRM établissements
--
-- Jusqu'ici la prospection vivait dans venue_leads (un formulaire du site,
-- aucun suivi) et les clients dans venues. Deux endroits, aucune continuité :
-- un bar rencontré en roadshow n'avait nulle part où exister avant de signer.
--
-- crm_venues est la ligne de vie unique d'un établissement, du premier café
-- jusqu'au contrat. Quand le lieu signe, on crée le venue et on garde le lien :
-- la fiche CRM ne meurt pas, elle se branche sur la facturation réelle.
--
-- Table strictement serveur (service role), comme venue_leads et billing_events.
-- ============================================================================

create table if not exists crm_venues (
  id uuid primary key default gen_random_uuid(),

  -- Rempli à la signature. Tant qu'il est nul, le lieu est un prospect.
  venue_id uuid references venues (id) on delete set null,

  name text not null,
  city text,
  type text,
  address text,

  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,

  -- prospect | contacte | rdv | demo | interesse | signe | perdu
  stage text not null default 'prospect',
  stage_changed_at timestamptz not null default now(),
  lost_reason text,

  -- Qui porte le lieu. Email d'un platform_admin.
  owner_email text,

  -- roadshow | inbound | reseau | terrain | autre
  source text,

  -- Formule pressentie, pour calculer le MRR potentiel du pipeline avant
  -- qu'aucun euro ne soit facturé.
  expected_plan text,
  tables_count int,

  next_action text,
  next_action_at date,

  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_venues_stage_idx on crm_venues (stage, updated_at desc);
create index if not exists crm_venues_next_action_idx on crm_venues (next_action_at) where next_action_at is not null;
create unique index if not exists crm_venues_venue_idx on crm_venues (venue_id) where venue_id is not null;

alter table crm_venues enable row level security;

-- ----------------------------------------------------------------------------
-- Le journal. Une ligne par échange : c'est ce qu'on tape sur la tablette en
-- sortant du rendez-vous, et c'est ce qui permet à l'autre associé de reprendre
-- un lieu sans rien demander.
-- ----------------------------------------------------------------------------
create table if not exists crm_notes (
  id uuid primary key default gen_random_uuid(),
  crm_venue_id uuid not null references crm_venues (id) on delete cascade,
  author_email text not null,
  body text not null,
  -- Renseigné quand la note accompagne un changement d'étape : on relit
  -- l'historique et on voit pourquoi le lieu a bougé, pas seulement qu'il a bougé.
  stage_from text,
  stage_to text,
  created_at timestamptz not null default now()
);

create index if not exists crm_notes_venue_idx on crm_notes (crm_venue_id, created_at desc);

alter table crm_notes enable row level security;

-- ----------------------------------------------------------------------------
-- Reprise de l'existant : chaque établissement déjà créé devient une fiche CRM
-- au stade « signé », pour qu'il n'y ait jamais deux listes à regarder.
-- ----------------------------------------------------------------------------
insert into crm_venues (venue_id, name, city, type, contact_name, contact_email, stage, source, expected_plan, created_at)
select v.id, v.name, v.city, v.type::text, v.contact_name, v.contact_email, 'signe', 'existant', v.plan::text, v.created_at
from venues v
where not exists (select 1 from crm_venues c where c.venue_id = v.id);

-- Les leads du formulaire public rejoignent le même pipeline, au stade prospect.
insert into crm_venues (name, city, type, contact_name, contact_email, stage, source, expected_plan, created_at)
select l.venue_name, l.venue_city, l.venue_type, l.contact_name, l.contact_email, 'prospect', 'inbound', l.plan_interest, l.created_at
from venue_leads l
where l.status <> 'imported'
  and not exists (
    select 1 from crm_venues c
    where lower(c.contact_email) = lower(l.contact_email) and lower(c.name) = lower(l.venue_name)
  );

update venue_leads set status = 'imported' where status <> 'imported';

-- ----------------------------------------------------------------------------
-- updated_at automatique : sur une tablette on tape vite, personne ne pensera
-- à toucher la colonne.
-- ----------------------------------------------------------------------------
create or replace function crm_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  if new.stage is distinct from old.stage then
    new.stage_changed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists crm_venues_touch on crm_venues;
create trigger crm_venues_touch before update on crm_venues
  for each row execute function crm_touch_updated_at();
