"use client";

import { Skeleton } from "@/app/components/skeleton";
import { FileText, Sparkles, Zap } from "lucide-react";

const cardClass =
  "rounded-[1.15rem] border border-[#e5edf7] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]";

const DETAIL_LEFT: { label: string; divider?: boolean; valueWidth?: string }[] =
  [
    { label: "Business name" },
    { label: "Currency" },
    { label: "Email address", valueWidth: "w-36" },
    { label: "City" },
    { label: "Country", divider: false },
  ];

const DETAIL_RIGHT: { label: string; divider?: boolean; valueWidth?: string }[] =
  [
    { label: "Business type" },
    { label: "Phone number" },
    { label: "Website", valueWidth: "w-32" },
    { label: "State" },
    { label: "Postal code", divider: false },
  ];

function DetailRowSkeleton({
  label,
  showDivider = true,
  valueWidth = "w-28",
}: {
  label: string;
  showDivider?: boolean;
  valueWidth?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center py-3.5 ${
        showDivider ? "border-b border-[#eef2f7]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.72rem] font-semibold text-[#7183a4]">
          {label}
        </p>
        <Skeleton funnel className={`mt-1.5 h-4 ${valueWidth} max-w-full rounded`} />
      </div>
    </div>
  );
}

function SideRowSkeleton({
  label,
  trailing = false,
}: {
  label: string;
  trailing?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1 py-2">
      <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-[#101a35]">
        {label}
      </span>
      {trailing ? (
        <Skeleton funnel className="h-4 w-8 shrink-0 rounded" />
      ) : (
        <Skeleton funnel className="size-3.5 shrink-0 rounded" />
      )}
    </div>
  );
}

export function BusinessProfileSkeleton() {
  return (
    <div
      className="business-profile-fit flex min-h-0 w-full min-w-0 flex-col bg-[#f1f5fb]/40"
      aria-busy="true"
      aria-label="Loading business profile"
    >
      <div className="flex min-w-0 flex-col gap-4 pb-4">
        <section
          className={`relative overflow-hidden ${cardClass} px-4 py-3 sm:px-5 sm:py-3.5`}
        >
          <div className="relative mb-3 min-w-0">
            <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1464ff]">
              — Business profile
            </p>
            <h1 className="m-0 mt-0.5 text-[1.35rem] font-extrabold tracking-tight text-[#101a35] xl:text-[1.5rem]">
              Business profile
            </h1>
            <p className="m-0 mt-0.5 text-[0.82rem] text-[#7183a4]">
              Manage your business information and settings
            </p>
          </div>
          <div className="relative grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
              <Skeleton
                funnel
                className="size-[4.75rem] shrink-0 rounded-full ring-1 ring-[#e8edf5] xl:size-[5.25rem]"
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7183a4]">
                  Business name
                </p>
                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                  <Skeleton funnel className="h-6 w-40 max-w-[70%] rounded-md" />
                  <Skeleton funnel className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton funnel className="mt-1 h-3.5 w-52 max-w-full rounded" />
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#e8edf5] bg-[#f8faff] px-3 py-2.5"
                >
                  <Skeleton funnel className="h-2.5 w-12 rounded" />
                  <Skeleton funnel className="mt-1.5 h-3.5 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
          <section className={`h-full ${cardClass} px-6 py-7 sm:px-8 sm:py-9`}>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1464ff]">
                  <FileText className="size-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 text-[1.05rem] font-bold text-[#101a35]">
                    Business details
                  </h3>
                  <p className="m-0 mt-0.5 text-[0.8rem] text-[#7183a4]">
                    Core information about your business
                  </p>
                </div>
              </div>
              <Skeleton funnel className="h-10 w-[7.5rem] shrink-0 rounded-xl" />
            </header>

            <div className="mt-2 grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <div className="min-w-0">
                {DETAIL_LEFT.map((row) => (
                  <DetailRowSkeleton
                    key={row.label}
                    label={row.label}
                    showDivider={row.divider !== false}
                    valueWidth={row.valueWidth ?? "w-28"}
                  />
                ))}
              </div>
              <div className="min-w-0">
                {DETAIL_RIGHT.map((row) => (
                  <DetailRowSkeleton
                    key={row.label}
                    label={row.label}
                    showDivider={row.divider !== false}
                    valueWidth={row.valueWidth ?? "w-24"}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-col">
            <section className={`shrink-0 ${cardClass} px-3.5 py-3 sm:px-4`}>
              <header className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1464ff]">
                  <Zap className="size-3.5" strokeWidth={2.25} aria-hidden />
                </span>
                <h3 className="m-0 text-[0.82rem] font-bold text-[#101a35]">
                  Quick actions
                </h3>
              </header>
              <div className="mt-2 space-y-0.5">
                <SideRowSkeleton label="Manage members" />
                <SideRowSkeleton label="Integrations" />
              </div>
            </section>

            <section className={`shrink-0 ${cardClass} px-3.5 py-3 sm:px-4`}>
              <header className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] text-[#8b5cf6]">
                  <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
                </span>
                <h3 className="m-0 text-[0.82rem] font-bold text-[#101a35]">
                  Business summary
                </h3>
              </header>
              <div className="mt-2 space-y-0.5">
                <SideRowSkeleton label="Total campaigns" trailing />
                <SideRowSkeleton label="Total customers" trailing />
                <SideRowSkeleton label="Active automations" trailing />
              </div>
            </section>

            <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#d7ede4] bg-[linear-gradient(145deg,#ffffff_0%,#f3fbf7_100%)] px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:col-span-2 sm:px-4 xl:mt-auto">
              <header className="flex items-center gap-2">
                <Skeleton funnel className="size-7 shrink-0 rounded-full" />
                <Skeleton funnel className="h-3.5 w-28 rounded" />
              </header>
              <div className="mt-3 flex items-center gap-3">
                <Skeleton funnel className="size-16 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton funnel className="h-3 w-full rounded" />
                  <Skeleton funnel className="h-3 w-5/6 rounded" />
                  <Skeleton funnel className="h-3 w-4/5 rounded" />
                  <Skeleton funnel className="h-3 w-3/4 rounded" />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
