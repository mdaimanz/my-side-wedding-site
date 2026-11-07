"use client";

import { useEffect, useId, useRef, useState } from "react";
import { wedding } from "@/data/wedding";
import { googleCalendarUrl } from "@/lib/calendar";

const googleUrl = googleCalendarUrl(wedding);

export function AddToCalendar() {
  const [open, setOpen] = useState(false);
  const choicesId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  return (
    <div className="calendar-control" ref={container} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        className="button button-secondary"
        type="button"
        ref={trigger}
        aria-expanded={open}
        aria-controls={choicesId}
        onClick={() => setOpen((expanded) => !expanded)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18M12 14v4M10 16h4" />
        </svg>
        Tambah ke kalendar
      </button>
      <div className="calendar-choices" id={choicesId} hidden={!open}>
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Google Calendar <span className="calendar-link-hint">(tab baharu)</span></a>
        <a href="/calendar" download="walimatul-urus.ics" onClick={() => setOpen(false)}>Apple Calendar / Outlook <span className="calendar-link-hint">(.ics)</span></a>
      </div>
    </div>
  );
}
