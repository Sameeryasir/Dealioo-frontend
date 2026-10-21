"use client";

import { Skeleton } from "@/app/components/skeleton";
import type { PlatformDashboardPanel } from "@/app/services/admin/get-platform-dashboard";
import { ChevronDown, Globe } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

const BusinessesByRegionMap = dynamic(
  () =>
    import("@/app/components/super-admin/BusinessesByRegionMap").then(
      (mod) => mod.BusinessesByRegionMap,
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full min-h-[11rem] w-full rounded-2xl sm:min-h-[12.5rem]" />
    ),
  },
);

type RegionRow = PlatformDashboardPanel["regions"][number];

const REGION_COLORS: Record<string, string> = {
  "North America": "#4361EE",
  Asia: "#8B5CF6",
  Australia: "#A855F7",
  Europe: "#E879F9",
  Other: "#F0ABFC",
  "South America": "#FB7185",
  Africa: "#34D399",
};

const REGION_CENTROIDS: Record<string, [number, number]> = {
  "North America": [-100, 40],
  "South America": [-58, -14],
  Europe: [10, 50],
  Africa: [18, 4],
  Asia: [95, 32],
  Australia: [134, -25],
};

const ALL_REGIONS = "all";

function regionColor(region: string): string {
  return REGION_COLORS[region] ?? "#94A3B8";
}

export function BusinessesByRegionCard({
  regions,
  loading,
}: {
  regions: RegionRow[];
  loading?: boolean;
}) {
  const [filter, setFilter] = useState<string>(ALL_REGIONS);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeFilter =
    filter === ALL_REGIONS || regions.some((row) => row.region === filter)
      ? filter
      : ALL_REGIONS;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const totalBusinesses = useMemo(
    () => regions.reduce((sum, row) => sum + row.count, 0),
    [regions],
  );

  const filteredRegions = useMemo(() => {
    if (activeFilter === ALL_REGIONS) return regions;
    return regions.filter((row) => row.region === activeFilter);
  }, [activeFilter, regions]);

  const markers = useMemo(() => {
    const source = activeFilter === ALL_REGIONS ? regions : filteredRegions;
    return source
      .filter((row) => row.count > 0 && REGION_CENTROIDS[row.region])
      .map((row) => ({
        region: row.region,
        count: row.count,
        coordinates: REGION_CENTROIDS[row.region]!,
        color: regionColor(row.region),
      }));
  }, [activeFilter, filteredRegions, regions]);

  const filterLabel =
    activeFilter === ALL_REGIONS ? "All Regions" : activeFilter;

  const filterOptions = useMemo(() => {
    return [
      { id: ALL_REGIONS, label: "All Regions" },
      ...regions.map((row) => ({ id: row.region, label: row.region })),
    ];
  }, [regions]);

  return (
    <section
      className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[20px] border border-[#e8edf5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
      aria-label="Businesses by Region"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#8B5CF6]"
        aria-hidden
      />

      <div className="relative mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff] text-[#8B5CF6]">
            <Globe className="size-5" strokeWidth={2.1} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="m-0 text-[0.92rem] font-extrabold tracking-tight text-[#07111f]">
              Businesses by Region
            </h3>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium leading-snug text-slate-500">
              Distribution of registered businesses
            </p>
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-3 py-2 text-[0.75rem] font-semibold text-[#334155] shadow-[0_2px_8px_rgba(15,23,42,0.03)] outline-none transition hover:border-[#c4b5fd] hover:bg-[#faf5ff] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/25"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            {filterLabel}
            <ChevronDown className="size-3.5 opacity-70" aria-hidden />
          </button>

          {menuOpen ? (
            <div
              role="listbox"
              aria-label="Filter regions"
              className="absolute right-0 z-20 mt-1.5 min-w-[10.5rem] overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
            >
              {filterOptions.map((option) => {
                const active = option.id === activeFilter;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center px-3 py-2 text-left text-[0.75rem] font-semibold transition ${
                      active
                        ? "bg-[#f5f3ff] text-[#6d28d9]"
                        : "text-[#334155] hover:bg-[#f8fafc]"
                    }`}
                    onClick={() => {
                      setFilter(option.id);
                      setMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className="grid min-h-0 flex-1 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
          aria-busy="true"
        >
          <Skeleton className="min-h-[11rem] w-full rounded-2xl sm:min-h-[12.5rem]" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : regions.length === 0 ? (
        <div className="flex min-h-[11rem] flex-1 items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
          No business locations yet.
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="min-h-[11rem] min-w-0 self-stretch sm:min-h-[12.5rem]">
            <BusinessesByRegionMap markers={markers} />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-2.5 self-stretch">
            {filteredRegions.length === 0 ? (
              <p className="m-0 text-sm font-medium text-slate-500">
                No businesses in this region.
              </p>
            ) : (
              filteredRegions.map((row) => {
                const pct =
                  totalBusinesses > 0
                    ? Math.round((row.count / totalBusinesses) * 1000) / 10
                    : 0;
                const color = regionColor(row.region);
                return (
                  <div key={row.region} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[0.8rem] font-bold text-[#0f172a]">
                        {row.region}
                      </span>
                      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                        <span className="text-[0.8rem] font-bold text-[#0f172a]">
                          {row.count}
                        </span>
                        <span className="text-[0.72rem] font-semibold text-slate-500">
                          {pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8eef7]">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${Math.max(pct > 0 ? 4 : 0, pct)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
