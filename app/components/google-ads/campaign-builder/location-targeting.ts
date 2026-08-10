export type GoogleAdsLocationType =
  | "country"
  | "state"
  | "city"
  | "postal_code";

export type GoogleAdsLocationRef = {
  type: GoogleAdsLocationType;
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type PresenceOptionId =
  | "PRESENCE"
  | "SEARCH"
  | "PRESENCE_OR_INTEREST"
  | "PRESENCE_NOT_EXCLUDED";

export type RadiusUnitId = "KILOMETERS" | "MILES";

export type LocationTargetingPayload = {
  locations: GoogleAdsLocationRef[];
  excludedLocations: GoogleAdsLocationRef[];
  radius: {
    enabled: boolean;
    center: GoogleAdsLocationRef | null;
    value: number;
    unit: RadiusUnitId;
  };
  presenceOption: PresenceOptionId;
};

export const PRESENCE_OPTIONS: {
  id: PresenceOptionId;
  label: string;
  recommended?: boolean;
}[] = [
  {
    id: "PRESENCE",
    label: "People in or regularly in your targeted locations",
    recommended: true,
  },
  {
    id: "SEARCH",
    label: "People searching for your targeted locations",
  },
  {
    id: "PRESENCE_OR_INTEREST",
    label:
      "People in, regularly in, or searching for your targeted locations",
  },
  {
    id: "PRESENCE_NOT_EXCLUDED",
    label: "People not in your excluded locations",
  },
];

export const GOOGLE_ADS_COUNTRY_LOCATIONS: GoogleAdsLocationRef[] = [
  {
    type: "country",
    id: "2840",
    name: "United States",
    latitude: 39.8283,
    longitude: -98.5795,
  },
  {
    type: "country",
    id: "2124",
    name: "Canada",
    latitude: 56.1304,
    longitude: -106.3468,
  },
  {
    type: "country",
    id: "2826",
    name: "United Kingdom",
    latitude: 54.7024,
    longitude: -3.2766,
  },
  {
    type: "country",
    id: "2036",
    name: "Australia",
    latitude: -25.2744,
    longitude: 133.7751,
  },
  {
    type: "country",
    id: "2356",
    name: "India",
    latitude: 20.5937,
    longitude: 78.9629,
  },
  {
    type: "country",
    id: "2784",
    name: "United Arab Emirates",
    latitude: 23.4241,
    longitude: 53.8478,
  },
  {
    type: "country",
    id: "2682",
    name: "Saudi Arabia",
    latitude: 23.8859,
    longitude: 45.0792,
  },
  {
    type: "country",
    id: "2276",
    name: "Germany",
    latitude: 51.1657,
    longitude: 10.4515,
  },
  {
    type: "country",
    id: "2250",
    name: "France",
    latitude: 46.2276,
    longitude: 2.2137,
  },
  {
    type: "country",
    id: "2586",
    name: "Pakistan",
    latitude: 30.3753,
    longitude: 69.3451,
  },
];

const STATIC_REGION_CITY_SEED: GoogleAdsLocationRef[] = [
  {
    type: "state",
    id: "21137",
    name: "New South Wales",
    latitude: -32.1306,
    longitude: 147.018,
  },
  {
    type: "state",
    id: "21132",
    name: "Victoria",
    latitude: -36.9848,
    longitude: 143.3906,
  },
  {
    type: "state",
    id: "21135",
    name: "Queensland",
    latitude: -22.1646,
    longitude: 144.584,
  },
  {
    type: "state",
    id: "21133",
    name: "California",
    latitude: 36.7783,
    longitude: -119.4179,
  },
  {
    type: "state",
    id: "21167",
    name: "New York",
    latitude: 43.2994,
    longitude: -74.2179,
  },
  {
    type: "state",
    id: "21176",
    name: "Texas",
    latitude: 31.9686,
    longitude: -99.9018,
  },
  {
    type: "state",
    id: "20133",
    name: "Ontario",
    latitude: 51.2538,
    longitude: -85.3232,
  },
  {
    type: "state",
    id: "20027",
    name: "British Columbia",
    latitude: 53.7267,
    longitude: -127.6476,
  },
  {
    type: "city",
    id: "1006989",
    name: "Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    type: "city",
    id: "1007369",
    name: "Melbourne",
    latitude: -37.8136,
    longitude: 144.9631,
  },
  {
    type: "city",
    id: "1007200",
    name: "Brisbane",
    latitude: -27.4698,
    longitude: 153.0251,
  },
  {
    type: "city",
    id: "1015116",
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    type: "city",
    id: "1014044",
    name: "Los Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    type: "city",
    id: "1014221",
    name: "Chicago",
    latitude: 41.8781,
    longitude: -87.6298,
  },
  {
    type: "city",
    id: "1007751",
    name: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
  },
  {
    type: "city",
    id: "1006887",
    name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    type: "postal_code",
    id: "9031953",
    name: "2000",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    type: "postal_code",
    id: "9031954",
    name: "10001",
    latitude: 40.7506,
    longitude: -73.9971,
  },
];

export function resolveLocationCoordinates(
  location: GoogleAdsLocationRef | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!location) return null;
  if (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return { latitude: location.latitude, longitude: location.longitude };
  }
  const known = [...GOOGLE_ADS_COUNTRY_LOCATIONS, ...STATIC_REGION_CITY_SEED].find(
    (row) =>
      row.id === location.id ||
      (row.type === location.type &&
        row.name.toLowerCase() === location.name.toLowerCase()),
  );
  if (
    known &&
    typeof known.latitude === "number" &&
    typeof known.longitude === "number"
  ) {
    return { latitude: known.latitude, longitude: known.longitude };
  }
  return null;
}

function typeLabel(type: GoogleAdsLocationType): string {
  switch (type) {
    case "country":
      return "Country";
    case "state":
      return "State / Region";
    case "city":
      return "City";
    case "postal_code":
      return "Postal code";
    default:
      return "Location";
  }
}

export function formatLocationChip(location: GoogleAdsLocationRef): string {
  return location.name;
}

export function formatLocationOption(location: GoogleAdsLocationRef): string {
  return `${location.name} · ${typeLabel(location.type)}`;
}

function inferTypeFromPhoton(
  properties: Record<string, string | undefined>,
): GoogleAdsLocationType {
  const osm = (properties.osm_value || properties.type || "").toLowerCase();
  if (properties.postcode && !properties.city && !properties.name) {
    return "postal_code";
  }
  if (
    osm.includes("postcode") ||
    osm === "postal_code" ||
    (/^\d/.test(properties.name || "") && Boolean(properties.postcode))
  ) {
    return "postal_code";
  }
  if (
    osm.includes("state") ||
    osm.includes("province") ||
    osm.includes("region") ||
    properties.state === properties.name
  ) {
    return "state";
  }
  if (osm.includes("country") || properties.country === properties.name) {
    return "country";
  }
  return "city";
}

function locationKey(location: GoogleAdsLocationRef): string {
  return `${location.type}:${location.id}:${location.name.toLowerCase()}`;
}

export function isSameLocation(
  a: GoogleAdsLocationRef,
  b: GoogleAdsLocationRef,
): boolean {
  return locationKey(a) === locationKey(b);
}

export function deriveLegacyLocationFields(locations: GoogleAdsLocationRef[]) {
  return {
    countries: locations
      .filter((row) => row.type === "country")
      .map((row) => row.name),
    regions: locations
      .filter((row) => row.type === "state")
      .map((row) => row.name),
    cities: locations
      .filter((row) => row.type === "city" || row.type === "postal_code")
      .map((row) => row.name),
  };
}

export function buildLocationTargetingPayload(input: {
  targetLocations: GoogleAdsLocationRef[];
  excludedLocationTargets: GoogleAdsLocationRef[];
  radiusEnabled: boolean;
  radiusCenter: GoogleAdsLocationRef | null;
  radiusValue: number;
  radiusUnit: RadiusUnitId;
  presenceOption: PresenceOptionId;
}): LocationTargetingPayload {
  return {
    locations: input.targetLocations,
    excludedLocations: input.excludedLocationTargets,
    radius: {
      enabled: input.radiusEnabled,
      center: input.radiusEnabled ? input.radiusCenter : null,
      value: input.radiusValue,
      unit: input.radiusUnit,
    },
    presenceOption: input.presenceOption,
  };
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<{ label: string; latitude: number; longitude: number } | null> {
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
        properties?: Record<string, string | undefined>;
      }>;
    };
    const properties = data.features?.[0]?.properties ?? {};
    const street =
      [properties.housenumber, properties.street].filter(Boolean).join(" ") ||
      properties.name?.trim();
    const locality =
      properties.city?.trim() ||
      properties.town?.trim() ||
      properties.village?.trim() ||
      properties.county?.trim();
    const region = properties.state?.trim();
    const country = properties.country?.trim();
    const label = [street, locality, region, country]
      .filter(Boolean)
      .join(", ");

    if (!label) {
      return {
        label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
      };
    }

    return { label, latitude, longitude };
  } catch {
    return null;
  }
}

export async function searchGoogleAdsLocations(
  query: string,
): Promise<GoogleAdsLocationRef[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const q = trimmed.toLowerCase();
  const staticHits = [...GOOGLE_ADS_COUNTRY_LOCATIONS, ...STATIC_REGION_CITY_SEED]
    .filter((row) => row.name.toLowerCase().includes(q))
    .slice(0, 12);

  if (trimmed.length < 2) {
    return staticHits;
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      limit: "10",
      lang: "en",
    });
    const response = await fetch(
      `https://photon.komoot.io/api/?${params.toString()}`,
    );
    if (!response.ok) return staticHits;

    const data = (await response.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: Record<string, string | undefined>;
      }>;
    };

    const remoteHits = (data.features ?? []).map((feature, index) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const properties = feature.properties;
      const type = inferTypeFromPhoton(properties);
      const primary =
        type === "postal_code"
          ? properties.postcode || properties.name || trimmed
          : properties.name ||
            properties.city ||
            properties.state ||
            properties.country ||
            trimmed;
      const locality =
        properties.city?.trim() ||
        properties.town?.trim() ||
        properties.village?.trim();
      const region = properties.state?.trim();
      const country = properties.country?.trim();
      const extras = [locality, region, country].filter(
        (part) => part && part.toLowerCase() !== primary.toLowerCase(),
      );
      const name = extras.length ? `${primary}, ${extras.join(", ")}` : primary;
      const id = `geo-${type}-${properties.osm_id || `${longitude}-${latitude}-${index}`}`;

      return {
        type,
        id,
        name,
        latitude,
        longitude,
      } satisfies GoogleAdsLocationRef;
    });

    const merged: GoogleAdsLocationRef[] = [];
    const seen = new Set<string>();
    for (const row of [...staticHits, ...remoteHits]) {
      const key = locationKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
    return merged.slice(0, 16);
  } catch {
    return staticHits;
  }
}

export function migrateLegacyLocations(draft: {
  countries?: string[];
  regions?: string[];
  cities?: string[];
  excludedLocations?: string[] | GoogleAdsLocationRef[];
  targetLocations?: GoogleAdsLocationRef[];
  excludedLocationTargets?: GoogleAdsLocationRef[];
}): {
  targetLocations: GoogleAdsLocationRef[];
  excludedLocationTargets: GoogleAdsLocationRef[];
} {
  if (draft.targetLocations?.length) {
    return {
      targetLocations: draft.targetLocations,
      excludedLocationTargets:
        draft.excludedLocationTargets ??
        (Array.isArray(draft.excludedLocations) &&
        draft.excludedLocations.length > 0 &&
        typeof draft.excludedLocations[0] === "object"
          ? (draft.excludedLocations as GoogleAdsLocationRef[])
          : []),
    };
  }

  const fromNames = (
    names: string[] | undefined,
    type: GoogleAdsLocationType,
  ): GoogleAdsLocationRef[] =>
    (names ?? []).map((name, index) => {
      const known = [...GOOGLE_ADS_COUNTRY_LOCATIONS, ...STATIC_REGION_CITY_SEED].find(
        (row) =>
          row.type === type && row.name.toLowerCase() === name.toLowerCase(),
      );
      return (
        known ?? {
          type,
          id: `legacy-${type}-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
          name,
        }
      );
    });

  const excludedNames = Array.isArray(draft.excludedLocations)
    ? draft.excludedLocations.filter(
        (row): row is string => typeof row === "string",
      )
    : [];

  return {
    targetLocations: [
      ...fromNames(draft.countries, "country"),
      ...fromNames(draft.regions, "state"),
      ...fromNames(draft.cities, "city"),
    ],
    excludedLocationTargets: fromNames(excludedNames, "city"),
  };
}
