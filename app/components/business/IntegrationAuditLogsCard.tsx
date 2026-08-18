"use client";

import { AutomationFilterDropdown } from "@/app/components/automation/AutomationFilterDropdown";
import { Skeleton } from "@/app/components/skeleton";
import {
  GoogleAdsLogo,
  MetaLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { formatRelativeTimeAgo } from "@/app/lib/datetime";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  INTEGRATION_AUDIT_PAGE_SIZE,
  getIntegrationAuditLogs,
  integrationAuditQueryKey,
  type IntegrationAuditLogItem,
} from "@/app/services/integration-audit/get-integration-audit-logs";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  CircleAlert,
  Clock,
  RefreshCw,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IntegrationAuditLogsCardProps = {
  businessId: number;
  refreshKey?: number;
};

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayYmd(): string {
  return formatYmd(new Date());
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(year, (month ?? 1) - 1, day ?? 1);
  next.setDate(next.getDate() + days);
  return formatYmd(next);
}

function capToMax(value: string, max: string): string {
  if (!value) return "";
  return value > max ? max : value;
}

const PLATFORM_OPTIONS: { id: string; label: string }[] = [
  { id: "", label: "All platforms" },
  { id: "stripe", label: "Stripe" },
  { id: "facebook", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
];

const EVENT_OPTIONS: { id: string; label: string }[] = [
  { id: "", label: "All events" },
  { id: "oauth_started", label: "Initiated" },
  { id: "stripe_connected", label: "Stripe completed" },
  { id: "meta_connected", label: "Meta Ads completed" },
  { id: "google_ads_connected", label: "Google Ads completed" },
  { id: "oauth_failed", label: "Failed" },
  { id: "oauth_aborted", label: "Cancelled" },
  { id: "stripe_disconnected", label: "Stripe disconnected" },
  { id: "meta_disconnected", label: "Meta disconnected" },
  { id: "google_ads_disconnected", label: "Google Ads disconnected" },
];

const DETAIL_FIELDS: Record<
  string,
  { label: string; hint: string; format?: (value: string) => string }
> = {
  connectedAccount: {
    label: "Connected account",
    hint: "The account linked to this business",
  },
  managerAccount: {
    label: "Manager account",
    hint: "The Google manager account used to sign in",
  },
};

function providerLabel(provider: string): string {
  if (provider === "stripe") return "Stripe";
  if (provider === "facebook") return "Meta Ads";
  if (provider === "google_ads") return "Google Ads";
  return provider;
}

function eventCopy(
  provider: string,
  eventType: string,
): { title: string; subtitle: string } {
  const platform = providerLabel(provider);
  const byEvent: Record<string, { title: string; subtitle: string }> = {
    oauth_started: {
      title: `${platform} connection initiated`,
      subtitle: `Started connecting to ${platform}`,
    },
    oauth_failed: {
      title: `${platform} connection failed`,
      subtitle: `Could not complete ${platform} Connect`,
    },
    oauth_aborted: {
      title: `${platform} connection cancelled`,
      subtitle: `Cancelled connecting to ${platform}`,
    },
    stripe_connected: {
      title: "Stripe connection completed",
      subtitle: "Stripe was connected successfully",
    },
    meta_connected: {
      title: "Meta Ads connection completed",
      subtitle: "Meta Ads was connected successfully",
    },
    google_ads_connected: {
      title: "Google Ads connection completed",
      subtitle: "Google Ads was connected successfully",
    },
    stripe_disconnected: {
      title: "Stripe disconnected",
      subtitle: "Stripe was removed from this business",
    },
    meta_disconnected: {
      title: "Meta Ads disconnected",
      subtitle: "Meta Ads was removed from this business",
    },
    google_ads_disconnected: {
      title: "Google Ads disconnected",
      subtitle: "Google Ads was removed from this business",
    },
  };
  return (
    byEvent[eventType] ?? {
      title: platform,
      subtitle: eventType.replaceAll("_", " "),
    }
  );
}

function EventGlyph({ eventType }: { eventType: string }) {
  if (eventType === "oauth_failed") {
    return <EventIconWrap className="bg-[#fee2e2] text-[#dc2626]" icon={CircleAlert} />;
  }
  if (eventType.endsWith("_disconnected") || eventType === "oauth_aborted") {
    return <EventIconWrap className="bg-slate-100 text-slate-500" icon={Unlink} />;
  }
  if (
    eventType === "stripe_connected" ||
    eventType === "meta_connected" ||
    eventType === "google_ads_connected"
  ) {
    return <EventIconWrap className="bg-[#dcfce7] text-[#16a34a]" icon={Check} />;
  }
  return <EventIconWrap className="bg-[#dbeafe] text-[#1d4ed8]" icon={Clock} />;
}

function EventIconWrap({
  className,
  icon: Icon,
}: {
  className: string;
  icon: LucideIcon;
}) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      <Icon className="size-4" strokeWidth={2.4} aria-hidden />
    </span>
  );
}

function PlatformMark({ provider }: { provider: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06]">
      {provider === "stripe" ? <StripeLogo className="size-5" /> : null}
      {provider === "facebook" ? <MetaLogo className="size-5" /> : null}
      {provider === "google_ads" ? <GoogleAdsLogo className="size-5" /> : null}
    </span>
  );
}

function formatAbsoluteTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const time = d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${date}, ${time}`;
  } catch {
    return "—";
  }
}

function detailEntries(metadata: Record<string, string>) {
  const preferred = Object.keys(DETAIL_FIELDS);
  const orderedKeys = [
    ...preferred.filter((key) => metadata[key]),
    ...Object.keys(metadata).filter((key) => !preferred.includes(key)),
  ].slice(0, 4);

  return orderedKeys.map((key) => {
    const field = DETAIL_FIELDS[key];
    const raw = metadata[key];
    return {
      key,
      label:
        field?.label ??
        key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      hint: field?.hint ?? "",
      value: field?.format ? field.format(raw) : raw,
    };
  });
}

function DetailsBlock({ item }: { item: IntegrationAuditLogItem }) {
  const entries = detailEntries(item.metadata);
  const errorMessage = item.errorMessage?.trim() || "";
  if (entries.length === 0 && !errorMessage) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return (
    <dl className="m-0 grid gap-y-2.5">
      {entries.map((entry) => (
        <div key={entry.key} className="min-w-0">
          <dt className="text-[0.72rem] font-medium text-slate-400">
            {entry.label}
          </dt>
          <dd className="m-0 mt-0.5">
            <span
              title={entry.value}
              className="block truncate text-[0.8rem] font-semibold text-slate-800"
            >
              {entry.value}
            </span>
          </dd>
          {entry.hint ? (
            <p className="m-0 mt-0.5 text-[0.68rem] leading-snug text-slate-400">
              {entry.hint}
            </p>
          ) : null}
        </div>
      ))}
      {errorMessage ? (
        <div className="min-w-0">
          <dt className="text-[0.72rem] font-medium text-red-500">Error</dt>
          <dd className="m-0 mt-0.5 text-[0.8rem] font-medium leading-relaxed text-red-700">
            {errorMessage}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function CompactLogRow({ item }: { item: IntegrationAuditLogItem }) {
  const copy = eventCopy(item.provider, item.eventType);
  const details = detailEntries(item.metadata).slice(0, 2);

  return (
    <li className="flex items-start gap-3 border-b border-[#f1f5f9] px-4 py-3 last:border-0 sm:px-5">
      <EventGlyph eventType={item.eventType} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold tracking-tight text-slate-900">
              {copy.title}
            </p>
            <p className="m-0 mt-0.5 text-[0.75rem] text-slate-500">
              {copy.subtitle}
            </p>
            {details.length > 0 ? (
              <div className="mt-1.5 space-y-1">
                {details.map((entry) => (
                  <p key={entry.key} className="m-0 text-[0.72rem] leading-snug text-slate-500">
                    <span className="font-semibold text-slate-600">{entry.label}:</span>{" "}
                    <span className="text-slate-700">{entry.value}</span>
                    {entry.hint ? (
                      <span className="block text-[0.68rem] text-slate-400">
                        {entry.hint}
                      </span>
                    ) : null}
                  </p>
                ))}
              </div>
            ) : null}
            {item.errorMessage ? (
              <p className="m-0 mt-1.5 text-[0.72rem] leading-relaxed">
                <span className="font-semibold text-red-600">Error:</span>{" "}
                <span className="text-red-700">{item.errorMessage}</span>
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="m-0 whitespace-nowrap text-[0.72rem] font-medium text-slate-600">
              {formatAbsoluteTime(item.createdAt)}
            </p>
            <p className="m-0 mt-0.5 whitespace-nowrap text-[0.68rem] text-slate-400">
              {formatRelativeTimeAgo(item.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

function LogRow({ item }: { item: IntegrationAuditLogItem }) {
  const copy = eventCopy(item.provider, item.eventType);

  return (
    <tr className="border-b border-[#f1f5f9] last:border-0">
      <td className="px-4 py-3.5 align-top first:pl-5">
        <div className="flex items-start gap-3">
          <EventGlyph eventType={item.eventType} />
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold tracking-tight text-slate-900">
              {copy.title}
            </p>
            <p className="m-0 mt-0.5 text-[0.78rem] leading-relaxed text-slate-500">
              {copy.subtitle}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 align-top">
        <DetailsBlock item={item} />
      </td>
      <td className="px-4 py-3.5 align-top">
        <div className="flex items-center gap-2.5">
          <PlatformMark provider={item.provider} />
          <p className="m-0 text-sm font-semibold text-slate-900">
            {providerLabel(item.provider)}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5 align-top last:pr-5">
        <p className="m-0 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-700">
          <Calendar className="size-3.5 text-slate-400" aria-hidden />
          {formatAbsoluteTime(item.createdAt)}
        </p>
        <p className="m-0 mt-1 pl-5 text-[0.72rem] text-slate-400">
          {formatRelativeTimeAgo(item.createdAt)}
        </p>
      </td>
    </tr>
  );
}

export function IntegrationAuditLogsCard({
  businessId,
  refreshKey = 0,
}: IntegrationAuditLogsCardProps) {
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState("");
  const [eventType, setEventType] = useState("");
  const today = todayYmd();
  const tomorrow = addDaysYmd(today, 1);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(tomorrow);

  const handleFromChange = (next: string) => {
    const safe = capToMax(next, today);
    setFrom(to && safe && safe > to ? to : safe);
  };

  const handleToChange = (next: string) => {
    const safe = capToMax(next, tomorrow);
    setTo(from && safe && safe < from ? from : safe);
  };

  useEffect(() => {
    setPage(1);
  }, [businessId, refreshKey, provider, eventType, from, to]);

  const filters = useMemo(
    () => ({
      page,
      provider: provider || undefined,
      eventType: eventType || undefined,
      from: from || undefined,
      to: to || undefined,
      refreshKey,
    }),
    [page, provider, eventType, from, to, refreshKey],
  );

  const query = useQuery({
    queryKey: integrationAuditQueryKey(businessId, filters),
    queryFn: () => getIntegrationAuditLogs(businessId, filters),
    enabled: businessId > 0,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta ?? null;
  const loading = query.isLoading || query.isFetching;
  const error = query.error
    ? getApiErrorMessage(query.error, "Could not load connection activity.")
    : null;
  const ownerOnly =
    Boolean(error) &&
    /only the account owner|admin and super admin|forbidden/i.test(error ?? "");

  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const rowOffset =
    ((meta?.page ?? page) - 1) * (meta?.limit ?? INTEGRATION_AUDIT_PAGE_SIZE);

  if (ownerOnly) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#E8EDF5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8edf5] px-4 py-3 sm:px-5">
        <h2 className="m-0 text-sm font-semibold tracking-tight text-slate-900">
          Integration Audit Logs
        </h2>
        <p className="m-0 text-xs text-slate-500">
          {total} {total === 1 ? "event" : "events"}
        </p>
      </header>

      <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-[#e8edf5] px-4 py-2.5 sm:px-5">
        <AutomationFilterDropdown
          className="w-[11.5rem] shrink-0"
          ariaLabel="Filter by platform"
          value={provider}
          options={PLATFORM_OPTIONS}
          onChange={setProvider}
        />
        <AutomationFilterDropdown
          className="w-[13.5rem] shrink-0"
          ariaLabel="Filter by event type"
          value={eventType}
          options={EVENT_OPTIONS}
          onChange={setEventType}
        />
        <div className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-2.5 text-sm text-slate-600 shadow-sm">
          <Calendar className="size-4 shrink-0 text-slate-400" aria-hidden />
          <label className="inline-flex items-center">
            <span className="sr-only">From date</span>
            <input
              type="date"
              value={from}
              max={to && to < today ? to : today}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-[7.25rem] cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-700 outline-none"
            />
          </label>
          <span className="text-slate-300">–</span>
          <label className="inline-flex items-center">
            <span className="sr-only">To date</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={tomorrow}
              onChange={(e) => handleToChange(e.target.value)}
              className="w-[7.25rem] cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-700 outline-none"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={loading}
          className="ml-auto inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
        >
          <RefreshCw
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            strokeWidth={2.25}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {loading && rows.length === 0 ? <TableSkeleton /> : null}

      {!loading && error ? (
        <p role="alert" className="m-0 px-4 py-6 text-sm text-red-700 sm:px-5">
          {error}
        </p>
      ) : null}

      {!error && !loading && total === 0 ? (
        <p className="m-0 px-4 py-10 text-center text-sm text-slate-500 sm:px-5">
          No connection activity yet. Connect Stripe, Meta Ads, or Google Ads
          and those events will show up here.
        </p>
      ) : null}

      {!error && rows.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
                  <th className="w-[34%] px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500 first:pl-5">
                    Event
                  </th>
                  <th className="w-[28%] px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Details
                  </th>
                  <th className="w-[18%] px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Platform / Account
                  </th>
                  <th className="w-[20%] px-4 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500 last:pr-5">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <LogRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
          <ul className="m-0 list-none p-0 md:hidden">
            {rows.map((item) => (
              <CompactLogRow key={item.id} item={item} />
            ))}
          </ul>
        </>
      ) : null}

      {meta && total > 0 ? (
        <div className="flex flex-col gap-3 border-t border-[#e8edf5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="m-0 text-xs text-slate-500">
            Showing {rowOffset + 1} to{" "}
            {Math.min(rowOffset + (meta.limit ?? 10), total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-4 last:border-0"
        >
          <Skeleton funnel className="size-9 shrink-0 rounded-full" />
          <Skeleton funnel className="h-4 w-48" />
          <Skeleton funnel className="ml-auto h-4 w-28" />
          <Skeleton funnel className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
