"use client";

import { useActionState } from "react";
import { submitRsvp, type RsvpState } from "@/app/actions/rsvp";

const initialState: RsvpState = { status: "idle", message: "" };

export function RsvpForm() {
  const [state, action, pending] = useActionState(submitRsvp, initialState);

  return (
    <form action={action} className="rsvp-form">
      <label>Nama penuh<input name="name" autoComplete="name" maxLength={120} required /></label>
      <label>Nombor telefon<input name="phone" type="tel" autoComplete="tel" placeholder="012-345 6789" required /></label>
      <fieldset>
        <legend>Kehadiran</legend>
        <label className="radio-label"><input type="radio" name="attendance" value="attending" required /> Insya-Allah, saya hadir</label>
        <label className="radio-label"><input type="radio" name="attendance" value="not_attending" required /> Maaf, saya tidak dapat hadir</label>
      </fieldset>
      <label>Bilangan tetamu<select name="guestCount" defaultValue="1">{Array.from({ length: 10 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>
      <label>Ucapan untuk pengantin <span>(pilihan)</span><textarea name="message" rows={4} maxLength={500} /></label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Hantar maklum balas"}</button>
      {state.message && <p className={`form-message ${state.status}`} role="status">{state.message}</p>}
    </form>
  );
}

