# Usulan Struktur Leaderboard

Status: **usulan**, menunggu keputusan.

## Prinsip

Kategori yang dibuat hanya yang **bisa dibuktikan dari screenshot**. Jika suatu aturan tidak bisa dicek (misalnya "tanpa tuning mesin"), kategori itu akan diisi orang yang curang dan merugikan yang jujur.

## Usulan

### 1. Satu leaderboard per layout
Kunci utama leaderboard adalah **sirkuit + layout**. Contoh: `Gunsai TA` dan `Gunsai Drift` adalah dua leaderboard berbeda karena jalurnya beda.

Untuk FRLAttack, fokus awal di **layout TA (time attack)** karena memang dibuat untuk mengejar waktu. Layout drift bisa dibuka belakangan jika komunitas meminta.

### 2. Kategori utama: Open
Semua mobil, tuning bebas. Ini leaderboard yang tampil pertama.

### 3. Filter, bukan kategori terpisah
Data berikut **dicatat** di setiap submission dan bisa dipakai untuk menyaring tabel, tapi tidak membuat leaderboard terpisah:

| Data | Alasan dicatat | Bisa dicek dari screenshot? |
|------|----------------|-----------------------------|
| Mobil | Pemain ingin melihat "tercepat dengan AE86" | Tergantung apakah tampil di layar hasil |
| Platform (Android / iOS) | Statistik | Sebagian (rasio layar, status bar) |
| Kontrol (tombol / tilt) | Statistik | Tidak |
| Versi game | Waktu dari versi lama bisa ditandai | Tidak, kecuali tampil di layar |

Jika mobil ternyata tampil di layar hasil, filter per mobil bisa dinaikkan jadi leaderboard resmi per mobil.

### 4. Kategori yang **tidak** dibuat (untuk sekarang)
- **Stock / tanpa tuning**: tidak bisa dibuktikan dari satu screenshot.
- **Per kelas tenaga (HP)**: sama, tidak terlihat di layar hasil.

Bisa dipertimbangkan nanti dengan bukti video yang menampilkan layar tuning.

## Aturan urutan

1. Lap time tercepat (milidetik).
2. Jika sama persis, yang **lebih dulu** dikirim dan diterima berada di atas.

## Perubahan versi game

Jika update game mengubah sirkuit atau fisika secara besar, leaderboard layout tersebut **diarsipkan** (tetap bisa dilihat, diberi label versi) dan leaderboard baru dibuka. Keputusan ini diambil admin per kasus.

## Keputusan yang dibutuhkan

- [ ] Setuju fokus awal di layout TA saja?
- [ ] Setuju kategori utama Open + filter mobil?
- [ ] Platform dan kontrol cukup jadi data statistik?
