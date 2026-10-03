"use client";

import { useMemo, useRef, useState } from "react";
import { formatDate, formatNumber } from "@/lib/format";

type Point = { taken_on: string; rating: number };

const W = 640;
const H = 200;
const PAD = { top: 16, right: 56, bottom: 24, left: 44 };

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = Math.max(1, max - min);
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

// Riwayat rating: satu seri, garis 2px, area tipis, crosshair + tooltip.
export function RatingChart({ points }: { points: Point[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const values = points.map((p) => p.rating);
    const ticks = niceTicks(Math.min(...values) - 25, Math.max(...values) + 25);
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - yMin) / Math.max(1, yMax - yMin)) * innerH;
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`;
    return { ticks, x, y, line, area, baseY: PAD.top + innerH };
  }, [points]);

  if (points.length < 2) {
    return <p className="text-[14px] text-ink-2">Grafik muncul setelah rating tercatat di 2 hari berbeda.</p>;
  }

  const last = points.length - 1;

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(geo.x(i) - px) < Math.abs(geo.x(best) - px)) best = i;
    }
    setHover(best);
  }

  const active = hover ?? null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-none"
        role="img"
        aria-label={`Riwayat rating dari ${formatNumber(points[0].rating)} menjadi ${formatNumber(points[last].rating)}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--rule)" strokeWidth={1} />
            <text x={PAD.left - 8} y={geo.y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-2)" className="num">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} fontSize={11} fill="var(--ink-2)">
          {formatDate(points[0].taken_on, false)}
        </text>
        <text x={W - PAD.right} y={H - 6} fontSize={11} fill="var(--ink-2)" textAnchor="end">
          {formatDate(points[last].taken_on, false)}
        </text>

        <path d={geo.area} fill="var(--accent)" fillOpacity={0.1} />
        <path d={geo.line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={geo.x(last)} cy={geo.y(points[last].rating)} r={4} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
        <text x={geo.x(last) + 10} y={geo.y(points[last].rating) + 4} fontSize={12} fill="var(--ink)" className="num">
          {formatNumber(points[last].rating)}
        </text>

        {active !== null ? (
          <g>
            <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.top} y2={geo.baseY} stroke="var(--ink-2)" strokeWidth={1} />
            <circle cx={geo.x(active)} cy={geo.y(points[active].rating)} r={5} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>

      {active !== null ? (
        <div
          className="pointer-events-none absolute top-1 rounded-[2px] border border-rule-strong bg-bg px-2 py-1 text-[13px]"
          style={{
            left: `${(geo.x(active) / W) * 100}%`,
            transform: geo.x(active) > W / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
          }}
        >
          <span className="text-ink-2">{formatDate(points[active].taken_on)}</span>{" "}
          <span className="num">{formatNumber(points[active].rating)}</span>
        </div>
      ) : null}

      <details className="mt-2 text-[13px]">
        <summary className="cursor-pointer text-ink-2">Lihat data</summary>
        <table className="sheet mt-2">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th className="right">Rating</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.taken_on}>
                <td className="num">{formatDate(p.taken_on)}</td>
                <td className="right num">{formatNumber(p.rating)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
