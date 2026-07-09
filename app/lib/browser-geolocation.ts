export type ResolvedAddress = {
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
};

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was blocked. Allow location in your browser and try again.";
    case error.POSITION_UNAVAILABLE:
      return "Could not detect your location. Try again or enter the address manually.";
    case error.TIMEOUT:
      return "Location request timed out. Try again.";
    default:
      return "Could not get your location. Try again or enter the address manually.";
  }
}

/** Browser Geolocation API — free, no API key; user must allow access. */
export function requestBrowserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(geolocationErrorMessage(error)));
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

function pickCity(properties: Record<string, string | undefined>): string {
  return (
    properties.city?.trim() ||
    properties.town?.trim() ||
    properties.village?.trim() ||
    properties.municipality?.trim() ||
    properties.county?.trim() ||
    ""
  );
}

function pickState(properties: Record<string, string | undefined>): string {
  return properties.state?.trim() || properties.region?.trim() || "";
}

/** Reverse geocode coordinates via Photon (OpenStreetMap, no API key). */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ResolvedAddress> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    lang: "en",
  });

  const response = await fetch(
    `https://photon.komoot.io/reverse?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Could not look up your address. Enter location manually.");
  }

  const data = (await response.json()) as {
    features?: Array<{
      properties: Record<string, string | undefined>;
    }>;
  };

  const properties = data.features?.[0]?.properties;
  if (!properties) {
    throw new Error("No address found for your location. Enter it manually.");
  }

  return {
    city: pickCity(properties),
    state: pickState(properties),
    postalCode: properties.postcode?.trim() ?? "",
    country: properties.country?.trim() ?? "",
    latitude,
    longitude,
  };
}

/** Get GPS coordinates, then fill city/state/postal/country from reverse geocoding. */
export async function resolveAddressFromBrowserLocation(): Promise<ResolvedAddress> {
  const position = await requestBrowserLocation();
  const { latitude, longitude } = position.coords;
  return reverseGeocodeCoordinates(latitude, longitude);
}
