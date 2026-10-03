# Aturan Proyek FRLAttack

Aturan ini wajib diikuti di semua pekerjaan pada repo ini (kode, dokumen, teks UI, commit message).

## 1. Tanpa em dash
- Jangan pernah memakai karakter em dash (U+2014) atau en dash (U+2013), di mana pun: teks UI, dokumen, komentar kode, commit message.
- Ganti dengan titik, koma, titik dua, kurung, atau kata ("sampai", "hingga").
- Rentang angka ditulis `30 sampai 50` atau `30-50` (tanda minus biasa).
- Cek sebelum commit: `scripts/check-no-dash.sh`.
- Satu pengecualian: `AGENTS.md` ditulis otomatis oleh Next.js (`next dev`) dan memuat em dash dari teks mereka. Jangan diedit; Next.js akan menulisnya ulang, dan tanpa file itu Next.js menyisipkan teksnya ke CLAUDE.md ini.

## 2. Desain tidak boleh AI slop
Panduan lengkap: [docs/DESIGN.md](docs/DESIGN.md). Ringkasnya, yang **dilarang**:
- Gradien ungu/biru/pink, latar "mesh gradient", blob, glow, glassmorphism.
- Kartu membulat dengan bayangan lembut di mana-mana, grid 3 kolom fitur dengan ikon di atasnya.
- Hero raksasa dengan judul generik + dua tombol + ilustrasi abstrak.
- Emoji sebagai ikon, ikon "sparkle"/bintang AI, badge "AI-powered".
- Animasi fade-in saat scroll, angka yang "menghitung naik", efek parallax.
- Font default yang dipakai semua orang (Inter, Poppins, Montserrat) sebagai identitas utama.
- Copywriting kosong: "Rasakan pengalaman", "Revolusioner", "Unleash", "Elevate", "Seamless", "Next-level", "Tingkatkan permainanmu".

Prinsip yang **dipakai**: landing page di `/` dengan cuplikan data asli, halaman fitur masing-masing berbentuk dashboard liga balap gelap dengan rujukan Low Fuel Motorsport (sidebar, panel, tabel timing padat, angka monospace), warna dipakai hanya untuk makna (rekor, PB, status, divisi, aksi), gambar asli dari game, teks singkat dan langsung.

## 3. Bahasa
- Teks UI dan dokumen: Bahasa Indonesia yang wajar, tidak kaku, tidak berlebihan.
- Istilah game tetap pakai istilah komunitas (lap time, best lap, PB, layout, TA).

## 4. Next.js
Versi Next.js di repo ini (16) berbeda dari yang umum dikenal. Baca @AGENTS.md dan dokumentasi di `node_modules/next/dist/docs/` sebelum menulis kode Next.js. Contoh: middleware sekarang bernama `proxy.ts`, `params` dan `searchParams` berupa Promise.

## 5. Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Server development |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit test (Vitest) |
| `npm run test:db` | Uji migrasi + RLS di Postgres sementara |
| `npm run check` | Semua cek di atas + cek dash |

Jalankan `npm run check` sebelum commit.

## 6. Rating dan event
Rumus rating, ambang divisi, poin event, dan klasemen ada di [docs/RATING.md](docs/RATING.md) dan migrasi `20261003010000_rating_events.sql`. Ubah keduanya bersamaan, beserta halaman /aturan.

## 7. Data lap time
- Simpan sebagai integer milidetik.
- Format tampilan mengikuti format di game (lihat docs/DESIGN.md bagian Angka).
