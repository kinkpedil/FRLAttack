"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { formatDate, formatPosition } from "@/lib/format";
import { formatGap, formatLapTime } from "@/lib/laptime";
import type { LeaderboardRow } from "@/lib/types";

type Props = {
  rows: LeaderboardRow[];
  viewerId: string | null;
  recordMs: number | null;
};

export function LeaderboardTable({ rows, viewerId, recordMs }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="sheet">
        <thead>
          <tr>
            <th className="right">Pos</th>
            <th>Pemain</th>
            <th className="hidden sm:table-cell">Mobil</th>
            <th className="right">Lap time</th>
            <th className="right">Selisih</th>
            <th className="right hidden sm:table-cell">Tgl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = openId === row.submission_id;
            const isViewer = row.user_id === viewerId;
            const isRecord = row.time_ms === recordMs;
            return (
              <Fragment key={row.submission_id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : row.submission_id)}
                  className={`cursor-pointer ${isViewer ? "!bg-row-alt shadow-[inset_3px_0_0_var(--pb)]" : ""}`}
                  aria-expanded={isOpen}
                >
                  <td className="right num">{formatPosition(row.position)}</td>
                  <td>
                    <Link href={`/pemain/${row.username}`} onClick={(e) => e.stopPropagation()}>
                      {row.username}
                    </Link>
                    {row.country ? <span className="label ml-2">{row.country}</span> : null}
                    <span className="block text-[13px] text-ink-2 sm:hidden">{row.car_name}</span>
                  </td>
                  <td className="hidden sm:table-cell">{row.car_name}</td>
                  <td className={`right num text-[15px] ${isRecord ? "text-record" : ""}`}>{formatLapTime(row.time_ms)}</td>
                  <td className="right num text-ink-2">{formatGap(row.gap_ms)}</td>
                  <td className="right num hidden whitespace-nowrap text-ink-2 sm:table-cell">{formatDate(row.created_at, false)}</td>
                </tr>
                {isOpen ? (
                  <tr className="detail">
                    <td colSpan={6} className="!p-0">
                      <div className="border-b border-ink p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL bertanda tangan, tidak lewat optimizer */}
                        <img
                          src={`/bukti/${row.submission_id}`}
                          alt={`Screenshot bukti ${formatLapTime(row.time_ms)} oleh ${row.username}`}
                          className="block h-auto w-full"
                          loading="lazy"
                        />
                        {row.ingame_name ? (
                          <p className="mt-2 text-[13px] text-ink-2">Nama di game: {row.ingame_name}</p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
