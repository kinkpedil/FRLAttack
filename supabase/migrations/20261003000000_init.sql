-- FRLAttack: skema awal (Fase 1, review manual)
--
-- Prinsip akses:
-- * Data referensi (sirkuit, layout, mobil, kategori) dan submission yang sudah
--   diterima bisa dibaca publik.
-- * Submission hanya dibuat oleh server (secret key) setelah file divalidasi,
--   jadi tidak ada policy INSERT untuk pengguna biasa.
-- * Perubahan status hanya lewat fungsi review_submission / withdraw_submission.

-- ---------------------------------------------------------------------------
-- Tipe
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('user', 'mod', 'admin');
create type public.submission_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.layout_type as enum ('time_attack', 'drift', 'other');
create type public.device_platform as enum ('android', 'ios');
create type public.control_type as enum ('buttons', 'tilt', 'other');

-- ---------------------------------------------------------------------------
-- Profil
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_.]{3,24}$'),
  ingame_name text
    check (ingame_name is null or char_length(ingame_name) between 1 and 32),
  country text
    check (country is null or country ~ '^[A-Z]{2}$'),
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Data referensi
-- ---------------------------------------------------------------------------

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  real_world_reference text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.track_layouts (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  type public.layout_type not null default 'time_attack',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (track_id, slug)
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

insert into public.categories (slug, name, description, sort_order)
values ('open', 'Open', 'Semua mobil, tuning bebas.', 0);

-- ---------------------------------------------------------------------------
-- Submission
-- ---------------------------------------------------------------------------

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  layout_id uuid not null references public.track_layouts (id) on delete restrict,
  car_id uuid not null references public.cars (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  time_ms integer not null check (time_ms between 1000 and 3600000),
  platform public.device_platform,
  control public.control_type,
  game_version text check (game_version is null or char_length(game_version) <= 20),
  video_url text check (video_url is null or video_url ~ '^https://'),
  original_path text not null,
  preview_path text not null,
  image_sha256 text not null check (image_sha256 ~ '^[0-9a-f]{64}$'),
  image_dhash bigint not null,
  image_width integer not null,
  image_height integer not null,
  status public.submission_status not null default 'pending',
  reject_reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'rejected' or reject_reason is not null)
);

-- Screenshot yang sama tidak boleh aktif di dua submission sekaligus.
-- Submission yang ditolak/ditarik tidak dihitung, supaya pemilik bisa
-- mengirim ulang screenshot yang sama setelah memperbaiki isian form.
create unique index submissions_active_sha256_key
  on public.submissions (image_sha256)
  where status in ('pending', 'approved');

create index submissions_board_idx
  on public.submissions (layout_id, category_id, time_ms, created_at)
  where status = 'approved';
create index submissions_user_idx on public.submissions (user_id, created_at desc);
create index submissions_pending_idx on public.submissions (created_at) where status = 'pending';
create index submissions_sha256_idx on public.submissions (image_sha256);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_target_idx on public.audit_log (target_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fungsi peran
-- ---------------------------------------------------------------------------

create function public.is_mod()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('mod', 'admin')
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Profil otomatis saat daftar
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  attempt integer := 0;
begin
  base := lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1)
  ));
  base := left(regexp_replace(coalesce(base, ''), '[^a-z0-9_.]', '', 'g'), 18);
  if char_length(base) < 3 then
    base := 'pembalap';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    attempt := attempt + 1;
    candidate := base || floor(random() * 10000)::int::text;
    if attempt > 20 then
      candidate := 'pembalap' || replace(left(new.id::text, 8), '-', '');
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, candidate, new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Perubahan status submission
-- ---------------------------------------------------------------------------

create function public.review_submission(
  p_submission_id uuid,
  p_decision public.submission_status,
  p_reason text default null
)
returns public.submissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.submission_status;
  result public.submissions;
begin
  if not public.is_mod() then
    raise exception 'Hanya moderator yang bisa mereview submission.' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Keputusan tidak valid.' using errcode = '22023';
  end if;

  if p_decision = 'rejected' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'Alasan penolakan wajib diisi.' using errcode = '22023';
  end if;

  select status into current_status
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission tidak ditemukan.' using errcode = 'P0002';
  end if;

  -- pending -> approved/rejected, approved -> rejected (misal setelah laporan).
  if not (
    current_status = 'pending'
    or (current_status = 'approved' and p_decision = 'rejected')
  ) then
    raise exception 'Status % tidak bisa diubah menjadi %.', current_status, p_decision
      using errcode = '22023';
  end if;

  update public.submissions
  set status = p_decision,
      reject_reason = case when p_decision = 'rejected' then btrim(p_reason) else null end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_submission_id
  returning * into result;

  insert into public.audit_log (actor_id, action, target_id, payload)
  values (
    auth.uid(),
    'submission.' || p_decision::text,
    p_submission_id,
    jsonb_build_object('from', current_status, 'reason', p_reason)
  );

  return result;
end;
$$;

create function public.withdraw_submission(p_submission_id uuid)
returns public.submissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.submissions;
begin
  update public.submissions
  set status = 'withdrawn'
  where id = p_submission_id
    and user_id = auth.uid()
    and status in ('pending', 'approved')
  returning * into result;

  if result.id is null then
    raise exception 'Submission tidak ditemukan atau tidak bisa ditarik.' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, target_id)
  values (auth.uid(), 'submission.withdrawn', p_submission_id);

  return result;
end;
$$;

create function public.set_user_role(p_username text, p_role public.user_role)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang bisa mengubah peran.' using errcode = '42501';
  end if;

  update public.profiles set role = p_role
  where username = lower(btrim(p_username))
  returning * into result;

  if result.id is null then
    raise exception 'Pengguna % tidak ditemukan.', p_username using errcode = 'P0002';
  end if;

  if result.id = auth.uid() and p_role <> 'admin' then
    raise exception 'Admin tidak bisa menurunkan perannya sendiri.' using errcode = '22023';
  end if;

  insert into public.audit_log (actor_id, action, target_id, payload)
  values (auth.uid(), 'profile.role', result.id, jsonb_build_object('role', p_role));

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboard
-- ---------------------------------------------------------------------------

-- Waktu terbaik tiap pemain di satu layout + kategori (opsional: satu mobil).
-- Urutan: waktu tercepat, lalu yang lebih dulu dikirim.
create function public.get_leaderboard(
  p_layout_id uuid,
  p_category_id uuid,
  p_car_id uuid default null,
  p_limit integer default 100
)
returns table (
  "position" integer,
  submission_id uuid,
  user_id uuid,
  username text,
  ingame_name text,
  country text,
  car_slug text,
  car_name text,
  time_ms integer,
  gap_ms integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (s.user_id) s.*
    from public.submissions s
    where s.layout_id = p_layout_id
      and s.category_id = p_category_id
      and s.status = 'approved'
      and (p_car_id is null or s.car_id = p_car_id)
    order by s.user_id, s.time_ms, s.created_at
  )
  select
    (row_number() over (order by b.time_ms, b.created_at))::integer,
    b.id,
    b.user_id,
    p.username,
    p.ingame_name,
    p.country,
    c.slug,
    c.name,
    b.time_ms,
    (b.time_ms - min(b.time_ms) over ())::integer,
    b.created_at
  from best b
  join public.profiles p on p.id = b.user_id
  join public.cars c on c.id = b.car_id
  order by b.time_ms, b.created_at
  limit greatest(1, least(p_limit, 500));
$$;

-- Ringkasan semua layout aktif: jumlah pemain dan rekor (kategori Open).
create function public.get_layout_overview()
returns table (
  track_id uuid,
  track_slug text,
  track_name text,
  layout_id uuid,
  layout_slug text,
  layout_name text,
  layout_type public.layout_type,
  driver_count integer,
  record_ms integer,
  record_username text,
  record_car_name text,
  record_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with open_cat as (
    select id from public.categories where slug = 'open'
  ),
  best as (
    select distinct on (s.layout_id, s.user_id) s.*
    from public.submissions s
    where s.status = 'approved'
      and s.category_id = (select id from open_cat)
    order by s.layout_id, s.user_id, s.time_ms, s.created_at
  ),
  ranked as (
    select b.*,
      row_number() over (partition by b.layout_id order by b.time_ms, b.created_at) as rn,
      count(*) over (partition by b.layout_id) as drivers
    from best b
  )
  select
    t.id, t.slug, t.name,
    l.id, l.slug, l.name, l.type,
    coalesce(r.drivers, 0)::integer,
    r.time_ms,
    p.username,
    c.name,
    r.created_at
  from public.track_layouts l
  join public.tracks t on t.id = l.track_id
  left join ranked r on r.layout_id = l.id and r.rn = 1
  left join public.profiles p on p.id = r.user_id
  left join public.cars c on c.id = r.car_id
  where l.is_active and t.is_active
  order by t.sort_order, t.name, l.sort_order, l.name;
$$;

-- PB seorang pemain di setiap layout + posisinya.
create function public.get_personal_bests(p_user_id uuid)
returns table (
  submission_id uuid,
  track_slug text,
  track_name text,
  layout_slug text,
  layout_name text,
  category_slug text,
  car_name text,
  time_ms integer,
  "position" integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (s.user_id, s.layout_id, s.category_id) s.*
    from public.submissions s
    where s.status = 'approved'
    order by s.user_id, s.layout_id, s.category_id, s.time_ms, s.created_at
  )
  select
    b.id, t.slug, t.name, l.slug, l.name, cat.slug, c.name, b.time_ms,
    (1 + (
      select count(*) from best o
      where o.layout_id = b.layout_id
        and o.category_id = b.category_id
        and (o.time_ms < b.time_ms or (o.time_ms = b.time_ms and o.created_at < b.created_at))
    ))::integer,
    b.created_at
  from best b
  join public.track_layouts l on l.id = b.layout_id
  join public.tracks t on t.id = l.track_id
  join public.categories cat on cat.id = b.category_id
  join public.cars c on c.id = b.car_id
  where b.user_id = p_user_id
  order by t.sort_order, t.name, l.sort_order, l.name;
$$;

-- Submission lain dengan gambar mirip (dHash). Hanya petunjuk untuk moderator:
-- layar hasil game punya tata letak yang sama, jadi kemiripan tinggi belum
-- tentu berarti gambar yang sama.
create function public.find_similar_submissions(p_submission_id uuid, p_max_distance integer default 6)
returns table (
  submission_id uuid,
  username text,
  status public.submission_status,
  time_ms integer,
  distance integer,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_mod() then
    raise exception 'Hanya moderator.' using errcode = '42501';
  end if;

  return query
  select o.id, p.username, o.status, o.time_ms,
    bit_count((o.image_dhash # s.image_dhash)::bit(64))::integer as dist,
    o.created_at
  from public.submissions s
  join public.submissions o on o.id <> s.id
  join public.profiles p on p.id = o.user_id
  where s.id = p_submission_id
    and bit_count((o.image_dhash # s.image_dhash)::bit(64)) <= p_max_distance
  order by dist, o.created_at
  limit 10;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.track_layouts enable row level security;
alter table public.cars enable row level security;
alter table public.categories enable row level security;
alter table public.submissions enable row level security;
alter table public.audit_log enable row level security;

create policy "profil bisa dibaca semua" on public.profiles
  for select using (true);
create policy "pengguna mengubah profil sendiri" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "sirkuit bisa dibaca" on public.tracks
  for select using (is_active or (select public.is_admin()));
create policy "admin mengelola sirkuit" on public.tracks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "layout bisa dibaca" on public.track_layouts
  for select using (is_active or (select public.is_admin()));
create policy "admin mengelola layout" on public.track_layouts
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "mobil bisa dibaca" on public.cars
  for select using (is_active or (select public.is_admin()));
create policy "admin mengelola mobil" on public.cars
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "kategori bisa dibaca" on public.categories
  for select using (is_active or (select public.is_admin()));
create policy "admin mengelola kategori" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "submission diterima publik, sisanya pemilik dan moderator" on public.submissions
  for select using (
    status = 'approved'
    or user_id = (select auth.uid())
    or (select public.is_mod())
  );

create policy "moderator membaca audit log" on public.audit_log
  for select to authenticated using ((select public.is_mod()));

-- ---------------------------------------------------------------------------
-- Hak akses (eksplisit, tidak bergantung pada default privileges)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.tracks, public.track_layouts, public.cars,
  public.categories, public.submissions to anon, authenticated;
grant select on public.audit_log to authenticated;
grant update (username, ingame_name, country) on public.profiles to authenticated;
grant insert, update, delete on public.tracks, public.track_layouts, public.cars,
  public.categories to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_mod(), public.is_admin() to anon, authenticated;
grant execute on function public.get_leaderboard(uuid, uuid, uuid, integer),
  public.get_layout_overview(),
  public.get_personal_bests(uuid) to anon, authenticated;
grant execute on function public.review_submission(uuid, public.submission_status, text),
  public.withdraw_submission(uuid),
  public.set_user_role(text, public.user_role),
  public.find_similar_submissions(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: screenshot
-- ---------------------------------------------------------------------------
-- incoming/<user_id>/<file>  : diunggah langsung oleh browser pemain
-- originals/<submission_id>.* : file asli, dipindah oleh server
-- previews/<submission_id>.webp : versi terkompresi untuk ditampilkan
-- Semua privat. Server membuat signed URL setelah mengecek hak akses.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('screenshots', 'screenshots', false, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "pemain mengunggah ke folder incoming sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = 'incoming'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
