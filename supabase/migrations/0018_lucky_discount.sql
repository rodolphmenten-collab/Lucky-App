-- ============================================================================
-- 0018 — Remise Lucky
--
-- Tout ce qui passe par Lucky bénéficie d'une remise immédiate, négociée avec
-- l'établissement au moment de la signature. C'est elle qui fait exister la
-- trace : le client montre son bon parce qu'il y gagne quelque chose tout de
-- suite, et le bon indique au bar le prix exact à appliquer.
--
-- Le CA attribué est le montant réellement encaissé (net), jamais le prix
-- catalogue : ce qui compte pour le lieu, c'est ce qui entre en caisse.
-- ============================================================================

alter table venues
  add column if not exists lucky_discount_percent int not null default 0
  check (lucky_discount_percent >= 0 and lucky_discount_percent <= 100);

-- price_cents reste le prix carte (brut). On fige aussi la remise appliquée et
-- le montant net à la commande : la remise peut être renégociée, l'historique
-- du CA ne doit pas bouger rétroactivement.
alter table lucky_orders
  add column if not exists discount_percent int not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);

alter table lucky_orders
  add column if not exists net_price_cents int;

-- Commandes antérieures à la remise : net = brut.
update lucky_orders set net_price_cents = price_cents where net_price_cents is null;

alter table lucky_orders alter column net_price_cents set not null;
