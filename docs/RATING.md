# Rating, Divisi, Event, dan Musim

Diadaptasi dari sistem [Low Fuel Motorsport](https://lowfuelmotorsport.com/) (rating ala Elo, divisi, uji lisensi 107%, seri hotlap mingguan). Bedanya: FR Legends tidak punya server balap atau API, jadi semua angka di sini dihitung **hanya dari lap time yang sudah diterima moderator**. Tidak ada balapan langsung, tidak ada insiden, jadi tidak ada safety rating.

Semua angka di bawah ada di satu tempat di kode: `supabase/migrations/20261003010000_rating_events.sql`. Ubah dokumen ini bersamaan.

## 1. Rating pembalap (FRL Rating)

### Skor per layout
Untuk setiap layout tempat pemain punya PB (kategori Open):

```
selisih  = PB / rekor layout - 1          (0 = pemegang rekor)
skor     = 1000 x (1 - selisih / 0.07), minimal 0
```

| PB terhadap rekor | Skor |
|-------------------|------|
| Sama dengan rekor | 1000 |
| 101% (1% lebih lambat) | 857 |
| 103.5% | 500 |
| 107% atau lebih lambat | 0 |

Batas 107% diambil dari uji lisensi LFM: lebih lambat dari 107% rekor dianggap belum layak bersaing.

Layout baru dihitung jika sudah ada **minimal 3 pemain**. Tanpa syarat ini, pemain yang sendirian di sebuah layout otomatis memegang rekor dan mendapat 1000.

### Rating
```
rating = 1000 + (jumlah 5 skor layout terbaik) / 2
```

Rentang 1000 sampai 3500. Hanya 5 layout terbaik yang dihitung, jadi pemain tidak dihukum karena mencoba layout yang belum dikuasai, tapi tetap perlu main di beberapa layout untuk naik ke divisi atas.

Rating ikut berubah saat rekor layout dipecahkan, karena skor dihitung relatif terhadap rekor saat ini.

### Divisi

| Divisi | Syarat |
|--------|--------|
| Rookie | Kurang dari 3 layout dengan PB yang diterima |
| Div 1 | Rating 3000 ke atas |
| Div 2 | 2600 sampai 2999 |
| Div 3 | 2200 sampai 2599 |
| Div 4 | 1800 sampai 2199 |
| Div 5 | 1400 sampai 1799 |
| Div 6 | Di bawah 1400 |

Gambaran: rata-rata 1% dari rekor di 5 layout menghasilkan sekitar 3140 (Div 1), 2% sekitar 2790 (Div 2), 3.5% sekitar 2250 (Div 3), 5% sekitar 1710 (Div 5).

### Riwayat rating
Rating semua pemain disimpan sebagai potret harian (`rating_snapshots`). Potret hari itu diperbarui setiap kali moderator menerima atau menolak submission, dan setiap kali pemain menarik submission. Grafik di profil memakai potret ini.

## 2. Event mingguan

Meniru Weekly Hot Lap Series LFM.

- Admin membuat event: satu layout, periode (misal Senin 00:00 sampai Minggu 23:59 WIB), dan opsional satu mobil wajib.
- Pemain cukup mengirim lap time seperti biasa. Kiriman di layout itu yang **dikirim selama periode event** dan kemudian diterima moderator otomatis masuk hasil event.
- Hasil event memakai waktu terbaik tiap pemain selama periode.

### Poin

| Posisi | Poin |
|--------|------|
| 1 | 50 |
| 2 | 45 |
| 3 | 41 |
| 4 | 38 |
| 5 | 36 |
| 6 dan seterusnya | 36 dikurangi 1 per posisi, minimal 1 |

Setiap peserta mendapat minimal 1 poin, jadi ikut serta selalu dihargai.

### Keterbatasan
Screenshot tidak menunjukkan kapan lap dilakukan. Pemain bisa saja mengirim screenshot lama selama periode event. Pengaman yang ada: screenshot yang sudah pernah dikirim ditolak, dan moderator melihat riwayat pemain. Jika ini jadi masalah, opsi berikutnya adalah kode event yang harus terlihat di screenshot (misal ditulis di nama pemain di game).

## 3. Musim

- Musim adalah kumpulan event dalam rentang tanggal tertentu.
- Klasemen musim = jumlah poin semua event di musim itu. Tidak ada pengurangan untuk minggu yang dilewatkan.
- Jika poin sama, diurutkan dari jumlah kemenangan, lalu posisi terbaik.
- Event yang sedang berjalan sudah dihitung (sementara) di klasemen.
