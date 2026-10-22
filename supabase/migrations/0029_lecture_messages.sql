-- Suivi de lecture des conversations.
--
-- Le compteur de l'onglet Messages comptait les conversations dont le dernier
-- message n'etait pas de soi. Faute de notion de lecture, il ne s'effacait
-- qu'en repondant : ouvrir la conversation ne changeait rien, et le badge
-- restait allume sur un message deja lu.
--
-- Une ligne par personne et par conversation, mise a jour a l'ouverture.

create table if not exists match_reads (
  match_id uuid not null references matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists match_reads_user_idx on match_reads (user_id);

alter table match_reads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'match_reads' and policyname = 'users manage their own reads'
  ) then
    create policy "users manage their own reads"
      on match_reads for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
