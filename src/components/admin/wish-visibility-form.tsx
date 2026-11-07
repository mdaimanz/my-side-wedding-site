"use client";

import { useActionState } from "react";
import { updateWishVisibility, type WishVisibilityState } from "@/app/actions/admin";

const initialState: WishVisibilityState = { status: "idle", message: "" };

export function WishVisibilityForm({ guestId, name, message, visible }: {
  guestId: number;
  name: string;
  message: string | null;
  visible: boolean;
}) {
  const [state, action, pending] = useActionState(updateWishVisibility, initialState);
  const canPublish = Boolean(name.trim() && message?.trim());

  return (
    <form action={action} className="wish-visibility-form">
      <input type="hidden" name="guestId" value={guestId} />
      <input type="hidden" name="visible" value={String(!visible)} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="message" value={message ?? ""} />
      <span>{visible ? "Diterbitkan" : "Tersembunyi"}</span>
      <button
        className="button button-secondary"
        type="submit"
        disabled={pending || (!visible && !canPublish)}
        aria-label={`${visible ? "Sembunyikan" : "Terbitkan"} ucapan ${name}`}
      >
        {pending ? "Menyimpan…" : visible ? "Sembunyikan" : "Terbitkan"}
      </button>
      {!visible && !canPublish && <small>Tiada ucapan untuk diterbitkan.</small>}
      {state.message && <p className={`form-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  );
}
