"use client";

import { ArrowUpRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";

type Props = {
  funnel: Funnel;
  businessId: number;
};

function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

function parsePrice(raw: number | string | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatCreatedDate(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeImgSrc(raw: string): string {
  return resolveUploadImageUrl(raw);
}

function statusFromFunnel(f: Funnel): string {
  const raw = f.status?.trim();
  if (raw) return raw;
  if (f.published === true) return "Published";
  if (f.published === false) return "Unpublished";
  return "N/A";
}

function statusBadgeLabel(f: Funnel): string {
  const s = statusFromFunnel(f);
  if (s === "N/A") return "";
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function CampaignFunnelCard({ funnel, businessId }: Props) {
  const imageSrc = useMemo(
    () => normalizeImgSrc(funnel.imageUrl?.trim() ?? ""),
    [funnel.imageUrl],
  );
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [funnel.id, imageSrc]);

  const priceNum = parsePrice(funnel.price);
  const priceText = priceNum != null ? formatPrice(priceNum) : null;
  const created = formatCreatedDate(funnel.createdAt);
  const badgeLabel = statusBadgeLabel(funnel);
  const isPublished = funnel.published === true;

  const campaignHref = `/business/${businessId}/dashboard/campaigns/${funnel.id}`;
  const campaignName = funnel.campaignName?.trim() ?? "";
  const offerName = funnel.offer?.trim() ?? "";
  const title =
    campaignName || offerName || `Campaign ${funnel.id}`;
  const showOfferSubtitle =
    offerName.length > 0 &&
    campaignName.length > 0 &&
    offerName.toLowerCase() !== campaignName.toLowerCase();

  return (
    <Link
      href={campaignHref}
      aria-label={`Open ${title}`}
      className="group flex w-full flex-col overflow-hidden rounded-[1.15rem] border border-[#e8edf5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] outline-none ring-1 ring-black/[0.02] transition duration-300 hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-[0_16px_36px_rgba(24,119,242,0.14)] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
    >
      <article className="flex flex-col">
        <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden bg-[#18243d]">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={title}
              className="h-full w-full object-contain object-center transition duration-500"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[#93c5fd]/70"
              aria-hidden
            >
              <Megaphone className="size-11" strokeWidth={1.75} />
            </div>
          )}
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07111f]/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
            aria-hidden
          />
          {badgeLabel ? (
            <span
              className={
                isPublished
                  ? "absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.68rem] font-bold text-[#166534] shadow-sm ring-1 ring-[#bbf7d0]/80 backdrop-blur-sm"
                  : "absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.68rem] font-bold text-[#c2410c] shadow-sm ring-1 ring-[#fed7aa]/80 backdrop-blur-sm"
              }
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="m-0 line-clamp-2 flex-1 text-[0.94rem] font-extrabold leading-snug text-[#07111f] transition group-hover:text-[#1877f2]">
              {title}
            </h3>
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 text-[#1877f2]/0 transition duration-300 group-hover:text-[#1877f2]"
              strokeWidth={2.5}
              aria-hidden
            />
          </div>
          {showOfferSubtitle ? (
            <p className="m-0 line-clamp-1 text-[0.75rem] font-medium text-slate-500">
              Offer: {offerName}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {priceText ? (
              <p className="m-0 text-[0.82rem] font-bold text-[#07111f]">
                {priceText}
              </p>
            ) : (
              <span className="text-[0.75rem] font-medium text-slate-400">
                No price set
              </span>
            )}
            {created ? (
              <p className="m-0 text-[0.68rem] font-medium text-slate-400">
                {created}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
