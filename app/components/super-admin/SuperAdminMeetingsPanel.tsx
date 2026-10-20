"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { SuperAdminSectionChrome } from "@/app/components/super-admin/SuperAdminSectionChrome";
import {
  formatAbsoluteDate,
  formatRelative,
  humanizeLabel,
  matchesQuery,
  SA_TABLE_PAGE_SIZE,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  getAdminMeetingRequests,
  type AdminMeetingRequest,
} from "@/app/services/admin/get-admin-meeting-requests";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

const EMPTY_MEETINGS: AdminMeetingRequest[] = [];

function isFutureMeeting(meeting: AdminMeetingRequest, now = Date.now()): boolean {
  if (!meeting.scheduledDate || !meeting.scheduledTime) return false;
  const zone = meeting.scheduledTimeZone?.trim() || "UTC";
  const [year, month, day] = meeting.scheduledDate.split("-").map(Number);
  const [hour, minute] = meeting.scheduledTime.split(":").map(Number);
  const duration = meeting.scheduledDuration ?? 0;
  const wallUtc = Date.UTC(year, month - 1, day, hour, minute + duration);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(wallUtc));
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    const zonedAsUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      read("second"),
    );
    const offset = Math.round((zonedAsUtc - wallUtc) / 60_000);
    return wallUtc - offset * 60_000 > now;
  } catch {
    return false;
  }
}

function MeetingRequestDetail({ meeting }: { meeting: AdminMeetingRequest }) {
  const when = [
    meeting.scheduledDate,
    meeting.scheduledTime,
    meeting.scheduledDuration ? `${meeting.scheduledDuration} min` : "",
    meeting.scheduledTimeZone?.replaceAll("_", " "),
  ]
    .filter(Boolean)
    .join(" · ");
  const place = [meeting.cityLocation, meeting.state, meeting.postalCode, meeting.country]
    .filter(Boolean)
    .join(", ");
  const activities = (meeting.marketingActivities ?? [])
    .map((item) => humanizeLabel(item))
    .filter(Boolean)
    .join(", ");
  const rows = [
    ["Scheduled", when || "No time was saved"],
    ["Visitor", `${meeting.firstName} ${meeting.lastName}`.trim()],
    ["Visitor email", meeting.email],
    ["Visitor phone", meeting.phone],
    ["Business", meeting.businessName],
    ["Business type", humanizeLabel(meeting.businessCategory)],
    ["Business phone", meeting.businessPhone || ""],
    ["Business email", meeting.businessEmail || ""],
    ["Website", meeting.website || ""],
    ["Location", place],
    ["Role", humanizeLabel(meeting.businessRole)],
    [
      "Monthly revenue",
      [humanizeLabel(meeting.monthlyRevenue), meeting.currency]
        .filter(Boolean)
        .join(" "),
    ],
    ["Marketing", activities],
    ["Situation", meeting.currentSituation],
    ["Start timeline", humanizeLabel(meeting.startTimeline)],
    ["Commitment", humanizeLabel(meeting.meetingCommitment)],
    ["Notes", meeting.description || ""],
  ].filter(([, value]) => Boolean(value?.trim()));

  return (
    <section
      className={styles.meetingDetail}
      aria-label={`Meeting request ${meeting.id}`}
    >
      <h3 className={styles.meetingDetailTitle}>
        Meeting request #{meeting.id}
      </h3>
      <dl className={styles.meetingDetailGrid}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.meetingDetailLinks}>
        {meeting.googleMeetLink ? (
          <a href={meeting.googleMeetLink} target="_blank" rel="noreferrer">
            Join with Google Meet
          </a>
        ) : (
          <p>
            No Google Meet link yet. The calendar was not connected for this
            booking.
          </p>
        )}
        {meeting.googleEventLink ? (
          <a href={meeting.googleEventLink} target="_blank" rel="noreferrer">
            Open in Google Calendar
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function SuperAdminMeetingsPanel() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const meetingsQuery = useQuery({
    queryKey: adminQueryKeys.meetings(),
    queryFn: getAdminMeetingRequests,
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const meetings = meetingsQuery.data?.items ?? EMPTY_MEETINGS;
  const loading = meetingsQuery.isLoading || meetingsQuery.isFetching;
  const errorMessage = meetingsQuery.error
    ? getApiErrorMessage(
        meetingsQuery.error,
        "Could not load meeting requests.",
      )
    : null;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = [...meetings].sort((a, b) => {
      const aFuture = isFutureMeeting(a) ? 1 : 0;
      const bFuture = isFutureMeeting(b) ? 1 : 0;
      if (aFuture !== bFuture) return bFuture - aFuture;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows.filter((meeting) =>
      matchesQuery(
        [
          meeting.firstName,
          meeting.lastName,
          meeting.email,
          meeting.phone,
          meeting.businessName,
          meeting.businessRole,
          meeting.businessCategory,
          meeting.cityLocation,
          String(meeting.id),
        ],
        q,
      ),
    );
  }, [meetings, q]);

  const selected = useMemo(
    () => filtered.find((meeting) => meeting.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / SA_TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * SA_TABLE_PAGE_SIZE;
    return filtered.slice(start, start + SA_TABLE_PAGE_SIZE);
  }, [filtered, safePage]);

  return (
    <SuperAdminSectionChrome
      title="Meeting requests"
      subtitle="Bookings from the Dealioo website calendar."
      query={query}
      onQueryChange={handleQueryChange}
      searchPlaceholder="Search meetings"
      onRefresh={() => void meetingsQuery.refetch()}
      refreshing={loading}
    >
      {errorMessage ? (
        <div className="mb-4">
          <AsyncErrorRetry
            layout="inline"
            title="Something went wrong"
            message={errorMessage}
            onRetry={() => void meetingsQuery.refetch()}
          />
        </div>
      ) : null}

      <div className={`${styles.card} ${styles.tableCard}`}>
        <div className={styles.cardHead}>
          <div className={styles.tableHeadLeft}>
            <span className={styles.tableHeadIcon} aria-hidden>
              <CalendarDays className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>All requests</h2>
              <p className={styles.cardSub}>
                {filtered.length.toLocaleString()} match
                {filtered.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {loading && meetings.length === 0 ? (
            <div className={styles.loadingBox}>
              <Loader2 className="size-6 animate-spin" style={{ color: "#1877f2" }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>No meeting requests found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Business</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((meeting) => {
                  const upcoming = isFutureMeeting(meeting);
                  const selectedRow = selectedId === meeting.id;
                  return (
                    <tr
                      key={meeting.id}
                      className={styles.meetingRow}
                      data-selected={selectedRow ? "true" : undefined}
                      onClick={() =>
                        setSelectedId((current) =>
                          current === meeting.id ? null : meeting.id,
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className={styles.bizName}>
                          {`${meeting.firstName} ${meeting.lastName}`.trim()}
                        </div>
                        <div className={styles.bizMeta}>{meeting.email}</div>
                      </td>
                      <td>
                        <div className={styles.bizName}>
                          {meeting.businessName || "—"}
                        </div>
                        <div className={styles.bizMeta}>
                          {humanizeLabel(meeting.businessCategory) || "—"}
                        </div>
                      </td>
                      <td>
                        {meeting.scheduledDate
                          ? [
                              meeting.scheduledDate,
                              meeting.scheduledTime,
                              meeting.scheduledTimeZone?.replaceAll("_", " "),
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : "Not scheduled"}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${
                            upcoming ? styles.statusActive : styles.statusMuted
                          }`}
                        >
                          <span className={styles.statusDot} aria-hidden />
                          {upcoming ? "Upcoming" : "Past / open"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.createdStack}>
                          <span>{formatRelative(meeting.createdAt)}</span>
                          <span className={styles.createdSub}>
                            {formatAbsoluteDate(meeting.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <OffsetPagination
          page={safePage}
          totalPages={totalPages}
          total={filtered.length}
          limit={SA_TABLE_PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          itemLabel="requests"
        />
      </div>

      {selected ? (
        <div className="mt-4">
          <MeetingRequestDetail meeting={selected} />
        </div>
      ) : null}
    </SuperAdminSectionChrome>
  );
}
