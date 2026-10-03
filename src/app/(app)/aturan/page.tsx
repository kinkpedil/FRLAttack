import type { Metadata } from "next";
import { DivisionBadge } from "@/components/division-badge";
import { PageTitle } from "@/components/page-title";

export const metadata: Metadata = { title: "Aturan" };

// Sumber: docs/ATURAN.md dan docs/RATING.md (bagian publik). Ubah bersamaan.

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel mb-5 max-w-[760px] scroll-mt-20 p-4 lg:p-6">
      <h2 className="heading mb-3 text-[20px]">{title}</h2>
      {children}
    </section>
  );
}

export default function RulesPage() {
  return (
    <>
      <PageTitle title="Aturan" />

      <Section title="Syarat screenshot">
        <ol className="grid list-decimal gap-2 pl-5">
          <li>Screenshot layar hasil lap FR Legends, langsung dari HP kamu.</li>
          <li>Lap time harus terbaca jelas. Jangan di-crop sampai angka atau nama sirkuit terpotong.</li>
          <li>
            Kirim file asli. Jangan diedit, ditambah tulisan, diberi filter, atau dikompres lewat aplikasi chat.
          </li>
          <li>
            Satu screenshot hanya bisa dipakai satu kali. Screenshot yang sudah pernah dikirim (oleh siapa pun) akan
            ditolak.
          </li>
          <li>Format PNG, JPG, atau WEBP. Ukuran maksimal 8 MB. Sisi terpendek minimal 720 piksel.</li>
        </ol>
      </Section>

      <Section title="Mengisi form">
        <ul className="grid list-disc gap-2 pl-5">
          <li>Pilih sirkuit, layout, dan mobil yang sama dengan di screenshot.</li>
          <li>Isi lap time persis seperti di layar, sampai milidetik.</li>
          <li>Lap time yang kamu isi dicocokkan dengan screenshot. Beda satu angka saja, submission ditolak.</li>
        </ul>
      </Section>

      <Section title="Proses pengecekan">
        <table className="sheet mb-4">
          <tbody>
            <tr>
              <td className="w-32">
                <span className="status status-pending">MENUNGGU</span>
              </td>
              <td>Menunggu dicek moderator.</td>
            </tr>
            <tr>
              <td>
                <span className="status status-approved">DITERIMA</span>
              </td>
              <td>Masuk leaderboard.</td>
            </tr>
            <tr>
              <td>
                <span className="status status-rejected">DITOLAK</span>
              </td>
              <td>Tidak masuk. Alasannya selalu ditulis.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Untuk rekor sirkuit dan Top 3, moderator bisa meminta video lap tersebut (link YouTube, TikTok, atau
          Instagram).
        </p>
      </Section>

      <Section title="Memperbarui lap time">
        <p>
          Kirim screenshot baru di layout yang sama. Jika lebih cepat, otomatis jadi PB baru. Waktu lama tetap tersimpan
          di riwayatmu. Lap time tidak bisa diedit tanpa screenshot baru.
        </p>
      </Section>

      <Section id="rating" title="Rating dan divisi">
        <p className="mb-3">
          Rating dihitung dari PB kamu di setiap layout dibanding rekor layout itu. Diadaptasi dari sistem Low Fuel
          Motorsport.
        </p>
        <ul className="mb-4 grid list-disc gap-2 pl-5">
          <li>
            Skor layout: <span className="num">1000</span> untuk pemegang rekor, turun sampai <span className="num">0</span>{" "}
            di 107% rekor. Contoh: 1% lebih lambat dari rekor = <span className="num">857</span>.
          </li>
          <li>Layout baru dihitung jika sudah ada minimal 3 pemain.</li>
          <li>
            Rating = <span className="num">1000</span> + jumlah 5 skor layout terbaik dibagi 2. Rentang 1.000 sampai
            3.500.
          </li>
          <li>Rating ikut turun jika rekor sebuah layout dipecahkan orang lain.</li>
        </ul>
        <table className="sheet">
          <thead>
            <tr>
              <th>Divisi</th>
              <th>Syarat</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><DivisionBadge division="rookie" /></td><td>Kurang dari 3 layout dengan PB diterima</td></tr>
            <tr><td><DivisionBadge division="div1" /></td><td className="num">3.000 ke atas</td></tr>
            <tr><td><DivisionBadge division="div2" /></td><td className="num">2.600 sampai 2.999</td></tr>
            <tr><td><DivisionBadge division="div3" /></td><td className="num">2.200 sampai 2.599</td></tr>
            <tr><td><DivisionBadge division="div4" /></td><td className="num">1.800 sampai 2.199</td></tr>
            <tr><td><DivisionBadge division="div5" /></td><td className="num">1.400 sampai 1.799</td></tr>
            <tr><td><DivisionBadge division="div6" /></td><td className="num">di bawah 1.400</td></tr>
          </tbody>
        </table>
      </Section>

      <Section id="event" title="Event mingguan dan musim">
        <ul className="mb-4 grid list-disc gap-2 pl-5">
          <li>Setiap event memakai satu layout dan periode tertentu, kadang dengan mobil wajib.</li>
          <li>
            Kirim lap time seperti biasa. Kiriman di layout itu yang dikirim selama periode event dan diterima moderator
            otomatis masuk hasil event.
          </li>
          <li>Posisi akhir event menjadi poin. Klasemen musim adalah jumlah poin semua event di musim itu.</li>
          <li>Jika poin sama: jumlah kemenangan, lalu posisi terbaik.</li>
        </ul>
        <table className="sheet">
          <thead>
            <tr>
              <th>Posisi</th>
              <th className="right">Poin</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td className="right num">50</td></tr>
            <tr><td>2</td><td className="right num">45</td></tr>
            <tr><td>3</td><td className="right num">41</td></tr>
            <tr><td>4</td><td className="right num">38</td></tr>
            <tr><td>5</td><td className="right num">36</td></tr>
            <tr><td>6 dan seterusnya</td><td className="right num">turun 1 per posisi, minimal 1</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Yang dilarang">
        <ul className="grid list-disc gap-2 pl-5">
          <li>Mengedit screenshot dalam bentuk apa pun.</li>
          <li>Mengirim screenshot milik orang lain.</li>
          <li>Memakai versi game modifikasi, cheat, atau alat yang mengubah kecepatan game.</li>
          <li>Memakai mod mobil atau mod sirkuit yang memengaruhi performa.</li>
          <li>Satu orang dengan beberapa akun.</li>
        </ul>
      </Section>

      <Section title="Sanksi">
        <table className="sheet">
          <thead>
            <tr>
              <th>Pelanggaran</th>
              <th>Sanksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pertama, ringan (misal salah pilih mobil)</td>
              <td>Submission ditolak, boleh kirim ulang</td>
            </tr>
            <tr>
              <td>Screenshot editan atau milik orang lain</td>
              <td>Semua submission dihapus dari leaderboard, akun dibekukan 30 hari</td>
            </tr>
            <tr>
              <td>Mengulang, atau akun ganda</td>
              <td>Akun diblokir permanen</td>
            </tr>
          </tbody>
        </table>
      </Section>
    </>
  );
}
