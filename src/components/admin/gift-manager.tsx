"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createGift,
  releaseGift,
  toggleGiftActive,
  updateGift,
  type GiftAdminState,
} from "@/app/actions/admin-gifts";
import type { AdminGift } from "@/types/wedding";

const initialState: GiftAdminState = { status: "idle", message: "" };

function ActionMessage({ state }: { state: GiftAdminState }) {
  if (!state.message) return null;
  return <p className={`form-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>;
}

export function GiftCreateForm() {
  const [state, action, pending] = useActionState(createGift, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="gift-admin-create-form">
      <div className="gift-admin-form-heading">
        <div><p className="eyebrow">Hadiah baharu</p><h2>Tambah ke senarai</h2></div>
        <ActionMessage state={state} />
      </div>
      <label>Nama hadiah
        <input name="name" maxLength={160} required placeholder="Contoh: Set pinggan mangkuk" />
      </label>
      <label>Pautan pembelian
        <input name="purchaseUrl" type="url" maxLength={2048} required placeholder="https://…" />
      </label>
      <label>Susunan
        <input name="displayOrder" type="number" min="0" max="999999" step="1" defaultValue="0" required />
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Menambah…" : "Tambah hadiah"}</button>
    </form>
  );
}

export function GiftAdminCard({ gift }: { gift: AdminGift }) {
  const [editState, editAction, editPending] = useActionState(updateGift, initialState);
  const [activeState, activeAction, activePending] = useActionState(toggleGiftActive, initialState);
  const [releaseState, releaseAction, releasePending] = useActionState(releaseGift, initialState);
  const reservedAt = gift.reservedAt
    ? new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(gift.reservedAt))
    : null;

  return (
    <article className={`gift-admin-card${gift.active ? "" : " archived"}`}>
      <header>
        <div>
          <span className={`gift-status ${gift.active ? "available" : "archived"}`}>{gift.active ? "Aktif" : "Diarkibkan"}</span>
          <h2>{gift.name}</h2>
        </div>
        <span className={`gift-status ${gift.reserved ? "reserved" : "available"}`}>{gift.reserved ? "Ditempah" : "Tersedia"}</span>
      </header>

      <form action={editAction} className="gift-admin-edit-form">
        <input type="hidden" name="giftId" value={gift.id} />
        <label>Nama hadiah
          <input name="name" maxLength={160} required defaultValue={gift.name} />
        </label>
        <label>Pautan pembelian
          <input name="purchaseUrl" type="url" maxLength={2048} required defaultValue={gift.purchaseUrl} />
        </label>
        <label>Susunan
          <input name="displayOrder" type="number" min="0" max="999999" step="1" required defaultValue={gift.displayOrder} />
        </label>
        <button className="button button-secondary" type="submit" disabled={editPending}>{editPending ? "Menyimpan…" : "Simpan perubahan"}</button>
        <ActionMessage state={editState} />
      </form>

      <div className="gift-admin-reservation">
        <h3>Maklumat tempahan</h3>
        {gift.reserved ? (
          <dl>
            <div><dt>Nama</dt><dd>{gift.gifterName}</dd></div>
            <div><dt>Telefon</dt><dd>{gift.gifterPhone}</dd></div>
            <div><dt>Ditempah</dt><dd>{reservedAt}</dd></div>
          </dl>
        ) : <p>Hadiah ini belum ditempah.</p>}
      </div>

      <div className="gift-admin-actions">
        <form
          action={activeAction}
          onSubmit={(event) => {
            if (gift.active && !window.confirm(`Arkibkan “${gift.name}” daripada senarai awam?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="giftId" value={gift.id} />
          <input type="hidden" name="active" value={String(!gift.active)} />
          <button className="button button-secondary" type="submit" disabled={activePending}>
            {activePending ? "Menyimpan…" : gift.active ? "Arkibkan" : "Aktifkan semula"}
          </button>
          <ActionMessage state={activeState} />
        </form>
        {gift.reserved && (
          <form
            action={releaseAction}
            onSubmit={(event) => {
              if (!window.confirm(`Lepaskan tempahan “${gift.name}”? Tindakan ini membolehkan orang lain menempahnya.`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="giftId" value={gift.id} />
            <button className="button gift-danger-button" type="submit" disabled={releasePending}>{releasePending ? "Melepaskan…" : "Lepaskan tempahan"}</button>
            <ActionMessage state={releaseState} />
          </form>
        )}
      </div>
    </article>
  );
}
