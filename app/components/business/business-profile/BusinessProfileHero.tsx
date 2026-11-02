"use client";

import {
  Building2,
  Camera,
  MapPin,
  Pencil,
  UtensilsCrossed,
} from "lucide-react";

const cardClass =
  "overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]";

const editButtonClass =
  "inline-flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0] active:scale-[0.98] sm:w-auto";

type BusinessProfileHeroProps = {
  displayName: string;
  descriptionText: string;
  logoSrc: string | null;
  isBusinessActive: boolean;
  businessTypeLabel: string;
  locationBadge: string;
  branchLabel: string;
  onEdit: () => void;
  onEditLogo: () => void;
};

export function BusinessProfileHero({
  displayName,
  descriptionText,
  logoSrc,
  isBusinessActive,
  businessTypeLabel,
  locationBadge,
  branchLabel,
  onEdit,
  onEditLogo,
}: BusinessProfileHeroProps) {
  return (
    <section className={`${cardClass} mt-2`}>
      <div className="border-b border-[#eef2f7] bg-white px-5 py-4 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              id="business-settings-logo"
              className="relative size-16 shrink-0 sm:size-[4.5rem]"
            >
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-[#dbeafe] shadow-[0_10px_28px_rgba(24,119,242,0.18)]">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="size-full object-contain object-center p-1.5"
                  />
                ) : (
                  <Camera
                    className="size-7 text-slate-300"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
              </span>
              <button
                type="button"
                onClick={onEditLogo}
                aria-label="Update business logo"
                className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.35)] ring-2 ring-white transition hover:brightness-105"
              >
                <Camera className="size-3.5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="min-w-0">
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                Business profile
              </p>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="m-0 truncate text-[1.45rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.65rem]">
                  {displayName}
                </h2>
                {isBusinessActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-800 ring-1 ring-amber-200">
                    <span
                      className="size-1.5 rounded-full bg-amber-500"
                      aria-hidden
                    />
                    Inactive
                  </span>
                )}
              </div>
              {descriptionText ? (
                <p className="m-0 mt-1.5 line-clamp-2 text-sm font-medium text-slate-500">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          </div>

          <button type="button" onClick={onEdit} className={editButtonClass}>
            <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
            Edit Details
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 text-[0.78rem] font-medium text-slate-500 sm:px-6">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UtensilsCrossed className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
          <span className="truncate">{businessTypeLabel}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
          <span className="truncate">{locationBadge || "—"}</span>
        </span>
        <span
          id="business-settings-branch"
          className="inline-flex min-w-0 items-center gap-1.5"
        >
          <Building2 className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
          <span className="truncate">{branchLabel}</span>
        </span>
      </div>
    </section>
  );
}
