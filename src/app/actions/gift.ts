"use server";

import { revalidatePath } from "next/cache";
import { createGiftReservation } from "@/lib/db";
import { normalizeMalaysianPhone } from "@/lib/phone";

export type GiftReservationField = "name" | "phone";

export type GiftReservationState = {
  status: "idle" | "success" | "error" | "conflict";
  message: string;
  fieldErrors: Partial<Record<GiftReservationField, string>>;
};

function validationError(field: GiftReservationField, message: string): GiftReservationState {
  return { status: "error", message: "", fieldErrors: { [field]: message } };
}

export async function reserveGift(
  _previous: GiftReservationState,
  formData: FormData,
): Promise<GiftReservationState> {
  const giftIdValue = formData.get("giftId");
  const giftId = Number(giftIdValue);
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = normalizeMalaysianPhone(String(formData.get("phone") ?? ""));

  if (
    typeof giftIdValue !== "string" || !/^\d+$/.test(giftIdValue) ||
    !Number.isSafeInteger(giftId) || giftId <= 0
  ) {
    return { status: "error", message: "Hadiah yang dipilih tidak sah.", fieldErrors: {} };
  }
  if (name.length < 2 || name.length > 120 || !/^[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)*$/u.test(name)) {
    return validationError("name", "Sila masukkan nama penuh yang sah.");
  }
  if (!phoneNumber) {
    return validationError("phone", "Sila masukkan nombor telefon Malaysia yang sah.");
  }

  try {
    const reserved = await createGiftReservation({ giftId, name, phoneNumber });
    if (!reserved) {
      revalidatePath("/gift");
      return {
        status: "conflict",
        message: "Maaf, hadiah ini telah ditempah atau tidak lagi tersedia.",
        fieldErrors: {},
      };
    }
  } catch (error) {
    console.error("Gift reservation failed", error);
    return {
      status: "error",
      message: "Tempahan belum dapat disimpan. Sila cuba lagi sebentar.",
      fieldErrors: {},
    };
  }

  revalidatePath("/gift");
  revalidatePath("/admin/gifts");
  return {
    status: "success",
    message: "Terima kasih. Hadiah ini telah ditempah atas nama anda.",
    fieldErrors: {},
  };
}
