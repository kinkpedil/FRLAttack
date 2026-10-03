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

PSQL=("$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f supabase/tests/stubs.sql
for f in supabase/migrations/*.sql; do
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -o /dev/null -f supabase/tests/access.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
