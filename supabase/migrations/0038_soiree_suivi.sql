-- Rendre visible ce qui a été encaissé.
--
-- Une soirée payée ne laissait aucune trace lisible : pas de statut
-- d'abonnement (il n'y en a pas), donc la fiche continuait d'afficher le
-- dernier état connu — « résilié » dans le pire des cas, alors que le lieu
-- venait de payer. On stocke donc le fait et le montant.
--
-- Le montant est conservé même à zéro : une soirée offerte est une soirée
-- honorée, elle doit apparaître dans le suivi comme les autres. C'est le
-- montant qui dit qu'elle était gratuite, pas son absence.

alter table venues add column if not exists soiree_paid_at timestamptz;
alter table venues add column if not exists soiree_amount_cents integer;

-- Soirée offerte : décidée côté commercial, avant toute facturation. Aucun
-- passage par Stripe — le contrat part à 0 €, avec les mêmes CGV.
alter table crm_venues add column if not exists soiree_offerte boolean not null default false;

-- Nature de l'événement, pour que le suivi commercial distingue d'un coup
-- d'œil un paiement d'une note prise au comptoir.
alter table crm_notes add column if not exists kind text;

create index if not exists venues_soiree_paid_idx on venues (soiree_paid_at)
  where soiree_paid_at is not null;
