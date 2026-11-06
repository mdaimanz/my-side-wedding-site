import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeMalaysianPhone(value: string): string | null {
  const phone = parsePhoneNumberFromString(value.trim(), "MY");
  if (!phone?.isValid() || phone.country !== "MY") return null;
  return phone.number;
}

