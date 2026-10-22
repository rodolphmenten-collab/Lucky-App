-- Elargissement des types de lieux.
--
-- L'enum d'origine couvrait sept cas pensés pour une première démo. Le
-- terrain en a montré d'autres : hôtels-resorts, discothèques, casinos,
-- brasseries, cafés. Un type absent de l'enum ne provoquait pas d'erreur
-- visible — le code retombait silencieusement sur 'bar' — ce qui rendait
-- les statistiques par type fausses sans prévenir.
--
-- `add value if not exists` : la migration peut être rejouée sans casser.
-- Chaque valeur est ajoutée seule, jamais utilisée dans la même
-- transaction, ce que Postgres exige.

alter type venue_type add value if not exists 'resort';
alter type venue_type add value if not exists 'brasserie';
alter type venue_type add value if not exists 'cafe';
alter type venue_type add value if not exists 'pub';
alter type venue_type add value if not exists 'nightclub';
alter type venue_type add value if not exists 'casino';
alter type venue_type add value if not exists 'spa';
alter type venue_type add value if not exists 'camping';
alter type venue_type add value if not exists 'other';
