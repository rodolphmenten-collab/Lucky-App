-- ============================================================================
-- 0043 — Signalements prioritaires : images sexuelles impliquant un mineur,
--        images intimes diffusées sans consentement
--
-- Ces deux signalements ne sont pas des signalements comme les autres. Ils
-- portent sur un contenu qui doit disparaître tout de suite, pas après revue :
-- le temps qu'un humain regarde, la photo reste visible par tout le monde dans
-- la salle. La revue humaine garde son rôle — décider de la suite — mais elle
-- n'est plus ce qui conditionne le retrait.
--
-- D'où trois ajouts :
--   * une priorité, pour que ces signalements ne se noient pas dans la file ;
--   * une copie de l'URL de la photo au moment du signalement, parce que le
--     compte est suspendu dans la foulée et que la preuve disparaîtrait avec
--     lui — sans elle, impossible de répondre ensuite aux autorités ;
--   * la trace de l'escalade externe, qui dit à qui et quand le dossier a été
--     transmis. Un signalement « traité » sans cette ligne ne prouve rien.
--
-- La preuve est conservée douze mois, puis purgée : c'est la durée qui permet
-- de répondre à une réquisition sans conserver indéfiniment l'image d'une
-- personne qui en est la victime.
-- ============================================================================

alter table reports
  add column if not exists priority text not null default 'standard'
  check (priority in ('standard', 'urgent'));

alter table reports add column if not exists photo_url_at_report text;
alter table reports add column if not exists evidence_expires_at timestamptz;
alter table reports add column if not exists escalated_at timestamptz;
alter table reports add column if not exists escalated_to text;
alter table reports add column if not exists escalated_by text;

-- La file de modération s'ouvre sur les urgents, sans tri côté application.
create index if not exists reports_priority_idx
  on reports (priority, created_at desc)
  where status = 'pending';

-- Purge des preuves arrivées à échéance. Appelée par la tâche planifiée ; on ne
-- supprime que la copie de l'image, jamais le signalement lui-même : savoir
-- qu'un compte a été signalé pour ce motif reste utile après la purge.
create or replace function purger_preuves_signalements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update reports
    set photo_url_at_report = null, evidence_expires_at = null
    where evidence_expires_at is not null
      and evidence_expires_at < now()
      and photo_url_at_report is not null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function purger_preuves_signalements() from public, anon, authenticated;
