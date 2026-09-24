import { isValidPhoneNumber } from "react-phone-number-input";

export function hasMeaningfulText(raw: string): boolean {
  return /\p{L}/u.test(raw);
}

export function meaningfulTextValidationMessage(
  raw: string,
  fieldLabel: string,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!hasMeaningfulText(trimmed)) {
    return `${fieldLabel} must include letters, not only numbers.`;
  }
  const letters = (trimmed.match(/\p{L}/gu) ?? []).length;
  const digits = (trimmed.match(/\p{N}/gu) ?? []).length;
  if (digits > 0 && letters < 2) {
    return `${fieldLabel} needs real words — add more letters, not just numbers.`;
  }
  return null;
}

export function personNameValidationMessage(
  raw: string,
  fieldLabel = "Name",
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return `Enter a ${fieldLabel.toLowerCase()}.`;
  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters.`;
  }
  return meaningfulTextValidationMessage(trimmed, fieldLabel);
}

export function guestNameValidationMessage(raw: string): string | null {
  return personNameValidationMessage(raw, "Guest name");
}

export function emailValidationMessage(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "Enter an email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function phoneValidationMessage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter a phone number.";
  if (!isValidPhoneNumber(trimmed)) {
    return "Enter a valid phone number.";
  }
  return null;
}
