import type { WeddingWish } from "@/types/wedding";

export const MAX_WEDDING_WISHES = 5;

/** Keep only valid public fields, including when handling an unexpected API response. */
export function normalizeWeddingWishes(value: unknown): WeddingWish[] {
  if (!Array.isArray(value)) return [];

  const wishes: WeddingWish[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.full_name !== "string" || typeof item.wish !== "string") continue;

    const full_name = item.full_name.trim();
    const wish = item.wish.trim();
    if (!full_name || !wish) continue;

    wishes.push({ full_name, wish });
    if (wishes.length === MAX_WEDDING_WISHES) break;
  }
  return wishes;
}
