-- Remise sur une prestation « soirée ».
--
-- Une soirée se négocie : 249 € est un prix d'appel, et un lieu qui hésite se
-- décide souvent pour dix pour cent. Jusqu'ici la seule façon de le faire
-- était d'offrir la soirée entièrement — tout ou rien — ou de bricoler côté
-- Stripe, avec le contrat qui annonçait alors un montant faux.
--
-- Le pourcentage vit à deux endroits pour la même raison que la formule :
-- crm_venues porte ce qui est écrit au contrat, venues ce qui est facturé.
alter table crm_venues add column if not exists soiree_remise_pct int;
alter table venues add column if not exists soiree_remise_pct int;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'crm_venues_soiree_remise_pct_valide'
  ) then
    alter table crm_venues add constraint crm_venues_soiree_remise_pct_valide
      check (soiree_remise_pct is null or soiree_remise_pct between 0 and 50);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'venues_soiree_remise_pct_valide'
  ) then
    alter table venues add constraint venues_soiree_remise_pct_valide
      check (soiree_remise_pct is null or soiree_remise_pct between 0 and 50);
  end if;
end $$;
