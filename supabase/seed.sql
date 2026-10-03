-- Data awal untuk development lokal.
-- Diambil dari data/tracks.draft.json dan data/cars.draft.json yang BELUM dicek di game.
-- Di production, data ini dikelola lewat halaman /admin.

insert into public.tracks (slug, name, real_world_reference, sort_order) values
  ('gunsai', 'Gunsai', 'Gunsai Touge (Gunma Cycle Sports Center)', 10),
  ('iwd', 'IWD Speedway', 'Irwindale Speedway, California', 20),
  ('ebisu-minami', 'Ebisu Minami', 'Ebisu Circuit, South Course', 30),
  ('ebisu-touge', 'Ebisu Touge', 'Ebisu Circuit, Touge Course', 40),
  ('ebisu-school', 'Ebisu School', 'Ebisu Circuit, School Course', 50),
  ('meihan', 'Meihan', 'Meihan Sportsland, Nara', 60),
  ('hiroshima', 'Hiroshima', null, 70),
  ('grange', 'Grange', null, 80),
  ('usair', 'USAIR', null, 90),
  ('drift-park', 'Drift Park', null, 100);

insert into public.track_layouts (track_id, slug, name, type, sort_order)
select t.id, v.slug, v.name, v.type::public.layout_type, v.sort_order
from (values
  ('gunsai', 'ta', 'Gunsai TA', 'time_attack', 10),
  ('gunsai', 'drift', 'Gunsai Drift', 'drift', 20),
  ('iwd', 'ta', 'IWD TA', 'time_attack', 10),
  ('iwd', 'speedway', 'IWD Speedway', 'drift', 20),
  ('ebisu-minami', 'utama', 'Ebisu Minami', 'other', 10),
  ('ebisu-touge', 'utama', 'Ebisu Touge', 'other', 10),
  ('ebisu-school', 'utama', 'Ebisu School', 'other', 10),
  ('meihan', 'utama', 'Meihan', 'other', 10),
  ('hiroshima', 'utama', 'Hiroshima', 'other', 10),
  ('grange', 'utama', 'Grange', 'other', 10),
  ('usair', 'utama', 'USAIR', 'other', 10),
  ('drift-park', 'a', 'Drift Park A', 'drift', 10),
  ('drift-park', 'b', 'Drift Park B', 'drift', 20),
  ('drift-park', 'c', 'Drift Park C', 'drift', 30),
  ('drift-park', 'd', 'Drift Park D', 'drift', 40)
) as v(track_slug, slug, name, type, sort_order)
join public.tracks t on t.slug = v.track_slug;

insert into public.cars (slug, name, sort_order) values
  ('ae86', 'AE86', 10),
  ('s13', 'S13', 20),
  ('180sx', '180SX', 30),
  ('s14', 'S14', 40),
  ('s15', 'S15', 50),
  ('r32', 'R32', 60),
  ('gt86', 'GT86', 70),
  ('altezza', 'Altezza', 80),
  ('jzx100-mkii', 'JZX100 MKII', 90),
  ('jzx100-chaser', 'JZX100 Chaser', 100),
  ('rx7-fc', 'RX-7 FC', 110),
  ('e30', 'E30', 120);
