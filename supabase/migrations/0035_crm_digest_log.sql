-- Journal des récapitulatifs de relances envoyés.
--
-- La tâche planifiée tourne toutes les heures pour ne pas dépendre d'un fuseau
-- ou d'un passage manqué, mais chacun ne doit recevoir son récap qu'une fois
-- par jour. La clé primaire (email, jour) fait la garde : un insert en doublon
-- échoue, et l'envoi n'a pas lieu.
--
-- Pas de policy : seule la clé service écrit ici, personne ne lit cette table
-- depuis l'app. RLS activé pour qu'elle reste fermée par défaut.

create table if not exists crm_digest_log (
  email       text        not null,
  sent_on     date        not null,
  nb_taches   integer     not null default 0,
  created_at  timestamptz not null default now(),
  primary key (email, sent_on)
);

alter table crm_digest_log enable row level security;
