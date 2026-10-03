-- Helper uji, dimuat sebelum setiap file tes.
\set ON_ERROR_STOP on

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
