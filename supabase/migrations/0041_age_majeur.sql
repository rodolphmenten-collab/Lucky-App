-- L'âge devient obligatoire, et la majorité est contrôlée en base.
--
-- Le service est réservé aux personnes majeures : les CGU le disaient déjà,
-- le produit ne le vérifiait pas. Le champ était facultatif et le `min=18` du
-- formulaire n'est qu'une indication du navigateur — rien n'empêchait un
-- profil sans âge, ni un âge saisi hors du formulaire.
--
-- NOT VALID : la contrainte s'applique à toute insertion et à toute mise à
-- jour, sans rejeter les profils déjà enregistrés sans âge. Ceux-là devront
-- le renseigner à leur prochaine modification de profil.
alter table profiles drop constraint if exists profiles_age_check;

alter table profiles
  add constraint profiles_age_majeur
  check (age is not null and age between 18 and 100)
  not valid;
