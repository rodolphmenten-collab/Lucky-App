-- L'ordre des étapes d'une tournée.
--
-- Jusqu'ici la journée s'affichait triée par ville puis par nom. Sur le
-- trottoir, ça oblige à reconstruire l'itinéraire soi-même à chaque arrêt.
-- Un entier par lieu suffit : la liste et la carte suivent la marche.
alter table crm_venues add column if not exists roadshow_order int;

create index if not exists crm_venues_roadshow_idx
  on crm_venues (roadshow_date, roadshow_order)
  where roadshow_date is not null;
