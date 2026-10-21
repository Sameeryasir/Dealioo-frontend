"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { Skeleton } from "@/app/components/skeleton";
import {
  formatRelative,
  humanizeLabel,
  initialsFromName,
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
  Building2,
  CalendarCheck2,
  CalendarDays,
  CircleDot,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Hash,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Search,
  TrendingUp,
  UserRound,
  UsersRound,
  Video,
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
const PAGE_SIZE = 10;

type MeetingScope = "all" | "upcoming" | "past" | "deal_won";

const SCOPE_OPTIONS: Array<{ id: MeetingScope; label: string }> = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "deal_won", label: "Deal won" },
];

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
  tone: "green" | "yellow" | "muted";
} {
  if (meeting.attendance === "CANCELLED") {
    return { label: "Cancelled", tone: "muted" };
  }
  if (meeting.attendance === "NO_SHOW") {
    return { label: "No show", tone: "muted" };
  }
  if (meeting.attendance === "ATTENDED") {
    return { label: "Attended", tone: "green" };
  }
  return { label: "Past / open", tone: "yellow" };
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
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const fullName =
    `${meeting.firstName} ${meeting.lastName}`.trim() || "Visitor";
  const attendanceLabel = humanizeLabel(meeting.attendance) || "Not recorded";
  const outcomeLabel = humanizeLabel(meeting.salesOutcome) || "Not recorded";
  const scheduleWhen = [
    formatMeetingDateLabel(meeting.scheduledDate),
    formatMeetingTimeLabel(meeting.scheduledTime),
  ]
    .filter(Boolean)
    .join(" · ");

  const contactRows: Array<{
    label: string;
    value: string;
    icon: typeof Mail;
  }> = [
    {
      label: "Email",
      value: meeting.email?.trim() || "Not set",
      icon: Mail,
    },
    {
      label: "Phone",
      value: meeting.phone?.trim() || "Not set",
      icon: Phone,
    },
    {
      label: "Location",
      value: meeting.cityLocation?.trim() || "Not set",
      icon: MapPin,
    },
    {
      label: "Requested on",
      value: formatCreatedAbsolute(meeting.createdAt),
      icon: Clock3,
    },
  ];

  const scheduleRows: Array<{
    label: string;
    value: string;
    icon: typeof CalendarDays;
  }> = [
    {
      label: "Scheduled",
      value: scheduleWhen || "Not scheduled",
      icon: CalendarDays,
    },
    {
      label: "Duration",
      value: meeting.scheduledDuration
        ? `${meeting.scheduledDuration} min`
        : "Not set",
      icon: Clock3,
    },
    {
      label: "Time zone",
      value: meeting.scheduledTimeZone?.replaceAll("_", " ") || "Not set",
      icon: MapPin,
    },
  ];

  const businessRows: Array<{
    label: string;
    value: string;
    icon: typeof Building2;
  }> = [
    {
      label: "Business",
      value: meeting.businessName?.trim() || "Not provided",
      icon: Building2,
    },
    {
      label: "Category",
      value: humanizeLabel(meeting.businessCategory) || "Not provided",
      icon: CircleDot,
    },
    {
      label: "Interested plan",
      value: [
        meeting.selectedPlanName?.trim() ||
          meeting.selectedPlanSlug?.trim() ||
          "",
        meeting.selectedBillingCycle === "annual"
          ? "Annually"
          : meeting.selectedBillingCycle === "monthly"
            ? "Monthly"
            : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Not selected",
      icon: TrendingUp,
    },
    {
      label: "Attendance",
      value: attendanceLabel,
      icon: CalendarCheck2,
    },
    {
      label: "Sales outcome",
      value: outcomeLabel,
      icon: TrendingUp,
    },
  ];

  const noteRows = [
    {
      label: "Meeting notes",
      value: meeting.meetingNotes?.trim() || "",
    },
    {
      label: "Follow-up notes",
      value: meeting.followUpNotes?.trim() || "",
    },
  ].filter((row) => Boolean(row.value));

  const attendanceChipActive = meeting.attendance === "ATTENDED";

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`${styles.usersDirDetailSheet} ${styles.usersDirDetailSheetFlat}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-meeting-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.usersDirDetailClose}
          onClick={onClose}
          aria-label="Close meeting details"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className={styles.usersDirDetailBody}>
          <div className={styles.usersDirDetailIdentity}>
            <div className={styles.usersDirDetailAvatarRing}>
              <span className={styles.userAvatarLg} aria-hidden>
                {initialsFromName(fullName)}
              </span>
            </div>
            <div className={styles.usersDirDetailIdentityText}>
              <p className={styles.usersDirDetailEyebrow}>Meeting request</p>
              <h3
                id="sa-meeting-details-title"
                className={styles.usersDirDetailName}
              >
                {fullName}
              </h3>
              <p className={styles.usersDirDetailEmail}>
                {meeting.email || "—"}
              </p>
              <div className={styles.usersDirDetailChips}>
                <span
                  className={`${styles.usersDirDetailChip} ${
                    attendanceChipActive
                      ? styles.usersDirDetailChipActive
                      : styles.usersDirDetailChipMuted
                  }`}
                >
                  <span className={styles.usersDirStatusDot} aria-hidden />
                  {attendanceLabel}
                </span>
                <span
                  className={`${styles.usersDirDetailChip} ${styles.usersDirDetailChipMuted}`}
                >
                  <TrendingUp className="size-3" strokeWidth={2.5} aria-hidden />
                  {outcomeLabel}
                </span>
                <span
                  className={`${styles.usersDirDetailChip} ${styles.usersDirDetailChipMuted}`}
                >
                  <Building2 className="size-3" strokeWidth={2.5} aria-hidden />
                  {meeting.businessName?.trim() || "No business"}
                </span>
                <span
                  className={`${styles.usersDirDetailChip} ${styles.usersDirDetailChipMuted}`}
                >
                  <TrendingUp className="size-3" strokeWidth={2.5} aria-hidden />
                  {meeting.selectedPlanName?.trim() ||
                    meeting.selectedPlanSlug?.trim() ||
                    "No plan"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>
              Contact & request
            </h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {contactRows.map(({ label, value, icon: Icon }) => (
                <div key={label} className={styles.usersDirDetailInfoRow}>
                  <span
                    className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className={styles.usersDirDetailInfoCopy}>
                    <span className={styles.usersDirDetailInfoLabel}>
                      {label}
                    </span>
                    <span className={styles.usersDirDetailInfoValue}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>Schedule</h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {scheduleRows.map(({ label, value, icon: Icon }) => (
                <div key={label} className={styles.usersDirDetailInfoRow}>
                  <span
                    className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className={styles.usersDirDetailInfoCopy}>
                    <span className={styles.usersDirDetailInfoLabel}>
                      {label}
                    </span>
                    <span className={styles.usersDirDetailInfoValue}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>
              Business & outcome
            </h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {businessRows.map(({ label, value, icon: Icon }) => (
                <div key={label} className={styles.usersDirDetailInfoRow}>
                  <span
                    className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className={styles.usersDirDetailInfoCopy}>
                    <span className={styles.usersDirDetailInfoLabel}>
                      {label}
                    </span>
                    <span className={styles.usersDirDetailInfoValue}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {noteRows.length > 0 ? (
            <div className={styles.usersDirDetailSection}>
              <h4 className={styles.usersDirDetailSectionTitle}>Notes</h4>
              <div className={styles.usersDirDetailInfoGrid}>
                {noteRows.map((row) => (
                  <div key={row.label} className={styles.usersDirDetailInfoRow}>
                    <span
                      className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                      aria-hidden
                    >
                      <CircleDot className="size-3.5" strokeWidth={2.25} />
                    </span>
                    <div className={styles.usersDirDetailInfoCopy}>
                      <span className={styles.usersDirDetailInfoLabel}>
                        {row.label}
                      </span>
                      <span className={styles.usersDirDetailInfoValue}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {meeting.googleMeetLink || meeting.googleEventLink ? (
            <div className={styles.usersDirDetailSection}>
              <h4 className={styles.usersDirDetailSectionTitle}>
                Calendar links
              </h4>
              <div className={styles.usersDirDetailInfoGrid}>
                {meeting.googleMeetLink ? (
                  <div className={styles.usersDirDetailInfoRow}>
                    <span
                      className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                      aria-hidden
                    >
                      <Video className="size-3.5" strokeWidth={2.25} />
                    </span>
                    <div className={styles.usersDirDetailInfoCopy}>
                      <span className={styles.usersDirDetailInfoLabel}>
                        Google Meet
                      </span>
                      <a
                        href={meeting.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.usersDirDetailInfoValue}
                      >
                        Join with Google Meet
                      </a>
                    </div>
                  </div>
                ) : null}
                {meeting.googleEventLink ? (
                  <div className={styles.usersDirDetailInfoRow}>
                    <span
                      className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                      aria-hidden
                    >
                      <ExternalLink className="size-3.5" strokeWidth={2.25} />
                    </span>
                    <div className={styles.usersDirDetailInfoCopy}>
                      <span className={styles.usersDirDetailInfoLabel}>
                        Google Calendar
                      </span>
                      <a
                        href={meeting.googleEventLink}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.usersDirDetailInfoValue}
                      >
                        Open in Google Calendar
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.usersDirDetailFooter}>
          <button
            type="button"
            className={styles.userControlSecondary}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
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
              {!meeting.attendance ? (
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
                  Record attendance
                </button>
              ) : null}
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
  scope: MeetingScope,
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
  const [scope, setScope] = useState<MeetingScope>("all");
  const [filterOpen, setFilterOpen] = useState(false);
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

  useEffect(() => {
    const onOverlayOpen = () => {
      setFilterOpen(false);
      setMenuMeetingId(null);
    };
    window.addEventListener("dealio:sa-overlay-open", onOverlayOpen);
    return () => {
      window.removeEventListener("dealio:sa-overlay-open", onOverlayOpen);
    };
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(`.${styles.usersDirFilterMenu}`)) return;
      if (target?.closest?.(`.${styles.usersDirFilterBtn}`)) return;
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

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
      PAGE_SIZE,
      "meeting_asc",
    ),
    queryFn: () =>
      getAdminMeetingRequests({
        scope,
        page,
        limit: PAGE_SIZE,
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
  const showingStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const runPrimary = (meeting: AdminMeetingRequest) => {
    const action = primaryActionFor(meeting, scope);
    if (action.kind === "details") setDetailsMeeting(meeting);
    if (action.kind === "attendance" && !meeting.attendance) {
      setAttendanceMeeting(meeting);
    }
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

  const scopeCounts: Record<MeetingScope, number> = {
    all: counts.all,
    upcoming: counts.upcoming,
    past: counts.past,
    deal_won: counts.dealWon,
  };

  return (
    <section
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions}`}
      aria-label="Meeting requests"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Meeting requests</h1>
            <p className={styles.subtitle}>
              Bookings from the Dealioo website calendar. Record attendance and
              sales outcomes. Create accounts in Customer Onboarding.
            </p>
          </div>

          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meetings, visitors or business..."
                className={styles.usersDirSearchInput}
                aria-label="Search meetings"
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className={styles.usersDirFilterBtn}
                aria-expanded={filterOpen}
                aria-haspopup="menu"
                onClick={() => setFilterOpen((open) => !open)}
              >
                <Filter className="size-4" strokeWidth={2.25} aria-hidden />
                Filter
                {scope !== "all" ? (
                  <span className="ml-1 text-[0.72rem] font-semibold text-slate-500">
                    · {SCOPE_OPTIONS.find((option) => option.id === scope)?.label}
                  </span>
                ) : null}
              </button>
              {filterOpen ? (
                <div className={styles.usersDirFilterMenu} role="menu">
                  {SCOPE_OPTIONS.map((option) => {
                    const count = scopeCounts[option.id];
                    const selected = scope === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        className={`${styles.usersDirFilterMenuItem} ${
                          selected ? styles.usersDirFilterMenuItemSelected : ""
                        }`}
                        onClick={() => {
                          setScope(option.id);
                          setPage(1);
                          setFilterOpen(false);
                        }}
                      >
                        <span>
                          {option.label}{" "}
                          <span className={styles.usersDirFilterMenuCount}>
                            ({count})
                          </span>
                        </span>
                        {selected ? (
                          <span className={styles.usersDirFilterMenuApplied}>
                            Applied
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.usersDirFilterBtn}
              disabled={exportMutation.isPending || total === 0}
              onClick={() => exportMutation.mutate()}
            >
              <Download className="size-4" strokeWidth={2.25} aria-hidden />
              {exportMutation.isPending ? "Exporting…" : "Export"}
            </button>
          </div>
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
          <p className={styles.usersDirFooterMeta}>
            Showing{" "}
            {SCOPE_OPTIONS.find((option) => option.id === scope)?.label ??
              "All"}{" "}
            meetings
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading ? (
              <TableSkeleton />
            ) : meetings.length === 0 ? (
              <p className={styles.empty}>No meeting requests found.</p>
            ) : (
              <table
                className={`${styles.usersDirTable} ${styles.meetingsTable}`}
              >
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>
                      <span className={styles.meetingsThWithIcon}>
                        <Hash
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span className="sr-only">Row number</span>
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <UserRound
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Visitor
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Building2
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Business
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <TrendingUp
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Plan
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CalendarDays
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Date
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Clock3
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Time
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <MapPin
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Timezone
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CircleDot
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Status
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <TrendingUp
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Outcome / Account
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CalendarCheck2
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Created
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <MoreVertical
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting, index) => {
                    const rowNumber = showingStart + index;
                    const fullName =
                      `${meeting.firstName} ${meeting.lastName}`.trim() ||
                      "Visitor";
                    const action = primaryActionFor(meeting, scope);
                    const badge =
                      scope === "upcoming" && !meeting.attendance
                        ? { label: "Upcoming", tone: "green" as const }
                        : statusBadge(meeting);
                    const statusPillClass =
                      badge.tone === "green"
                        ? styles.usersDirStatusPill
                        : badge.tone === "yellow"
                          ? `${styles.usersDirStatusPill} ${styles.usersDirStatusPillProgress}`
                          : `${styles.usersDirStatusPill} ${styles.usersDirStatusPillInactive}`;

                    return (
                      <tr
                        key={meeting.id}
                        className={`${styles.meetingRow} ${styles.usersDirRowClickable}`}
                        onClick={() => setDetailsMeeting(meeting)}
                      >
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {rowNumber}.
                          </span>
                        </td>
                        <td>
                          <div className={styles.meetingIdentity}>
                            <span
                              className={styles.meetingsAvatar}
                              aria-hidden
                            >
                              {initialsFromName(fullName)}
                            </span>
                            <div className={styles.meetingIdentityText}>
                              <div className={styles.meetingPersonName}>
                                {fullName}
                              </div>
                              <div className={styles.bizMeta}>
                                {meeting.email}
                              </div>
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
                          <div className={styles.meetingsBizText}>
                            <span className={styles.bizName}>
                              {meeting.selectedPlanName?.trim() ||
                                meeting.selectedPlanSlug?.trim() ||
                                "—"}
                            </span>
                            {meeting.selectedBillingCycle ? (
                              <span className={styles.bizMeta}>
                                {meeting.selectedBillingCycle === "annual"
                                  ? "Annually"
                                  : "Monthly"}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          {formatMeetingDateLabel(meeting.scheduledDate)}
                        </td>
                        <td>
                          {formatMeetingTimeLabel(meeting.scheduledTime) || "—"}
                        </td>
                        <td>
                          <span className={styles.meetingsContactText}>
                            {meeting.scheduledTimeZone
                              ? meeting.scheduledTimeZone.replaceAll("_", " ")
                              : "—"}
                          </span>
                        </td>
                        <td>
                          <span className={statusPillClass}>
                            <span
                              className={styles.usersDirStatusDot}
                              aria-hidden
                            />
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
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className={styles.meetingActionGroup}>
                            {action.kind === "onboarded" ? (
                              <span className={styles.usersDirStatusPill}>
                                <span
                                  className={styles.usersDirStatusDot}
                                  aria-hidden
                                />
                                Onboarded
                              </span>
                            ) : action.kind === "onboarding" ? (
                              <Link
                                href="/admin/customer-onboarding"
                                className={styles.usersDirActionLink}
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
                                className={styles.usersDirActionLink}
                                disabled={busy}
                                onClick={() => setDetailsMeeting(meeting)}
                              >
                                <Eye
                                  className="size-3.5"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                View
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.usersDirActionLink}
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
                              onRecordAttendance={() => {
                                if (meeting.attendance) return;
                                setAttendanceMeeting(meeting);
                              }}
                              onRecordOutcome={() =>
                                setOutcomeMeeting(meeting)
                              }
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

          <OffsetPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            loading={meetingsQuery.isFetching}
            onPageChange={setPage}
            itemLabel="meetings"
          />
        </div>
      </div>

      {detailsMeeting ? (
        <DetailsDrawer
          meeting={detailsMeeting}
          onClose={() => setDetailsMeeting(null)}
        />
      ) : null}

      {attendanceMeeting && !attendanceMeeting.attendance ? (
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
    </section>
  );
}
