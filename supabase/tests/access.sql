-- Uji hak akses dan fungsi leaderboard. Dijalankan oleh scripts/test-db.sh.
\set ON_ERROR_STOP on
\set QUIET on

-- Supabase memberi service_role akses penuh; tiru di sini.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

create schema t;
grant usage on schema t to public;

create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'GAGAL: %', msg;
  end if;
  raise notice 'lolos: %', msg;
end $$;

create function t.fails(stmt text, expected_state text, msg text) returns void language plpgsql as $$
declare
  got text;
begin
  begin
    execute stmt;
  exception when others then
    got := sqlstate;
  end;
  if got is null then
    raise exception 'GAGAL: % (tidak ada error)', msg;
  end if;
  if expected_state is not null and got <> expected_state then
    raise exception 'GAGAL: % (sqlstate %, harusnya %)', msg, got, expected_state;
  end if;
  raise notice 'lolos: %', msg;
end $$;

grant execute on all functions in schema t to public;

-- Pengguna ----------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"user_name": "Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{"name": "Bob Kansai!"}'),
  ('00000000-0000-0000-0000-00000000000c', 'alice2@example.com', '{"user_name": "alice"}'),
  ('00000000-0000-0000-0000-0000000000dd', 'mod@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000ee', 'x@example.com', '{"user_name": "!!"}');

update public.profiles set role = 'mod' where id = '00000000-0000-0000-0000-0000000000dd';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000ee';

select t.ok((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'alice',
  'username dibuat dari user_name');
select t.ok((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'bobkansai',
  'karakter tidak valid dibuang dari username');
select t.ok((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000c') ~ '^alice[0-9]+$',
  'username bentrok diberi angka');
select t.ok((select username from public.profiles where id = '00000000-0000-0000-0000-0000000000ee') = 'pembalap',
  'username terlalu pendek diganti pembalap');

-- Submission dibuat server (service_role) -------------------------------------
set role service_role;

create temporary table ids as
select
  (select id from public.track_layouts where slug = 'ta' and track_id = (select id from public.tracks where slug = 'gunsai')) as layout,
  (select id from public.cars where slug = 'ae86') as ae86,
  (select id from public.cars where slug = 's13') as s13,
  (select id from public.categories where slug = 'open') as open;

insert into public.submissions
  (id, user_id, layout_id, car_id, category_id, time_ms, original_path, preview_path, image_sha256, image_dhash, image_width, image_height, created_at)
select v.id::uuid, v.user_id::uuid, ids.layout, case v.car when 'ae86' then ids.ae86 else ids.s13 end, ids.open,
  v.time_ms, 'originals/x.png', 'previews/x.webp', repeat(v.h, 64), v.dhash, 2400, 1080, v.created_at::timestamptz
from ids, (values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'ae86', 85000, 'a', 0, '2026-10-01'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 's13', 84500, 'b', 1, '2026-10-01'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 's13', 84320, 'c', 3, '2026-10-02'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000c', 'ae86', 84320, 'd', -1, '2026-10-03')
) as v(id, user_id, car, time_ms, h, dhash, created_at);

grant select on ids to public;
reset role;

-- Anonim ------------------------------------------------------------------------
set role anon;
select t.ok((select count(*) from public.submissions) = 0, 'anon tidak melihat submission pending');
select t.ok((select count(*) from public.profiles) = 5, 'anon bisa membaca profil');
select t.ok((select count(*) from public.tracks) = 10, 'anon bisa membaca sirkuit');
select t.fails($$select public.review_submission('10000000-0000-0000-0000-000000000001', 'approved')$$, '42501',
  'anon tidak bisa memanggil review_submission');
reset role;

-- Pemain biasa --------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);

select t.ok((select count(*) from public.submissions) = 2, 'pemain melihat submission pending miliknya saja');
select t.fails($$insert into public.submissions (user_id, layout_id, car_id, category_id, time_ms, original_path, preview_path, image_sha256, image_dhash, image_width, image_height)
  select '00000000-0000-0000-0000-00000000000a', layout, ae86, open, 1000, 'a', 'b', repeat('f', 64), 0, 1, 1 from ids$$,
  '42501', 'pemain tidak bisa insert submission langsung');
select t.fails($$update public.submissions set status = 'approved' where id = '10000000-0000-0000-0000-000000000001'$$,
  '42501', 'pemain tidak bisa mengubah status');
select t.fails($$select public.review_submission('10000000-0000-0000-0000-000000000001', 'approved')$$,
  '42501', 'pemain tidak bisa mereview');
select t.fails($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', 'pemain tidak bisa menaikkan perannya');
update public.profiles set ingame_name = 'Alice FR', country = 'ID' where id = '00000000-0000-0000-0000-00000000000a';
select t.ok((select ingame_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Alice FR',
  'pemain bisa mengubah profil sendiri');
update public.profiles set ingame_name = 'diretas' where id = '00000000-0000-0000-0000-00000000000b';
select t.ok((select ingame_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') is null,
  'pemain tidak bisa mengubah profil orang lain');
select t.fails($$insert into public.tracks (slug, name) values ('palsu', 'Palsu')$$, '42501',
  'pemain tidak bisa menambah sirkuit');
select t.fails($$select public.set_user_role('alice', 'admin')$$, '42501', 'pemain tidak bisa mengubah peran');
select t.fails($$select public.find_similar_submissions('10000000-0000-0000-0000-000000000001')$$, '42501',
  'pemain tidak bisa memakai find_similar_submissions');
select t.ok((select count(*) from public.audit_log) = 0, 'pemain tidak bisa membaca audit log');

insert into storage.objects (bucket_id, name) values ('screenshots', 'incoming/00000000-0000-0000-0000-00000000000a/a.png');
select t.ok(true, 'pemain bisa upload ke incoming/<id sendiri>/');
select t.fails($$insert into storage.objects (bucket_id, name) values ('screenshots', 'incoming/00000000-0000-0000-0000-00000000000b/a.png')$$,
  '42501', 'pemain tidak bisa upload ke folder orang lain');
select t.fails($$insert into storage.objects (bucket_id, name) values ('screenshots', 'originals/a.png')$$,
  '42501', 'pemain tidak bisa upload ke originals/');
reset role;

-- Moderator --------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000dd', false);

select t.ok((select count(*) from public.submissions) = 4, 'moderator melihat semua submission');
select t.fails($$select public.review_submission('10000000-0000-0000-0000-000000000002', 'rejected', '  ')$$,
  '22023', 'penolakan tanpa alasan ditolak');
select public.review_submission('10000000-0000-0000-0000-000000000001', 'approved');
select public.review_submission('10000000-0000-0000-0000-000000000002', 'approved');
select public.review_submission('10000000-0000-0000-0000-000000000003', 'approved');
select public.review_submission('10000000-0000-0000-0000-000000000004', 'approved');
select t.fails($$select public.review_submission('10000000-0000-0000-0000-000000000001', 'approved')$$,
  '22023', 'submission yang sudah diterima tidak bisa diterima ulang');
select t.ok((select count(*) from public.audit_log where action = 'submission.approved') = 4, 'review tercatat di audit log');
select t.ok((select count(*) from public.find_similar_submissions('10000000-0000-0000-0000-000000000001', 2)) = 2,
  'find_similar_submissions memakai jarak hamming');
select t.fails($$insert into public.tracks (slug, name) values ('palsu', 'Palsu')$$, '42501',
  'moderator tidak bisa menambah sirkuit');
reset role;

-- Leaderboard ---------------------------------------------------------------------------
set role anon;
select set_config('request.jwt.claim.sub', '', false);

select t.ok((select count(*) from public.get_leaderboard((select layout from ids), (select open from ids))) = 3,
  'leaderboard: satu baris per pemain');
select t.ok((select time_ms from public.get_leaderboard((select layout from ids), (select open from ids)) where username = 'alice') = 84320,
  'leaderboard memakai PB pemain');
select t.ok((select username from public.get_leaderboard((select layout from ids), (select open from ids)) where position = 1) = 'alice',
  'waktu sama: yang lebih dulu dikirim di atas');
select t.ok((select gap_ms from public.get_leaderboard((select layout from ids), (select open from ids)) where username = 'bobkansai') = 180,
  'selisih ke posisi 1 benar');
select t.ok((select count(*) from public.get_leaderboard((select layout from ids), (select open from ids), (select ae86 from ids))) = 2,
  'filter mobil');
select t.ok((select time_ms from public.get_leaderboard((select layout from ids), (select open from ids), (select ae86 from ids)) where username = 'alice') = 85000,
  'filter mobil memakai PB di mobil itu');
select t.ok((select record_ms from public.get_layout_overview() where layout_id = (select layout from ids)) = 84320,
  'overview: rekor layout');
select t.ok((select driver_count from public.get_layout_overview() where layout_id = (select layout from ids)) = 3,
  'overview: jumlah pemain');
select t.ok((select position from public.get_personal_bests('00000000-0000-0000-0000-00000000000c')) = 2,
  'personal best: posisi');
reset role;

-- Duplikat screenshot ---------------------------------------------------------------------
set role service_role;
select t.fails($$insert into public.submissions (user_id, layout_id, car_id, category_id, time_ms, original_path, preview_path, image_sha256, image_dhash, image_width, image_height)
  select '00000000-0000-0000-0000-00000000000b', layout, ae86, open, 90000, 'a', 'b', repeat('a', 64), 0, 1, 1 from ids$$,
  '23505', 'screenshot yang masih aktif tidak bisa dipakai lagi');
reset role;

-- Tarik submission ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select t.fails($$select public.withdraw_submission('10000000-0000-0000-0000-000000000003')$$, 'P0002',
  'tidak bisa menarik submission orang lain');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.withdraw_submission('10000000-0000-0000-0000-000000000003');
select t.ok((select time_ms from public.get_leaderboard((select layout from ids), (select open from ids)) where username = 'alice') = 85000,
  'setelah ditarik, leaderboard kembali ke PB sebelumnya');
reset role;

set role service_role;
insert into public.submissions (user_id, layout_id, car_id, category_id, time_ms, original_path, preview_path, image_sha256, image_dhash, image_width, image_height)
select '00000000-0000-0000-0000-00000000000a', layout, s13, open, 84320, 'a', 'b', repeat('c', 64), 0, 1, 1 from ids;
select t.ok(true, 'screenshot dari submission yang ditarik boleh dikirim ulang');
reset role;

-- Admin -------------------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ee', false);
insert into public.tracks (slug, name) values ('baru', 'Sirkuit Baru');
select t.ok(exists (select 1 from public.tracks where slug = 'baru'), 'admin bisa menambah sirkuit');
select public.set_user_role('alice', 'mod');
select t.ok((select role from public.profiles where username = 'alice') = 'mod', 'admin bisa mengubah peran');
select t.fails($$select public.set_user_role('pembalap', 'user')$$, '22023', 'admin tidak bisa menurunkan dirinya sendiri');
reset role;

\echo 'Semua uji database lolos.'
