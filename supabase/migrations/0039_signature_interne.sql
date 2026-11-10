-- Signature électronique maison : un lien unique par contrat, et la trace de
-- ce qui s'est passé quand le lieu a signé.
--
-- Le PDF est stocké tel quel, pas reconstruit à la demande : la fiche peut
-- changer après l'envoi, et ce qui fait foi est le document que le signataire
-- a eu sous les yeux — pas ce que la base dirait aujourd'hui.

create table if not exists contrat_signatures (
  id uuid primary key default gen_random_uuid(),
  crm_venue_id uuid not null references crm_venues(id) on delete cascade,
  token text not null unique,
  destinataire_email text not null,
  signataire_attendu text not null,
  pdf_base64 text not null,
  pdf_sha256 text not null,
  envoye_par text,
  envoye_le timestamptz not null default now(),
  annule_le timestamptz,
  signe_le timestamptz,
  signe_par text,
  signe_ip text,
  signe_user_agent text,
  pdf_signe_base64 text,
  created_at timestamptz not null default now()
);

create index if not exists contrat_signatures_crm_idx on contrat_signatures (crm_venue_id);

-- Aucune policy : la table n'est lue et écrite que par la clé de service,
-- depuis les routes serveur. Le lien de signature est le seul accès, et il
-- passe par une route qui vérifie le token.
alter table contrat_signatures enable row level security;
