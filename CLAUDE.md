# Aturan Proyek FRLAttack

Aturan ini wajib diikuti di semua pekerjaan pada repo ini (kode, dokumen, teks UI, commit message).

## 1. Tanpa em dash
- Jangan pernah memakai karakter em dash (U+2014) atau en dash (U+2013), di mana pun: teks UI, dokumen, komentar kode, commit message.
- Ganti dengan titik, koma, titik dua, kurung, atau kata ("sampai", "hingga").
- Rentang angka ditulis `30 sampai 50` atau `30-50` (tanda minus biasa).
- Cek sebelum commit: `scripts/check-no-dash.sh`.

## 2. Desain tidak boleh AI slop
Panduan lengkap: [docs/DESIGN.md](docs/DESIGN.md). Ringkasnya, yang **dilarang**:
- Gradien ungu/biru/pink, latar "mesh gradient", blob, glow, glassmorphism.
- Kartu membulat dengan bayangan lembut di mana-mana, grid 3 kolom fitur dengan ikon di atasnya.
- Hero raksasa dengan judul generik + dua tombol + ilustrasi abstrak.
- Emoji sebagai ikon, ikon "sparkle"/bintang AI, badge "AI-powered".
- Animasi fade-in saat scroll, angka yang "menghitung naik", efek parallax.
- Font default yang dipakai semua orang (Inter, Poppins, Montserrat) sebagai identitas utama.
- Copywriting kosong: "Rasakan pengalaman", "Revolusioner", "Unleash", "Elevate", "Seamless", "Next-level", "Tingkatkan permainanmu".

Prinsip yang **dipakai**: estetika lembar timing resmi balap (tabel padat, angka monospace, garis tipis), warna dipakai hanya untuk makna (rekor, PB, status), gambar asli dari game, teks singkat dan langsung.

## 3. Bahasa
- Teks UI dan dokumen: Bahasa Indonesia yang wajar, tidak kaku, tidak berlebihan.
- Istilah game tetap pakai istilah komunitas (lap time, best lap, PB, layout, TA).

## 4. Data lap time
- Simpan sebagai integer milidetik.
- Format tampilan mengikuti format di game (lihat docs/DESIGN.md bagian Angka).
