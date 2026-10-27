-- Consentement de l'utilisateur à recevoir les actualités d'UN établissement.
--
-- Une ligne par couple personne / lieu : le consentement vaut pour ce lieu-là
-- et pour aucun autre. C'est ce qui le rend éclairé, et c'est ce qui permet de
-- prouver, lieu par lieu, qui a accepté quoi et quand.
--
-- On ne supprime pas la ligne au retrait : on date le retrait. Une liste de
-- diffusion se conteste des mois plus tard, et il faut alors pouvoir montrer
-- que la personne était bien consentante à la date de l'envoi, puis qu'elle
-- s'est retirée à telle date. Une ligne effacée ne prouve rien.

create table if not exists venue_follows (
  user_id uuid not null references profiles(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  consented_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  -- D'où vient le consentement : utile le jour où il faut retracer le parcours
  -- exact dans lequel la case a été cochée.
  source text not null default 'room',
  primary key (user_id, venue_id)
);

create index if not exists venue_follows_venue_actifs_idx
  on venue_follows (venue_id)
  where withdrawn_at is null;

alter table venue_follows enable row level security;

do $$
begin
  -- La personne voit et modifie ses propres abonnements, et eux seuls.
  if not exists (
    select 1 from pg_policies
    where tablename = 'venue_follows' and policyname = 'users manage their own follows'
  ) then
    create policy "users manage their own follows" on venue_follows
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- Le lieu lit les abonnés de SON établissement. Pas ceux des autres.
  if not exists (
    select 1 from pg_policies
    where tablename = 'venue_follows' and policyname = 'venue admins read their followers'
  ) then
    create policy "venue admins read their followers" on venue_follows
      for select
      using (
        exists (
          select 1 from venue_admins m
          where m.venue_id = venue_follows.venue_id
            and m.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Les e-mails ne sont pas dans profiles mais dans auth.users, que personne ne
-- doit pouvoir interroger librement. Cette fonction est le seul passage : elle
-- s'exécute en droits élevés, mais vérifie d'abord que l'appelant administre
-- bien CE lieu — sans quoi elle ne retourne rien.
create or replace function venue_followers(p_venue_id uuid)
returns table (first_name text, email text, consented_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.first_name, u.email::text, f.consented_at
  from venue_follows f
  join profiles p on p.id = f.user_id
  join auth.users u on u.id = f.user_id
  where f.venue_id = p_venue_id
    and f.withdrawn_at is null
    and exists (
      select 1 from venue_admins m
      where m.venue_id = p_venue_id
        and m.user_id = auth.uid()
    )
  order by f.consented_at desc;
$$;

revoke all on function venue_followers(uuid) from public, anon;
grant execute on function venue_followers(uuid) to authenticated;
