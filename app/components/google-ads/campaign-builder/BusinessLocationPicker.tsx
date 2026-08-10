"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import {
  formatLocationOption,
  reverseGeocodeCoordinates,
  searchGoogleAdsLocations,
  type GoogleAdsLocationRef,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

const LocationRadiusMap = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/LocationRadiusMap").then(
      (mod) => mod.LocationRadiusMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f4f8ff] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

const FALLBACK_CENTER = { latitude: 20, longitude: 0 };

export type BusinessLocationPickerValue = {
  businessLocation: string;
  businessAddress: string;
  businessLocationLat: number | null;
  businessLocationLng: number | null;
};

type BusinessLocationPickerProps = {
  value: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (patch: BusinessLocationPickerValue) => void;
  error?: string;
  label?: string;
  description?: string;
  required?: boolean;
};

function readBrowserPosition(
  timeoutMs = 10000,
): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }

    const timer = window.setTimeout(() => {
      reject(new Error("Timed out while getting your location."));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        window.clearTimeout(timer);
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Allow location access or pick a spot on the map."
              : "Could not read your current location. Try the map instead.",
          ),
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

export function BusinessLocationPicker({
  value,
  latitude,
  longitude,
  onChange,
  error,
  label = "Business location",
  description = "Use your current location, search an address, or tap the map to place a pin.",
  required = true,
}: BusinessLocationPickerProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GoogleAdsLocationRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searched, setSearched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingPin, setResolvingPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const skipNextQuerySync = useRef(false);
  const suppressSearchRef = useRef(false);
  const allowSearchRef = useRef(false);

  useEffect(() => {
    if (skipNextQuerySync.current) {
      skipNextQuerySync.current = false;
      return;
    }
    setQuery(value);
    setOpen(false);
    setResults([]);
    setSearched(false);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (
      !allowSearchRef.current ||
      suppressSearchRef.current ||
      trimmed.length < 2
    ) {
      setResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!allowSearchRef.current || suppressSearchRef.current) return;
      setSearching(true);
      void searchGoogleAdsLocations(trimmed)
        .then((rows) => {
          if (!allowSearchRef.current || suppressSearchRef.current) return;
          setResults(rows);
          setActiveIndex(0);
          setSearched(true);
          setOpen(true);
        })
        .catch(() => {
          if (!allowSearchRef.current || suppressSearchRef.current) return;
          setResults([]);
          setSearched(true);
          setOpen(true);
        })
        .finally(() => setSearching(false));
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const applyPlace = (label: string, lat: number, lng: number) => {
    allowSearchRef.current = false;
    suppressSearchRef.current = true;
    skipNextQuerySync.current = true;
    setQuery(label);
    setLocalError(null);
    setOpen(false);
    setResults([]);
    setSearching(false);
    setSearched(false);
    onChange({
      businessLocation: label,
      businessAddress: label,
      businessLocationLat: lat,
      businessLocationLng: lng,
    });
    setMapFocusToken((token) => token + 1);
  };

  const selectSuggestion = (location: GoogleAdsLocationRef) => {
    const lat = location.latitude;
    const lng = location.longitude;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      allowSearchRef.current = false;
      suppressSearchRef.current = true;
      skipNextQuerySync.current = true;
      setQuery(location.name);
      setOpen(false);
      setResults([]);
      setSearching(false);
      setSearched(false);
      onChange({
        businessLocation: location.name,
        businessAddress: location.name,
        businessLocationLat: null,
        businessLocationLng: null,
      });
      setLocalError("This place has no map coordinates. Try another suggestion or tap the map.");
      return;
    }
    applyPlace(location.name, lat, lng);
  };

  const resolveFromCoordinates = async (lat: number, lng: number) => {
    setResolvingPin(true);
    setLocalError(null);
    try {
      const resolved = await reverseGeocodeCoordinates(lat, lng);
      if (resolved) {
        applyPlace(resolved.label, resolved.latitude, resolved.longitude);
        return;
      }
      applyPlace(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng);
    } finally {
      setResolvingPin(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setLocalError(null);
    try {
      const position = await readBrowserPosition();
      await resolveFromCoordinates(position.latitude, position.longitude);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "Could not get your current location.",
      );
    } finally {
      setLocating(false);
    }
  };

  const hasPin = latitude != null && longitude != null;
  const mapLat = hasPin ? latitude : FALLBACK_CENTER.latitude;
  const mapLng = hasPin ? longitude : FALLBACK_CENTER.longitude;
  const displayError = error || localError;
  const showSuggestions =
    open &&
    query.trim().length >= 2 &&
    (searching || searched || results.length > 0);

  return (
    <div ref={rootRef} className="space-y-3">
      <div>
        <p className="text-sm font-bold text-[#07111f]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-[#f8fafc] px-3 py-2.5 ${
              displayError ? "border-red-300" : "border-[#e8edf5]"
            }`}
          >
            <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
            <input
              className="w-full bg-transparent text-sm text-[#07111f] outline-none placeholder:text-slate-400"
              value={query}
              placeholder="Search address or place"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={listboxId}
              aria-autocomplete="list"
              onFocus={() => {
                if (
                  allowSearchRef.current &&
                  query.trim().length >= 2 &&
                  (results.length || searched)
                ) {
                  setOpen(true);
                }
              }}
              onBlur={() => {
                setOpen(false);
                const trimmed = query.trim();
                if (trimmed && trimmed !== value.trim()) {
                  onChange({
                    businessLocation: trimmed,
                    businessAddress: trimmed,
                    businessLocationLat: latitude,
                    businessLocationLng: longitude,
                  });
                }
              }}
              onChange={(e) => {
                allowSearchRef.current = true;
                suppressSearchRef.current = false;
                setQuery(e.target.value);
                setOpen(true);
                setLocalError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                  setActiveIndex((index) =>
                    results.length ? (index + 1) % results.length : 0,
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setOpen(true);
                  setActiveIndex((index) =>
                    results.length
                      ? (index - 1 + results.length) % results.length
                      : 0,
                  );
                  return;
                }
                if (e.key === "Enter" && open && results[activeIndex]) {
                  e.preventDefault();
                  selectSuggestion(results[activeIndex]);
                }
              }}
            />
            {searching || resolvingPin ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-[#4285F4]"
                aria-hidden
              />
            ) : query ? (
              <button
                type="button"
                aria-label="Clear location"
                className="rounded-full p-0.5 text-slate-400 hover:bg-[#e8edf5] hover:text-slate-600"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearched(false);
                  setOpen(false);
                  onChange({
                    businessLocation: "",
                    businessAddress: "",
                    businessLocationLat: null,
                    businessLocationLng: null,
                  });
                }}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          {showSuggestions ? (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-lg"
            >
              {searching ? (
                <li className="px-3 py-2.5 text-sm text-slate-500">
                  Searching places…
                </li>
              ) : null}
              {!searching && searched && results.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-slate-500">
                  No places found. Try another search or use the map.
                </li>
              ) : null}
              {!searching
                ? results.map((location, index) => (
                    <li
                      key={`${location.type}-${location.id}-${location.name}-${location.latitude}-${location.longitude}`}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                          index === activeIndex
                            ? "bg-[#f4f8ff] text-[#4285F4]"
                            : "text-[#07111f] hover:bg-[#f8fafc]"
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(location)}
                      >
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          {location.name}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {formatLocationOption(location).split(" · ")[1]}
                        </span>
                      </button>
                    </li>
                  ))
                : null}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleUseCurrentLocation()}
          disabled={locating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dbeafe] bg-[#f4f8ff] px-3.5 py-2.5 text-sm font-semibold text-[#4285F4] transition hover:border-[#4285F4] hover:bg-[#e8f0fe] disabled:cursor-wait disabled:opacity-70"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="size-4" aria-hidden />
          )}
          {locating ? "Locating…" : "Use current location"}
        </button>
      </div>

      <div className="space-y-2">
        <LocationRadiusMap
          latitude={mapLat}
          longitude={mapLng}
          radiusValue={1}
          radiusUnit="KILOMETERS"
          showRadius={false}
          countryZoom={!hasPin}
          focusToken={mapFocusToken}
          onPinMove={(nextLat, nextLng) => {
            void resolveFromCoordinates(nextLat, nextLng);
          }}
        />
        <p className="text-xs text-slate-500">
          {hasPin
            ? "Drag the pin or click the map to adjust your business location."
            : "Click the map to drop a pin at your business."}
        </p>
      </div>

      {displayError ? (
        <p className="text-xs font-medium text-red-500">{displayError}</p>
      ) : null}
    </div>
  );
}
