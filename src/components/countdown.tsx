"use client";

import { useEffect, useState } from "react";

// Hitung mundur ke `target`. `now` dari server agar render pertama sama
// di server dan browser; setelah itu diperbarui tiap 30 detik.
export function Countdown({ target, now }: { target: string; now: number }) {
  const [current, setCurrent] = useState(now);

  useEffect(() => {
    const tick = () => setCurrent(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const ms = Math.max(0, new Date(target).getTime() - current);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const text = days > 0 ? `${days}h ${hours}j ${minutes}m` : `${hours}j ${minutes}m`;

  return <span className="num">{text}</span>;
}
