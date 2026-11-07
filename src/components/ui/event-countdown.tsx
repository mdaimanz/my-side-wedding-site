"use client";

import { useEffect, useState } from "react";

const units = [
  { label: "Hari", seconds: 86400, modulo: Infinity },
  { label: "Jam", seconds: 3600, modulo: 24 },
  { label: "Minit", seconds: 60, modulo: 60 },
  { label: "Saat", seconds: 1, modulo: 60 },
];

export function EventCountdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse(targetDate);
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const seconds = Number.isFinite(target)
        ? Math.max(0, Math.ceil((target - Date.now()) / 1000))
        : 0;
      setRemaining(seconds);
      if (seconds > 0) timer = setTimeout(tick, 1000);
    }

    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [targetDate]);

  return (
    <div className="event-countdown" role="timer" aria-label="Masa sehingga majlis" aria-live="off">
      {units.map(({ label, seconds, modulo }) => {
        const value = remaining === null
          ? "--"
          : String(Math.floor(remaining / seconds) % modulo).padStart(2, "0");

        return (
          <div className="event-countdown-unit" key={label}>
            <span className="event-countdown-number">{value}</span>
            <span className="event-countdown-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
