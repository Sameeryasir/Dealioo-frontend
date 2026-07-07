"use client";

import type { Funnel } from "@/app/services/funnel/get-campaigns-by-restaurant";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  funnel: Funnel;
  restaurantId: number;
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
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeImgSrc(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith("data:")) return t;
  const comma = t.indexOf(",");
  if (comma === -1) return t;
  return t.slice(0, comma + 1) + t.slice(comma + 1).replace(/\s+/g, "");
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

export default function CampaignFunnelCard({ funnel, restaurantId }: Props) {
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

  const campaignHref = `/restaurant/${restaurantId}/dashboard/campaigns/${funnel.id}`;
  const openLabel =
    funnel.campaignName?.trim() ||
    `Campaign ${funnel.id}`;

  return (
    <Link
      href={campaignHref}
      aria-label={`Open ${openLabel}`}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    >
      <article className="flex min-h-0 flex-1 flex-col">
        <div className="relative h-44 w-full shrink-0 bg-zinc-100">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={`Campaign ${funnel.id}`}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-zinc-400"
              aria-hidden
            >
              <Megaphone className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          {badgeLabel ? (
            <span
              className={
                isPublished
                  ? "absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm ring-1 ring-black/5"
                  : "absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-sm ring-1 ring-black/5"
              }
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 text-sm text-zinc-700">
          {priceText ? (
            <p>
              <span className="font-medium text-zinc-900">Price:</span>{" "}
              {priceText}
            </p>
          ) : null}
          {created ? (
            <p className="text-xs text-zinc-500">Created {created}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
