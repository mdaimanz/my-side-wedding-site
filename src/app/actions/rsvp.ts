"use server";

import { upsertRsvp } from "@/lib/db";
import { normalizeMalaysianPhone } from "@/lib/phone";

export type RsvpState = { status: "idle" | "success" | "error"; message: string };

export async function submitRsvp(_previous: RsvpState, formData: FormData): Promise<RsvpState> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhone(String(formData.get("phone") ?? ""));
  const attendance = String(formData.get("attendance") ?? "");
  const rawGuestCount = Number(formData.get("guestCount") ?? 0);
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || name.length > 120) return { status: "error", message: "Sila masukkan nama yang sah." };
  if (!phoneNumber) return { status: "error", message: "Sila masukkan nombor telefon Malaysia yang sah." };
  if (attendance !== "attending" && attendance !== "not_attending") {
    return { status: "error", message: "Sila pilih status kehadiran." };
  }
  const guestCount = attendance === "attending" ? rawGuestCount : 0;
  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 10) {
    return { status: "error", message: "Bilangan tetamu mestilah antara 1 hingga 10." };
  }
  if (message.length > 500) return { status: "error", message: "Ucapan mestilah 500 aksara atau kurang." };

  try {
    await upsertRsvp({
      name,
      phoneNumber,
      attendance,
      guestCount,
      message: message || null,
    });
    return { status: "success", message: "Terima kasih. Maklum balas anda telah disimpan." };
  } catch (error) {
    console.error("RSVP submission failed", error);
    return { status: "error", message: "Maklum balas belum dapat disimpan. Sila cuba lagi sebentar." };
  }
}

