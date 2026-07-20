"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Search,
  X,
} from "lucide-react";
import type {
  AdSetLocationTarget,
  MetaDistanceUnit,
  MetaLocationTargetMode,
} from "@/app/lib/meta-campaign-builder-types";
import { COUNTRIES } from "@/app/lib/meta-adset-builder-helpers";
import {
  createLocationId,
  getCountryLabel,
  groupLocationsByCountry,
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
      <div className="flex h-64 items-center justify-center rounded-lg border border-[#e8edf5] bg-[#f4f8ff] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

type AdSetLocationsBoxProps = {
  locations: AdSetLocationTarget[];
  onChange: (locations: AdSetLocationTarget[]) => void;
};

export function AdSetLocationsBox({ locations, onChange }: AdSetLocationsBoxProps) {
  const [expanded, setExpanded] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(true);
  const [searchMode, setSearchMode] = useState<MetaLocationTargetMode>("include");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(
    locations.find((loc) => loc.type === "address")?.id ?? null,
  );
  const [radiusEditorId, setRadiusEditorId] = useState<string | null>(null);
  const [dropPinMode, setDropPinMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => groupLocationsByCountry(locations), [locations]);

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
        setShowBrowse(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addLocation = (result: LocationSearchResult) => {
    if (result.type === "country") {
      addCountry(result.countryCode);
      return;
    }

    const duplicate = locations.some(
      (loc) =>
        loc.mode === searchMode &&
        loc.type === "address" &&
        loc.latitude != null &&
        loc.longitude != null &&
        Math.abs((loc.latitude ?? 0) - result.latitude) < 0.0005 &&
        Math.abs((loc.longitude ?? 0) - result.longitude) < 0.0005,
    );
    if (duplicate) {
      setSearchQuery(result.label);
      setSearchResults([]);
      return;
    }

    const next: AdSetLocationTarget = {
      id: createLocationId(),
      mode: searchMode,
      type: "address",
      countryCode: result.countryCode,
      countryName: result.countryName,
      label: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
      radius: 16,
      distanceUnit: "kilometer",
    };

    const withoutCountry = locations.filter(
      (loc) =>
        !(
          loc.mode === searchMode &&
          loc.type === "country" &&
          loc.countryCode === result.countryCode
        ),
    );

    let nextLocations = [...withoutCountry, next];

    // Drop leftover default US country when targeting a pin outside the US.
    if (
      searchMode === "include" &&
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

    onChange(nextLocations);
    setActiveLocationId(next.id);
    setSearchQuery(result.label);
    setSearchResults([]);
    setSearchError(null);
    setDropPinMode(false);
  };

  const commitTypedSearch = async () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocations(trimmed);
      if (results[0]) {
        addLocation(results[0]);
        return;
      }
      setSearchError("No matching locations. Try another search.");
    } catch {
      setSearchError("No matching locations. Try another search.");
    } finally {
      setSearching(false);
    }
  };

  const addCountry = (countryCode: string) => {
    const countryName = getCountryLabel(countryCode);
    const exists = locations.some(
      (loc) =>
        loc.mode === searchMode &&
        loc.type === "country" &&
        loc.countryCode === countryCode,
    );
    if (exists) return;

    const next: AdSetLocationTarget = {
      id: createLocationId(),
      mode: searchMode,
      type: "country",
      countryCode,
      countryName,
      label: countryName,
    };

    onChange([...locations, next]);
    setShowBrowse(false);
    setSearchQuery(countryName);
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
    if (radiusEditorId === id) {
      setRadiusEditorId(null);
    }
  };

  const updateLocation = (
    id: string,
    patch: Partial<AdSetLocationTarget>,
  ) => {
    onChange(
      locations.map((loc) => (loc.id === id ? { ...loc, ...patch } : loc)),
    );
  };

  const handleDropPin = (latitude: number, longitude: number) => {
    const id = createLocationId();
    const countryCode = "US";
    const next: AdSetLocationTarget = {
      id,
      mode: searchMode,
      type: "address",
      countryCode,
      countryName: "United States",
      label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      radius: 16,
      distanceUnit: "kilometer",
    };

    const withoutCountry = locations.filter(
      (loc) =>
        !(
          loc.mode === searchMode &&
          loc.type === "country" &&
          loc.countryCode === countryCode
        ),
    );

    onChange([...withoutCountry, next]);
    setActiveLocationId(id);
    setSearchQuery(next.label);
    setDropPinMode(false);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between border-b border-[#e8edf5] bg-[#f4f8ff]/80 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#07111f]">Locations</span>
          <Info className="size-4 text-slate-400" aria-hidden />
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-slate-500" />
        ) : (
          <ChevronDown className="size-4 text-slate-500" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-3 p-4">
          <div className="rounded-lg border border-[#bfdbfe] bg-[#f4f8ff] px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-[#07111f]">How locations publish to Meta</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                <span className="font-semibold">Include</span> countries and
                address pins (with radius) are all sent to Ads Manager.
              </li>
              <li>
                <span className="font-semibold">Exclude</span> locations are sent
                as exclusions so Meta will not show ads there.
              </li>
              <li>
                A whole country includes everyone in that country. Remove the
                country row if you only want the pin + radius.
              </li>
            </ul>
          </div>

          {Array.from(grouped.entries()).map(([countryName, countryLocations]) => (
            <div key={countryName} className="space-y-2">
              <p className="text-sm font-semibold text-[#07111f]">{countryName}</p>
              {countryLocations.map((location) => (
                <div key={location.id} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      location.mode === "exclude"
                        ? "border-red-200 bg-red-50/70"
                        : activeLocationId === location.id
                          ? "border-[#1877F2] bg-[#1877F2]/5"
                          : "border-[#e8edf5] bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLocationId(location.id);
                        setSearchQuery(location.label);
                        if (location.type === "address") {
                          setRadiusEditorId(
                            radiusEditorId === location.id ? null : location.id,
                          );
                        }
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
                          location.mode === "exclude"
                            ? "bg-red-100"
                            : "bg-emerald-50"
                        }`}
                      >
                        <MapPin
                          className={`size-4 ${
                            location.mode === "exclude"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[#07111f]">
                          {location.label}
                        </span>
                        {location.mode === "exclude" ? (
                          <span className="text-xs font-semibold text-red-600">
                            Excluded
                          </span>
                        ) : location.type === "address" && location.radius ? (
                          <span className="text-xs text-slate-500">
                            {location.radius}{" "}
                            {location.distanceUnit === "mile" ? "mi" : "km"} radius
                          </span>
                        ) : location.type === "country" ? (
                          <span className="text-xs text-slate-500">
                            Entire country
                          </span>
                        ) : null}
                      </span>
                      {location.type === "address" ? (
                        <ChevronDown className="size-4 shrink-0 text-slate-400" />
                      ) : null}
                    </button>
                    <select
                      value={location.mode}
                      onChange={(e) =>
                        updateLocation(location.id, {
                          mode: e.target.value as MetaLocationTargetMode,
                        })
                      }
                      className="rounded-md border border-[#e8edf5] bg-white px-2 py-1 text-xs font-semibold text-[#07111f]"
                      aria-label={`Include or exclude ${location.label}`}
                    >
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="rounded p-1 text-slate-400 hover:bg-[#e8f2ff] hover:text-slate-500"
                      aria-label="Remove location"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {radiusEditorId === location.id && location.type === "address" ? (
                    <div className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff] p-4">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Radius around this address (sent to Meta)
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={80}
                          value={location.radius ?? 16}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              radius: Number.parseInt(e.target.value, 10),
                            })
                          }
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min={1}
                          max={80}
                          value={location.radius ?? 16}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              radius: Number.parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-14 rounded border border-[#e8edf5] px-2 py-1 text-sm"
                        />
                        <select
                          value={location.distanceUnit ?? "kilometer"}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              distanceUnit: e.target.value as MetaDistanceUnit,
                            })
                          }
                          className="rounded border border-[#e8edf5] px-2 py-1 text-sm"
                        >
                          <option value="kilometer">km</option>
                          <option value="mile">mi</option>
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}

          <div ref={searchRef} className="space-y-2">
            <div className="flex gap-2">
              <select
                value={searchMode}
                onChange={(e) =>
                  setSearchMode(e.target.value as MetaLocationTargetMode)
                }
                className="rounded-lg border border-[#e8edf5] bg-white px-3 py-2 text-sm font-medium text-[#07111f]"
              >
                <option value="include">Include</option>
                <option value="exclude">Exclude</option>
              </select>

              <div className="relative flex min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (searchResults[0]) {
                        addLocation(searchResults[0]);
                      } else {
                        void commitTypedSearch();
                      }
                    }
                  }}
                  placeholder="Search locations"
                  className="w-full rounded-lg border border-[#e8edf5] py-2 pl-9 pr-24 text-sm text-[#07111f]"
                />
                <button
                  type="button"
                  onClick={() => setShowBrowse((value) => !value)}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-[#e8f2ff]"
                >
                  Browse
                  <ChevronDown className="size-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMapExpanded((value) => !value)}
                className="rounded-lg border border-[#e8edf5] px-2 py-2 text-slate-500 hover:bg-[#f4f8ff]"
                aria-label={mapExpanded ? "Collapse map" : "Expand map"}
              >
                {mapExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            </div>

            {searching ? (
              <p className="text-xs text-slate-500">Searching…</p>
            ) : null}
            {searchError ? (
              <p className="text-xs text-slate-500">{searchError}</p>
            ) : null}

            {searchResults.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto rounded-lg border border-[#e8edf5] bg-white shadow-sm">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => addLocation(result)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-[#f4f8ff]"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <span>
                        <span className="block text-[#07111f]">{result.label}</span>
                        <span className="text-xs text-slate-500">
                          {result.countryName}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {showBrowse ? (
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-[#e8edf5] bg-white shadow-sm">
                {COUNTRIES.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      onClick={() => addCountry(country.code)}
                      className="w-full px-3 py-2 text-left text-sm text-[#07111f] hover:bg-[#f4f8ff]"
                    >
                      {country.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {mapExpanded ? (
            <div className="space-y-2">
              <AdSetLocationsMap
                locations={locations}
                activeLocationId={activeLocationId}
                dropPinMode={dropPinMode}
                onDropPin={handleDropPin}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDropPinMode((value) => !value)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    dropPinMode
                      ? "border-[#1877F2] bg-[#1877F2] text-white"
                      : "border-[#e8edf5] bg-white text-[#07111f] hover:bg-[#f4f8ff]"
                  }`}
                >
                  <MapPin className="size-4" />
                  Drop pin
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
