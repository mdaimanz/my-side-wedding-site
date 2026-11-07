"use server";

import { upsertRsvp } from "@/lib/db";
import { normalizeMalaysianPhone } from "@/lib/phone";

export type RsvpField = "name" | "phone" | "attendance" | "guestCount" | "message";

export type RsvpState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<RsvpField, string>>;
};

function validationError(field: RsvpField, message: string): RsvpState {
  return { status: "error", message: "", fieldErrors: { [field]: message } };
}

export async function submitRsvp(_previous: RsvpState, formData: FormData): Promise<RsvpState> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhone(String(formData.get("phone") ?? ""));
  const attendance = String(formData.get("attendance") ?? "");
  const rawGuestCount = Number(formData.get("guestCount") ?? 0);
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || name.length > 120 || !/^[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)*$/u.test(name)) return validationError("name", "Sila masukkan nama yang sah.");
  if (!phoneNumber) return validationError("phone", "Sila masukkan nombor telefon Malaysia yang sah.");
  if (attendance !== "attending" && attendance !== "not_attending") {
    return validationError("attendance", "Sila pilih status kehadiran.");
  }
  const guestCount = attendance === "attending" ? rawGuestCount : 0;
  if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 3) {
    return validationError("guestCount", "Bilangan tetamu mestilah antara 1 hingga 3.");
  }
  if (message.length > 500) return validationError("message", "Ucapan mestilah 500 aksara atau kurang.");

  try {
    await upsertRsvp({
      name,
      phoneNumber,
      attendance,
      guestCount,
      message: message || null,
    });
    return { status: "success", message: "Terima kasih. Maklum balas anda telah disimpan.", fieldErrors: {} };
  } catch (error) {
    console.error("RSVP submission failed", error);
    return { status: "error", message: "Maklum balas belum dapat disimpan. Sila cuba lagi sebentar.", fieldErrors: {} };
  }
}

