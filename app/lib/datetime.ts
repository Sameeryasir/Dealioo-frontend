export function formatTimeShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function formatDateTimeShort(
  iso: string | null | undefined,
): string {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
}

export function formatLogDrawerTimestamp(
  iso: string | null | undefined,
): string {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${date} (${time})`;
  } catch {
    return "N/A";
  }
}

export function formatDurationBetween(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const secs = Math.round((end - start) / 1000);
  if (secs < 60) return `${Math.max(secs, 1)}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    const rem = secs % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

export function formatRelativeTimeAgo(
  iso: string | null | undefined,
): string {
  if (!iso) return "Unknown";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Unknown";

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    return formatDateTimeShort(iso);
  } catch {
    return "Unknown";
  }
}

export function formatPaidAtParts(
  iso: string | null | undefined,
): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return {
    date: `${day}/${month}/${year}`,
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Change summary:
 * - What: Chart bucket labels treat keys as already in the viewer's calendar.
 * - Why: Backend now buckets by viewer timezone; converting again would shift
 *   hours/days (e.g. 6 PM local shown as wrong hour).
 * - Related: overview-monthly.util buildZonedRangeBucketKeys
 * - MCP context 7: display-only formatting from key parts; no invented times.
 */
export function formatUtcChartBucketLabel(
  bucketKey: string,
  _timeZone: string = getUserTimeZone(),
): string {
  // Hour buckets: YYYY-MM-DDTHH (wall clock in the viewer's zone)
  const hourMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/.exec(bucketKey);
  if (hourMatch) {
    const hour = Number(hourMatch[4]);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
      return bucketKey;
    }
    // Format like Intl hour12 (e.g. "3 AM", "6 PM") without re-zoning.
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hour12: true,
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2000, 0, 1, hour)));
  }

  const parts = bucketKey.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  // Day buckets: YYYY-MM-DD civil date in the viewer's zone — label as-is.
  if (
    parts.length >= 3 &&
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day)
  ) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  }

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return bucketKey;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}
