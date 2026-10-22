-- ============================================================================
-- 0027 — Relance des bons oubliés
--
-- Depuis que seul celui qui offre confirme le service, le chiffre d'affaires
-- certifié du lieu dépend d'un geste unique. S'il l'oublie — et au comptoir,
-- un verre à la main, il l'oubliera souvent — le bon reste en attente et le
-- lieu ne voit jamais ce que Lucky lui a rapporté.
--
-- Une seule relance, jamais deux : la colonne retient qu'on a déjà poussé,
-- pour qu'un redémarrage de la tâche planifiée ne harcèle personne.
-- ============================================================================

alter table lucky_orders add column if not exists reminder_sent_at timestamptz;

-- La tâche cherche les bons en attente, assez vieux, jamais relancés.
-- Index partiel : seules ces lignes-là comptent, elles sont une poignée.
create index if not exists lucky_orders_a_relancer_idx
  on lucky_orders (created_at)
  where status = 'pending' and reminder_sent_at is null;
