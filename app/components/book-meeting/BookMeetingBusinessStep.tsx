"use client";

import { BusinessOptionSelect } from "@/app/components/business/BusinessOptionSelect";
import { BookMeetingPhoneInput } from "@/app/components/book-meeting/BookMeetingPhoneInput";
import logoStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import { BUSINESS_TYPE_OPTIONS } from "@/app/lib/business-type-currency";
import { withAutomaticHttps } from "@/app/lib/website-url";
import { Building2, Globe, Mail, Map, MapPin, Search, Tag } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const RegisterBusinessLocationMap = dynamic(
  () =>
    import("@/app/components/register-business/RegisterBusinessLocationMap").then(
      (mod) => mod.RegisterBusinessLocationMap,
    ),
  { ssr: false },
);

export type BookMeetingBusinessDetails = {
  businessName: string;
  businessPhone: string;
  businessCategory: string;
  businessEmail: string;
  description: string;
  website: string;
  cityLocation: string;
  state: string;
  postalCode: string;
  country: string;
};

type BookMeetingBusinessStepProps = BookMeetingBusinessDetails & {
  section: "about" | "location";
  onChange: (patch: Partial<BookMeetingBusinessDetails>) => void;
};

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

type LocationSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function addressFromNominatim(address?: NominatimAddress) {
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

async function searchBusinessLocations(
  query: string,
): Promise<{ failed: boolean; results: LocationSearchResult[] }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { failed: false, results: [] };
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("q", trimmed);
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) return { failed: true, results: [] };
    const results = (await response.json()) as Array<{
      place_id: number | string;
      display_name: string;
      lat: string;
      lon: string;
      address?: NominatimAddress;
    }>;
    return {
      failed: false,
      results: results
      .map((row) => {
        const latitude = Number(row.lat);
        const longitude = Number(row.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return {
          id: String(row.place_id),
          label: row.display_name,
          latitude,
          longitude,
          ...addressFromNominatim(row.address),
        };
      })
      .filter((row): row is LocationSearchResult => row != null),
    };
  } catch {
    return { failed: true, results: [] };
  }
}

async function reverseGeocodeBusinessAddress(latitude: number, longitude: number) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = (await response.json()) as { address?: NominatimAddress };
    if (!payload.address) return null;
    return addressFromNominatim(payload.address);
  } catch {
    return null;
  }
}

export function BookMeetingBusinessStep({
  section,
  onChange,
  ...values
}: BookMeetingBusinessStepProps) {
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchFailed, setLocationSearchFailed] = useState(false);
  const [mapPin, setMapPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = locationSearch.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setLocationSearching(false);
      return;
    }
    let cancelled = false;
    setLocationSearching(true);
    const timer = window.setTimeout(() => {
      void searchBusinessLocations(query).then((outcome) => {
        if (cancelled) return;
        setLocationResults(outcome.results);
        setLocationSearchFailed(outcome.failed);
        setLocationSearching(false);
        setLocationSearchOpen(true);
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [locationSearch]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!locationSearchRef.current?.contains(event.target as Node)) {
        setLocationSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const applyLocationResult = useCallback(
    (result: LocationSearchResult) => {
      setMapPin({ latitude: result.latitude, longitude: result.longitude });
      onChange({
        cityLocation: result.city || values.cityLocation,
        state: result.state || values.state,
        postalCode: result.postalCode || values.postalCode,
        country: result.country || values.country,
      });
      setLocationSearch(result.label);
      setLocationResults([]);
      setLocationSearchOpen(false);
    },
    [onChange, values.cityLocation, values.country, values.postalCode, values.state],
  );

  if (section === "about") {
    return (
    <div className={logoStyles.basicsFields}>
        <label>
          <span className={logoStyles.basicsLabel}>
            Business name<span className={logoStyles.basicsRequired}>*</span>
          </span>
          <span className={logoStyles.basicsInputWrap}>
            <Building2 className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
            <input
              name="business-name"
              autoComplete="organization"
              className={logoStyles.basicsInput}
              placeholder="Enter your business name"
              value={values.businessName}
              onChange={(event) => onChange({ businessName: event.target.value })}
            />
          </span>
        </label>
        <label>
          <span className={logoStyles.basicsLabel}>
            Contact number<span className={logoStyles.basicsRequired}>*</span>
          </span>
          <div className={logoStyles.basicsPhoneWrap}>
            <BookMeetingPhoneInput
              variant="boxed"
              value={values.businessPhone}
              onChange={(businessPhone) => onChange({ businessPhone })}
            />
          </div>
        </label>
        <label>
          <span className={logoStyles.basicsLabel}>
            Business type<span className={logoStyles.basicsRequired}>*</span>
          </span>
          <span className={logoStyles.basicsInputWrap}>
            <Tag className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
            <BusinessOptionSelect
              value={values.businessCategory}
              options={[...BUSINESS_TYPE_OPTIONS]}
              placeholder="Select business type"
              ariaLabel="Business type"
              triggerClassName={`${logoStyles.basicsInput} ${logoStyles.basicsSelectTrigger}`}
              onChange={(businessCategory) => onChange({ businessCategory })}
            />
          </span>
        </label>
        <label>
          <span className={logoStyles.basicsLabel}>
            Business email<span className={logoStyles.basicsRequired}>*</span>
          </span>
          <span className={logoStyles.basicsInputWrap}>
            <Mail className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
            <input
              type="email"
              name="business-email"
              autoComplete="email"
              className={logoStyles.basicsInput}
              placeholder="you@business.com"
              value={values.businessEmail}
              onChange={(event) => onChange({ businessEmail: event.target.value })}
            />
          </span>
        </label>
        <label>
          <span className={logoStyles.basicsLabel}>
            Description<span className={logoStyles.basicsRequired}>*</span>
          </span>
          <textarea
            name="business-description"
            autoComplete="off"
            className={logoStyles.basicsTextarea}
            rows={4}
            maxLength={500}
            placeholder="Tell customers what you do"
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </label>
        <label>
          <span className={logoStyles.basicsLabel}>Website</span>
          <span className={logoStyles.basicsInputWrap}>
            <Globe className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
            <input
              type="url"
              name="business-website"
              autoComplete="url"
              className={logoStyles.basicsInput}
              placeholder="https://yourwebsite.com"
              value={values.website}
              onChange={(event) =>
                onChange({ website: withAutomaticHttps(event.target.value) })
              }
            />
          </span>
        </label>
    </div>
    );
  }

  return (
      <section className={logoStyles.locationForm}>
        <div ref={locationSearchRef} className={logoStyles.locationSearch}>
          <span className={logoStyles.basicsLabel}>Search location</span>
          <span className={logoStyles.basicsInputWrap}>
            <Search className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
            <input
              type="text"
              className={logoStyles.basicsInput}
              placeholder="Search city, address, or place"
              value={locationSearch}
              autoComplete="off"
              onChange={(event) => {
                setLocationSearch(event.target.value);
                setLocationSearchOpen(true);
              }}
              onFocus={() => {
                if (locationResults.length > 0) setLocationSearchOpen(true);
              }}
            />
          </span>
          {locationSearchOpen && locationSearch.trim().length >= 2 ? (
            <div className={logoStyles.locationSearchMenu} role="listbox">
              {locationSearching ? (
                <p className={logoStyles.locationSearchStatus}>Searching…</p>
              ) : locationSearchFailed ? (
                <p className={logoStyles.locationSearchStatus}>
                  Search is unavailable right now. Type the city, state, postal code, and country below.
                </p>
              ) : locationResults.length === 0 ? (
                <p className={logoStyles.locationSearchStatus}>No matching locations. Try another search.</p>
              ) : (
                locationResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className={logoStyles.locationSearchOption}
                    onClick={() => applyLocationResult(result)}
                  >
                    <MapPin className="size-4 shrink-0 text-[#1877F2]" strokeWidth={2.25} aria-hidden />
                    <span>{result.label}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className={logoStyles.locationMap}>
          <RegisterBusinessLocationMap
            latitude={mapPin?.latitude ?? null}
            longitude={mapPin?.longitude ?? null}
            dropPinMode
            onDropPin={(latitude, longitude) => {
              setMapPin({ latitude, longitude });
              void reverseGeocodeBusinessAddress(latitude, longitude).then((place) => {
                if (!place) {
                  setLocationSearchFailed(true);
                  setLocationSearchOpen(true);
                  return;
                }
                setLocationSearchFailed(false);
                onChange({
                  cityLocation: values.cityLocation.trim() || place.city,
                  state: values.state.trim() || place.state,
                  postalCode: values.postalCode.trim() || place.postalCode,
                  country: values.country.trim() || place.country,
                });
              });
            }}
          />
        </div>

        <div className={logoStyles.locationGrid}>
          <label>
            <span className={logoStyles.basicsLabel}>
              City<span className={logoStyles.basicsRequired}>*</span>
            </span>
            <span className={logoStyles.basicsInputWrap}>
              <Building2 className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
              <input
                name="business-city"
                autoComplete="address-level2"
                className={logoStyles.basicsInput}
                placeholder="Enter city"
                value={values.cityLocation}
                onChange={(event) => onChange({ cityLocation: event.target.value })}
              />
            </span>
          </label>
          <label>
            <span className={logoStyles.basicsLabel}>
              State / region<span className={logoStyles.basicsRequired}>*</span>
            </span>
            <span className={logoStyles.basicsInputWrap}>
              <Map className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
              <input
                name="business-state"
                autoComplete="address-level1"
                className={logoStyles.basicsInput}
                placeholder="Enter state or region"
                value={values.state}
                onChange={(event) => onChange({ state: event.target.value })}
              />
            </span>
          </label>
          <label>
            <span className={logoStyles.basicsLabel}>
              Postal / ZIP<span className={logoStyles.basicsRequired}>*</span>
            </span>
            <span className={logoStyles.basicsInputWrap}>
              <Mail className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
              <input
                name="business-postal"
                autoComplete="postal-code"
                className={logoStyles.basicsInput}
                placeholder="Enter postal code"
                value={values.postalCode}
                onChange={(event) => onChange({ postalCode: event.target.value })}
              />
            </span>
          </label>
          <label>
            <span className={logoStyles.basicsLabel}>
              Country<span className={logoStyles.basicsRequired}>*</span>
            </span>
            <span className={logoStyles.basicsInputWrap}>
              <Globe className={`${logoStyles.basicsInputIcon} size-4`} strokeWidth={2.25} aria-hidden />
              <input
                name="business-country"
                autoComplete="country-name"
                className={logoStyles.basicsInput}
                placeholder="Enter country"
                value={values.country}
                onChange={(event) => onChange({ country: event.target.value })}
              />
            </span>
          </label>
        </div>
      </section>
  );
}
