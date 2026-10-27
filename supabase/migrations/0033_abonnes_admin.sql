-- Un administrateur de la plateforme qui se connecte « à la place du lieu »
-- doit voir ce que le lieu voit, adresses comprises : sinon l'impersonation
-- ne sert plus au support, et on masquait de toute façon une donnée déjà
-- présente dans la base. La fonction accepte donc aussi le rôle de service,
-- utilisé uniquement côté serveur, après vérification que l'appelant est bien
-- administrateur de la plateforme.
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
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from venue_admins m
        where m.venue_id = p_venue_id
          and m.user_id = auth.uid()
      )
    )
  order by f.consented_at desc;
$$;

revoke all on function venue_followers(uuid) from public, anon;
grant execute on function venue_followers(uuid) to authenticated, service_role;
