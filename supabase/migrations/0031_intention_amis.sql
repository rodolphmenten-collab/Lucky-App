-- Cinquième intention : « avec des amis ».
--
-- Les quatre intentions existantes décrivent toutes un rapport d'individu à
-- individu. Or une grande partie des gens présents dans un lieu y sont en
-- groupe, et c'est précisément ce qui les retient : on n'aborde pas quelqu'un
-- seul quand on est à six. Cette intention dit « notre table est ouverte à une
-- autre table », et lève ce frein.
--
-- `add value if not exists` : rejouable. La valeur n'est pas utilisée dans la
-- même transaction, ce que Postgres exige.

alter type intention add value if not exists 'friends';
