-- ============================================================================
-- 0026 — Lieux de test
--
-- Un faux lieu créé pour essayer le parcours apparaissait jusqu'ici comme
-- n'importe quel client : il gonflait le MRR, le nombre d'essais en cours et
-- le pipeline. C'est exactement ce qui s'est produit avec « Aux ministères »,
-- compté comme un essai à 99 € alors que personne n'avait rien signé.
--
-- Le marqueur reste sur la ligne plutôt que dans un schéma séparé : un lieu de
-- test doit se comporter exactement comme un vrai, sans quoi le test ne prouve
-- rien. Seuls les compteurs l'ignorent.
-- ============================================================================

alter table venues     add column if not exists is_test boolean not null default false;
alter table crm_venues add column if not exists is_test boolean not null default false;

create index if not exists venues_is_test_idx     on venues (is_test)     where is_test;
create index if not exists crm_venues_is_test_idx on crm_venues (is_test) where is_test;
