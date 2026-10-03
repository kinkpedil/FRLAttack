# Sampel Screenshot (Fase 0)

Kumpulan screenshot asli layar hasil lap FR Legends. Dipakai untuk:
1. Mengetahui apa saja yang tampil di layar hasil (lap time, sirkuit, mobil, nama pemain).
2. Menentukan format tampilan lap time di web.
3. Menguji akurasi pembacaan otomatis di Fase 2.

Target: **30 sampai 50 screenshot**.

## Yang dibutuhkan

Usahakan variasinya luas:

| Variasi | Contoh |
|---------|--------|
| Sirkuit dan layout | Minimal 1 screenshot per layout yang ada di `data/tracks.draft.json` |
| Mobil | Beberapa mobil berbeda |
| Perangkat | HP Android, iPhone, tablet |
| Rasio layar | 16:9, 19.5:9, 20:9, 4:3 (tablet) |
| Bahasa game | Inggris, dan bahasa lain jika ada |
| Mode | Time attack, dan mode lain yang menampilkan waktu lap |
| Kondisi | Screenshot normal, screenshot yang di-crop, screenshot dengan notifikasi HP menutupi sebagian layar |

Sertakan juga beberapa **contoh negatif** (diberi tanda di manifest): screenshot game lain, screenshot menu FR Legends yang bukan layar hasil, dan (jika sanggup) satu screenshot yang angkanya sengaja diedit. Ini untuk menguji apakah sistem bisa menolaknya.

## Cara menyimpan

1. Simpan file **asli** (jangan dikompres ulang lewat WhatsApp, kirim sebagai dokumen/file) ke `samples/screenshots/`.
2. Nama file: `NNN_<sirkuit>_<layout>.png`, misalnya `001_gunsai_ta.png`.
3. Isi satu baris per file di `samples/manifest.csv`.

## Kolom manifest

| Kolom | Isi |
|-------|-----|
| `file` | Nama file |
| `track` | Slug sirkuit (lihat `data/tracks.draft.json`) |
| `layout` | Slug layout |
| `car` | Slug mobil (lihat `data/cars.draft.json`) |
| `lap_time_on_screen` | Lap time **persis seperti tulisan di layar**, contoh `1'24"320` |
| `player_name_on_screen` | Nama pemain jika tampil, kosongkan jika tidak |
| `device` | Model HP |
| `os` | `android` / `ios` |
| `resolution` | Contoh `2400x1080` |
| `game_version` | Versi game (lihat menu pengaturan) |
| `game_language` | Bahasa game |
| `is_valid_result` | `yes` untuk layar hasil asli, `no` untuk contoh negatif |
| `notes` | Catatan bebas |

## Privasi

Folder ini masuk ke repo. Jika ada screenshot milik orang lain, minta izin dulu dan sensor informasi pribadi (notifikasi, nama kontak) sebelum disimpan.
