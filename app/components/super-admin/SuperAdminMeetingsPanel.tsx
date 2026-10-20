"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { Skeleton } from "@/app/components/skeleton";
import { SuperAdminSectionChrome } from "@/app/components/super-admin/SuperAdminSectionChrome";
import {
  formatRelative,
  humanizeLabel,
  initialsFromName,
  SA_TABLE_PAGE_SIZE,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  exportAdminMeetingRequestsCsv,
  getAdminMeetingRequests,
  getAdminMeetingRequestsSummary,
  type AdminMeetingRequest,
} from "@/app/services/admin/get-admin-meeting-requests";
import {
  updateAdminMeetingOutcome,
  type MeetingAttendance,
  type MeetingSalesOutcome,
} from "@/app/services/admin/update-admin-meeting-outcome";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  MapPin,
  MoreVertical,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const EMPTY_MEETINGS: AdminMeetingRequest[] = [];

const AVATAR_TONES = [
  { background: "#eff6ff", color: "#1769ff" },
  { background: "#ecfdf5", color: "#059669" },
  { background: "#f5f3ff", color: "#7c3aed" },
  { background: "#fff7ed", color: "#ea580c" },
  { background: "#fdf2f8", color: "#db2777" },
] as const;

const SALES_OPTIONS: Array<{ value: MeetingSalesOutcome; label: string }> = [
  { value: "PENDING_DECISION", label: "Pending decision" },
  { value: "DEAL_WON", label: "Deal won" },
  { value: "FOLLOW_UP_REQUIRED", label: "Follow-up required" },
  { value: "DEAL_LOST", label: "Deal lost" },
];

function formatMeetingDateLabel(date: string | null | undefined): string {
  if (!date) return "Not scheduled";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMeetingTimeLabel(time: string | null | undefined): string {
  if (!time) return "";
  const [hourRaw, minuteRaw] = time.split(":").map(Number);
  if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) return time;
  const hour12 = hourRaw % 12 || 12;
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minuteRaw).padStart(2, "0")} ${suffix}`;
}

function formatCreatedAbsolute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function percentOf(part: number, total: number): string {
  if (total <= 0) return "0% of total";
  return `${Math.round((part / total) * 100)}% of total`;
}

function statusBadge(meeting: AdminMeetingRequest): {
  label: string;
  className: string;
} {
  if (meeting.attendance === "CANCELLED") {
    return { label: "Cancelled", className: styles.statusCancelled };
  }
  if (meeting.attendance === "NO_SHOW") {
    return { label: "No show", className: styles.statusNoShow };
  }
  if (meeting.attendance === "ATTENDED") {
    return { label: "Attended", className: styles.statusAttended };
  }
  return { label: "Past / open", className: styles.statusMuted };
}

function MeetingModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={styles.meetingModalPanel}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.meetingModalHeader}>
          <div>
            <p className={styles.meetingModalEyebrow}>Meeting workflow</p>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className={styles.meetingModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className={styles.meetingModalBody}>{children}</div>
      </section>
    </div>
  );
}

function AttendanceModal({
  meeting,
  busy,
  onClose,
  onSave,
}: {
  meeting: AdminMeetingRequest;
  busy: boolean;
  onClose: () => void;
  onSave: (input: {
    attendance: "ATTENDED" | "NO_SHOW";
    meetingNotes: string;
  }) => void;
}) {
  const [attendance, setAttendance] = useState<"ATTENDED" | "NO_SHOW">(
    meeting.attendance === "NO_SHOW" ? "NO_SHOW" : "ATTENDED",
  );
  const [notes, setNotes] = useState(meeting.meetingNotes || "");

  return (
    <MeetingModalShell title="Record attendance" onClose={onClose}>
      <p className={styles.meetingModalLead}>
        {`${meeting.firstName} ${meeting.lastName}`.trim()} ·{" "}
        {meeting.businessName || "Business"} ·{" "}
        {formatMeetingDateLabel(meeting.scheduledDate)}{" "}
        {formatMeetingTimeLabel(meeting.scheduledTime)}
      </p>
      <div className={styles.meetingModalChoices}>
        {(
          [
            { value: "ATTENDED" as const, label: "Attended" },
            { value: "NO_SHOW" as const, label: "No show" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.meetingChoiceBtn} ${
              attendance === option.value ? styles.meetingChoiceBtnActive : ""
            }`}
            onClick={() => setAttendance(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className={styles.meetingModalField}>
        Meeting notes (optional)
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </label>
      <div className={styles.meetingModalActions}>
        <button
          type="button"
          className={styles.userControlSecondary}
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.userControlPrimary}
          disabled={busy}
          onClick={() =>
            onSave({ attendance, meetingNotes: notes.trim() })
          }
        >
          Save attendance
        </button>
      </div>
    </MeetingModalShell>
  );
}

function OutcomeModal({
  meeting,
  busy,
  onClose,
  onSave,
}: {
  meeting: AdminMeetingRequest;
  busy: boolean;
  onClose: () => void;
  onSave: (input: {
    salesOutcome: MeetingSalesOutcome;
    followUpNotes: string;
  }) => void;
}) {
  const [salesOutcome, setSalesOutcome] = useState<MeetingSalesOutcome>(
    (meeting.salesOutcome as MeetingSalesOutcome) || "PENDING_DECISION",
  );
  const [notes, setNotes] = useState(meeting.followUpNotes || "");
  const alreadyOnboarded = Boolean(meeting.businessId);
  const isDealWon = meeting.salesOutcome === "DEAL_WON";

  return (
    <MeetingModalShell title="Record sales outcome" onClose={onClose}>
      <p className={styles.meetingModalLead}>
        {`${meeting.firstName} ${meeting.lastName}`.trim()} ·{" "}
        {meeting.businessName || "Business"}
      </p>
      {isDealWon && alreadyOnboarded ? (
        <p className={styles.meetingConfirmWarning}>
          This deal already has a customer account. Change the outcome only if
          you are sure — undo is blocked until the business is removed.
        </p>
      ) : null}
      {isDealWon && !alreadyOnboarded ? (
        <p className={styles.meetingModalLead}>
          Wrong Deal won? Pick another outcome (or Pending decision) to move
          this meeting out of the Deal won tab.
        </p>
      ) : null}
      <label className={styles.meetingModalField}>
        Sales outcome
        <select
          value={salesOutcome}
          disabled={busy || (isDealWon && alreadyOnboarded)}
          onChange={(event) =>
            setSalesOutcome(event.target.value as MeetingSalesOutcome)
          }
        >
          {SALES_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {isDealWon && !alreadyOnboarded ? (
        <button
          type="button"
          className={styles.userControlSecondary}
          disabled={busy}
          onClick={() => setSalesOutcome("PENDING_DECISION")}
        >
          Undo Deal won → Pending decision
        </button>
      ) : null}
      <label className={styles.meetingModalField}>
        Follow-up notes (optional)
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </label>
      <div className={styles.meetingModalActions}>
        <button
          type="button"
          className={styles.userControlSecondary}
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.userControlPrimary}
          disabled={busy || (isDealWon && alreadyOnboarded)}
          onClick={() =>
            onSave({ salesOutcome, followUpNotes: notes.trim() })
          }
        >
          Save outcome
        </button>
      </div>
    </MeetingModalShell>
  );
}

function DetailsDrawer({
  meeting,
  onClose,
}: {
  meeting: AdminMeetingRequest;
  onClose: () => void;
}) {
  const when = [
    formatMeetingDateLabel(meeting.scheduledDate),
    formatMeetingTimeLabel(meeting.scheduledTime),
    meeting.scheduledDuration ? `${meeting.scheduledDuration} min` : "",
    meeting.scheduledTimeZone?.replaceAll("_", " "),
  ]
    .filter(Boolean)
    .join(" · ");

  const rows = [
    ["Visitor", `${meeting.firstName} ${meeting.lastName}`.trim()],
    ["Email", meeting.email],
    ["Phone", meeting.phone],
    ["Business", meeting.businessName || "Not provided"],
    ["Category", humanizeLabel(meeting.businessCategory) || "Not provided"],
    ["Scheduled", when || "Not scheduled"],
    ["Attendance", humanizeLabel(meeting.attendance) || "Not recorded"],
    ["Sales outcome", humanizeLabel(meeting.salesOutcome) || "Not recorded"],
    ["Meeting notes", meeting.meetingNotes || ""],
    ["Follow-up notes", meeting.followUpNotes || ""],
  ].filter(([, value]) => Boolean(value?.trim()));

  return (
    <MeetingModalShell title={`Meeting #${meeting.id}`} onClose={onClose}>
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
        ) : null}
        {meeting.googleEventLink ? (
          <a href={meeting.googleEventLink} target="_blank" rel="noreferrer">
            Open in Google Calendar
          </a>
        ) : null}
      </div>
    </MeetingModalShell>
  );
}

function RowMenu({
  meeting,
  open,
  onOpenChange,
  onViewDetails,
  onRecordAttendance,
  onRecordOutcome,
}: {
  meeting: AdminMeetingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails: () => void;
  onRecordAttendance: () => void;
  onRecordOutcome: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const positionMenu = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 260;
    const estimatedHeight = 280;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight + gap;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    setMenuStyle({
      left,
      top: openUpward
        ? Math.max(8, rect.top - estimatedHeight - gap)
        : rect.bottom + gap,
      width: menuWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
    const onReposition = () => positionMenu();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const copyRef = async () => {
    await navigator.clipboard.writeText(String(meeting.id));
    toast.success("Meeting reference copied.");
    onOpenChange(false);
  };

  return (
    <div ref={rootRef} className={styles.meetingActionSplit}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.meetingActionMenuBtn}
        aria-label="More meeting actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          if (!open) positionMenu();
          onOpenChange(!open);
        }}
      >
        <MoreVertical className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              className={`${styles.meetingMenuDropdown} ${styles.meetingMenuDropdownFixed}`}
              role="menu"
              style={menuStyle}
            >
              <p className={styles.meetingMenuLabel}>Actions</p>
              <button
                type="button"
                role="menuitem"
                className={styles.meetingMenuItem}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                  onViewDetails();
                }}
              >
                <span className={styles.meetingMenuIcon}>
                  <Eye className="size-3.5" aria-hidden />
                </span>
                View meeting details
              </button>
              {meeting.googleEventLink ? (
                <a
                  role="menuitem"
                  className={styles.meetingMenuItem}
                  href={meeting.googleEventLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className={styles.meetingMenuIcon}>
                    <ExternalLink className="size-3.5" aria-hidden />
                  </span>
                  Open Google Calendar event
                </a>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className={styles.meetingMenuItem}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                  onRecordAttendance();
                }}
              >
                <span className={styles.meetingMenuIcon}>
                  <CalendarCheck2 className="size-3.5" aria-hidden />
                </span>
                Record or update attendance
              </button>
              {meeting.attendance === "ATTENDED" ? (
                <button
                  type="button"
                  role="menuitem"
                  className={styles.meetingMenuItem}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenChange(false);
                    onRecordOutcome();
                  }}
                >
                  <span className={styles.meetingMenuIcon}>
                    <TrendingUp className="size-3.5" aria-hidden />
                  </span>
                  {meeting.salesOutcome === "DEAL_WON"
                    ? "Change or undo sales outcome"
                    : "Update sales outcome"}
                </button>
              ) : null}
              {meeting.attendance === "ATTENDED" &&
              meeting.salesOutcome === "DEAL_WON" &&
              !meeting.businessId ? (
                <Link
                  role="menuitem"
                  className={styles.meetingMenuItem}
                  href="/admin/customer-onboarding"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenChange(false);
                  }}
                >
                  <span className={styles.meetingMenuIcon}>
                    <ExternalLink className="size-3.5" aria-hidden />
                  </span>
                  Open Customer Onboarding
                </Link>
              ) : null}
              <div className={styles.meetingMenuDivider} />
              <button
                type="button"
                role="menuitem"
                className={styles.meetingMenuItem}
                onClick={(event) => {
                  event.stopPropagation();
                  void copyRef();
                }}
              >
                <span className={styles.meetingMenuIcon}>
                  <Copy className="size-3.5" aria-hidden />
                </span>
                Copy meeting reference
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function primaryActionFor(
  meeting: AdminMeetingRequest,
  scope: "upcoming" | "past" | "deal_won",
): {
  label: string;
  kind: "details" | "attendance" | "outcome" | "onboarding" | "onboarded";
  icon: "eye" | "calendar";
  primary: boolean;
} {
  if (
    meeting.attendance === "ATTENDED" &&
    meeting.salesOutcome === "DEAL_WON" &&
    meeting.businessId
  ) {
    return {
      label: "Onboarded",
      kind: "onboarded",
      icon: "eye",
      primary: false,
    };
  }
  if (
    meeting.attendance === "ATTENDED" &&
    meeting.salesOutcome === "DEAL_WON"
  ) {
    return {
      label: "Open onboarding",
      kind: "onboarding",
      icon: "eye",
      primary: true,
    };
  }
  if (meeting.attendance === "ATTENDED") {
    return {
      label: "Record outcome",
      kind: "outcome",
      icon: "calendar",
      primary: true,
    };
  }
  if ((scope === "past" || scope === "deal_won") && !meeting.attendance) {
    return {
      label: "Record attendance",
      kind: "attendance",
      icon: "calendar",
      primary: true,
    };
  }
  return {
    label: "View details",
    kind: "details",
    icon: "eye",
    primary: false,
  };
}

function KpiSkeleton() {
  return (
    <div className={styles.usersDirStats} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className={styles.usersDirStatCard}>
          <div className="w-full space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </article>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function SuperAdminMeetingsPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(SA_TABLE_PAGE_SIZE);
  const [scope, setScope] = useState<"upcoming" | "past" | "deal_won">(
    "upcoming",
  );
  const [menuMeetingId, setMenuMeetingId] = useState<number | null>(null);
  const [detailsMeeting, setDetailsMeeting] =
    useState<AdminMeetingRequest | null>(null);
  const [attendanceMeeting, setAttendanceMeeting] =
    useState<AdminMeetingRequest | null>(null);
  const [outcomeMeeting, setOutcomeMeeting] =
    useState<AdminMeetingRequest | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const summaryQuery = useQuery({
    queryKey: adminQueryKeys.meetingsSummary(),
    queryFn: getAdminMeetingRequestsSummary,
    enabled: hasAuthSession(),
    staleTime: 30_000,
  });

  const meetingsQuery = useQuery({
    queryKey: adminQueryKeys.meetings(
      scope,
      page,
      debouncedSearch,
      limit,
      "meeting_asc",
    ),
    queryFn: () =>
      getAdminMeetingRequests({
        scope,
        page,
        limit,
        search: debouncedSearch,
        sort: "meeting_asc",
      }),
    enabled: hasAuthSession(),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const meetings = meetingsQuery.data?.items ?? EMPTY_MEETINGS;
  const meta = meetingsQuery.data?.meta;
  const counts = meetingsQuery.data?.counts ?? {
    upcoming: summaryQuery.data?.upcoming ?? 0,
    past: summaryQuery.data?.past ?? 0,
    dealWon: 0,
    all: summaryQuery.data?.total ?? 0,
  };
  const summary = summaryQuery.data;
  const loading =
    (meetingsQuery.isLoading || meetingsQuery.isFetching) &&
    meetings.length === 0;
  const refreshing =
    meetingsQuery.isFetching || summaryQuery.isFetching;
  const errorMessage = meetingsQuery.error
    ? getApiErrorMessage(
        meetingsQuery.error,
        "Could not load meeting requests.",
      )
    : null;

  const invalidateMeetings = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.meetingsRoot(),
    });
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.meetingsSummary(),
    });
  };

  const outcomeMutation = useMutation({
    mutationFn: ({
      meetingId,
      ...input
    }: {
      meetingId: number;
      attendance?: MeetingAttendance | null;
      salesOutcome?: MeetingSalesOutcome | null;
      meetingNotes?: string | null;
      followUpNotes?: string | null;
    }) => updateAdminMeetingOutcome(meetingId, input),
    onSuccess: async () => {
      toast.success("Meeting updated.");
      setAttendanceMeeting(null);
      setOutcomeMeeting(null);
      await invalidateMeetings();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update meeting."));
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportAdminMeetingRequestsCsv({
        scope,
        search: debouncedSearch,
      }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `meeting-requests-${scope}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not export meetings."));
    },
  });

  const busy = outcomeMutation.isPending;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const total = meta?.total ?? 0;

  const runPrimary = (meeting: AdminMeetingRequest) => {
    const action = primaryActionFor(meeting, scope);
    if (action.kind === "details") setDetailsMeeting(meeting);
    if (action.kind === "attendance") setAttendanceMeeting(meeting);
    if (action.kind === "outcome") setOutcomeMeeting(meeting);
  };

  const stats = useMemo(
    () => ({
      total: summary?.total ?? counts.all,
      upcoming: summary?.upcoming ?? counts.upcoming,
      attended: summary?.attended ?? 0,
      onboardingStarted: summary?.onboardingStarted ?? 0,
      createdThisWeek: summary?.createdThisWeek ?? 0,
      past: summary?.past ?? counts.past,
    }),
    [summary, counts],
  );

  return (
    <SuperAdminSectionChrome
      title="Meeting requests"
      subtitle="Bookings from the Dealioo website calendar. Record attendance and sales outcomes. Create accounts in Customer Onboarding."
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search meetings, visitors or business..."
      onRefresh={() => {
        void meetingsQuery.refetch();
        void summaryQuery.refetch();
      }}
      refreshing={refreshing}
    >
      {summaryQuery.isLoading && !summary ? (
        <KpiSkeleton />
      ) : (
        <div className={styles.usersDirStats}>
          <article className={styles.usersDirStatCard}>
            <div>
              <p className={styles.usersDirStatLabel}>Total requests</p>
              <p className={styles.usersDirStatValue}>{stats.total}</p>
              <p className={styles.usersDirStatHint}>
                +{stats.createdThisWeek} this week
              </p>
            </div>
            <span
              className={styles.usersDirStatIcon}
              style={{ background: "#eff6ff", color: "#1769ff" }}
              aria-hidden
            >
              <CalendarDays className="size-4" strokeWidth={2.25} />
            </span>
          </article>
          <article className={styles.usersDirStatCard}>
            <div>
              <p className={styles.usersDirStatLabel}>Upcoming</p>
              <p className={styles.usersDirStatValue}>{stats.upcoming}</p>
              <p
                className={`${styles.usersDirStatHint} ${styles.usersDirStatHintMuted}`}
              >
                {percentOf(stats.upcoming, stats.total)}
              </p>
            </div>
            <span
              className={styles.usersDirStatIcon}
              style={{ background: "#ecfdf5", color: "#059669" }}
              aria-hidden
            >
              <CalendarCheck2 className="size-4" strokeWidth={2.25} />
            </span>
          </article>
          <article className={styles.usersDirStatCard}>
            <div>
              <p className={styles.usersDirStatLabel}>Attended</p>
              <p className={styles.usersDirStatValue}>{stats.attended}</p>
              <p
                className={`${styles.usersDirStatHint} ${styles.usersDirStatHintMuted}`}
              >
                {percentOf(stats.attended, stats.total)}
              </p>
            </div>
            <span
              className={styles.usersDirStatIcon}
              style={{ background: "#f5f3ff", color: "#7c3aed" }}
              aria-hidden
            >
              <UsersRound className="size-4" strokeWidth={2.25} />
            </span>
          </article>
          <article className={styles.usersDirStatCard}>
            <div>
              <p className={styles.usersDirStatLabel}>Accounts created</p>
              <p className={styles.usersDirStatValue}>
                {stats.onboardingStarted}
              </p>
              <p
                className={`${styles.usersDirStatHint} ${styles.usersDirStatHintMuted}`}
              >
                {percentOf(stats.onboardingStarted, stats.total)}
              </p>
            </div>
            <span
              className={styles.usersDirStatIcon}
              style={{ background: "#fff7ed", color: "#ea580c" }}
              aria-hidden
            >
              <TrendingUp className="size-4" strokeWidth={2.25} />
            </span>
          </article>
        </div>
      )}

      <div className={styles.usersDirToolbar}>
        <div
          className={styles.meetingScopeTabs}
          role="tablist"
          aria-label="Meeting time filters"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "upcoming"}
            className={`${styles.usersDirTab} ${
              scope === "upcoming" ? styles.usersDirTabActive : ""
            }`}
            onClick={() => {
              setScope("upcoming");
              setPage(1);
            }}
          >
            <CalendarDays className="size-3.5" strokeWidth={2.25} aria-hidden />
            Upcoming ({counts.upcoming})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "past"}
            className={`${styles.usersDirTab} ${
              scope === "past" ? styles.usersDirTabActive : ""
            }`}
            onClick={() => {
              setScope("past");
              setPage(1);
            }}
          >
            <Clock3 className="size-3.5" strokeWidth={2.25} aria-hidden />
            Past ({counts.past})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "deal_won"}
            className={`${styles.usersDirTab} ${
              scope === "deal_won" ? styles.usersDirTabActive : ""
            }`}
            onClick={() => {
              setScope("deal_won");
              setPage(1);
            }}
          >
            <TrendingUp className="size-3.5" strokeWidth={2.25} aria-hidden />
            Deal won ({counts.dealWon})
          </button>
        </div>
        <label className={styles.usersDirSort}>
          <span className="sr-only">Page size</span>
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </label>
      </div>

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

      <div className={`${styles.card} ${styles.tableCard} ${styles.meetingsCard}`}>
        <div className={styles.cardHead}>
          <div className={styles.tableHeadLeft}>
            <span className={styles.tableHeadIcon} aria-hidden>
              <CalendarDays className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>All requests</h2>
              <p className={styles.cardSub}>
                Meeting requests from the Dealioo website calendar
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.meetingExportBtn}
            disabled={exportMutation.isPending || total === 0}
            onClick={() => exportMutation.mutate()}
          >
            <Download className="size-4" strokeWidth={2.25} aria-hidden />
            Export
          </button>
        </div>

        <div className={styles.meetingsTableWrap}>
          {loading ? (
            <TableSkeleton />
          ) : meetings.length === 0 ? (
            <div className={styles.meetingsEmpty}>
              <UserRound className="size-7 text-slate-400" aria-hidden />
              <p>No meeting requests found.</p>
              <p>Try another tab or clear your search.</p>
              {debouncedSearch ? (
                <button
                  type="button"
                  className={styles.userControlSecondary}
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              ) : null}
            </div>
          ) : (
            <table className={`${styles.table} ${styles.meetingsTable}`}>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Business</th>
                  <th>Meeting Date &amp; Time</th>
                  <th>Status</th>
                  <th>Outcome / Account</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting, index) => {
                  const fullName =
                    `${meeting.firstName} ${meeting.lastName}`.trim() ||
                    "Visitor";
                  const tone = AVATAR_TONES[index % AVATAR_TONES.length]!;
                  const action = primaryActionFor(meeting, scope);
                  const badge =
                    scope === "upcoming" && !meeting.attendance
                      ? {
                          label: "Upcoming",
                          className: styles.statusActive,
                        }
                      : statusBadge(meeting);

                  return (
                    <tr
                      key={meeting.id}
                      className={`${styles.meetingRow} ${styles.usersDirRowClickable}`}
                      onClick={() => setDetailsMeeting(meeting)}
                    >
                      <td>
                        <div className={styles.meetingIdentity}>
                          <span
                            className={styles.meetingsAvatar}
                            style={{
                              background: tone.background,
                              color: tone.color,
                            }}
                            aria-hidden
                          >
                            {initialsFromName(fullName)}
                          </span>
                          <div className={styles.meetingIdentityText}>
                            <div className={styles.meetingPersonName}>
                              {fullName}
                            </div>
                            <div className={styles.bizMeta}>{meeting.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.meetingsBizText}>
                          <div className={styles.bizName}>
                            {meeting.businessName || "Not provided"}
                          </div>
                          <div className={styles.bizMeta}>
                            {humanizeLabel(meeting.businessCategory) ||
                              "Not provided"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.meetingsSchedule}>
                          <span className={styles.meetingsDateLine}>
                            <CalendarDays
                              className="size-3.5"
                              strokeWidth={2.25}
                              aria-hidden
                            />
                            {formatMeetingDateLabel(meeting.scheduledDate)}
                          </span>
                          <span className={styles.meetingsTimeLine}>
                            <Clock3
                              className="size-3.5"
                              strokeWidth={2.25}
                              aria-hidden
                            />
                            {formatMeetingTimeLabel(meeting.scheduledTime) ||
                              "Time not set"}
                          </span>
                          {meeting.scheduledTimeZone ? (
                            <span className={styles.meetingsZoneLine}>
                              <MapPin
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              <span className={styles.meetingsContactText}>
                                {meeting.scheduledTimeZone.replaceAll("_", " ")}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${badge.className}`}
                        >
                          <span className={styles.statusDot} aria-hidden />
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        {meeting.salesOutcome || meeting.onboardingId ? (
                          <div className={styles.meetingsOutcomeStack}>
                            <span className={styles.bizName}>
                              {meeting.salesOutcome
                                ? humanizeLabel(meeting.salesOutcome)
                                : "—"}
                            </span>
                            <span className={styles.bizMeta}>
                              {meeting.businessId
                                ? "Account created"
                                : meeting.salesOutcome === "DEAL_WON"
                                  ? "Create in Onboarding"
                                  : "No account yet"}
                            </span>
                          </div>
                        ) : (
                          <span className={styles.meetingOutcomeEmpty}>
                            — Not recorded
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.createdStack}>
                          <span>{formatRelative(meeting.createdAt)}</span>
                          <span className={styles.createdSub}>
                            {formatCreatedAbsolute(meeting.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td
                        className={styles.meetingRowActions}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className={styles.meetingActionGroup}>
                          {action.kind === "onboarded" ? (
                            <span
                              className={`${styles.statusPill} ${styles.statusActive}`}
                            >
                              <span className={styles.statusDot} aria-hidden />
                              Onboarded
                            </span>
                          ) : action.kind === "onboarding" ? (
                            <Link
                              href="/admin/customer-onboarding"
                              className={styles.meetingPrimaryAction}
                            >
                              <ExternalLink
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              {action.label}
                            </Link>
                          ) : action.kind === "details" ? (
                            <button
                              type="button"
                              className={styles.meetingSecondaryAction}
                              disabled={busy}
                              onClick={() => setDetailsMeeting(meeting)}
                            >
                              <Eye
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              View details
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.meetingPrimaryAction}
                              disabled={busy}
                              onClick={() => runPrimary(meeting)}
                            >
                              <CalendarCheck2
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              {action.label}
                            </button>
                          )}
                          <RowMenu
                            meeting={meeting}
                            open={menuMeetingId === meeting.id}
                            onOpenChange={(open) =>
                              setMenuMeetingId(open ? meeting.id : null)
                            }
                            onViewDetails={() => setDetailsMeeting(meeting)}
                            onRecordAttendance={() =>
                              setAttendanceMeeting(meeting)
                            }
                            onRecordOutcome={() => setOutcomeMeeting(meeting)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.meetingsFooter}>
          <p className={styles.meetingsFooterMeta}>
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}–
            {Math.min(page * limit, total)} of {total} requests
          </p>
          <div className={styles.meetingsFooterPager}>
            <button
              type="button"
              className={styles.meetingsPageBtn}
              disabled={meetingsQuery.isFetching || page <= 1}
              aria-label="Previous page"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(
                Math.max(0, Math.min(page - 3, totalPages - 5)),
                Math.max(0, Math.min(page - 3, totalPages - 5)) + 5,
              )
              .map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.meetingsPageBtn} ${
                    pageNumber === page ? styles.meetingsPageBtnActive : ""
                  }`}
                  disabled={meetingsQuery.isFetching}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            <button
              type="button"
              className={styles.meetingsPageBtn}
              disabled={meetingsQuery.isFetching || page >= totalPages}
              aria-label="Next page"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <label className={styles.meetingsPageSize}>
              <select
                value={limit}
                aria-label="Rows per page"
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {detailsMeeting ? (
        <DetailsDrawer
          meeting={detailsMeeting}
          onClose={() => setDetailsMeeting(null)}
        />
      ) : null}

      {attendanceMeeting ? (
        <AttendanceModal
          meeting={attendanceMeeting}
          busy={outcomeMutation.isPending}
          onClose={() => setAttendanceMeeting(null)}
          onSave={({ attendance, meetingNotes }) => {
            outcomeMutation.mutate({
              meetingId: attendanceMeeting.id,
              attendance,
              salesOutcome:
                attendance === "ATTENDED"
                  ? (attendanceMeeting.salesOutcome as MeetingSalesOutcome) ||
                    null
                  : null,
              meetingNotes: meetingNotes || null,
              followUpNotes: attendanceMeeting.followUpNotes ?? null,
            });
          }}
        />
      ) : null}

      {outcomeMeeting ? (
        <OutcomeModal
          meeting={outcomeMeeting}
          busy={outcomeMutation.isPending}
          onClose={() => setOutcomeMeeting(null)}
          onSave={({ salesOutcome, followUpNotes }) => {
            outcomeMutation.mutate({
              meetingId: outcomeMeeting.id,
              attendance: "ATTENDED",
              salesOutcome,
              meetingNotes: outcomeMeeting.meetingNotes ?? null,
              followUpNotes: followUpNotes || null,
            });
          }}
        />
      ) : null}

    </SuperAdminSectionChrome>
  );
}
