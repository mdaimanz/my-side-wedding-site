"use client";

import { useActionState } from "react";
import { submitRsvp, type RsvpState } from "@/app/actions/rsvp";
import { AddToCalendar } from "@/components/ui/add-to-calendar";

const initialState: RsvpState = { status: "idle", message: "", fieldErrors: {} };

export function RsvpForm() {
  const [state, action, pending] = useActionState(submitRsvp, initialState);

  return (
    <form action={action} className="rsvp-form" noValidate>
      {state.status === "error" && state.message && <p className="form-message error" role="alert">{state.message}</p>}
      <label htmlFor="name">Nama penuh
        {state.fieldErrors.name && <p className="form-message error" id="name-error" role="alert">{state.fieldErrors.name}</p>}
        <input id="name" name="name" autoComplete="name" maxLength={120} required onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^\p{L}\p{M}\s]/gu, ""); }} aria-invalid={Boolean(state.fieldErrors.name)} aria-describedby={state.fieldErrors.name ? "name-error" : undefined} />
      </label>
      <label htmlFor="phone">Nombor telefon
        {state.fieldErrors.phone && <p className="form-message error" id="phone-error" role="alert">{state.fieldErrors.phone}</p>}
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="012-345 6789" required pattern="[0-9-]*" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^0-9-]/g, ""); }} aria-invalid={Boolean(state.fieldErrors.phone)} aria-describedby={state.fieldErrors.phone ? "phone-error" : undefined} />
      </label>
      <fieldset>
        <legend>Kehadiran</legend>
        {state.fieldErrors.attendance && <p className="form-message error" id="attendance-error" role="alert">{state.fieldErrors.attendance}</p>}
        <label className="radio-label"><input type="radio" name="attendance" value="attending" required aria-describedby={state.fieldErrors.attendance ? "attendance-error" : undefined} /> Insya-Allah, saya hadir</label>
        <label className="radio-label"><input type="radio" name="attendance" value="not_attending" required aria-describedby={state.fieldErrors.attendance ? "attendance-error" : undefined} /> Maaf, saya tidak dapat hadir</label>
      </fieldset>
      <label htmlFor="guestCount">Bilangan tetamu
        {state.fieldErrors.guestCount && <p className="form-message error" id="guest-count-error" role="alert">{state.fieldErrors.guestCount}</p>}
        <select id="guestCount" name="guestCount" defaultValue="1" aria-invalid={Boolean(state.fieldErrors.guestCount)} aria-describedby={state.fieldErrors.guestCount ? "guest-count-error" : undefined}>{Array.from({ length: 5 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select>
      </label>
      <label htmlFor="message">Ucapan untuk pengantin <span>(pilihan)</span>
        {state.fieldErrors.message && <p className="form-message error" id="message-error" role="alert">{state.fieldErrors.message}</p>}
        <textarea id="message" name="message" rows={4} maxLength={500} aria-invalid={Boolean(state.fieldErrors.message)} aria-describedby={state.fieldErrors.message ? "message-error" : undefined} />
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Hantar maklum balas"}</button>
      <AddToCalendar />
      {state.status === "success" && state.message && <p className="form-message success" role="status">{state.message}</p>}
    </form>
  );
}

