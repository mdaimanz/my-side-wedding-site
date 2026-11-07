"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAdminSession, createAdminSession, requireAdmin } from "@/lib/admin-auth";
import { setWishVisibility } from "@/lib/db";

export type LoginState = { error: string };

export async function loginAdmin(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) return { error: "Admin credentials are not configured." };
  if (username !== expectedUsername || password !== expectedPassword) return { error: "Nama pengguna atau kata laluan tidak tepat." };

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export type WishVisibilityState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateWishVisibility(
  _previous: WishVisibilityState,
  formData: FormData,
): Promise<WishVisibilityState> {
  await requireAdmin();

  const guestIdValue = formData.get("guestId");
  const guestId = Number(guestIdValue);
  const visibility = formData.get("visible");
  const name = formData.get("name");
  const message = formData.get("message");
  if (
    typeof guestIdValue !== "string" || !/^\d+$/.test(guestIdValue) ||
    !Number.isSafeInteger(guestId) || guestId <= 0 ||
    (visibility !== "true" && visibility !== "false") ||
    typeof name !== "string" || typeof message !== "string" ||
    (visibility === "true" && (!name.trim() || !message.trim()))
  ) {
    return { status: "error", message: "Maklumat ucapan tidak sah." };
  }

  try {
    const updated = await setWishVisibility({ guestId, visible: visibility === "true", name, message });
    if (!updated) {
      return { status: "error", message: "Rekod telah berubah. Muat semula halaman sebelum mencuba lagi." };
    }
  } catch {
    console.error("Wedding wish visibility could not be updated.");
    return { status: "error", message: "Paparan ucapan belum dapat dikemas kini. Sila cuba lagi." };
  }

  revalidatePath("/admin");
  return { status: "success", message: visibility === "true" ? "Ucapan telah diterbitkan." : "Ucapan telah disembunyikan." };
}

