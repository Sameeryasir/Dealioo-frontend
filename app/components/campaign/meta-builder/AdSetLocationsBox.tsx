"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Search, X } from "lucide-react";
import type {
  AdSetLocationTarget,
  MetaDistanceUnit,
  MetaLocationTargetMode,
} from "@/app/lib/meta-campaign-builder-types";
import {
  createLocationId,
  detectUserLocationTarget,
  isDefaultUnitedStatesOnly,
  searchLocations,
  type LocationSearchResult,
} from "@/app/lib/meta-location-targeting";

const AdSetLocationsMap = dynamic(
  () =>
    import("@/app/components/campaign/meta-builder/AdSetLocationsMap").then(
      (mod) => mod.AdSetLocationsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f8fafc] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

const RADIUS_PRESETS_KM = [1, 5, 10, 16, 25, 50, 80] as const;

const EXAMPLE_QUERIES = [
  "Pakistan",
  "Islamabad",
  "Rawalpindi",
  "New York",
  "California",
  "Sydney",
];

type AdSetLocationsBoxProps = {
  locations: AdSetLocationTarget[];
  onChange: (locations: AdSetLocationTarget[]) => void;
};

export function AdSetLocationsBox({ locations, onChange }: AdSetLocationsBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [radiusEnabled, setRadiusEnabled] = useState(false);
  const [dropPinEnabled, setDropPinEnabled] = useState(false);
  const [excludeEnabled, setExcludeEnabled] = useState(
    () => locations.some((loc) => loc.mode === "exclude"),
  );
  const [searchMode, setSearchMode] = useState<MetaLocationTargetMode>("include");
  const [activeLocationId, setActiveLocationId] = useState<string | null>(
    locations.find((loc) => loc.type === "address")?.id ?? null,
  );
  const [detectingLocation, setDetectingLocation] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const locationsRef = useRef(locations);
  const didAutoDetectRef = useRef(false);
  onChangeRef.current = onChange;
  locationsRef.current = locations;

  useEffect(() => {
    if (didAutoDetectRef.current) return;

    const starting = locationsRef.current;
    const shouldDetect =
      starting.length === 0 ||
      isDefaultUnitedStatesOnly(starting) ||
      (starting.length === 1 &&
        starting[0]?.mode === "include" &&
        starting[0]?.type === "country");

    if (!shouldDetect) {
      didAutoDetectRef.current = true;
      return;
    }

    let cancelled = false;
    didAutoDetectRef.current = true;
    setDetectingLocation(true);
    const startingSnapshot = starting
      .map((loc) => `${loc.mode}:${loc.type}:${loc.countryCode}:${loc.label}`)
      .join("|");

    void detectUserLocationTarget()
      .then((detected) => {
        if (cancelled || !detected) return;
        const latest = locationsRef.current;
        const latestSnapshot = latest
          .map((loc) => `${loc.mode}:${loc.type}:${loc.countryCode}:${loc.label}`)
          .join("|");
        if (latestSnapshot !== startingSnapshot) return;

        const alreadySameCountryOnly =
          latest.length === 1 &&
          latest[0]?.type === "country" &&
          detected.type === "country" &&
          latest[0]?.countryCode === detected.countryCode;
        if (alreadySameCountryOnly) return;

        onChangeRef.current([detected]);
        setActiveLocationId(detected.type === "address" ? detected.id : null);
      })
      .finally(() => {
        if (!cancelled) setDetectingLocation(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const included = useMemo(
    () => locations.filter((loc) => loc.mode === "include"),
    [locations],
  );
  const excluded = useMemo(
    () => locations.filter((loc) => loc.mode === "exclude"),
    [locations],
  );
  const addressPins = useMemo(
    () =>
      locations.filter(
        (loc) =>
          loc.type === "address" &&
          loc.latitude != null &&
          loc.longitude != null,
      ),
    [locations],
  );
  const showMap = radiusEnabled || dropPinEnabled;
  const activeLocation =
    locations.find((loc) => loc.id === activeLocationId) ??
    addressPins[0] ??
    null;

  useEffect(() => {
    if (excluded.length > 0) setExcludeEnabled(true);
  }, [excluded.length]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      void searchLocations(searchQuery)
        .then((results) => {
          setSearchResults(results);
          setSearchError(
            results.length ? null : "No matching locations. Try another search.",
          );
        })
        .catch(() => {
          setSearchResults([]);
          setSearchError("No matching locations. Try another search.");
        })
        .finally(() => setSearching(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDuplicate = (
    result: LocationSearchResult,
    mode: MetaLocationTargetMode,
  ) => {
    if (result.type === "country") {
      return locations.some(
        (loc) =>
          loc.mode === mode &&
          loc.type === "country" &&
          loc.countryCode === result.countryCode,
      );
    }
    return locations.some(
      (loc) =>
        loc.mode === mode &&
        loc.type === "address" &&
        loc.latitude != null &&
        loc.longitude != null &&
        Math.abs((loc.latitude ?? 0) - result.latitude) < 0.0005 &&
        Math.abs((loc.longitude ?? 0) - result.longitude) < 0.0005,
    );
  };

  const addResult = (
    result: LocationSearchResult,
    mode: MetaLocationTargetMode = searchMode,
  ) => {
    if (isDuplicate(result, mode)) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    if (result.type === "country") {
      const next: AdSetLocationTarget = {
        id: createLocationId(),
        mode,
        type: "country",
        countryCode: result.countryCode,
        countryName: result.countryName,
        label: result.countryName,
      };
      onChange([...locations, next]);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const next: AdSetLocationTarget = {
      id: createLocationId(),
      mode,
      type: "address",
      countryCode: result.countryCode,
      countryName: result.countryName,
      label: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
      radius: 16,
      distanceUnit: "kilometer",
    };

    let nextLocations = locations.filter(
      (loc) =>
        !(
          loc.mode === mode &&
          loc.type === "country" &&
          loc.countryCode === result.countryCode
        ),
    );

    if (
      mode === "include" &&
      result.countryCode !== "US" &&
      !nextLocations.some(
        (loc) =>
          loc.mode === "include" &&
          loc.type === "address" &&
          loc.countryCode === "US",
      )
    ) {
      nextLocations = nextLocations.filter(
        (loc) =>
          !(
            loc.mode === "include" &&
            loc.type === "country" &&
            loc.countryCode === "US"
          ),
      );
    }

    onChange([...nextLocations, next]);
    setActiveLocationId(next.id);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeLocation = (id: string) => {
    const next = locations.filter((loc) => loc.id !== id);
    onChange(
      next.length
        ? next
        : [
            {
              id: createLocationId(),
              mode: "include",
              type: "country",
              countryCode: "US",
              countryName: "United States",
              label: "United States",
            },
          ],
    );
    if (activeLocationId === id) {
      setActiveLocationId(null);
    }
  };

  const updateLocation = (id: string, patch: Partial<AdSetLocationTarget>) => {
    onChange(
      locations.map((loc) => (loc.id === id ? { ...loc, ...patch } : loc)),
    );
  };

  const handleDropPin = (latitude: number, longitude: number) => {
    if (!dropPinEnabled) return;

    const id = createLocationId();
    const next: AdSetLocationTarget = {
      id,
      mode: "include",
      type: "address",
      countryCode: "US",
      countryName: "United States",
      label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      radius: 16,
      distanceUnit: "kilometer",
    };

    const withoutUsCountry = locations.filter(
      (loc) =>
        !(
          loc.mode === "include" &&
          loc.type === "country" &&
          loc.countryCode === "US"
        ),
    );

    onChange([...withoutUsCountry, next]);
    setActiveLocationId(id);
  };

  const chipClass =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium";

  return (
    <section className="space-y-4 rounded-xl border border-[#e8edf5] bg-white p-4">
      <div>
        <h4 className="text-sm font-bold text-[#07111f]">Target locations</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Search and select countries, cities, or places. The map stays hidden
          unless you need radius or drop-pin targeting.
        </p>
        {detectingLocation ? (
          <p className="mt-1 text-xs font-medium text-[#1877f2]">
            Detecting your location…
          </p>
        ) : null}
      </div>

      <div ref={searchRef} className="relative space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (searchResults[0]) addResult(searchResults[0], "include");
              }
            }}
            placeholder="Search locations…"
            className="w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-sm text-[#07111f] outline-none placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white"
            aria-label="Search locations"
          />
        </div>

        {!searchQuery.trim() ? (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setSearchQuery(example)}
                className="rounded-full border border-[#e8edf5] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
              >
                {example}
              </button>
            ))}
          </div>
        ) : null}

        {searching ? (
          <p className="text-xs text-slate-500">Searching…</p>
        ) : null}
        {searchError ? (
          <p className="text-xs text-slate-500">{searchError}</p>
        ) : null}

        {searchResults.length > 0 ? (
          <ul className="absolute z-20 max-h-56 w-full overflow-y-auto rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() =>
                    addResult(
                      result,
                      excludeEnabled && searchMode === "exclude"
                        ? "exclude"
                        : "include",
                    )
                  }
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f4f8ff]"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block font-medium text-[#07111f]">
                      {result.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {result.type === "country"
                        ? "Country"
                        : result.countryName}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            Included locations
          </p>
          {included.length ? (
            <div className="flex flex-wrap gap-2">
              {included.map((location) => (
                <span
                  key={location.id}
                  className={`${chipClass} border-[#dbeafe] bg-[#f4f8ff] text-[#07111f]`}
                >
                  <MapPin className="size-3.5 shrink-0 text-[#1877f2]" />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLocationId(location.id);
                      if (location.type === "address") {
                        setRadiusEnabled(true);
                        setAdvancedOpen(true);
                      }
                    }}
                    className="max-w-[220px] truncate text-left"
                    title={location.label}
                  >
                    {location.label}
                    {location.type === "address" && location.radius
                      ? ` · ${location.radius}${
                          location.distanceUnit === "mile" ? "mi" : "km"
                        }`
                      : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocation(location.id)}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-white hover:text-slate-600"
                    aria-label={`Remove ${location.label}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Add at least one included location to continue.
            </p>
          )}
        </div>

        {excludeEnabled ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              Excluded locations
            </p>
            {excluded.length ? (
              <div className="flex flex-wrap gap-2">
                {excluded.map((location) => (
                  <span
                    key={location.id}
                    className={`${chipClass} border-red-200 bg-red-50 text-red-800`}
                  >
                    <span className="font-bold" aria-hidden>
                      ✕
                    </span>
                    <span className="max-w-[220px] truncate">
                      {location.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="rounded-full p-0.5 text-red-400 hover:bg-white hover:text-red-600"
                      aria-label={`Remove exclusion ${location.label}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Search above and add places to exclude.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8edf5]">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between bg-[#f8fafc] px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-[#07111f]">
            Advanced location options
          </span>
          {advancedOpen ? (
            <ChevronUp className="size-4 text-slate-500" />
          ) : (
            <ChevronDown className="size-4 text-slate-500" />
          )}
        </button>

        {advancedOpen ? (
          <div className="space-y-4 border-t border-[#e8edf5] bg-white p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={radiusEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRadiusEnabled(checked);
                  if (checked) {
                    setActiveLocationId(
                      addressPins[0]?.id ?? activeLocationId,
                    );
                  }
                }}
                className="mt-0.5 size-4 rounded border-[#c5d0e0] text-[#1877f2] focus:ring-[#1877f2]/30"
              />
              <span>
                <span className="block text-sm font-semibold text-[#07111f]">
                  Radius targeting
                </span>
                <span className="text-xs text-slate-500">
                  Show a map and set a radius around a place.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={dropPinEnabled}
                onChange={(e) => setDropPinEnabled(e.target.checked)}
                className="mt-0.5 size-4 rounded border-[#c5d0e0] text-[#1877f2] focus:ring-[#1877f2]/30"
              />
              <span>
                <span className="block text-sm font-semibold text-[#07111f]">
                  Drop pin
                </span>
                <span className="text-xs text-slate-500">
                  Click the map to place a marker and set a radius.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={excludeEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExcludeEnabled(checked);
                  setSearchMode(checked ? "exclude" : "include");
                  if (!checked) {
                    onChange(locations.filter((loc) => loc.mode === "include"));
                  }
                }}
                className="mt-0.5 size-4 rounded border-[#c5d0e0] text-[#1877f2] focus:ring-[#1877f2]/30"
              />
              <span>
                <span className="block text-sm font-semibold text-[#07111f]">
                  Exclude locations
                </span>
                <span className="text-xs text-slate-500">
                  Search and add cities or countries Meta should skip.
                </span>
              </span>
            </label>

            {excludeEnabled ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSearchMode("include")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    searchMode === "include"
                      ? "bg-[#1877f2] text-white"
                      : "border border-[#e8edf5] text-slate-600"
                  }`}
                >
                  Add to included
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("exclude")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    searchMode === "exclude"
                      ? "bg-red-600 text-white"
                      : "border border-[#e8edf5] text-slate-600"
                  }`}
                >
                  Add to excluded
                </button>
              </div>
            ) : null}

            {showMap ? (
              <div className="space-y-3">
                {radiusEnabled &&
                activeLocation?.type === "address" &&
                activeLocation.latitude != null ? (
                  <div className="space-y-2 rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Radius for “{activeLocation.label}”
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {RADIUS_PRESETS_KM.map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() =>
                            updateLocation(activeLocation.id, {
                              radius: km,
                              distanceUnit: "kilometer",
                            })
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            (activeLocation.radius ?? 16) === km &&
                            (activeLocation.distanceUnit ?? "kilometer") ===
                              "kilometer"
                              ? "bg-[#1877f2] text-white"
                              : "border border-[#e8edf5] bg-white text-slate-600"
                          }`}
                        >
                          {km} km
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={activeLocation.radius ?? 16}
                        onChange={(e) =>
                          updateLocation(activeLocation.id, {
                            radius: Number.parseInt(e.target.value, 10),
                          })
                        }
                        className="min-w-[140px] flex-1"
                      />
                      <input
                        type="number"
                        min={1}
                        max={80}
                        value={activeLocation.radius ?? 16}
                        onChange={(e) =>
                          updateLocation(activeLocation.id, {
                            radius: Number.parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-14 rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm"
                      />
                      <div className="flex overflow-hidden rounded-lg border border-[#e8edf5] bg-white">
                        {(
                          [
                            ["kilometer", "km"],
                            ["mile", "mi"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              updateLocation(activeLocation.id, {
                                distanceUnit: value as MetaDistanceUnit,
                              })
                            }
                            className={`px-2.5 py-1 text-xs font-semibold ${
                              (activeLocation.distanceUnit ?? "kilometer") ===
                              value
                                ? "bg-[#1877f2] text-white"
                                : "text-slate-600"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : radiusEnabled ? (
                  <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fbff] px-3 py-2 text-xs text-slate-600">
                    Select or search a city/address first, then set a radius. Country-only targeting does not use the map.
                  </p>
                ) : null}

                {addressPins.length > 0 || dropPinEnabled ? (
                  <AdSetLocationsMap
                    locations={locations}
                    activeLocationId={activeLocationId}
                    dropPinMode={dropPinEnabled}
                    onDropPin={handleDropPin}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-[#e8edf5] bg-[#f8fafc] px-3 py-6 text-center text-sm text-slate-500">
                    Add a city or address, or enable Drop pin to use the map.
                  </p>
                )}

                {dropPinEnabled ? (
                  <p className="text-xs font-medium text-[#1877f2]">
                    Click the map to drop a pin.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!included.length ? (
        <p className="text-xs font-medium text-amber-700">
          Add at least one included location.
        </p>
      ) : null}
    </section>
  );
}
