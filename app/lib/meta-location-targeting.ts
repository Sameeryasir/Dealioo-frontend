import type { AdSetLocationTarget, MetaDistanceUnit } from "@/app/lib/meta-campaign-builder-types";
import { COUNTRIES } from "@/app/lib/meta-adset-builder-helpers";

export type LocationSearchResult = {
  id: string;
  label: string;
  countryCode: string;
  countryName: string;
  latitude: number;
  longitude: number;
  type: "address" | "country";
};

export function getCountryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

export function createLocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildLocationsFromAudience(audience?: {
  country?: string;
  region?: string;
  city?: string;
  radius?: number;
  distanceUnit?: MetaDistanceUnit;
  latitude?: number;
  longitude?: number;
  locations?: AdSetLocationTarget[];
}): AdSetLocationTarget[] {
  if (audience?.locations?.length) {
    return audience.locations;
  }

  if (!audience?.country) {
    const guessed = guessCountryFromTimezone();
    if (guessed) return [guessed];
    return [
      {
        id: createLocationId(),
        mode: "include",
        type: "country",
        countryCode: "US",
        countryName: "United States",
        label: "United States",
      },
    ];
  }

  const countryCode = audience.country.toUpperCase();
  const countryName = getCountryLabel(countryCode);

  if (
    audience.city?.trim() ||
    (audience.latitude != null && audience.longitude != null)
  ) {
    return [
      {
        id: createLocationId(),
        mode: "include",
        type: "address",
        countryCode,
        countryName,
        label: audience.city?.trim() || countryName,
        latitude: audience.latitude,
        longitude: audience.longitude,
        radius: audience.radius ?? 16,
        distanceUnit: audience.distanceUnit ?? "kilometer",
        useRadius: true,
      },
    ];
  }

  return [
    {
      id: createLocationId(),
      mode: "include",
      type: "country",
      countryCode,
      countryName,
      label: countryName,
    },
  ];
}

export function deriveLegacyAudienceFields(locations: AdSetLocationTarget[]) {
  const included = locations.filter((loc) => loc.mode === "include");
  const primary =
    included.find((loc) => loc.type === "address") ?? included[0];

  if (!primary) {
    return { country: "US" };
  }

  if (primary.type === "address") {
    return {
      country: primary.countryCode,
      city: primary.label,
      radius: primary.radius ?? 16,
      distanceUnit: primary.distanceUnit ?? ("kilometer" as MetaDistanceUnit),
      latitude: primary.latitude,
      longitude: primary.longitude,
    };
  }

  return {
    country: primary.countryCode,
  };
}

function formatPhotonLabel(properties: Record<string, string | undefined>): string {
  const parts = [
    properties.housenumber,
    properties.street,
    properties.city ?? properties.name,
    properties.state,
    properties.country,
  ].filter(Boolean);

  return parts.join(", ") || properties.name || "Selected location";
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const countryHits: LocationSearchResult[] = COUNTRIES.filter((country) => {
    const q = trimmed.toLowerCase();
    return (
      country.label.toLowerCase().includes(q) ||
      country.code.toLowerCase() === q
    );
  }).map((country) => ({
    id: `country-${country.code}`,
    label: country.label,
    countryCode: country.code,
    countryName: country.label,
    latitude: 0,
    longitude: 0,
    type: "country" as const,
  }));

  try {
    const params = new URLSearchParams({
      q: trimmed,
      limit: "8",
      lang: "en",
    });

    const response = await fetch(
      `https://photon.komoot.io/api/?${params.toString()}`,
    );
    if (!response.ok) {
      return countryHits;
    }

    const data = (await response.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: Record<string, string | undefined>;
      }>;
    };

    const placeHits = (data.features ?? []).map((feature, index) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const countryCode = (feature.properties.countrycode ?? "US").toUpperCase();
      const countryName =
        feature.properties.country ?? getCountryLabel(countryCode);

      return {
        id: `search-${index}-${longitude}-${latitude}`,
        label: formatPhotonLabel(feature.properties),
        countryCode,
        countryName,
        latitude,
        longitude,
        type: "address" as const,
      };
    });

    return [...countryHits, ...placeHits];
  } catch {
    return countryHits;
  }
}

export function groupLocationsByCountry(
  locations: AdSetLocationTarget[],
): Map<string, AdSetLocationTarget[]> {
  const groups = new Map<string, AdSetLocationTarget[]>();

  for (const location of locations) {
    const key = location.countryName || getCountryLabel(location.countryCode);
    const existing = groups.get(key) ?? [];
    existing.push(location);
    groups.set(key, existing);
  }

  return groups;
}

export function radiusToMeters(
  radius: number,
  unit: MetaDistanceUnit,
): number {
  return unit === "mile" ? radius * 1609.34 : radius * 1000;
}

const TIMEZONE_COUNTRY_HINTS: Record<string, string> = {
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Sao_Paulo": "BR",
};

function countryTargetFromCode(countryCode: string): AdSetLocationTarget | null {
  const code = countryCode.trim().toUpperCase();
  if (!code || code.length !== 2) return null;
  if (!COUNTRIES.some((country) => country.code === code)) return null;
  const countryName = getCountryLabel(code);
  return {
    id: createLocationId(),
    mode: "include",
    type: "country",
    countryCode: code,
    countryName,
    label: countryName,
  };
}

export function guessCountryFromTimezone(
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): AdSetLocationTarget | null {
  const direct = TIMEZONE_COUNTRY_HINTS[timezone];
  if (direct) return countryTargetFromCode(direct);

  const region = timezone.split("/")[0]?.toLowerCase();
  if (region === "australia") return countryTargetFromCode("AU");
  if (timezone.startsWith("America/")) return countryTargetFromCode("US");
  if (timezone.startsWith("Europe/")) return countryTargetFromCode("GB");
  return null;
}

async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<AdSetLocationTarget | null> {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      lang: "en",
    });
    const response = await fetch(
      `https://photon.komoot.io/reverse?${params.toString()}`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: Record<string, string | undefined>;
      }>;
    };
    const feature = data.features?.[0];
    const properties = feature?.properties ?? {};
    const countryCode = (properties.countrycode ?? "").toUpperCase();
    if (!countryCode) return null;

    const countryName =
      properties.country ?? getCountryLabel(countryCode);
    const city =
      properties.city?.trim() ||
      properties.name?.trim() ||
      properties.town?.trim() ||
      properties.state?.trim();

    if (city) {
      return {
        id: createLocationId(),
        mode: "include",
        type: "address",
        countryCode,
        countryName,
        label: [city, countryName].filter(Boolean).join(", "),
        latitude,
        longitude,
        radius: 16,
        distanceUnit: "kilometer",
        useRadius: true,
      };
    }

    return countryTargetFromCode(countryCode);
  } catch {
    return null;
  }
}

function readBrowserPosition(
  timeoutMs = 5000,
): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 300_000 },
    );
  });
}

export function isDefaultUnitedStatesOnly(
  locations: AdSetLocationTarget[],
): boolean {
  return (
    locations.length === 1 &&
    locations[0]?.mode === "include" &&
    locations[0]?.type === "country" &&
    locations[0]?.countryCode === "US"
  );
}

export async function detectUserLocationTarget(): Promise<AdSetLocationTarget | null> {
  const coords = await readBrowserPosition();
  if (coords) {
    const fromGeo = await reverseGeocodeLocation(
      coords.latitude,
      coords.longitude,
    );
    if (fromGeo) return fromGeo;
  }

  return guessCountryFromTimezone();
}
