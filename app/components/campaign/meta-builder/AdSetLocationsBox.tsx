"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  MoreHorizontal,
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
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
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
        .then((results) => setSearchResults(results))
        .catch((error: unknown) => {
          setSearchResults([]);
          setSearchError(
            error instanceof Error ? error.message : "Search failed.",
          );
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
    const next: AdSetLocationTarget = {
      id: createLocationId(),
      mode: searchMode,
      type: result.type,
      countryCode: result.countryCode,
      countryName: result.countryName,
      label: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
      radius: result.type === "address" ? 16 : undefined,
      distanceUnit: result.type === "address" ? "kilometer" : undefined,
    };

    onChange([...locations, next]);
    setActiveLocationId(next.id);
    setSearchQuery("");
    setSearchResults([]);
    setDropPinMode(false);
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
    setSearchQuery("");
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
    const next: AdSetLocationTarget = {
      id,
      mode: searchMode,
      type: "address",
      countryCode: "US",
      countryName: "United States",
      label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      radius: 16,
      distanceUnit: "kilometer",
    };

    onChange([...locations, next]);
    setActiveLocationId(id);
    setDropPinMode(false);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">Locations</span>
          <Info className="size-4 text-zinc-400" aria-hidden />
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-zinc-500" />
        ) : (
          <ChevronDown className="size-4 text-zinc-500" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-3 p-4">
          {Array.from(grouped.entries()).map(([countryName, countryLocations]) => (
            <div key={countryName} className="space-y-2">
              <p className="text-sm font-semibold text-zinc-900">{countryName}</p>
              {countryLocations.map((location) => (
                <div key={location.id} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      activeLocationId === location.id
                        ? "border-[#1877F2] bg-[#1877F2]/5"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLocationId(location.id);
                        if (location.type === "address") {
                          setRadiusEditorId(
                            radiusEditorId === location.id ? null : location.id,
                          );
                        }
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50">
                        <MapPin className="size-4 text-emerald-600" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-zinc-800">
                          {location.label}
                        </span>
                        {location.mode === "exclude" ? (
                          <span className="text-xs text-red-600">Excluded</span>
                        ) : location.type === "address" && location.radius ? (
                          <span className="text-xs text-zinc-500">
                            {location.radius}{" "}
                            {location.distanceUnit === "mile" ? "mi" : "km"} radius
                          </span>
                        ) : null}
                      </span>
                      {location.type === "address" ? (
                        <ChevronDown className="size-4 shrink-0 text-zinc-400" />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label="Remove location"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {radiusEditorId === location.id && location.type === "address" ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="mb-2 text-xs font-semibold text-zinc-600">
                        Radius around this address
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
                          className="w-14 rounded border border-zinc-200 px-2 py-1 text-sm"
                        />
                        <select
                          value={location.distanceUnit ?? "kilometer"}
                          onChange={(e) =>
                            updateLocation(location.id, {
                              distanceUnit: e.target.value as MetaDistanceUnit,
                            })
                          }
                          className="rounded border border-zinc-200 px-2 py-1 text-sm"
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
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800"
              >
                <option value="include">Include</option>
                <option value="exclude">Exclude</option>
              </select>

              <div className="relative flex min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search locations"
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-24 text-sm text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowBrowse((value) => !value)}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Browse
                  <ChevronDown className="size-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMapExpanded((value) => !value)}
                className="rounded-lg border border-zinc-200 px-2 py-2 text-zinc-600 hover:bg-zinc-50"
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
              <p className="text-xs text-zinc-500">Searching…</p>
            ) : null}
            {searchError ? (
              <p className="text-xs text-red-600">{searchError}</p>
            ) : null}

            {searchResults.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => addLocation(result)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                      <span>
                        <span className="block text-zinc-900">{result.label}</span>
                        <span className="text-xs text-zinc-500">
                          {result.countryName}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {showBrowse ? (
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                {COUNTRIES.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      onClick={() => addCountry(country.code)}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
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
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
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
