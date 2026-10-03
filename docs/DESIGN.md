# Arah Desain FRLAttack

## Konsep: lembar timing, bukan landing page

FRLAttack adalah **papan waktu**. Rujukan visualnya adalah lembar hasil resmi balapan yang dicetak di sirkuit Jepang, menara timing di siaran balap, dan papan pengumuman di pit. Isinya angka, nama, dan urutan. Desain yang bagus di sini adalah desain yang membuat tabel waktu enak dibaca, bukan yang terlihat "modern".

Pertanyaan uji untuk setiap halaman: *apakah ini masih terlihat benar jika dicetak di kertas A4 dan ditempel di dinding pit?* Kalau elemennya hanya masuk akal di layar (glow, blur, gradien), buang.

## Yang dilarang (daftar tolak)

Jika salah satu ini muncul di desain atau PR, tolak.

| Dilarang | Alasan |
|----------|--------|
| Gradien ungu/biru/pink, mesh gradient, blob, glow | Ciri paling umum web hasil generator |
| Glassmorphism, blur latar | Tidak ada hubungannya dengan balap |
| Kartu membulat besar (radius > 4px) dengan bayangan lembut | Membuat semua halaman terlihat seperti template SaaS |
| Grid "3 fitur" dengan ikon di atas judul | Template, tidak memberi informasi |
| Hero besar dengan slogan + 2 tombol | Pemain datang untuk melihat waktu, bukan slogan |
| Emoji sebagai ikon, ikon sparkle, badge "AI" | Murahan dan tidak relevan |
| Animasi fade/slide saat scroll, counter naik, parallax | Menghambat membaca data |
| Teks putih tipis di atas foto | Tidak terbaca di HP |
| Inter / Poppins / Montserrat sebagai font utama | Identitas generik |
| Kata: "Rasakan", "Revolusioner", "Unleash", "Elevate", "Seamless", "Next-level" | Copy kosong |
| Em dash dan en dash | Aturan proyek |

## Warna

Warna hanya dipakai untuk **makna**, mengikuti konvensi timing balap yang sudah dikenal pembalap:

| Token | Terang | Gelap | Makna |
|-------|--------|-------|-------|
| `--paper` | `#F1EFE9` | `#111111` | Latar halaman |
| `--ink` | `#151515` | `#ECEAE4` | Teks utama |
| `--ink-2` | `#5C5A55` | `#9A978F` | Teks sekunder, label |
| `--rule` | `#CFCBC2` | `#2B2B2B` | Garis tabel |
| `--row-alt` | `#E8E5DD` | `#181818` | Baris selang-seling |
| `--record` | `#7A2BC2` | `#B57BF0` | **Rekor sirkuit** (ungu, konvensi "fastest overall") |
| `--pb` | `#11703A` | `#3DCB6F` | **Personal best** (hijau, konvensi timing) |
| `--slower` | `#7F5C00` | `#E3B53A` | Lebih lambat dari PB |
| `--alert` | `#B3241A` | `#F0574B` | Ditolak, laporan, error |
| `--signal` | `#151515` | `#ECEAE4` | Tombol utama: hitam pekat (terang) / putih (gelap). Tanpa warna merek. |

Catatan: ungu di sini **bukan** dekorasi. Ia hanya muncul di satu tempat: angka rekor sirkuit. Tidak boleh dipakai untuk latar, tombol, atau gradien.

## Tipografi

| Peran | Font | Catatan |
|-------|------|---------|
| Judul, nama sirkuit | **IBM Plex Sans Condensed** (600/700), huruf kapital, `letter-spacing: 0.02em` | Padat seperti papan pengumuman |
| Teks biasa | **IBM Plex Sans** (400/500) | Jelas di layar kecil |
| Lap time, posisi, selisih | **IBM Plex Mono** (500) | Angka sejajar, `font-variant-numeric: tabular-nums` |

Ukuran (mobile dulu): body 15px, tabel 14px, lap time di tabel 15px mono, lap time rekor di halaman sirkuit 40px mono. Skala judul: 28 / 20 / 16.

## Angka

- Lap time disimpan dalam milidetik, ditampilkan **mengikuti format di layar game** supaya pemain langsung mengenali. Dugaan sementara dari referensi komunitas: `1'24"320`. **Konfirmasi dari sampel screenshot (Fase 0).**
- Selisih ke rekor: `+0.412` (mono, warna `--ink-2`).
- Posisi: `01`, `02`, ... rata kanan, mono.
- Tanggal: `03 OKT 2026`.

## Tata letak

- Lebar konten maks 960px. Mobile dulu, sebagian besar pemain FR Legends membuka dari HP.
- Grid 4px. Jarak antar bagian 32px, antar baris tabel 0 (garis 1px `--rule`).
- Radius: 0 untuk tabel dan panel, 2px untuk tombol dan input.
- Tanpa bayangan. Pemisah memakai garis 1px atau perubahan latar `--row-alt`.
- Header situs: satu baris tipis. Logo teks `FRLATTACK` (Plex Sans Condensed 700) + navigasi teks. Tanpa ikon hamburger mewah.

## Komponen inti

**Tabel leaderboard** (komponen terpenting)
```
POS  PEMAIN          MOBIL       LAP TIME    SELISIH   TGL
01   rizk_drift      AE86        1'24"320    ---       12 SEP
02   kansai.wall     S13         1'24"733    +0.413    28 AGU
03   ...
```
- Baris rekor: angka lap time berwarna `--record`.
- PB pemain yang sedang login: latar `--row-alt` + garis kiri 3px `--pb`.
- Ketuk baris: membuka screenshot bukti di panel bawah (mobile) atau samping (desktop).

**Kepala halaman sirkuit**
- Nama sirkuit besar kapital, nama layout di bawahnya.
- Garis bentuk lintasan (SVG outline 1.5px, warna `--ink`) di kanan.
- Rekor saat ini: angka mono 40px + nama pemegang + mobil.

**Status submission**: label teks kapital kecil dengan kotak garis, bukan "pill" berwarna penuh.
`[ MENUNGGU ]` `[ DITERIMA ]` `[ DITOLAK ]`

## Gambar

- Pakai **screenshot asli dari game** (bukti submission, sirkuit). Tidak ada ilustrasi abstrak, tidak ada gambar stok, tidak ada gambar buatan AI.
- Peta lintasan digambar sebagai garis SVG sederhana.

## Gerak

- Hanya untuk umpan balik: perubahan status submission, baris yang baru masuk disorot sebentar (latar `--row-alt` 1 detik).
- Tanpa animasi masuk halaman, tanpa animasi saat scroll.

## Penulisan

- Pendek dan langsung. Contoh: "Kirim lap time", bukan "Mulai perjalanan balapmu sekarang!".
- Pesan error menyebut masalah dan cara memperbaiki: "Lap time di screenshot terbaca 1'25"010, berbeda dari yang kamu isi (1'24"010). Periksa lagi angkanya."
- Di UI, verifikasi otomatis disebut "Dibaca otomatis", tidak perlu menonjolkan kata AI.

## Checklist review desain

- [ ] Tidak ada item dari daftar tolak
- [ ] Warna dipakai hanya untuk makna (rekor, PB, status)
- [ ] Semua angka waktu memakai font mono + tabular-nums
- [ ] Terbaca di layar 360px tanpa scroll horizontal pada halaman (tabel boleh scroll sendiri)
- [ ] Mode gelap dan terang sama-sama lolos kontras WCAG AA
- [ ] `scripts/check-no-dash.sh` lolos
