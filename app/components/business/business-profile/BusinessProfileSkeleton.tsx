"use client";

import { Skeleton } from "@/app/components/skeleton";
import {
  Building2,
  FileText,
  Globe,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Settings2,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

const cardClass =
  "rounded-[1.15rem] border border-[#e5edf7] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]";

const DETAIL_LEFT: {
  icon: LucideIcon;
  tone: string;
  label: string;
  divider?: boolean;
}[] = [
  { icon: Building2, tone: "bg-[#e8f1ff] text-[#1464ff]", label: "Business name" },
  { icon: Wallet, tone: "bg-[#fff8e8] text-[#d97706]", label: "Currency" },
  { icon: Mail, tone: "bg-[#f3e8ff] text-[#8b5cf6]", label: "Email address" },
  { icon: MapPin, tone: "bg-[#e8f8ef] text-[#16a34a]", label: "City" },
  {
    icon: Globe,
    tone: "bg-[#e0f2fe] text-[#0284c7]",
    label: "Country",
    divider: false,
  },
];

const DETAIL_RIGHT: {
  icon: LucideIcon;
  tone: string;
  label: string;
  divider?: boolean;
}[] = [
  {
    icon: UtensilsCrossed,
    tone: "bg-[#fff1e6] text-[#ea580c]",
    label: "Business type",
  },
  { icon: Phone, tone: "bg-[#e6fffa] text-[#0d9488]", label: "Phone number" },
  { icon: Link2, tone: "bg-[#eef2ff] text-[#4f46e5]", label: "Website" },
  { icon: MapPin, tone: "bg-[#fde8f0] text-[#e11d48]", label: "State" },
  {
    icon: Building2,
    tone: "bg-[#ffe4e6] text-[#e11d48]",
    label: "Postal code",
    divider: false,
  },
];

function DetailRowSkeleton({
  icon: Icon,
  tone,
  label,
  showDivider = true,
  valueWidth = "w-28",
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  showDivider?: boolean;
  valueWidth?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-start gap-3 py-3.5 ${
        showDivider ? "border-b border-[#eef2f7]" : ""
      }`}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
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
  icon: Icon,
  tone,
  label,
  trailing = false,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  trailing?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1 py-2">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
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
      <header className="relative mb-4 shrink-0 pt-1">
        <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#101a35] xl:text-[1.7rem]">
          Business profile
        </h1>
        <p className="m-0 mt-1 text-[0.88rem] text-[#7183a4]">
          Manage your business information and settings
        </p>
      </header>

      <div className="grid min-w-0 gap-4 pb-4 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <section
            className={`relative overflow-visible ${cardClass} px-4 py-3.5 sm:px-5 sm:py-4`}
          >
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                <Skeleton
                  funnel
                  className="size-[5.75rem] shrink-0 rounded-full ring-1 ring-[#e8edf5] xl:size-[6.5rem]"
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#7183a4]">
                    Business name
                  </p>
                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                    <Skeleton funnel className="h-7 w-44 max-w-[70%] rounded-md" />
                    <Skeleton funnel className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <MapPin
                      className="size-3.5 shrink-0 text-[#cbd5e1]"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <Skeleton funnel className="h-3.5 w-40 max-w-full rounded" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Skeleton funnel className="h-5 w-20 rounded-full" />
                    <Skeleton funnel className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </div>
              <Skeleton
                funnel
                className="h-9 w-full shrink-0 rounded-xl sm:w-[8.5rem]"
              />
            </div>
          </section>

          <section className={`${cardClass} px-5 py-5 sm:px-6 sm:py-6`}>
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
                    icon={row.icon}
                    tone={row.tone}
                    label={row.label}
                    showDivider={row.divider !== false}
                    valueWidth={
                      row.label === "Email address" ? "w-36" : "w-28"
                    }
                  />
                ))}
              </div>
              <div className="min-w-0">
                {DETAIL_RIGHT.map((row) => (
                  <DetailRowSkeleton
                    key={row.label}
                    icon={row.icon}
                    tone={row.tone}
                    label={row.label}
                    showDivider={row.divider !== false}
                    valueWidth={row.label === "Website" ? "w-32" : "w-24"}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className={`${cardClass} px-4 py-4 sm:px-5`}>
            <header className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1464ff]">
                <Zap className="size-3.5" strokeWidth={2.25} aria-hidden />
              </span>
              <h3 className="m-0 text-[0.86rem] font-bold text-[#101a35]">
                Quick actions
              </h3>
            </header>
            <div className="mt-3 space-y-2.5">
              <SideRowSkeleton
                icon={Users}
                tone="bg-[#e8f8ef] text-[#22c55e]"
                label="Manage members"
              />
              <SideRowSkeleton
                icon={Link2}
                tone="bg-[#fde8f0] text-[#e11d48]"
                label="Integrations"
              />
            </div>
          </section>

          <section className={`${cardClass} px-4 py-4 sm:px-5`}>
            <header className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] text-[#8b5cf6]">
                <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
              </span>
              <h3 className="m-0 text-[0.86rem] font-bold text-[#101a35]">
                Business summary
              </h3>
            </header>
            <div className="mt-3 space-y-2.5">
              <SideRowSkeleton
                icon={Megaphone}
                tone="bg-[#e8f1ff] text-[#1464ff]"
                label="Total campaigns"
                trailing
              />
              <SideRowSkeleton
                icon={Users}
                tone="bg-[#f3e8ff] text-[#8b5cf6]"
                label="Total customers"
                trailing
              />
              <SideRowSkeleton
                icon={Settings2}
                tone="bg-[#fff1e6] text-[#f97316]"
                label="Active automations"
                trailing
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
