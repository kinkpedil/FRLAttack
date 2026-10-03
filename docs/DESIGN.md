# Arah Desain FRLAttack

## Konsep: ruang kontrol balap

Rujukan: [Low Fuel Motorsport](https://lowfuelmotorsport.com/), platform liga sim racing. Nuansa yang diambil: **gelap, padat data, terasa seperti platform liga**, bukan landing page. Pemain membuka situs untuk melihat rating, posisi, event yang berjalan, dan lap time. Semua itu harus terlihat dalam satu kali lihat.

Isi tetap mengikuti tradisi timing balap: tabel padat, angka monospace, warna untuk makna. Yang berubah dari versi sebelumnya: latar gelap, tata letak dashboard dengan sidebar, dan panel.

Pertanyaan uji untuk setiap elemen: *apakah ini menyampaikan data, status, atau aksi?* Kalau hanya hiasan, buang.

## Yang dilarang (daftar tolak)

| Dilarang | Alasan |
|----------|--------|
| Gradien, mesh gradient, blob, glow, neon | Ciri paling umum web hasil generator |
| Glassmorphism, blur latar | Tidak ada hubungannya dengan balap |
| Radius besar (> 4px), bayangan lembut | Membuat semua halaman terlihat seperti template SaaS |
| Grid "3 fitur" dengan ikon di atas judul | Template, tidak memberi informasi |
| Hero dengan slogan + 2 tombol | Halaman depan adalah dashboard, bukan iklan |
| Emoji sebagai ikon, ikon sparkle, badge "AI" | Murahan dan tidak relevan |
| Animasi fade/slide saat scroll, counter naik, parallax | Menghambat membaca data |
| Inter / Poppins / Montserrat sebagai font utama | Identitas generik |
| Kata: "Rasakan", "Revolusioner", "Unleash", "Elevate", "Seamless", "Next-level" | Copy kosong |
| Em dash dan en dash | Aturan proyek |

## Warna

Hanya mode gelap. Warna dipakai untuk makna.

| Token | Nilai | Dipakai untuk |
|-------|-------|---------------|
| `--bg` | `#0E1013` | Latar halaman |
| `--panel` | `#15181D` | Panel dan sidebar |
| `--panel-2` | `#1B1F26` | Baris selang-seling, hover |
| `--rule` | `#2A2F38` | Garis tipis, batas panel |
| `--rule-strong` | `#3A414C` | Garis bawah kepala tabel |
| `--ink` | `#ECEEF1` | Teks utama |
| `--ink-2` | `#A2AAB5` | Teks sekunder, label |
| `--accent` | `#4CC2FF` | Aksi utama, status LIVE dan MENUNGGU, menu aktif |
| `--record` | `#C39BFF` | **Rekor** (ungu, konvensi timing "fastest overall") |
| `--pb` | `#3DD68C` | **Personal best**, status DITERIMA |
| `--alert` | `#FF6B5E` | Ditolak, error |

Semua warna teks di atas lolos WCAG AA (minimal 5.3:1) di `--bg`, `--panel`, dan `--panel-2`.

### Divisi

Divisi itu berurutan, jadi warnanya satu gradasi amber dari terang (Div 1) ke redup (Div 6), bukan warna acak. Badge selalu memuat teks divisinya, jadi warna hanya penguat. Palet sudah divalidasi sebagai ramp ordinal (satu hue, terang monoton, jarak antar langkah cukup).

| Divisi | Isi badge | Teks |
|--------|-----------|------|
| Div 1 | `#F7CF7E` | gelap `#0E1013` |
| Div 2 | `#E8B04F` | gelap |
| Div 3 | `#CF902F` | gelap |
| Div 4 | `#AD7220` | gelap |
| Div 5 | `#8A5918` | terang `#ECEEF1` |
| Div 6 | `#6B4413` | terang |
| Rookie | tanpa isi, garis `--ink-2` | `--ink` |

## Tipografi

| Peran | Font | Catatan |
|-------|------|---------|
| Judul, label | **IBM Plex Sans Condensed** 600/700, kapital | Padat, seperti papan informasi |
| Teks biasa | **IBM Plex Sans** 400/500 | |
| Lap time, posisi, selisih di tabel | **IBM Plex Mono** 500, `tabular-nums` | Angka sejajar dalam kolom |
| Angka besar (rating, stat) | **IBM Plex Sans** 600, angka proporsional | Angka besar terlihat renggang jika tabular |

Lap time besar (rekor di kepala halaman) tetap mono karena dibandingkan dengan tabel di bawahnya.

## Tata letak

- **Desktop (lebar 1024px ke atas):** sidebar kiri 232px berisi logo, menu, tombol Kirim lap time, dan pengguna. Konten maksimal 1120px.
- **HP:** bilah atas berisi logo, tombol Kirim, dan tombol Menu yang membuka daftar menu. Tanpa sidebar.
- **Panel:** latar `--panel`, garis 1px `--rule`, radius 4px, tanpa bayangan. Kepala panel berisi label kapital kecil dan tautan "Lihat semua" bila perlu.
- Grid 4px. Jarak antar panel 16px (HP) atau 20px (desktop).

## Komponen

- **Tabel timing:** sama seperti sebelumnya. Kepala kolom label kapital, baris selang-seling `--panel-2`, angka mono rata kanan. Baris milik pemain yang login diberi garis kiri 3px `--pb`.
- **Badge divisi:** kotak kecil radius 2px, teks kapital `DIV 1`, `ROOKIE`.
- **Stat tile:** label kecil, angka besar sans semibold, keterangan opsional. Dipakai untuk rating, posisi, jumlah lap.
- **Status:** label kapital dalam kotak garis: `MENUNGGU` (accent), `DITERIMA` (pb), `DITOLAK` (alert), `DITARIK` (ink-2). Event: `LIVE` (accent, isi penuh), `SEGERA`, `SELESAI`.
- **Grafik riwayat rating:** satu seri, garis 2px warna accent, area tipis 10%, garis bantu 1px `--rule`, titik akhir 8px dengan ring warna panel, crosshair + tooltip saat hover, nilai terakhir ditulis di ujung. Tabel datanya bisa dibuka.

## Angka

- Lap time: format layar game, dugaan sementara `1'24"320` (konfirmasi dari sampel Fase 0).
- Selisih: `+0.412`. Posisi: `01`. Rating: `2.150` tanpa desimal, pemisah ribuan titik.
- Tanggal: `03 OKT 2026`, waktu WIB.

## Gerak

Hanya untuk umpan balik: hover baris, perubahan status, hitung mundur event. Tanpa animasi masuk halaman atau saat scroll.

## Penulisan

Pendek dan langsung. "Kirim lap time", bukan "Mulai perjalanan balapmu!". Pesan error menyebut masalah dan cara memperbaiki.

## Checklist review desain

- [ ] Tidak ada item dari daftar tolak
- [ ] Warna hanya untuk makna (rekor, PB, status, divisi, aksi)
- [ ] Angka di kolom memakai mono + tabular-nums
- [ ] Terbaca di layar 360px tanpa scroll horizontal pada halaman (tabel boleh scroll sendiri)
- [ ] Kontras lolos WCAG AA
- [ ] `scripts/check-no-dash.sh` lolos
