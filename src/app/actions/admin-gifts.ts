"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createGift as createGiftRecord,
  releaseGiftReservation,
  setGiftActive,
  updateGift as updateGiftRecord,
} from "@/lib/db";

export type GiftAdminState = {
  status: "idle" | "success" | "error";
  message: string;
};

type GiftInput = { name: string; purchaseUrl: string; displayOrder: number };

function parseGiftId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseGiftInput(formData: FormData): GiftInput | null {
  const name = String(formData.get("name") ?? "").trim();
  const purchaseUrlValue = String(formData.get("purchaseUrl") ?? "").trim();
  const displayOrderValue = formData.get("displayOrder");
  const displayOrder = Number(displayOrderValue);

  if (!name || name.length > 160) return null;
  if (
    typeof displayOrderValue !== "string" || !/^\d+$/.test(displayOrderValue) ||
    !Number.isSafeInteger(displayOrder) || displayOrder < 0 || displayOrder > 999999
  ) return null;

  try {
    const parsedUrl = new URL(purchaseUrlValue);
    if ((parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || parsedUrl.toString().length > 2048) {
      return null;
    }
    return { name, purchaseUrl: parsedUrl.toString(), displayOrder };
  } catch {
    return null;
  }
}

function refreshGiftPages() {
  revalidatePath("/gift");
  revalidatePath("/admin/gifts");
}

export async function createGift(
  _previous: GiftAdminState,
  formData: FormData,
): Promise<GiftAdminState> {
  await requireAdmin();
  const input = parseGiftInput(formData);
  if (!input) return { status: "error", message: "Nama, pautan, atau susunan hadiah tidak sah." };

  try {
    await createGiftRecord(input);
  } catch (error) {
    console.error("Gift could not be created", error);
    return { status: "error", message: "Hadiah belum dapat ditambah. Sila cuba lagi." };
  }
  refreshGiftPages();
  return { status: "success", message: "Hadiah telah ditambah." };
}

export async function updateGift(
  _previous: GiftAdminState,
  formData: FormData,
): Promise<GiftAdminState> {
  await requireAdmin();
  const giftId = parseGiftId(formData.get("giftId"));
  const input = parseGiftInput(formData);
  if (!giftId || !input) return { status: "error", message: "Maklumat hadiah tidak sah." };

  try {
    if (!(await updateGiftRecord({ giftId, ...input }))) {
      return { status: "error", message: "Hadiah tidak ditemui." };
    }
  } catch (error) {
    console.error("Gift could not be updated", error);
    return { status: "error", message: "Hadiah belum dapat dikemas kini. Sila cuba lagi." };
  }
  refreshGiftPages();
  return { status: "success", message: "Hadiah telah dikemas kini." };
}

export async function toggleGiftActive(
  _previous: GiftAdminState,
  formData: FormData,
): Promise<GiftAdminState> {
  await requireAdmin();
  const giftId = parseGiftId(formData.get("giftId"));
  const activeValue = formData.get("active");
  if (!giftId || (activeValue !== "true" && activeValue !== "false")) {
    return { status: "error", message: "Permintaan hadiah tidak sah." };
  }
  const active = activeValue === "true";

  try {
    if (!(await setGiftActive({ giftId, active }))) {
      return { status: "error", message: "Hadiah tidak ditemui." };
    }
  } catch (error) {
    console.error("Gift active state could not be updated", error);
    return { status: "error", message: "Status hadiah belum dapat dikemas kini." };
  }
  refreshGiftPages();
  return { status: "success", message: active ? "Hadiah telah diaktifkan semula." : "Hadiah telah diarkibkan." };
}

export async function releaseGift(
  _previous: GiftAdminState,
  formData: FormData,
): Promise<GiftAdminState> {
  await requireAdmin();
  const giftId = parseGiftId(formData.get("giftId"));
  if (!giftId) return { status: "error", message: "Permintaan pelepasan tidak sah." };

  try {
    if (!(await releaseGiftReservation(giftId))) {
      return { status: "error", message: "Tempahan tidak ditemui atau telah dilepaskan." };
    }
  } catch (error) {
    console.error("Gift reservation could not be released", error);
    return { status: "error", message: "Tempahan belum dapat dilepaskan." };
  }
  refreshGiftPages();
  return { status: "success", message: "Tempahan telah dilepaskan." };
}
