-- Uji rating, divisi, event, klasemen, dan statistik (docs/RATING.md).

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'u1@x', '{"user_name": "satu"}'),
  ('00000000-0000-0000-0000-000000000002', 'u2@x', '{"user_name": "dua"}'),
  ('00000000-0000-0000-0000-000000000003', 'u3@x', '{"user_name": "tiga"}'),
  ('00000000-0000-0000-0000-000000000004', 'u4@x', '{"user_name": "empat"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'ad@x', '{"user_name": "admin"}');
update public.profiles set role = 'admin' where username = 'admin';

create temporary table l as
select
  (select tl.id from public.track_layouts tl join public.tracks t on t.id = tl.track_id where t.slug = 'gunsai' and tl.slug = 'ta') as a,
  (select tl.id from public.track_layouts tl join public.tracks t on t.id = tl.track_id where t.slug = 'iwd' and tl.slug = 'ta') as b,
  (select tl.id from public.track_layouts tl join public.tracks t on t.id = tl.track_id where t.slug = 'ebisu-minami') as c,
  (select tl.id from public.track_layouts tl join public.tracks t on t.id = tl.track_id where t.slug = 'meihan') as d,
  (select id from public.cars where slug = 'ae86') as ae86,
  (select id from public.cars where slug = 's13') as s13,
  (select id from public.categories where slug = 'open') as open;
grant select on l to public;

-- Semua masuk sebagai pending, lalu diterima sekaligus (memicu potret rating).
insert into public.submissions
  (user_id, layout_id, car_id, category_id, time_ms, original_path, preview_path, image_sha256, image_dhash, image_width, image_height, created_at)
select v.u::uuid,
  case v.lay when 'a' then l.a when 'b' then l.b when 'c' then l.c else l.d end,
  case v.car when 'ae86' then l.ae86 else l.s13 end,
  l.open, v.ms, 'o', 'p', md5(v.u || v.lay || v.ms || v.car) || md5(v.ms::text || v.u), 0, 2400, 1080,
  now() - make_interval(days => v.days_ago)
from l, (values
  -- Layout A: rekor 80000, 4 pemain
  ('00000000-0000-0000-0000-000000000001', 'a', 'ae86', 80000, 10),
  ('00000000-0000-0000-0000-000000000001', 'a', 'ae86', 80500, 1),
  ('00000000-0000-0000-0000-000000000002', 'a', 's13', 80800, 1),
  ('00000000-0000-0000-0000-000000000003', 'a', 'ae86', 82800, 1),
  ('00000000-0000-0000-0000-000000000004', 'a', 'ae86', 86000, 40),
  -- Layout B: rekor 50000, 3 pemain
  ('00000000-0000-0000-0000-000000000001', 'b', 'ae86', 50000, 10),
  ('00000000-0000-0000-0000-000000000002', 'b', 's13', 50000, 9),
  ('00000000-0000-0000-0000-000000000003', 'b', 'ae86', 51750, 10),
  -- Layout C: hanya 2 pemain, belum dihitung
  ('00000000-0000-0000-0000-000000000001', 'c', 'ae86', 70000, 5),
  ('00000000-0000-0000-0000-000000000002', 'c', 's13', 71400, 5),
  -- Layout D: 1 pemain
  ('00000000-0000-0000-0000-000000000001', 'd', 'ae86', 60000, 5)
) as v(u, lay, car, ms, days_ago);

update public.submissions set status = 'approved' where status = 'pending';

-- Skor dan rating ------------------------------------------------------------
set role anon;

select t.ok(public.layout_score(80000, 80000) = 1000, 'skor rekor = 1000');
select t.ok(public.layout_score(80800, 80000) = 857, 'skor 101% = 857');
select t.ok(public.layout_score(82800, 80000) = 500, 'skor 103.5% = 500');
select t.ok(public.layout_score(85600, 80000) = 0, 'skor 107% = 0');
select t.ok(public.layout_score(90000, 80000) = 0, 'skor tidak pernah negatif');

select t.ok(public.division_for(3000, 5) = 'div1', 'divisi 1 mulai 3000');
select t.ok(public.division_for(2999, 5) = 'div2', 'divisi 2 di bawah 3000');
select t.ok(public.division_for(1399, 5) = 'div6', 'divisi 6 di bawah 1400');
select t.ok(public.division_for(3500, 2) = 'rookie', 'kurang dari 3 layout = rookie');

select t.ok((select score from public.get_driver_layout_scores('00000000-0000-0000-0000-000000000001') s
  join l on s.layout_id = l.c) is null, 'layout dengan 2 pemain belum dihitung');

select t.ok((select rating from public.get_driver_ratings() where username = 'satu') = 2000, 'rating satu = 1000 + (1000 + 1000)/2');
select t.ok((select rating from public.get_driver_ratings() where username = 'dua') = 1929, 'rating dua = 1000 + (857 + 1000)/2');
select t.ok((select rating from public.get_driver_ratings() where username = 'tiga') = 1500, 'rating tiga = 1000 + (500 + 500)/2');
select t.ok((select rating from public.get_driver_ratings() where username = 'empat') = 1000, 'rating empat = 1000');
select t.ok((select division from public.get_driver_ratings() where username = 'satu') = 'div4', 'satu di div4');
select t.ok((select division from public.get_driver_ratings() where username = 'tiga') = 'rookie', 'tiga masih rookie (2 layout)');
select t.ok((select string_agg(username, ',' order by position) from public.get_driver_ratings()) = 'satu,dua,tiga,empat',
  'urutan rating');
select t.ok((select layouts_driven || '/' || layouts_counted from public.get_driver_ratings() where username = 'satu') = '4/2',
  'layout dijalani vs dihitung');

-- Potret rating ------------------------------------------------------------------
select t.ok((select count(*) from public.rating_snapshots) = 4, 'potret rating dibuat saat status berubah');
select t.ok((select rating from public.rating_snapshots s join public.profiles p on p.id = s.user_id where p.username = 'dua') = 1929,
  'potret menyimpan rating');
select t.fails('select public.take_rating_snapshot()', '42501', 'anon tidak bisa memanggil take_rating_snapshot');
select t.fails($$insert into public.events (slug, name, layout_id, starts_at, ends_at) select 'x', 'x', a, now(), now() + interval '1 day' from l$$,
  '42501', 'anon tidak bisa membuat event');
reset role;

-- Event --------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', false);

insert into public.seasons (slug, name, starts_on, ends_on) values ('musim-1', 'Musim 1', current_date - 30, current_date + 60);
insert into public.events (season_id, slug, name, layout_id, car_id, starts_at, ends_at)
select (select id from public.seasons where slug = 'musim-1'), v.slug, v.name,
  case v.lay when 'a' then l.a else l.b end,
  case when v.car = 'ae86' then l.ae86 end,
  now() + make_interval(days => v.start_days), now() + make_interval(days => v.end_days)
from l, (values
  ('minggu-2', 'Minggu 2: Gunsai TA', 'a', null, -3, 4),
  ('minggu-1', 'Minggu 1: IWD TA (AE86)', 'b', 'ae86', -14, -7),
  ('minggu-3', 'Minggu 3: Gunsai TA', 'a', null, 7, 14)
) as v(slug, name, lay, car, start_days, end_days);
select t.ok((select count(*) from public.events) = 3, 'admin bisa membuat musim dan event');
reset role;

set role anon;
select set_config('request.jwt.claim.sub', '', false);

select t.ok(public.event_points(1) = 50 and public.event_points(2) = 45 and public.event_points(5) = 36
  and public.event_points(6) = 35 and public.event_points(40) = 1 and public.event_points(100) = 1, 'tabel poin');

select t.ok((select string_agg(username || ':' || time_ms || ':' || points, ',' order by position)
  from public.get_event_results((select id from public.events where slug = 'minggu-2'))) = 'satu:80500:50,dua:80800:45,tiga:82800:41',
  'event berjalan: hanya kiriman dalam periode, PB lama di luar periode tidak dihitung');
select t.ok((select gap_ms from public.get_event_results((select id from public.events where slug = 'minggu-2')) where username = 'dua') = 300,
  'selisih di event');
select t.ok((select string_agg(username || ':' || points, ',' order by position)
  from public.get_event_results((select id from public.events where slug = 'minggu-1'))) = 'satu:50,tiga:45',
  'event dengan mobil wajib hanya menghitung mobil itu');

select t.ok((select string_agg(slug || ':' || status || ':' || participant_count, ',' order by starts_at) from public.get_events()) =
  'minggu-1:finished:2,minggu-2:live:3,minggu-3:upcoming:0', 'status dan jumlah peserta event');
select t.ok((select leader_username from public.get_events() where slug = 'minggu-2') = 'satu', 'pemimpin event');

select t.ok((select string_agg(username || ':' || points || ':' || wins, ',' order by position)
  from public.get_season_standings((select id from public.seasons where slug = 'musim-1'))) = 'satu:100:2,tiga:86:0,dua:45:0',
  'klasemen musim: jumlah poin, event mendatang tidak dihitung');

-- Statistik ----------------------------------------------------------------------
select t.ok((select drivers || '/' || approved_laps || '/' || layouts_with_records || '/' || events_held from public.get_site_stats()) = '4/11/4/2',
  'statistik situs');
select t.ok((select username || ':' || lap_count from public.get_most_active(30, 1)) = 'satu:5', 'pembalap paling aktif 30 hari');
select t.ok((select count(*) from public.get_most_active(30, 10) where username = 'empat') = 0, 'kiriman lebih dari 30 hari tidak dihitung');
select t.ok((select car_slug || ':' || driver_count || ':' || lap_count from public.get_car_usage() limit 1) = 'ae86:3:8', 'pemakaian mobil');
reset role;

-- Layout nonaktif tidak dihitung --------------------------------------------------
update public.track_layouts set is_active = false where id = (select d from l);
set role anon;
select t.ok((select layouts_driven from public.get_driver_ratings() where username = 'satu') = 3, 'layout nonaktif tidak dihitung');
reset role;

-- Menarik submission memperbarui potret --------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select public.withdraw_submission(id) from public.submissions where user_id = '00000000-0000-0000-0000-000000000002' and layout_id = (select b from l);
reset role;
select t.ok((select rating from public.rating_snapshots s join public.profiles p on p.id = s.user_id where p.username = 'dua') = 1429,
  'potret diperbarui setelah submission ditarik (1000 + 857/2)');
