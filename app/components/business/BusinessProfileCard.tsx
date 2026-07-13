"use client";

/**
 * Change: Contact-only profile card (logo lives in the gradient hero).
 * Why: Business image belongs in the overview hero, not duplicated here.
 * Related: dashboard/page.tsx, open-business-settings.ts
 */

import { Skeleton } from "@/app/components/skeleton";
import { openBusinessSettings } from "@/app/lib/open-business-settings";
import {
  ExternalLink,
  Globe,
  Mail,
  PencilLine,
  Phone,
} from "lucide-react";

type BusinessProfileCardProps = {
  businessId?: number | null;
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
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/10">
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p
          className={`m-0 mt-0.5 truncate text-[0.88rem] font-semibold leading-snug ${
            hasValue ? "text-slate-900" : "text-slate-400"
          }`}
          title={hasValue ? displayValue : undefined}
        >
          {displayValue}
        </p>
      </div>
      {href && hasValue ? (
        <ExternalLink
          className="size-3 shrink-0 text-slate-400"
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
        className="block rounded-xl border border-transparent px-2 py-2 no-underline transition duration-200 hover:border-[#e8edf5] hover:bg-[#f8faff]"
      >
        {row}
      </a>
    );
  }

  return <div className="rounded-xl px-2 py-2">{row}</div>;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading business profile">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2.5 px-2 py-1.5">
          <Skeleton funnel className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton funnel className="h-2 w-10" />
            <Skeleton funnel className="mt-2 h-4 w-full max-w-[10rem]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusinessProfileCard({
  businessId,
  phoneNumber,
  email,
  websiteUrl,
  isLoading = false,
}: BusinessProfileCardProps) {
  const website = websiteUrl?.trim() || null;
  const websiteHref = website ? normalizeWebsiteHref(website) : null;
  const websiteLabel = website ? formatWebsiteLabel(website) : null;

  return (
    <article
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-br from-white via-[#f8faff] to-[#eef5ff] px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] sm:px-5 sm:py-5"
      aria-label="Business profile"
    >
      <span
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-[#1877f2]/10 blur-3xl"
        aria-hidden
      />

      <p className="relative m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        Business profile
      </p>

      <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5">
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
              onClick={() => openBusinessSettings("general", businessId)}
              className="mt-auto inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#0d5bb8] px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.22)] transition duration-200 hover:brightness-105"
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
