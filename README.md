# FRLAttack

Database lap time komunitas untuk game **FR Legends**. Pemain mengirim screenshot best lap, moderator memverifikasinya, lalu waktu yang lolos masuk ke leaderboard tiap layout sirkuit.

Status: **Fase 1 (MVP, review manual)**. Verifikasi otomatis dari screenshot menyusul di Fase 2.

| Dokumen | Isi |
|---------|-----|
| [PLANNING.md](PLANNING.md) | Rencana proyek dan tahapan |
| [CLAUDE.md](CLAUDE.md) | Aturan proyek (wajib) |
| [docs/DESIGN.md](docs/DESIGN.md) | Arah desain |
| [docs/KATEGORI.md](docs/KATEGORI.md) | Struktur leaderboard |
| [docs/ATURAN.md](docs/ATURAN.md) | Aturan submission |
| [samples/README.md](samples/README.md) | Panduan sampel screenshot |
| [data/](data/) | Draf daftar sirkuit dan mobil |

## Teknologi

Next.js 16 (App Router) + Tailwind CSS 4, Supabase (Postgres, Auth, Storage), hosting Vercel.

## Struktur

```
src/app/            halaman dan server action
  sirkuit/          daftar sirkuit dan leaderboard per layout
  kirim/            form kirim lap time
  saya/ profil/     submission dan profil pemain yang login
  pemain/           profil publik
  mod/              antrian dan review moderator
  admin/            kelola sirkuit, layout, mobil, peran
  bukti/[id]/       signed URL screenshot (cek akses lewat RLS)
src/lib/            lap time, gambar, query, klien Supabase
supabase/migrations skema, RLS, fungsi leaderboard, bucket storage
supabase/seed.sql   data awal (draf, belum dicek di game)
supabase/tests/     uji akses database
```

## Cara kerja submission

1. Browser mengunggah screenshot ke `screenshots/incoming/<user_id>/` (RLS hanya mengizinkan folder milik sendiri).
2. Server action `createSubmission` mengunduh file itu, mengecek format dan resolusi, menghitung SHA-256 dan dHash, menolak screenshot yang sudah pernah dipakai, lalu memindahkannya ke `originals/` dan membuat versi WEBP di `previews/` (metadata EXIF dibuang).
3. Submission masuk dengan status `pending`. Moderator menerima atau menolak lewat fungsi database `review_submission`.
4. Leaderboard (`get_leaderboard`) mengambil waktu terbaik tiap pemain dari submission yang diterima.

Pengguna biasa tidak bisa menulis ke tabel `submissions` sama sekali; semua perubahan status lewat fungsi database yang mengecek peran.

## Menjalankan di lokal

```bash
npm install
cp .env.example .env.local   # isi dari dashboard Supabase
npm run dev
```

`NEXT_PUBLIC_*` ditanam ke kode browser saat build, jadi harus sudah diisi sebelum `npm run build`.

## Menyiapkan Supabase

1. Buat project Supabase.
2. Jalankan `supabase/migrations/20261003000000_init.sql` (SQL Editor, atau `supabase db push` dengan Supabase CLI).
3. Opsional: jalankan `supabase/seed.sql` untuk data awal sirkuit dan mobil. **Cek dulu nama-namanya di game.**
4. Authentication > Providers: aktifkan **Discord** dan **Google**.
5. Authentication > URL Configuration: tambahkan `https://<domain>/auth/callback` (dan `http://localhost:3000/auth/callback` untuk lokal) ke Redirect URLs.
6. Isi env di Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
7. Login sekali di situs, lalu jadikan akunmu admin lewat SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where username = '<username kamu>';
   ```
   Setelah itu peran lain bisa diatur dari halaman `/admin`.

## Pengecekan

```bash
npm run check   # cek dash, lint, typecheck, unit test, uji database
```

`npm run test:db` butuh binary Postgres (`initdb`, `pg_ctl`, `psql`), tidak butuh Docker.
