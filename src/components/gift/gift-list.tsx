"use client";

import { useActionState, useRef } from "react";
import { reserveGift, type GiftReservationState } from "@/app/actions/gift";
import type { PublicGift } from "@/types/wedding";

const initialState: GiftReservationState = { status: "idle", message: "", fieldErrors: {} };

function GiftCard({ gift }: { gift: PublicGift }) {
  const [state, action, pending] = useActionState(reserveGift, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
    window.requestAnimationFrame(() => nameRef.current?.focus());
  }

  function closeDialog() {
    if (!pending) dialogRef.current?.close();
  }

  return (
    <li className={`gift-card${gift.reserved ? " gift-card-reserved" : ""}`}>
      <div className="gift-card-copy">
        <span className={`gift-status ${gift.reserved ? "reserved" : "available"}`}>
          {gift.reserved ? "Telah ditempah" : "Masih tersedia"}
        </span>
        <h2>{gift.name}</h2>
        <a className="gift-link" href={gift.purchaseUrl} target="_blank" rel="noopener noreferrer">
          Lihat hadiah <span aria-hidden="true">↗</span>
        </a>
      </div>
      <button
        className="button button-primary gift-reserve-button"
        type="button"
        onClick={openDialog}
        disabled={gift.reserved}
      >
        {gift.reserved ? "Sudah ditempah" : "Tempah hadiah"}
      </button>

      <dialog
        className="gift-dialog"
        ref={dialogRef}
        aria-labelledby={`gift-dialog-title-${gift.id}`}
        onCancel={(event) => { if (pending) event.preventDefault(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
      >
        <div className="gift-dialog-panel">
          <button className="gift-dialog-close" type="button" onClick={closeDialog} disabled={pending} aria-label="Tutup borang tempahan">×</button>
          <p className="eyebrow">Tempahan hadiah</p>
          <h2 id={`gift-dialog-title-${gift.id}`}>{gift.name}</h2>
          {state.status === "success" ? (
            <div className="gift-reservation-success">
              <span aria-hidden="true">✓</span>
              <p className="form-message success" role="status">{state.message}</p>
              <button className="button button-secondary" type="button" onClick={closeDialog}>Tutup</button>
            </div>
          ) : (
            <form action={action} className="gift-reservation-form" noValidate>
              <input type="hidden" name="giftId" value={gift.id} />
              {(state.status === "error" || state.status === "conflict") && state.message && (
                <p className="form-message error" role="alert">{state.message}</p>
              )}
              <label htmlFor={`gift-name-${gift.id}`}>Nama penuh
                {state.fieldErrors.name && <p className="form-message error" id={`gift-name-error-${gift.id}`} role="alert">{state.fieldErrors.name}</p>}
                <input
                  ref={nameRef}
                  id={`gift-name-${gift.id}`}
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  required
                  onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^\p{L}\p{M}\s]/gu, ""); }}
                  aria-invalid={Boolean(state.fieldErrors.name)}
                  aria-describedby={state.fieldErrors.name ? `gift-name-error-${gift.id}` : undefined}
                />
              </label>
              <label htmlFor={`gift-phone-${gift.id}`}>Nombor telefon
                {state.fieldErrors.phone && <p className="form-message error" id={`gift-phone-error-${gift.id}`} role="alert">{state.fieldErrors.phone}</p>}
                <input
                  id={`gift-phone-${gift.id}`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="012-345 6789"
                  required
                  onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^0-9-]/g, ""); }}
                  aria-invalid={Boolean(state.fieldErrors.phone)}
                  aria-describedby={state.fieldErrors.phone ? `gift-phone-error-${gift.id}` : undefined}
                />
              </label>
              <p className="gift-privacy-note">Maklumat anda hanya boleh dilihat oleh pengantin dan tidak akan dipaparkan di halaman ini.</p>
              <button className="button button-primary" type="submit" disabled={pending}>
                {pending ? "Menyimpan…" : "Sahkan tempahan"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </li>
  );
}

export function GiftList({ gifts, loadError = false }: { gifts: PublicGift[]; loadError?: boolean }) {
  if (loadError) {
    return (
      <div className="gift-list-state gift-list-error" role="alert">
        <span aria-hidden="true">!</span>
        <h2>Senarai hadiah belum dapat dimuatkan</h2>
        <p>Sila muat semula halaman atau cuba lagi sebentar.</p>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="gift-list-state">
        <span aria-hidden="true">♡</span>
        <h2>Senarai hadiah akan dikemas kini</h2>
        <p>Belum ada hadiah disenaraikan buat masa ini. Terima kasih kerana sudi singgah.</p>
      </div>
    );
  }

  return <ul className="gift-list">{gifts.map((gift) => <GiftCard key={gift.id} gift={gift} />)}</ul>;
}
