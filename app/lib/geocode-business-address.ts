type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export type GeocodedCoordinates = {
  latitude: number;
  longitude: number;
};

export type ReverseGeocodedAddress = {
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function addressFromNominatim(address?: NominatimAddress): ReverseGeocodedAddress {
  return {
    city:
      address?.city?.trim() ||
      address?.town?.trim() ||
      address?.village?.trim() ||
      address?.municipality?.trim() ||
      "",
    state: address?.state?.trim() || address?.region?.trim() || "",
    postalCode: address?.postcode?.trim() || "",
    country: address?.country?.trim() || "",
  };
}

export function buildBusinessAddressQuery(parts: {
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): string {
  return [parts.city, parts.state, parts.postalCode, parts.country]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(", ");
}

export async function geocodeBusinessAddress(
  query: string,
): Promise<GeocodedCoordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", trimmed);
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;
    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export async function reverseGeocodeBusinessAddress(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodedAddress | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { address?: NominatimAddress };
    if (!payload.address) return null;
    return addressFromNominatim(payload.address);
  } catch {
    return null;
  }
}
