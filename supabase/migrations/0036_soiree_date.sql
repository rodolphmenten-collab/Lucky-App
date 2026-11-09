-- Date de la soirée, pour la formule à l'unité.
--
-- Un contrat de prestation ponctuelle doit dire quel soir il engage : sans
-- cette date il ne vaut rien, et la laisser en blanc à remplir à la main nous
-- ramènerait à ce qu'on a justement supprimé en générant le contrat.
--
-- Distincte de roadshow_date, qui sert à planifier les tournées de prospection
-- et n'engage personne.

alter table crm_venues add column if not exists soiree_date date;
