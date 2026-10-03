#!/usr/bin/env bash
# Gagal jika ada em dash (U+2014) atau en dash (U+2013) di file yang dilacak git.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
EM=$(printf '\xe2\x80\x94')
EN=$(printf '\xe2\x80\x93')
git grep -nI -F -e "$EM" -e "$EN" -- .
status=$?
if [ "$status" -eq 0 ]; then
  echo "Ditemukan em dash / en dash. Ganti dengan tanda baca lain." >&2
  exit 1
elif [ "$status" -ne 1 ]; then
  echo "Pengecekan gagal dijalankan (git grep exit $status)." >&2
  exit "$status"
fi
echo "OK: tidak ada em dash / en dash."
