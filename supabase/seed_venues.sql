-- Lieux de démonstration.
--
-- Les noms sont inventés, et doivent le rester : un jeu de démo portant le nom
-- d'établissements réels finit tôt ou tard sur une capture d'écran envoyée à un
-- tiers — investisseur, partenaire de paiement, presse — et laisse croire à un
-- partenariat qui n'existe pas.
--
-- Rejouable sans risque (upsert sur le slug).
insert into venues (slug, name, city, type, latitude, longitude, verification_radius_m, checkin_duration_minutes, plan, cover_photo_url)
values
  ('hotel-des-colonnes', 'Hôtel des Colonnes', 'Rome', 'hotel', 41.9086, 12.4796, 100, 180, 'enterprise', 'https://images.unsplash.com/photo-1566073771259-6a8506099945'),
  ('maison-abel', 'Maison Abel', 'Paris', 'coworking', 48.8688, 2.3453, 80, 720, 'premium', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'),
  ('the-lantern-london', 'The Lantern', 'London', 'hotel', 51.5152, -0.1382, 100, 180, 'premium', 'https://images.unsplash.com/photo-1551632811-561732d1e306'),
  ('cap-helios-mykonos', 'Cap Hélios', 'Mykonos', 'beach_club', 37.3987, 25.3223, 150, 480, 'enterprise', 'https://images.unsplash.com/photo-1533105079780-92b9be482077')
on conflict (slug) do update set
  name = excluded.name, city = excluded.city, type = excluded.type,
  latitude = excluded.latitude, longitude = excluded.longitude,
  verification_radius_m = excluded.verification_radius_m,
  checkin_duration_minutes = excluded.checkin_duration_minutes,
  plan = excluded.plan, cover_photo_url = excluded.cover_photo_url;

insert into venue_zones (venue_id, name)
select v.id, z.name
from venues v
join (values
  ('hotel-des-colonnes', 'Lobby'), ('hotel-des-colonnes', 'Bar'), ('hotel-des-colonnes', 'Jardin'),
  ('maison-abel', 'Rooftop'), ('maison-abel', 'Bar'),
  ('the-lantern-london', 'Lobby'), ('the-lantern-london', 'Punch Room'),
  ('cap-helios-mykonos', 'Beach Deck'), ('cap-helios-mykonos', 'Sunset Bar')
) as z(slug, name) on z.slug = v.slug
on conflict do nothing;
