-- Données nécessaires au contrat.
--
-- La fiche CRM décrivait l'établissement (enseigne, ville, contact) mais pas
-- la personne morale qui signe. Or un contrat sans raison sociale, SIREN,
-- siège et signataire identifié n'est pas signable : il fallait les retaper
-- à la main à chaque envoi, hors de l'outil, avec le risque d'erreur que ça
-- suppose sur un acte qui engage.

alter table crm_venues add column if not exists legal_name text;      -- raison sociale
alter table crm_venues add column if not exists legal_form text;      -- SARL, SAS, EI…
alter table crm_venues add column if not exists siren text;
alter table crm_venues add column if not exists rcs_city text;        -- ville du RCS
alter table crm_venues add column if not exists legal_address text;   -- siège social
alter table crm_venues add column if not exists signer_name text;     -- qui signe
alter table crm_venues add column if not exists signer_role text;     -- à quel titre
alter table crm_venues add column if not exists supports_custom boolean not null default false;

-- Trace de l'envoi, pour savoir où en est chaque contrat sans ouvrir sa boîte mail.
alter table crm_venues add column if not exists contract_sent_at timestamptz;
alter table crm_venues add column if not exists contract_signed_at timestamptz;
