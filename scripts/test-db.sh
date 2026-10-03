#!/usr/bin/env bash
# Menguji migrasi + aturan akses di cluster Postgres sementara.
# Butuh binary Postgres (initdb, pg_ctl, psql). Tidak butuh Docker atau Supabase CLI.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb 2>/dev/null || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
WORK="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  # initdb menolak berjalan sebagai root.
  chown -R nobody "$WORK" 2>/dev/null || true
  RUN_AS=(su -s /bin/sh nobody -c)
  run() { "${RUN_AS[@]}" "$*"; }
else
  run() { sh -c "$*"; }
fi

run "'$PG_BIN/initdb' -D '$WORK/data' -U postgres --auth=trust >/dev/null"
run "'$PG_BIN/pg_ctl' -D '$WORK/data' -o '-p $PORT -k $WORK -c listen_addresses=' -l '$WORK/log' start -w >/dev/null"

PSQL=("$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)

# Setiap file tes mendapat database baru: stub Supabase, migrasi, seed, helper.
for test in supabase/tests/*.sql; do
  case "$(basename "$test")" in stubs.sql|helpers.sql) continue ;; esac
  db="t_$(basename "$test" .sql)"
  "${PSQL[@]}" -d postgres -c "create database \"$db\"" >/dev/null
  "${PSQL[@]}" -d "$db" -f supabase/tests/stubs.sql
  for f in supabase/migrations/*.sql; do
    "${PSQL[@]}" -d "$db" -f "$f"
  done
  "${PSQL[@]}" -d "$db" -f supabase/seed.sql
  echo "== $(basename "$test")"
  cat supabase/tests/helpers.sql "$test" | "${PSQL[@]}" -d "$db" -o /dev/null 2>&1 | sed -E 's/^(psql:[^ ]* )?NOTICE:  /  /'
done
echo "Semua uji database lolos."
