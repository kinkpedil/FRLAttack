import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";

export const metadata: Metadata = { title: "Aturan" };

// Sumber: docs/ATURAN.md (bagian publik). Ubah keduanya bersamaan.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 max-w-[680px]">
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
