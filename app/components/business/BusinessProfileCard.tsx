"use client";

/**
 * Change: Compact business profile card for the dashboard sidebar.
 * Why: Shows logo and contact details without duplicating the hero image.
 * Related: dashboard/page.tsx, open-business-settings.ts
 */

import { Skeleton } from "@/app/components/skeleton";
import { openBusinessSettings } from "@/app/lib/open-business-settings";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  ExternalLink,
  Globe,
  Mail,
  PencilLine,
  Phone,
  Store,
} from "lucide-react";

type BusinessProfileCardProps = {
  logoUrl?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  isLoading?: boolean;
};

function formatWebsiteLabel(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function normalizeWebsiteHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function ProfileContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  href?: string | null;
}) {
  const hasValue = Boolean(value?.trim());
  const displayValue = hasValue ? value!.trim() : `Add ${label.toLowerCase()}`;

  const row = (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f4f8ff] text-[#1877f2]">
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p
          className={`m-0 mt-0.5 truncate text-[0.84rem] font-semibold leading-snug ${
            hasValue ? "text-slate-900" : "text-slate-400"
          }`}
          title={hasValue ? displayValue : undefined}
        >
          {displayValue}
        </p>
      </div>
      {href && hasValue ? (
        <ExternalLink
          className="mt-1 size-3 shrink-0 text-slate-400"
          strokeWidth={2.25}
          aria-hidden
        />
      ) : null}
    </div>
  );

  if (href && hasValue) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg px-1 py-1.5 no-underline transition-colors hover:bg-[#f4f8ff]/80"
      >
        {row}
      </a>
    );
  }

  return <div className="rounded-lg px-1 py-1.5">{row}</div>;
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading business profile">
      <Skeleton funnel className="mx-auto aspect-square w-full max-w-[7.5rem] rounded-[1.15rem]" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-start gap-2.5 px-1 py-1.5">
          <Skeleton funnel className="size-7 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <Skeleton funnel className="h-2 w-10" />
            <Skeleton funnel className="mt-2 h-4 w-full max-w-[9rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusinessProfileCard({
  logoUrl,
  phoneNumber,
  email,
  websiteUrl,
  isLoading = false,
}: BusinessProfileCardProps) {
  const logoSrc = resolveUploadImageUrl(logoUrl ?? null);
  const website = websiteUrl?.trim() || null;
  const websiteHref = website ? normalizeWebsiteHref(website) : null;
  const websiteLabel = website ? formatWebsiteLabel(website) : null;

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]"
      aria-label="Business profile"
    >
      <p className="m-0 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        Business profile
      </p>

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <div className="mx-auto w-full max-w-[7.5rem]">
              <div className="relative aspect-square overflow-hidden rounded-[1.15rem] border border-[#e8edf5] bg-[#f8faff] shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store
                      className="size-9 text-[#1877f2]/70"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-[#eef2f8] pt-3">
              <ProfileContactRow
                icon={Phone}
                label="Phone"
                value={phoneNumber?.trim() || null}
              />
              <ProfileContactRow
                icon={Mail}
                label="Email"
                value={email?.trim() || null}
              />
              <ProfileContactRow
                icon={Globe}
                label="Website"
                value={websiteLabel}
                href={websiteHref}
              />
            </div>

            <button
              type="button"
              onClick={() => openBusinessSettings("general")}
              className="mt-auto inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#1877f2]/20 bg-[#1877f2]/[0.06] px-3 py-2.5 text-[0.78rem] font-bold text-[#1877f2] transition duration-200 hover:border-[#1877f2]/35 hover:bg-[#1877f2]/10"
            >
              <PencilLine className="size-3.5" strokeWidth={2.25} aria-hidden />
              Edit business
            </button>
          </>
        )}
      </div>
    </article>
  );
}
