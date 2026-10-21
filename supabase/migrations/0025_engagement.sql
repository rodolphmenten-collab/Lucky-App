-- ============================================================================
-- 0025 — Durée d'engagement et nombre de supports
--
-- Jusqu'ici une formule n'était qu'un prix. Le contrat en fait autre chose :
-- une formule, une durée d'engagement qui porte une remise, et un nombre de
-- supports inclus. Sans ces deux colonnes, le pipe affiche un montant qui
-- n'est pas celui qui sera facturé.
--
-- La durée vit en mois (3, 6, 12) plutôt qu'en libellé : on calcule des
-- échéances avec, pas des étiquettes.
-- ============================================================================

alter table crm_venues add column if not exists commitment_months int;
alter table crm_venues add column if not exists supports_count int;

alter table venues add column if not exists commitment_months int;
alter table venues add column if not exists supports_count int;

-- Les durées autorisées sont celles du contrat. Une valeur hors de cette liste
-- serait invisible à l'écran et fausserait le MRR en silence.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'crm_venues_engagement_connu'
  ) then
    alter table crm_venues add constraint crm_venues_engagement_connu
      check (commitment_months is null or commitment_months in (3, 6, 12));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'venues_engagement_connu'
  ) then
    alter table venues add constraint venues_engagement_connu
      check (commitment_months is null or commitment_months in (3, 6, 12));
  end if;
end $$;

-- Reprise : le nombre de supports suit la taille de la salle quand on la
-- connaît déjà, une table équipée valant un support.
update crm_venues
set supports_count = tables_count
where supports_count is null and tables_count is not null and tables_count > 0;
