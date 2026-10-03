import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { EVENT_STATUS_LABEL, formatDate, formatDateTime, LAYOUT_TYPE_LABEL } from "@/lib/format";
import { getEvents, getSeasons, pickCurrentSeason } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Car, Layout, Track } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { createCar, createEvent, createLayout, createSeason, createTrack, deleteEvent, setRole, toggleActive } from "./actions";
import { AdminForm, Field } from "./admin-form";

export const metadata: Metadata = { title: "Admin" };

function ToggleButton({ table, id, active }: { table: "tracks" | "layouts" | "cars"; id: string; active: boolean }) {
  return (
    <form action={toggleActive}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={String(!active)} />
      <button type="submit" className={`status ${active ? "status-approved" : "status-withdrawn"}`}>
        {active ? "AKTIF" : "NONAKTIF"}
      </button>
    </form>
  );
}

export default async function AdminPage() {
  await requireRole("admin", "/admin");
  const supabase = await createClient();
  const [{ data: tracks }, { data: layouts }, { data: cars }, seasons, events] = await Promise.all([
    supabase.from("tracks").select("*").order("sort_order").order("name"),
    supabase.from("track_layouts").select("*").order("sort_order").order("name"),
    supabase.from("cars").select("*").order("sort_order").order("name"),
    getSeasons(),
    getEvents(),
  ]);
  const trackList = (tracks ?? []) as Track[];
  const layoutList = (layouts ?? []) as Layout[];
  const carList = (cars ?? []) as Car[];

  return (
    <>
      <PageTitle kicker="Admin" title="Panel admin">
        Event, musim, dan data referensi. Nama sirkuit, layout, dan mobil harus sama persis dengan yang tampil di game.
        Data yang sudah dipakai submission tidak dihapus, cukup dinonaktifkan.
      </PageTitle>

      <section className="mb-12">
        <h2 className="heading mb-3 text-[20px]">Event dan musim</h2>
        <div className="panel overflow-x-auto">
          <table className="sheet">
            <thead>
              <tr>
                <th>Event</th>
                <th>Periode (WIB)</th>
                <th className="right">Peserta</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-ink-2">
                    Belum ada event.
                  </td>
                </tr>
              ) : null}
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className={`status status-${e.status} mr-2`}>{EVENT_STATUS_LABEL[e.status]}</span>
                    {e.name}
                    <span className="block text-[13px] text-ink-2">
                      {e.layout_name}
                      {e.car_name ? ` · ${e.car_name}` : ""}
                      {e.season_name ? ` · ${e.season_name}` : ""} · /{e.slug}
                    </span>
                  </td>
                  <td className="num whitespace-nowrap text-[13px] text-ink-2">
                    {formatDateTime(e.starts_at)}
                    <br />
                    {formatDateTime(e.ends_at)}
                  </td>
                  <td className="right num">{e.participant_count}</td>
                  <td className="right">
                    {e.participant_count === 0 ? (
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="text-[13px] text-alert underline underline-offset-2">
                          Hapus
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <AdminForm title="Buat event" action={createEvent} submitLabel="Buat event">
            <Field label="Nama">
              <input name="name" required maxLength={80} placeholder="Minggu 1: Gunsai TA" className="field" />
            </Field>
            <Field label="Slug (untuk URL)">
              <input name="slug" required maxLength={60} placeholder="s1-minggu-1" className="field" />
            </Field>
            <Field label="Layout">
              <select name="layout_id" required defaultValue="" className="field">
                <option value="" disabled>
                  Pilih layout
                </option>
                {trackList.map((track) => (
                  <optgroup key={track.id} label={track.name}>
                    {layoutList
                      .filter((l) => l.track_id === track.id && l.is_active)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Mobil wajib (opsional)">
              <select name="car_id" defaultValue="" className="field">
                <option value="">Semua mobil</option>
                {carList
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Musim (opsional)">
              <select name="season_id" defaultValue={pickCurrentSeason(seasons)?.id ?? ""} className="field">
                <option value="">Tanpa musim</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mulai (WIB)">
                <input name="starts_at" type="datetime-local" required className="field" />
              </Field>
              <Field label="Selesai (WIB)">
                <input name="ends_at" type="datetime-local" required className="field" />
              </Field>
            </div>
            <Field label="Catatan (opsional)">
              <textarea name="notes" rows={2} maxLength={500} className="field" />
            </Field>
          </AdminForm>

          <div className="grid content-start gap-5">
            <AdminForm title="Buat musim" action={createSeason} submitLabel="Buat musim">
              <Field label="Nama">
                <input name="name" required maxLength={60} placeholder="Musim 1" className="field" />
              </Field>
              <Field label="Slug (untuk URL)">
                <input name="slug" required maxLength={40} placeholder="musim-1" className="field" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Mulai">
                  <input name="starts_on" type="date" required className="field" />
                </Field>
                <Field label="Selesai">
                  <input name="ends_on" type="date" required className="field" />
                </Field>
              </div>
            </AdminForm>
            {seasons.length > 0 ? (
              <div className="panel p-4 text-[14px]">
                <p className="label mb-2">Musim</p>
                <ul className="grid gap-1">
                  {seasons.map((s) => (
                    <li key={s.id}>
                      {s.name}{" "}
                      <span className="num text-[13px] text-ink-2">
                        {formatDate(s.starts_on)} sampai {formatDate(s.ends_on)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="heading mb-3 text-[20px]">Sirkuit dan layout</h2>
        <div className="panel overflow-x-auto">
          <table className="sheet">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Slug</th>
                <th>Tipe</th>
                <th className="right">Urutan</th>
                <th className="right">Status</th>
              </tr>
            </thead>
            {trackList.map((track) => (
              <tbody key={track.id}>
                <tr>
                  <td className="heading text-[15px]">{track.name}</td>
                  <td className="num text-ink-2">{track.slug}</td>
                  <td />
                  <td className="right num">{track.sort_order}</td>
                  <td className="right">
                    <ToggleButton table="tracks" id={track.id} active={track.is_active} />
                  </td>
                </tr>
                {layoutList
                  .filter((layout) => layout.track_id === track.id)
                  .map((layout) => (
                    <tr key={layout.id}>
                      <td className="pl-6">{layout.name}</td>
                      <td className="num text-ink-2">{layout.slug}</td>
                      <td className="label !text-ink">{LAYOUT_TYPE_LABEL[layout.type]}</td>
                      <td className="right num">{layout.sort_order}</td>
                      <td className="right">
                        <ToggleButton table="layouts" id={layout.id} active={layout.is_active} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            ))}
          </table>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <AdminForm title="Tambah sirkuit" action={createTrack} submitLabel="Tambah sirkuit">
            <Field label="Nama">
              <input name="name" required maxLength={60} className="field" />
            </Field>
            <Field label="Slug (untuk URL)">
              <input name="slug" required maxLength={40} placeholder="gunsai" className="field" />
            </Field>
            <Field label="Sirkuit asli (opsional)">
              <input name="real_world_reference" maxLength={120} className="field" />
            </Field>
            <Field label="Urutan">
              <input name="sort_order" type="number" defaultValue={0} className="field !w-28" />
            </Field>
          </AdminForm>

          <AdminForm title="Tambah layout" action={createLayout} submitLabel="Tambah layout">
            <Field label="Sirkuit">
              <select name="track_id" required defaultValue="" className="field">
                <option value="" disabled>
                  Pilih sirkuit
                </option>
                {trackList.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama">
              <input name="name" required maxLength={60} placeholder="Gunsai TA" className="field" />
            </Field>
            <Field label="Slug (untuk URL)">
              <input name="slug" required maxLength={40} placeholder="ta" className="field" />
            </Field>
            <Field label="Tipe">
              <select name="type" defaultValue="time_attack" className="field">
                <option value="time_attack">Time attack</option>
                <option value="drift">Drift</option>
                <option value="other">Lainnya</option>
              </select>
            </Field>
            <Field label="Urutan">
              <input name="sort_order" type="number" defaultValue={0} className="field !w-28" />
            </Field>
          </AdminForm>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="heading mb-3 text-[20px]">Mobil</h2>
        <div className="panel overflow-x-auto">
          <table className="sheet">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Slug</th>
                <th className="right">Urutan</th>
                <th className="right">Status</th>
              </tr>
            </thead>
            <tbody>
              {carList.map((car) => (
                <tr key={car.id}>
                  <td>{car.name}</td>
                  <td className="num text-ink-2">{car.slug}</td>
                  <td className="right num">{car.sort_order}</td>
                  <td className="right">
                    <ToggleButton table="cars" id={car.id} active={car.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <AdminForm title="Tambah mobil" action={createCar} submitLabel="Tambah mobil">
            <Field label="Nama (persis seperti di game)">
              <input name="name" required maxLength={60} className="field" />
            </Field>
            <Field label="Slug (untuk URL)">
              <input name="slug" required maxLength={40} placeholder="ae86" className="field" />
            </Field>
            <Field label="Urutan">
              <input name="sort_order" type="number" defaultValue={0} className="field !w-28" />
            </Field>
          </AdminForm>
        </div>
      </section>

      <section>
        <h2 className="heading mb-3 text-[20px]">Peran pengguna</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <AdminForm title="Ubah peran" action={setRole} submitLabel="Simpan peran">
            <Field label="Nama pengguna">
              <input name="username" required className="field" />
            </Field>
            <Field label="Peran">
              <select name="role" defaultValue="mod" className="field">
                <option value="user">Pemain</option>
                <option value="mod">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </AdminForm>
        </div>
      </section>
    </>
  );
}
