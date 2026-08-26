create table match_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  met boolean not null,
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);

alter table match_feedback enable row level security;

create policy "users manage their own feedback"
  on match_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Aggregated, anonymous view venues can eventually be shown (no individual data).
create or replace function get_venue_meetup_rate(p_venue_id uuid)
returns table (total_feedback bigint, met_count bigint)
language sql
security definer
set search_path = public
as $$
  select count(*), count(*) filter (where mf.met)
  from match_feedback mf
  join matches m on m.id = mf.match_id
  where m.venue_id = p_venue_id;
$$;
