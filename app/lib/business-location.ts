const LOCATION_NAME_PATTERN = /^[\p{L}\p{M}\s.'’-]+$/u;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9\s-]+$/;

export function isValidLocationName(value: string, required = true): boolean {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  return LOCATION_NAME_PATTERN.test(trimmed);
}

export function isValidPostalCode(value: string, required = true): boolean {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  if (trimmed.length < 2 || trimmed.length > 20) return false;
  return POSTAL_CODE_PATTERN.test(trimmed);
}

export function locationFieldMessage(
  field: "city" | "state" | "country" | "postalCode",
  value: string,
  required = true,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    if (!required) return null;
    if (field === "city") return "Please enter a city.";
    if (field === "state") return "Please enter a state or region.";
    if (field === "country") return "Please enter a country.";
    return "Please enter a postal / zip code.";
  }

  if (field === "postalCode") {
    return isValidPostalCode(trimmed, true)
      ? null
      : "Enter a valid postal / zip code (letters, numbers, spaces, or hyphens).";
  }

  return isValidLocationName(trimmed, true)
    ? null
    : field === "city"
      ? "Enter a valid city name."
      : field === "state"
        ? "Enter a valid state or region."
        : "Enter a valid country name.";
}

export function validateBusinessLocation(input: {
  city: string;
  state: string;
  postalCode: string;
  country: string;
}, required = true): string | null {
  return (
    locationFieldMessage("city", input.city, required) ??
    locationFieldMessage("state", input.state, required) ??
    locationFieldMessage("postalCode", input.postalCode, required) ??
    locationFieldMessage("country", input.country, required)
  );
}
