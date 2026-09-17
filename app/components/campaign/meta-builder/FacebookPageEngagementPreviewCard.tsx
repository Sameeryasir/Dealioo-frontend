"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  getFacebookPageEngagementPreview,
  type FacebookPageEngagementPreview,
} from "@/app/services/facebook/get-facebook-page-engagement-preview";

type FacebookPageEngagementPreviewCardProps = {
  businessId: number;
  pageId: string;
};

type DetailRow = {
  label: string;
  value: ReactNode;
};

function splitWebsiteUrls(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\s,;|\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function FacebookPageEngagementPreviewCard({
  businessId,
  pageId,
}: FacebookPageEngagementPreviewCardProps) {
  const [preview, setPreview] = useState<FacebookPageEngagementPreview | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedPageId = pageId.trim();
    if (!trimmedPageId || !Number.isFinite(businessId) || businessId < 1) {
      setPreview(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);

    void getFacebookPageEngagementPreview(businessId, trimmedPageId)
      .then((loaded) => {
        if (cancelled) return;
        setPreview(loaded);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreview(null);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Facebook Page details.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, pageId]);

  const detailRows = useMemo((): DetailRow[] => {
    if (!preview?.detailsLoaded) return [];

    const rows: DetailRow[] = [];
    const about = preview.about?.trim() || "";
    const description = preview.description?.trim() || "";
    const websites = splitWebsiteUrls(preview.website);
    const phone = preview.phone?.trim() || "";
    const address = preview.singleLineAddress?.trim() || "";

    if (about) {
      rows.push({ label: "About", value: about });
    }
    if (description && description !== about) {
      rows.push({ label: "Description", value: description });
    }
    if (websites.length > 0) {
      rows.push({
        label: websites.length > 1 ? "Websites" : "Website",
        value: (
          <span className="flex flex-col gap-1">
            {websites.map((url) => (
              <a
                key={url}
                href={toHref(url)}
                target="_blank"
                rel="noreferrer"
                className="break-all font-medium text-[#1877f2] hover:underline"
              >
                {url}
              </a>
            ))}
          </span>
        ),
      });
    }
    if (phone) {
      rows.push({ label: "Phone", value: phone });
    }
    if (address) {
      rows.push({ label: "Address", value: address });
    }
    if (preview.link?.trim()) {
      rows.push({
        label: "Facebook",
        value: (
          <a
            href={preview.link.trim()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#1877f2] hover:underline"
          >
            View on Facebook
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ),
      });
    }

    return rows;
  }, [preview]);

  if (!pageId.trim()) {
    return null;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <div className="border-b border-[#e8edf5] bg-[#f8fbff] px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Selected Facebook Page
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Verify this is the Facebook Page that will represent your advertisement
          before publishing.
        </p>
      </div>

      <div className="px-3 py-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading Page information…
          </div>
        ) : null}

        {!loading && (error || (preview && !preview.detailsLoaded)) ? (
          <p className="rounded-lg bg-[#fff7ed] px-3 py-2 text-xs text-amber-800">
            Additional Page information couldn&apos;t be loaded. You can still
            use this Page for your advertisement.
          </p>
        ) : null}

        {!loading && preview?.detailsLoaded ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {preview.pictureUrl ? (
                <img
                  src={preview.pictureUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-[#dbe7f7]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8edf5] text-sm font-bold text-slate-500">
                  {(preview.name ?? "P").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {preview.name?.trim() || "Facebook Page"}
                </p>
                {preview.category?.trim() ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {preview.category.trim()}
                  </p>
                ) : null}
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Page ID: {preview.id}
                </p>
              </div>
            </div>

            {detailRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-[#e8edf5]">
                {detailRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[88px_minmax(0,1fr)] gap-3 px-3 py-2.5 text-xs ${
                      index > 0 ? "border-t border-[#eef2f7]" : ""
                    }`}
                  >
                    <div className="font-semibold text-slate-500">
                      {row.label}
                    </div>
                    <div className="min-w-0 leading-relaxed text-slate-700">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              This Page will represent your Facebook ad.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
