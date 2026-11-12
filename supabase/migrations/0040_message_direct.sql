-- Le signe mutuel disparaît : on écrit directement.
--
-- Le wave imposait un aller-retour — faire signe, attendre, être vu, être
-- repayé de son signe — alors que la personne d'en face quitte la salle en
-- vingt minutes. La conversation s'ouvre donc tout de suite, et c'est au
-- destinataire de répondre ou non.
--
-- En échange, une règle tient lieu de garde-fou : tant que l'autre n'a pas
-- répondu, on ne peut écrire qu'un seul message. Zéro attente pour qui tente
-- sa chance, et personne ne peut insister.

-- ---- send_wave() : ouvre la conversation, sans réciprocité ----------------
create or replace function send_wave(p_to_user uuid, p_venue_id uuid)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count int;
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
begin
  if auth.uid() = p_to_user then
    raise exception 'cannot wave at yourself';
  end if;

  if exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = p_to_user)
       or (blocker_id = p_to_user and blocked_id = auth.uid())
  ) then
    raise exception 'cannot wave at this user';
  end if;

  -- Garde-fou de volume : 20 ouvertures de conversation par heure glissante.
  select count(*) into v_recent_count from waves
    where from_user = auth.uid() and created_at > now() - interval '1 hour';
  if v_recent_count >= 20 then
    raise exception 'wave rate limit reached, try again later';
  end if;

  -- La table waves reste la trace de qui a tenté sa chance, et porte la
  -- limite de volume ci-dessus.
  insert into waves (from_user, to_user, venue_id)
    values (auth.uid(), p_to_user, p_venue_id)
    on conflict (from_user, to_user, venue_id) do nothing;

  v_user_a := least(auth.uid(), p_to_user);
  v_user_b := greatest(auth.uid(), p_to_user);

  insert into matches (user_a, user_b, venue_id)
    values (v_user_a, v_user_b, p_venue_id)
    on conflict (user_a, user_b, venue_id) do nothing
    returning id into v_match_id;

  if v_match_id is null then
    select id into v_match_id from matches
      where user_a = v_user_a and user_b = v_user_b and venue_id = p_venue_id;
  end if;

  return query select true, v_match_id;
end;
$$;

-- ---- un seul message tant que l'autre n'a pas répondu ---------------------
-- Posé en base et non dans la route : la règle doit tenir même si la requête
-- ne vient pas de l'application.
create or replace function messages_limite_sans_reponse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- L'autre a déjà écrit : la conversation est engagée, plus de limite.
  if exists (
    select 1 from messages m
    where m.match_id = new.match_id and m.sender_id <> new.sender_id
  ) then
    return new;
  end if;

  -- Sinon, un seul message d'ouverture.
  if exists (
    select 1 from messages m
    where m.match_id = new.match_id and m.sender_id = new.sender_id
  ) then
    raise exception 'en attente de reponse'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_limite_sans_reponse_trigger on messages;
create trigger messages_limite_sans_reponse_trigger
  before insert on messages
  for each row execute function messages_limite_sans_reponse();
