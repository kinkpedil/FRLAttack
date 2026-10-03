-- FRLAttack: rating, divisi, event mingguan, musim, statistik.
-- Aturan dan angka dijelaskan di docs/RATING.md. Ubah keduanya bersamaan.

-- ---------------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------------

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 1 and 80),
  layout_id uuid not null references public.track_layouts (id) on delete restrict,
  car_id uuid references public.cars (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index events_time_idx on public.events (starts_at, ends_at);
create index events_season_idx on public.events (season_id);

create table public.rating_snapshots (
  user_id uuid not null references public.profiles (id) on delete cascade,
  taken_on date not null,
  rating integer not null,
  division text not null,
  primary key (user_id, taken_on)
);

-- ---------------------------------------------------------------------------
-- Rating
-- ---------------------------------------------------------------------------

-- Skor satu layout: 1000 untuk rekor, 0 untuk 107% rekor atau lebih lambat.
create function public.layout_score(p_time_ms integer, p_record_ms integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(0, round(1000 * (1 - ((p_time_ms::numeric / p_record_ms) - 1) / 0.07)))::integer;
$$;

create function public.division_for(p_rating integer, p_layouts integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_layouts < 3 then 'rookie'
    when p_rating >= 3000 then 'div1'
    when p_rating >= 2600 then 'div2'
    when p_rating >= 2200 then 'div3'
    when p_rating >= 1800 then 'div4'
    when p_rating >= 1400 then 'div5'
    else 'div6'
  end;
$$;

-- PB tiap pemain di setiap layout aktif, beserta skornya.
-- score null jika layout belum punya minimal 3 pemain.
create function public.get_driver_layout_scores(p_user_id uuid default null)
returns table (
  user_id uuid,
  layout_id uuid,
  time_ms integer,
  record_ms integer,
  driver_count integer,
  score integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (s.user_id, s.layout_id) s.user_id, s.layout_id, s.time_ms
    from public.submissions s
    join public.categories cat on cat.id = s.category_id and cat.slug = 'open'
    join public.track_layouts l on l.id = s.layout_id and l.is_active
    join public.tracks t on t.id = l.track_id and t.is_active
    where s.status = 'approved'
    order by s.user_id, s.layout_id, s.time_ms, s.created_at
  ),
  layouts as (
    select b.layout_id, min(b.time_ms) as record_ms, count(*)::integer as drivers
    from best b
    group by b.layout_id
  )
  select
    b.user_id,
    b.layout_id,
    b.time_ms,
    l.record_ms,
    l.drivers,
    case when l.drivers >= 3 then public.layout_score(b.time_ms, l.record_ms) end
  from best b
  join layouts l on l.layout_id = b.layout_id
  where p_user_id is null or b.user_id = p_user_id;
$$;

-- Rating semua pemain: 1000 + (jumlah 5 skor layout terbaik) / 2.
create function public.get_driver_ratings()
returns table (
  "position" integer,
  user_id uuid,
  username text,
  country text,
  rating integer,
  division text,
  layouts_driven integer,
  layouts_counted integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with scores as (
    select s.*, row_number() over (partition by s.user_id order by s.score desc nulls last) as rn
    from public.get_driver_layout_scores() s
  ),
  per_user as (
    select
      s.user_id,
      count(*)::integer as driven,
      count(s.score)::integer as counted,
      coalesce(sum(s.score) filter (where s.rn <= 5), 0) as top5
    from scores s
    group by s.user_id
  ),
  rated as (
    select u.*, (1000 + round(u.top5 / 2.0))::integer as rating
    from per_user u
  )
  select
    (row_number() over (order by r.rating desc, r.counted desc, p.username))::integer,
    r.user_id,
    p.username,
    p.country,
    r.rating,
    public.division_for(r.rating, r.driven),
    r.driven,
    r.counted
  from rated r
  join public.profiles p on p.id = r.user_id
  order by 1;
$$;

-- Potret rating hari ini (WIB) untuk semua pemain.
create function public.take_rating_snapshot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  insert into public.rating_snapshots (user_id, taken_on, rating, division)
  select r.user_id, today, r.rating, r.division
  from public.get_driver_ratings() r
  on conflict (user_id, taken_on) do update
    set rating = excluded.rating, division = excluded.division;

  -- Pemain yang tidak lagi punya lap time diterima.
  delete from public.rating_snapshots rs
  where rs.taken_on = today
    and not exists (select 1 from public.get_driver_ratings() r where r.user_id = rs.user_id);
end;
$$;

create function public.on_submission_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.take_rating_snapshot();
  return null;
end;
$$;

create trigger submissions_rating_snapshot
  after update of status on public.submissions
  for each statement execute function public.on_submission_status_change();

-- ---------------------------------------------------------------------------
-- Event dan musim
-- ---------------------------------------------------------------------------

create function public.event_points(p_position integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_position
    when 1 then 50
    when 2 then 45
    when 3 then 41
    when 4 then 38
    when 5 then 36
    else greatest(1, 36 - (p_position - 5))
  end;
$$;

-- Hasil event: waktu terbaik tiap pemain yang dikirim selama periode event.
create function public.get_event_results(p_event_id uuid)
returns table (
  "position" integer,
  submission_id uuid,
  user_id uuid,
  username text,
  country text,
  car_name text,
  time_ms integer,
  gap_ms integer,
  points integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ev as (
    select * from public.events where id = p_event_id
  ),
  best as (
    select distinct on (s.user_id) s.*
    from public.submissions s
    cross join ev
    where s.layout_id = ev.layout_id
      and s.status = 'approved'
      and s.category_id = (select id from public.categories where slug = 'open')
      and (ev.car_id is null or s.car_id = ev.car_id)
      and s.created_at >= ev.starts_at
      and s.created_at < ev.ends_at
    order by s.user_id, s.time_ms, s.created_at
  ),
  ranked as (
    select b.*,
      (row_number() over (order by b.time_ms, b.created_at))::integer as pos,
      min(b.time_ms) over () as best_ms
    from best b
  )
  select
    r.pos,
    r.id,
    r.user_id,
    p.username,
    p.country,
    c.name,
    r.time_ms,
    (r.time_ms - r.best_ms)::integer,
    public.event_points(r.pos),
    r.created_at
  from ranked r
  join public.profiles p on p.id = r.user_id
  join public.cars c on c.id = r.car_id
  order by r.pos;
$$;

create function public.get_events(p_season_id uuid default null)
returns table (
  id uuid,
  slug text,
  name text,
  season_id uuid,
  season_name text,
  track_slug text,
  track_name text,
  layout_slug text,
  layout_name text,
  car_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  participant_count integer,
  leader_username text,
  leader_time_ms integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id, e.slug, e.name, e.season_id, se.name,
    t.slug, t.name, l.slug, l.name, c.name,
    e.starts_at, e.ends_at,
    case
      when now() < e.starts_at then 'upcoming'
      when now() >= e.ends_at then 'finished'
      else 'live'
    end,
    coalesce(res.cnt, 0),
    res.leader,
    res.leader_ms
  from public.events e
  join public.track_layouts l on l.id = e.layout_id
  join public.tracks t on t.id = l.track_id
  left join public.seasons se on se.id = e.season_id
  left join public.cars c on c.id = e.car_id
  left join lateral (
    select
      count(*)::integer as cnt,
      min(r.username) filter (where r.position = 1) as leader,
      min(r.time_ms) as leader_ms
    from public.get_event_results(e.id) r
  ) res on true
  where p_season_id is null or e.season_id = p_season_id
  order by e.starts_at desc;
$$;

create function public.get_season_standings(p_season_id uuid)
returns table (
  "position" integer,
  user_id uuid,
  username text,
  country text,
  points integer,
  events_entered integer,
  wins integer,
  best_finish integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ev as (
    select e.id from public.events e
    where e.season_id = p_season_id and e.starts_at <= now()
  ),
  res as (
    select r.* from ev cross join lateral public.get_event_results(ev.id) r
  )
  select
    (row_number() over (
      order by sum(res.points) desc,
        count(*) filter (where res.position = 1) desc,
        min(res.position),
        res.username
    ))::integer,
    res.user_id,
    res.username,
    res.country,
    sum(res.points)::integer,
    count(*)::integer,
    (count(*) filter (where res.position = 1))::integer,
    min(res.position)::integer
  from res
  group by res.user_id, res.username, res.country
  order by 1;
$$;

-- ---------------------------------------------------------------------------
-- Statistik
-- ---------------------------------------------------------------------------

create function public.get_site_stats()
returns table (drivers integer, approved_laps integer, layouts_with_records integer, events_held integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(distinct s.user_id) from public.submissions s where s.status = 'approved')::integer,
    (select count(*) from public.submissions s where s.status = 'approved')::integer,
    (select count(distinct s.layout_id) from public.submissions s where s.status = 'approved')::integer,
    (select count(*) from public.events e where e.starts_at <= now())::integer;
$$;

create function public.get_most_active(p_days integer default 30, p_limit integer default 10)
returns table (username text, country text, lap_count integer, layout_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.username, p.country, count(*)::integer, count(distinct s.layout_id)::integer
  from public.submissions s
  join public.profiles p on p.id = s.user_id
  where s.status = 'approved'
    and s.created_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))
  group by p.username, p.country
  order by 3 desc, 4 desc, p.username
  limit greatest(1, least(p_limit, 50));
$$;

create function public.get_car_usage()
returns table (car_slug text, car_name text, driver_count integer, lap_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.slug, c.name, count(distinct s.user_id)::integer, count(*)::integer
  from public.submissions s
  join public.cars c on c.id = s.car_id
  where s.status = 'approved'
  group by c.slug, c.name
  order by 4 desc, 3 desc, c.name;
$$;

-- ---------------------------------------------------------------------------
-- Akses
-- ---------------------------------------------------------------------------

alter table public.seasons enable row level security;
alter table public.events enable row level security;
alter table public.rating_snapshots enable row level security;

create policy "musim bisa dibaca" on public.seasons for select using (true);
create policy "admin mengelola musim" on public.seasons
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "event bisa dibaca" on public.events for select using (true);
create policy "admin mengelola event" on public.events
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "riwayat rating bisa dibaca" on public.rating_snapshots for select using (true);

revoke all on public.seasons, public.events, public.rating_snapshots from anon, authenticated;
grant select on public.seasons, public.events, public.rating_snapshots to anon, authenticated;
grant insert, update, delete on public.seasons, public.events to authenticated;

revoke execute on function
  public.layout_score(integer, integer),
  public.division_for(integer, integer),
  public.get_driver_layout_scores(uuid),
  public.get_driver_ratings(),
  public.take_rating_snapshot(),
  public.on_submission_status_change(),
  public.event_points(integer),
  public.get_event_results(uuid),
  public.get_events(uuid),
  public.get_season_standings(uuid),
  public.get_site_stats(),
  public.get_most_active(integer, integer),
  public.get_car_usage()
from public, anon, authenticated;

grant execute on function
  public.layout_score(integer, integer),
  public.division_for(integer, integer),
  public.get_driver_layout_scores(uuid),
  public.get_driver_ratings(),
  public.event_points(integer),
  public.get_event_results(uuid),
  public.get_events(uuid),
  public.get_season_standings(uuid),
  public.get_site_stats(),
  public.get_most_active(integer, integer),
  public.get_car_usage()
to anon, authenticated;
