-- Suspension et suppression d'un compte depuis le back-office.
--
-- Jusqu'ici, couper un compte qui harcèle quelqu'un demandait d'ouvrir la base
-- et d'écrire du SQL. Ce n'est pas tenable un samedi soir, et c'est aussi ce
-- que nous avons décrit à notre partenaire de paiement : une sanction doit
-- pouvoir être appliquée en quelques secondes, et laisser une trace.
--
-- La suspension est portée par la base, pas par l'application : un compte
-- suspendu disparaît des salles, ne peut plus se pointer dans un lieu, et ne
-- peut plus écrire. Contourner l'interface ne sert à rien.

alter table profiles add column if not exists suspended_at timestamptz;
alter table profiles add column if not exists suspended_reason text;
alter table profiles add column if not exists suspended_by text;

create index if not exists profiles_suspended_at_idx on profiles (suspended_at)
  where suspended_at is not null;

-- ---------------------------------------------------------------------------
-- Journal des décisions de modération.
--
-- Utile deux fois : quand une autorité demande ce qui a été fait d'un
-- signalement, et quand la personne sanctionnée conteste dans les trente jours.
-- ---------------------------------------------------------------------------
create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_user uuid not null,
  action text not null check (action in ('suspend', 'unsuspend', 'delete')),
  reason text,
  report_id uuid references reports (id) on delete set null,
  actor_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_target_idx
  on moderation_actions (target_user, created_at desc);

alter table moderation_actions enable row level security;
-- Aucune policy : seule la clé service role y accède, c'est-à-dire le
-- back-office après vérification de l'administrateur.

-- ---------------------------------------------------------------------------
-- Un compte suspendu n'apparaît plus dans aucune salle.
-- ---------------------------------------------------------------------------
create or replace function get_people_here(p_venue_slug text)
returns table (
  user_id uuid,
  first_name text,
  age int,
  city text,
  job text,
  company text,
  bio text,
  photo_url text,
  photos text[],
  linkedin_url text,
  intentions intention[],
  interests text[],
  presence_status presence_status,
  last_verified_at timestamptz,
  waved_at_me boolean,
  waved_by_me boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id, p.first_name, p.age, p.city, p.job, p.company, p.bio, p.photo_url, p.photos, p.linkedin_url,
    p.intentions, p.interests,
    ci.presence_status, ci.last_verified_at,
    exists (
      select 1 from waves w
      where w.from_user = p.id and w.to_user = auth.uid() and w.venue_id = v.id
    ) as waved_at_me,
    exists (
      select 1 from waves w
      where w.from_user = auth.uid() and w.to_user = p.id and w.venue_id = v.id
    ) as waved_by_me
  from check_ins ci
  join venues v on v.id = ci.venue_id and v.slug = p_venue_slug
  join profiles p on p.id = ci.user_id
  where ci.presence_status in ('verified_now', 'recently_verified')
    and ci.last_verified_at >= now() - make_interval(mins => v.checkin_duration_minutes)
    and p.visible = true
    and p.suspended_at is null
    and p.id <> auth.uid()
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by ci.last_verified_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Un compte suspendu ne peut plus entrer dans un lieu ni y rester.
--
-- Le déclencheur couvre aussi bien l'arrivée (insert) que le signal de
-- présence renvoyé pendant la soirée (update) : la personne sort de la salle
-- au plus tard à la vérification suivante, sans qu'on ait à la déconnecter.
-- ---------------------------------------------------------------------------
create or replace function check_ins_refuse_suspendu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sortir quelqu'un de la salle reste permis : on ne refuse que ce qui le
  -- rendrait, ou le garderait, présent.
  if new.presence_status not in ('verified_now', 'recently_verified') then
    return new;
  end if;
  if exists (select 1 from profiles p where p.id = new.user_id and p.suspended_at is not null) then
    raise exception 'compte suspendu' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists check_ins_refuse_suspendu_trigger on check_ins;
create trigger check_ins_refuse_suspendu_trigger
  before insert or update on check_ins
  for each row execute function check_ins_refuse_suspendu();

-- ---------------------------------------------------------------------------
-- Un compte suspendu ne peut plus écrire.
-- ---------------------------------------------------------------------------
create or replace function messages_refuse_suspendu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from profiles p where p.id = new.sender_id and p.suspended_at is not null) then
    raise exception 'compte suspendu' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_refuse_suspendu_trigger on messages;
create trigger messages_refuse_suspendu_trigger
  before insert on messages
  for each row execute function messages_refuse_suspendu();
