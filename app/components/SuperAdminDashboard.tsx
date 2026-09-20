"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import {
  formatMonthLabel,
  OVERVIEW_CHART_COLORS,
  OVERVIEW_MINI_LINE_CHART_MARGIN,
  overviewAxisInterval,
  shortenMonthAxisLabel,
} from "@/app/components/campaign/overview/charts/overview-chart-config";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import {
  activityCalendarYearMonthCount,
  buildActivityMonthKey,
  currentActivityDateKey,
  formatActivityDateLabel,
  formatActivityMonthLabel,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  getAdminMeetingRequests,
  type AdminMeetingRequest,
} from "@/app/services/admin/get-admin-meeting-requests";
import {
  getPlatformAdminKpis,
  getPlatformAdminOverview,
  getPlatformAdminTrends,
  type PlatformAdminKpis,
  type PlatformAdminOverview,
  type PlatformAdminTrends,
} from "@/app/services/admin/get-platform-overview";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  CircleMinus,
  CircleOff,
  Clock3,
  Crown,
  Filter,
  Hash,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Briefcase,
  RefreshCw,
  ScanLine,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TABLE_PAGE_SIZE = 8;
const BRAND_BLUE = "#1877f2";

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0] || "there";
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function titleCaseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function humanizeLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (/^\d/.test(part)) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase() === "USD" ? "USD" : currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatCompactMoney(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase() === "USD" ? "USD" : currency.toUpperCase(),
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 1 : amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatAbsoluteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const OWNER_AVATAR_TONES = [
  styles.ownerToneViolet,
  styles.ownerToneGreen,
  styles.ownerToneBlue,
  styles.ownerToneAmber,
  styles.ownerToneRose,
];

function ownerAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return OWNER_AVATAR_TONES[hash % OWNER_AVATAR_TONES.length];
}

function planTagMeta(planName: string | null | undefined, planSlug: string | null | undefined) {
  const label = planName?.trim();
  if (!label) {
    return { Icon: CircleMinus, className: styles.planTagNone, label: "No plan" };
  }
  const key = (planSlug ?? label).toLowerCase();
  if (key.includes("enterprise") || key.includes("expert")) {
    return { Icon: Crown, className: styles.planTagEnterprise, label };
  }
  if (key.includes("starter")) {
    return { Icon: Sparkles, className: styles.planTagStarter, label };
  }
  return { Icon: Crown, className: styles.planTagGrowth, label };
}

function roleTagMeta(roleName: string | null | undefined) {
  const role = (roleName ?? "").toLowerCase();
  if (role.includes("super")) {
    return { Icon: ShieldCheck, className: styles.roleSuper, label: roleName ?? "Super Admin" };
  }
  if (role.includes("admin")) {
    return { Icon: Shield, className: styles.roleAdmin, label: roleName ?? "Admin" };
  }
  if (role.includes("scanner")) {
    return { Icon: ScanLine, className: styles.roleScanner, label: roleName ?? "Scanner" };
  }
  if (role.includes("owner")) {
    return { Icon: Building2, className: styles.roleOwner, label: roleName ?? "Owner" };
  }
  return {
    Icon: User,
    className: styles.roleDefault,
    label: roleName?.trim() ? roleName : "No role",
  };
}

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`${styles.kpiTrend} ${up ? styles.kpiTrendUp : styles.kpiTrendDown}`}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function useCountUp(target: number, ready: boolean, durationMs = 900): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!ready) {
      setDisplay(0);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target === 0) {
      setDisplay(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    setDisplay(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, ready, target]);

  return display;
}

function formatKpiDisplay(
  animated: number,
  target: number,
  format: "number" | "money" | "percent",
): string {
  if (format === "money") {
    return formatCompactMoney(Math.round(animated));
  }
  if (format === "percent") {
    const digits = Number.isInteger(target) ? 0 : 1;
    return `${animated.toFixed(digits)}%`;
  }
  return String(Math.round(animated));
}

function KpiCard({
  label,
  value,
  changePct,
  hint,
  icon: Icon,
  accent,
  soft,
  format = "number",
  ready = true,
}: {
  label: string;
  value: number;
  changePct?: number;
  hint?: string;
  icon: typeof Users;
  accent: string;
  soft: string;
  format?: "number" | "money" | "percent";
  ready?: boolean;
}) {
  const animated = useCountUp(value, ready);
  const display = formatKpiDisplay(animated, value, format);

  return (
    <div
      className={styles.kpiCard}
      style={
        {
          "--kpi-accent": accent,
          "--kpi-soft": soft,
        } as CSSProperties
      }
    >
      <div className={styles.kpiTop}>
        <div>
          <p className={styles.kpiLabel}>{label}</p>
          <p
            className={styles.kpiValue}
            aria-label={`${label}: ${formatKpiDisplay(value, value, format)}`}
          >
            {display}
          </p>
        </div>
        <div className={styles.kpiIcon}>
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
      {typeof changePct === "number" ? <Trend value={changePct} /> : null}
      {hint ? <p className={styles.kpiHint}>{hint}</p> : null}
    </div>
  );
}

function PlatformTrendChart({
  data,
  dataKey,
  seriesName,
  stroke,
  money,
}: {
  data: Array<{ label: string }>;
  dataKey: string;
  seriesName: string;
  stroke: string;
  money?: boolean;
}) {
  return (
    <div className="h-[220px] w-full min-w-0">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={OVERVIEW_MINI_LINE_CHART_MARGIN}>
          <CartesianGrid strokeDasharray="4 6" stroke="#e8edf5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval={overviewAxisInterval(data.length)}
            tickFormatter={shortenMonthAxisLabel}
            height={34}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={money ? 42 : 36}
            tickFormatter={
              money
                ? (value: number) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(value)
                : undefined
            }
          />
          <Tooltip content={<OverviewChartTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={seriesName}
            stroke={stroke}
            strokeWidth={3}
            dot={{ r: 3.5, fill: "#ffffff", stroke, strokeWidth: 2.5 }}
            activeDot={{ r: 6, fill: stroke, stroke: "#ffffff", strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SuperAdminDashboard() {
  const [overview, setOverview] = useState<PlatformAdminOverview | null>(null);
  const [kpis, setKpis] = useState<PlatformAdminKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [businessPage, setBusinessPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [meetingPage, setMeetingPage] = useState(1);
  const [meetingRequests, setMeetingRequests] = useState<AdminMeetingRequest[]>(
    [],
  );
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const displayName = getSetupUser()?.name?.trim() || "Super Admin";
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
  });
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const [trends, setTrends] = useState<PlatformAdminTrends | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const dashboardMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);
  const periodRange = useMemo(() => {
    if (calendarMode === "day") {
      return resolveActivityDateRange(dateFilter, dashboardMonthCount);
    }
    return (
      getActivityMonthRangeForKey(monthFilter, dashboardMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), dashboardMonthCount)
    );
  }, [calendarMode, dashboardMonthCount, dateFilter, monthFilter]);
  const periodLabel =
    calendarMode === "day"
      ? formatActivityDateLabel(dateFilter)
      : formatActivityMonthLabel(monthFilter);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    void getPlatformAdminKpis()
      .then((next) => setKpis(next))
      .catch(() => {});
    try {
      const next = await getPlatformAdminOverview();
      setOverview(next);
      setKpis(next.kpis);
    } catch (error) {
      setOverview(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load platform overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeetingRequests = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const data = await getAdminMeetingRequests();
      setMeetingRequests(data.items);
    } catch {
      setMeetingRequests([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadMeetingRequests();
  }, [loadOverview, loadMeetingRequests]);

  useEffect(() => {
    let cancelled = false;
    setTrendsLoading(true);
    void getPlatformAdminTrends(periodRange.from, periodRange.to)
      .then((next) => {
        if (!cancelled) setTrends(next);
      })
      .catch(() => {
        if (!cancelled) setTrends(null);
      })
      .finally(() => {
        if (!cancelled) setTrendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [periodRange.from, periodRange.to]);

  useEffect(() => {
    setBusinessPage(1);
    setUserPage(1);
    setMeetingPage(1);
  }, [query]);

  const q = query.trim().toLowerCase();

  const filteredBusinesses = useMemo(() => {
    const rows = overview?.businesses ?? [];
    if (!q) return rows;
    return rows.filter((b) =>
      [b.name, b.ownerEmail, b.ownerName, b.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [overview?.businesses, q]);

  const filteredUsers = useMemo(() => {
    const rows = overview?.users ?? [];
    if (!q) return rows;
    return rows.filter((u) =>
      [u.name, u.email, u.roleName, u.provider, u.planName, u.planSlug, String(u.id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [overview?.users, q]);

  const filteredMeetings = useMemo(() => {
    if (!q) return meetingRequests;
    return meetingRequests.filter((m) =>
      [
        m.firstName,
        m.lastName,
        m.email,
        m.phone,
        m.businessName,
        m.businessRole,
        m.businessCategory,
        m.cityLocation,
        m.monthlyRevenue,
        m.startTimeline,
        m.meetingCommitment,
        String(m.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [meetingRequests, q]);

  const businessTotalPages = Math.max(
    1,
    Math.ceil(filteredBusinesses.length / TABLE_PAGE_SIZE),
  );
  const userTotalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE),
  );
  const meetingTotalPages = Math.max(
    1,
    Math.ceil(filteredMeetings.length / TABLE_PAGE_SIZE),
  );

  useEffect(() => {
    if (businessPage > businessTotalPages) setBusinessPage(businessTotalPages);
  }, [businessPage, businessTotalPages]);

  useEffect(() => {
    if (userPage > userTotalPages) setUserPage(userTotalPages);
  }, [userPage, userTotalPages]);

  useEffect(() => {
    if (meetingPage > meetingTotalPages) setMeetingPage(meetingTotalPages);
  }, [meetingPage, meetingTotalPages]);

  const pagedBusinesses = useMemo(() => {
    const start = (businessPage - 1) * TABLE_PAGE_SIZE;
    return filteredBusinesses.slice(start, start + TABLE_PAGE_SIZE);
  }, [businessPage, filteredBusinesses]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * TABLE_PAGE_SIZE;
    return filteredUsers.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const pagedMeetings = useMemo(() => {
    const start = (meetingPage - 1) * TABLE_PAGE_SIZE;
    return filteredMeetings.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredMeetings, meetingPage]);

  const revenueChart = useMemo(
    () =>
      (trends?.points ?? []).map((point) => ({
        label: formatMonthLabel(point.bucket),
        value: point.revenueCents / 100,
      })),
    [trends?.points],
  );

  const businessChart = useMemo(
    () =>
      (trends?.points ?? []).map((point) => ({
        label: formatMonthLabel(point.bucket),
        count: point.businesses,
      })),
    [trends?.points],
  );

  const periodRevenueCents = trends?.totalRevenueCents ?? 0;
  const periodNewBusinesses = trends?.newBusinesses ?? 0;

  return (
    <section className={styles.page} aria-label="Super Admin platform overview">
      <div className={styles.inner}>
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.greeting}>
              {greetingForNow()}, {firstName(displayName)}! 👋
            </p>
            <h1 className={styles.title}>Platform Overview</h1>
            <p className={styles.subtitle}>
              Live snapshot of businesses, users, and revenue across Dealioo.
            </p>
          </div>
          <div className={styles.heroTools}>
            <label className={styles.searchWrap}>
              <Search className={styles.searchIcon} aria-hidden />
              <input
                className={styles.searchInput}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search businesses, users..."
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex rounded-full border border-[#e8edf5] bg-white p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                <button
                  type="button"
                  onClick={() => setCalendarMode("month")}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
                    calendarMode === "month"
                      ? "bg-[#1877f2] text-white"
                      : "text-slate-600"
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMode("day")}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
                    calendarMode === "day"
                      ? "bg-[#1877f2] text-white"
                      : "text-slate-600"
                  }`}
                >
                  Day
                </button>
              </div>
              {calendarMode === "month" ? (
                <ActivityMonthCalendarPicker
                  value={monthFilter}
                  onChange={setMonthFilter}
                  compact
                  showAllMonths={false}
                  monthCount={dashboardMonthCount}
                />
              ) : (
                <PerformanceDateCalendar
                  value={dateFilter}
                  onChange={setDateFilter}
                  monthCount={dashboardMonthCount}
                />
              )}
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                void loadOverview();
                void loadMeetingRequests();
                setTrendsLoading(true);
                void getPlatformAdminTrends(periodRange.from, periodRange.to)
                  .then((next) => setTrends(next))
                  .catch(() => setTrends(null))
                  .finally(() => setTrendsLoading(false));
              }}
              disabled={loading || meetingsLoading || trendsLoading}
              aria-label="Refresh overview"
            >
              {loading || trendsLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void loadOverview()}
            />
          </div>
        ) : null}

        <div className={styles.kpiGrid}>
          <KpiCard
            label="Total Businesses"
            value={kpis?.totalBusinesses ?? 0}
            changePct={kpis?.businessesChangePct}
            hint="vs prior 30 days"
            icon={Building2}
            accent="#34a853"
            soft="#ecfdf5"
            ready={Boolean(kpis)}
          />
          <KpiCard
            label="Total Users"
            value={kpis?.totalUsers ?? 0}
            changePct={kpis?.usersChangePct}
            hint="vs prior 30 days"
            icon={Users}
            accent="#e1306c"
            soft="#fdf2f8"
            ready={Boolean(kpis)}
          />
          <KpiCard
            label="Total Revenue"
            value={periodRevenueCents}
            hint={periodLabel}
            icon={Wallet}
            accent="#e1306c"
            soft="#fdf2f8"
            format="money"
            ready={Boolean(trends)}
          />
          <KpiCard
            label="Platform Health"
            value={99.9}
            hint="All systems operational"
            icon={Activity}
            accent="#34a853"
            soft="#ecfdf5"
            format="percent"
            ready={Boolean(kpis)}
          />
        </div>

        <div className={styles.chartGrid}>
          <OverviewChartShell
            title="Total revenue"
            subtitle={periodLabel}
            accent="pink"
            stat={formatMoney(periodRevenueCents)}
            minHeightClass="min-h-[220px]"
          >
            {trendsLoading && !trends ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
              </div>
            ) : (
              <>
                <PlatformTrendChart
                  data={revenueChart}
                  dataKey="value"
                  seriesName="Revenue"
                  stroke={OVERVIEW_CHART_COLORS.pink}
                  money
                />
                <OverviewChartLegend
                  items={[
                    {
                      label: "Revenue",
                      value: formatMoney(periodRevenueCents),
                      color: OVERVIEW_CHART_COLORS.pink,
                    },
                  ]}
                />
              </>
            )}
          </OverviewChartShell>

          <OverviewChartShell
            title="New businesses"
            subtitle={periodLabel}
            accent="blue"
            stat={String(periodNewBusinesses)}
            minHeightClass="min-h-[220px]"
          >
            {trendsLoading && !trends ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
              </div>
            ) : (
              <>
                <PlatformTrendChart
                  data={businessChart}
                  dataKey="count"
                  seriesName="New businesses"
                  stroke={OVERVIEW_CHART_COLORS.blue}
                />
                <OverviewChartLegend
                  items={[
                    {
                      label: "New businesses",
                      value: periodNewBusinesses.toLocaleString(),
                      color: OVERVIEW_CHART_COLORS.blue,
                    },
                  ]}
                />
              </>
            )}
          </OverviewChartShell>
        </div>

        <div id="sa-businesses" className={`${styles.card} ${styles.tableCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.tableHeadLeft}>
              <span className={styles.tableHeadIcon} aria-hidden>
                <Building2 className="size-5" strokeWidth={2.25} />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Active Businesses</h2>
                <p className={styles.cardSub}>
                  {filteredBusinesses.length} businesses on the platform
                </p>
              </div>
            </div>
          </div>
          <div className={styles.tableWrap}>
            {loading && !overview ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <p className={styles.empty}>No businesses found.</p>
            ) : (
              <table className={`${styles.table} ${styles.bizTable}`}>
                <thead>
                  <tr>
                    <th>
                      <span className={styles.thSort}>
                        Business
                        <ChevronsUpDown className="size-3.5" aria-hidden />
                      </span>
                    </th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>
                      <span className={styles.thSort}>
                        Created
                        <ChevronDown className="size-3.5" aria-hidden />
                      </span>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBusinesses.map((b) => {
                    const ownerLabel = b.ownerName?.trim() || b.ownerEmail || "Owner";
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className={styles.bizCell}>
                            <div
                              className={`${styles.bizAvatar} ${
                                b.logoUrl ? "" : styles.bizAvatarPlaceholder
                              }`}
                            >
                              {b.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={b.logoUrl} alt="" />
                              ) : (
                                <Building2 className="size-4" strokeWidth={2.25} aria-hidden />
                              )}
                            </div>
                            <div>
                              <div className={styles.bizName}>{b.name}</div>
                              <div className={styles.bizMeta}>{b.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.bizCell}>
                            <div
                              className={`${styles.ownerAvatar} ${
                                b.ownerAvatar
                                  ? styles.ownerAvatarPhoto
                                  : ownerAvatarTone(ownerLabel)
                              }`}
                            >
                              {b.ownerAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={b.ownerAvatar} alt="" />
                              ) : (
                                initialsFromName(ownerLabel)
                              )}
                            </div>
                            <div>
                              <div className={styles.bizName}>
                                {b.ownerName ?? "—"}
                              </div>
                              <div className={styles.bizMeta}>
                                <span className={styles.metaWithIcon}>
                                  <Mail className="size-3" aria-hidden />
                                  {b.ownerEmail ?? "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              b.onboardingCompleted
                                ? styles.statusActive
                                : styles.statusWarn
                            }`}
                          >
                            {b.onboardingCompleted ? (
                              <CheckCircle2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                            ) : (
                              <Clock3 className="size-3.5" strokeWidth={2.25} aria-hidden />
                            )}
                            {b.onboardingCompleted ? "Active" : "Setup"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.createdStack}>
                            <span className={styles.metaWithIcon}>
                              <Clock3 className="size-3.5" aria-hidden />
                              {formatRelative(b.createdAt)}
                            </span>
                            <span className={styles.createdSub}>
                              <span className={styles.metaWithIcon}>
                                <CalendarDays className="size-3" aria-hidden />
                                {formatAbsoluteDate(b.createdAt)}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionRow}>
                            <Link
                              href={`/business/${b.id}/dashboard`}
                              className={styles.viewDetailsBtn}
                            >
                              View details
                            </Link>
                            <button
                              type="button"
                              className={styles.moreBtn}
                              aria-label={`More actions for ${b.name}`}
                            >
                              <MoreVertical className="size-4" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {filteredBusinesses.length > 0 ? (
            <OffsetPagination
              page={businessPage}
              totalPages={businessTotalPages}
              total={filteredBusinesses.length}
              limit={TABLE_PAGE_SIZE}
              loading={loading}
              onPageChange={setBusinessPage}
              itemLabel="businesses"
            />
          ) : null}
        </div>

        <div id="sa-users" className={`${styles.card} ${styles.tableCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.tableHeadLeft}>
              <span className={styles.tableHeadIcon} aria-hidden>
                <Users className="size-5" strokeWidth={2.25} />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Users</h2>
                <p className={styles.cardSub}>
                  {filteredUsers.length} accounts in the users table
                </p>
              </div>
            </div>
          </div>
          <div className={styles.tableWrap}>
            {loading && !overview ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className={styles.empty}>No users found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u) => {
                    const role = roleTagMeta(u.roleName);
                    const RoleIcon = role.Icon;
                    const plan = planTagMeta(u.planName, u.planSlug);
                    const PlanIcon = plan.Icon;
                    return (
                      <tr key={u.id}>
                        <td>
                          <span className={styles.idChip}>
                            <Hash className="size-3" strokeWidth={2.25} aria-hidden />
                            {u.id}
                          </span>
                        </td>
                        <td>
                          <div className={styles.bizCell}>
                            <div
                              className={`${styles.userAvatar} ${
                                u.avatar ? "" : styles.userAvatarPlaceholder
                              }`}
                            >
                              {u.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.avatar} alt="" />
                              ) : (
                                <User className="size-4" strokeWidth={2.25} aria-hidden />
                              )}
                            </div>
                            <div className={styles.bizName}>{u.name}</div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.metaWithIcon}>
                            <Mail className="size-3.5" strokeWidth={2.25} aria-hidden />
                            {u.email}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.roleTag} ${role.className}`}>
                            <RoleIcon className="size-3.5" strokeWidth={2.25} aria-hidden />
                            {role.label}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.planTag} ${plan.className}`}>
                            <PlanIcon className="size-3.5" strokeWidth={2.25} aria-hidden />
                            {plan.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              u.isActive ? styles.statusActive : styles.statusMuted
                            }`}
                          >
                            {u.isActive ? (
                              <CheckCircle2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                            ) : (
                              <CircleOff className="size-3.5" strokeWidth={2.25} aria-hidden />
                            )}
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.createdStack}>
                            <span className={styles.metaWithIcon}>
                              <CalendarDays className="size-3.5" strokeWidth={2.25} aria-hidden />
                              {formatRelative(u.createdAt)}
                            </span>
                            <span className={styles.createdSub}>
                              <span className={styles.metaWithIcon}>
                                <Clock3 className="size-3" strokeWidth={2.25} aria-hidden />
                                {formatAbsoluteDate(u.createdAt)}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.metaWithIcon}>
                            <Clock3 className="size-3.5" strokeWidth={2.25} aria-hidden />
                            {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "Never"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {filteredUsers.length > 0 ? (
            <OffsetPagination
              page={userPage}
              totalPages={userTotalPages}
              total={filteredUsers.length}
              limit={TABLE_PAGE_SIZE}
              loading={loading}
              onPageChange={setUserPage}
              itemLabel="users"
            />
          ) : null}
        </div>

        <div className={`${styles.card} ${styles.tableCard} ${styles.meetingsCard}`}>
          <div className={styles.meetingsHead}>
            <div className={styles.meetingsHeadLeft}>
              <span className={styles.meetingsIcon} aria-hidden>
                <CalendarDays className="size-6" strokeWidth={2.25} />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Meeting requests</h2>
                <p className={styles.cardSub}>
                  {filteredMeetings.length === 1
                    ? "1 user who booked a meeting"
                    : `${filteredMeetings.length} users who booked a meeting`}
                </p>
              </div>
            </div>
            <button type="button" className={styles.meetingsFilterBtn}>
              <Filter className="size-3.5" strokeWidth={2.25} aria-hidden />
              Filter
              <ChevronDown className="size-3.5" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          <div className={styles.meetingsListWrap}>
            {meetingsLoading && meetingRequests.length === 0 ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
              </div>
            ) : filteredMeetings.length === 0 ? (
              <p className={styles.empty}>No meeting requests yet.</p>
            ) : (
              <div className={styles.meetingsTableShell}>
                <div className={`${styles.meetingRow} ${styles.meetingHeaderRow}`} aria-hidden>
                  <span className={styles.meetingMetaLabel}>ID</span>
                  <span className={styles.meetingMetaLabel}>Name</span>
                  <span className={styles.meetingMetaLabel}>Contact</span>
                  <span className={styles.meetingMetaLabel}>Business</span>
                  <span className={styles.meetingMetaLabel}>Role</span>
                  <span className={styles.meetingMetaLabel}>Location</span>
                  <span className={styles.meetingMetaLabel}>Timeline</span>
                  <span className={styles.meetingMetaLabel}>Requested</span>
                  <span className={styles.meetingMetaLabel} />
                </div>
                <ul className={styles.meetingsList}>
                  {pagedMeetings.map((m) => {
                    const fullName = titleCaseWords(
                      `${m.firstName} ${m.lastName}`.trim(),
                    );
                    const committed = m.meetingCommitment === "yes";
                    const commitmentLabel = committed
                      ? "Committed"
                      : m.meetingCommitment === "not_sure"
                        ? "Not sure"
                        : humanizeLabel(m.meetingCommitment) || "—";
                    const businessSub = [
                      humanizeLabel(m.businessCategory),
                      humanizeLabel(m.monthlyRevenue),
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    const roleLabel = humanizeLabel(m.businessRole) || "—";
                    const locationLabel = humanizeLabel(m.cityLocation) || "—";
                    const timelineLabel = humanizeLabel(m.startTimeline) || "—";
                    return (
                      <li key={m.id} className={styles.meetingItem}>
                        <div className={styles.meetingRow}>
                          <span className={styles.meetingsIdChip}>
                            <Hash className="size-3" aria-hidden />
                            {m.id}
                          </span>
                          <div className={styles.meetingIdentity}>
                            <span className={styles.meetingsAvatar} aria-hidden>
                              {initialsFromName(fullName || m.email)}
                            </span>
                            <div className={styles.meetingIdentityText}>
                              <div
                                className={styles.meetingPersonName}
                                title={fullName || undefined}
                              >
                                {fullName || "—"}
                              </div>
                              <span
                                className={`${styles.meetingsCommitPill} ${
                                  committed
                                    ? styles.meetingsCommitYes
                                    : styles.meetingsCommitMaybe
                                }`}
                              >
                                <span className={styles.meetingsCommitDot} aria-hidden />
                                {commitmentLabel}
                              </span>
                            </div>
                          </div>
                          <div className={styles.meetingsContact}>
                            <span
                              className={styles.meetingsContactLine}
                              title={m.email}
                            >
                              <Mail className="size-3.5" aria-hidden />
                              <span className={styles.meetingsContactText}>
                                {m.email}
                              </span>
                            </span>
                            <span
                              className={styles.meetingsContactLine}
                              title={m.phone}
                            >
                              <Phone className="size-3.5" aria-hidden />
                              <span className={styles.meetingsContactText}>
                                {m.phone}
                              </span>
                            </span>
                          </div>
                          <div className={styles.meetingsBizCell}>
                            <span className={styles.meetingsBizIcon} aria-hidden>
                              <Briefcase className="size-4" strokeWidth={2.25} />
                            </span>
                            <div className={styles.meetingsBizText}>
                              <div
                                className={styles.meetingPersonName}
                                title={m.businessName || undefined}
                              >
                                {m.businessName || "—"}
                              </div>
                              {businessSub ? (
                                <div className={styles.bizMeta} title={businessSub}>
                                  {businessSub}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <span
                            className={styles.meetingsRolePill}
                            title={roleLabel}
                          >
                            {roleLabel}
                          </span>
                          <span
                            className={styles.meetingsContactLine}
                            title={locationLabel}
                          >
                            <MapPin className="size-3.5" aria-hidden />
                            <span className={styles.meetingsContactText}>
                              {locationLabel}
                            </span>
                          </span>
                          <span
                            className={styles.meetingsTimeline}
                            title={timelineLabel}
                          >
                            <CalendarDays className="size-3.5" aria-hidden />
                            <span className={styles.meetingsContactText}>
                              {timelineLabel}
                            </span>
                          </span>
                          <div className={styles.meetingsRequested}>
                            <span className={styles.meetingsRequestedTop}>
                              <Clock3 className="size-3.5" aria-hidden />
                              {formatRelative(m.createdAt)}
                            </span>
                            <span className={styles.createdSub}>
                              {formatAbsoluteDate(m.createdAt)}
                            </span>
                          </div>
                          <div className={styles.meetingRowActions}>
                            <button
                              type="button"
                              className={styles.moreBtn}
                              aria-label={`More actions for ${fullName || m.email}`}
                            >
                              <MoreVertical className="size-4" aria-hidden />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          {filteredMeetings.length > 0 ? (
            <OffsetPagination
              page={meetingPage}
              totalPages={meetingTotalPages}
              total={filteredMeetings.length}
              limit={TABLE_PAGE_SIZE}
              loading={meetingsLoading}
              onPageChange={setMeetingPage}
              itemLabel="meeting requests"
            />
          ) : null}
        </div>


      </div>
    </section>
  );
}
