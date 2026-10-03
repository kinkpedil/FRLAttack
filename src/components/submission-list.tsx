import Link from "next/link";
import { StatusLabel } from "@/components/status-label";
import type { OwnSubmission } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";

type Props = {
  rows: OwnSubmission[];
  showStatus?: boolean;
  withdrawAction?: (formData: FormData) => Promise<void>;
};

export function SubmissionList({ rows, showStatus = false, withdrawAction }: Props) {
  return (
    <div>
      <table className="sheet">
        <thead>
          <tr>
            <th>Tgl</th>
            <th>Layout</th>
            <th>Mobil</th>
            <th className="right">Lap time</th>
            {showStatus ? <th>Status</th> : null}
            {withdrawAction ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="num whitespace-nowrap text-ink-2">{formatDate(row.created_at)}</td>
              <td>
                <Link className="link" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                  {row.layout_name}
                </Link>
              </td>
              <td>{row.car_name}</td>
              <td className="right num">{formatLapTime(row.time_ms)}</td>
              {showStatus ? (
                <td>
                  <StatusLabel status={row.status} />
                  {row.reject_reason ? <p className="mt-1 text-[13px] text-alert">{row.reject_reason}</p> : null}
                </td>
              ) : null}
              {withdrawAction ? (
                <td className="right">
                  {row.status === "pending" || row.status === "approved" ? (
                    <form action={withdrawAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="text-[13px] text-ink-2 underline underline-offset-2">
                        Tarik
                      </button>
                    </form>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
