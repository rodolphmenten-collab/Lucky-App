-- « soiree » comme valeur de formule.
--
-- venues.plan est un enum, pas du texte. Écrire 'soiree' dedans échouait donc
-- en silence : le lien de paiement partait au bon montant, le lieu payait,
-- mais sa fiche continuait d'afficher l'ancienne formule mensuelle. Le bug
-- était invisible parce que l'écriture n'était pas contrôlée — c'est corrigé
-- côté code dans la même livraison.
--
-- À noter : crm_venues.expected_plan est du texte et acceptait déjà 'soiree',
-- d'où l'incohérence entre la fiche CRM et l'établissement.

alter type plan_type add value if not exists 'soiree';
