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

/** Builds location chips from saved draft audience (legacy fields + new locations array). */
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

/** Keeps draft payload compatible with existing backend audience fields. */
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

/** Search addresses and places via OpenStreetMap Photon (no API key). */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    lang: "en",
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Location search failed. Try again.");
  }

  const data = (await response.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number] };
      properties: Record<string, string | undefined>;
    }>;
  };

  return (data.features ?? []).map((feature, index) => {
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
