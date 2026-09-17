import en from "react-phone-number-input/locale/en.json";

function normalizeCountryLookup(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ");
}

const ALIASES: Record<string, string> = {
  usa: "US",
  uk: "GB",
  uae: "AE",
  "great britain": "GB",
  england: "GB",
};

let nameToIsoCache: Map<string, string> | null = null;

function getNameToIsoMap(): Map<string, string> {
  if (nameToIsoCache) {
    return nameToIsoCache;
  }

  const map = new Map<string, string>();
  const labels = en as Record<string, string>;

  for (const [iso, label] of Object.entries(labels)) {
    if (!/^[A-Z]{2}$/.test(iso)) {
      continue;
    }
    const name = normalizeCountryLookup(label);
    if (name) {
      map.set(name, iso);
    }
  }

  nameToIsoCache = map;
  return map;
}

export function resolveTwilioCountryInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) {
    return null;
  }

  if (/^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase();
  }

  const normalized = normalizeCountryLookup(raw);
  const alias = ALIASES[normalized];
  if (alias) {
    return alias;
  }

  const map = getNameToIsoMap();
  const exact = map.get(normalized);
  if (exact) {
    return exact;
  }

  if (normalized.length < 4) {
    return null;
  }

  let partial: string | null = null;
  for (const [name, iso] of map.entries()) {
    if (name.startsWith(normalized) || normalized.startsWith(name)) {
      if (partial && partial !== iso) {
        return null;
      }
      partial = iso;
    }
  }

  return partial;
}

export function countryDisplayName(isoOrName: string): string {
  const iso = resolveTwilioCountryInput(isoOrName);
  if (!iso) {
    return isoOrName.trim();
  }
  const labels = en as Record<string, string>;
  return labels[iso]?.trim() || iso;
}
