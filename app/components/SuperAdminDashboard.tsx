"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  getAdminMeetingRequests,
  type AdminMeetingRequest,
} from "@/app/services/admin/get-admin-meeting-requests";
import {
  getPlatformAdminOverview,
  type PlatformAdminOverview,
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
  ShoppingBag,
  Sparkles,
  User,
  UserPlus,
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
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TABLE_PAGE_SIZE = 8;
const BRAND_BLUE = "#1877f2";
const BRAND_PURPLE = "#7c3aed";

const PLAN_COLORS = ["#7c3aed", "#1877f2", "#0f766e", "#d97706", "#94a3b8"];

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

function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase() === "USD" ? "USD" : currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatShortDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

function dateRangeLabel(): string {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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

function KpiCard({
  label,
  value,
  changePct,
  hint,
  icon: Icon,
  accent,
  soft,
}: {
  label: string;
  value: string;
  changePct?: number;
  hint?: string;
  icon: typeof Users;
  accent: string;
  soft: string;
}) {
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
          <p className={styles.kpiValue}>{value}</p>
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

export function SuperAdminDashboard() {
  const [overview, setOverview] = useState<PlatformAdminOverview | null>(null);
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

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setOverview(await getPlatformAdminOverview());
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
    setBusinessPage(1);
    setUserPage(1);
    setMeetingPage(1);
  }, [query]);

  const kpis = overview?.kpis;
  const q = query.trim().toLowerCase();

  const filteredBusinesses = useMemo(() => {
    const rows = overview?.businesses ?? [];
    if (!q) return rows;
    return rows.filter((b) =>
      [b.name, b.ownerEmail, b.ownerName, b.planName, b.slug]
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
      [u.name, u.email, u.roleName, u.provider, String(u.id)]
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
      (overview?.charts.revenueLast30Days ?? []).map((row) => ({
        date: row.date,
        label: formatShortDay(row.date),
        value: row.amountCents / 100,
        amountCents: row.amountCents,
      })),
    [overview?.charts.revenueLast30Days],
  );

  const businessChart = useMemo(
    () =>
      (overview?.charts.businessesLast30Days ?? []).map((row) => ({
        date: row.date,
        label: formatShortDay(row.date),
        count: row.count,
      })),
    [overview?.charts.businessesLast30Days],
  );

  const subscriptionPie = useMemo(() => {
    const rows = overview?.charts.subscriptionBreakdown ?? [];
    if (rows.length === 0) {
      return [{ name: "No plans", value: 1, slug: "empty" }];
    }
    return rows.map((r) => ({
      name: r.planName,
      value: r.count,
      slug: r.planSlug,
    }));
  }, [overview?.charts.subscriptionBreakdown]);

  const subscriptionTotal = useMemo(
    () =>
      (overview?.charts.subscriptionBreakdown ?? []).reduce(
        (sum, r) => sum + r.count,
        0,
      ),
    [overview?.charts.subscriptionBreakdown],
  );

  const revenue30Total = useMemo(
    () =>
      (overview?.charts.revenueLast30Days ?? []).reduce(
        (sum, r) => sum + r.amountCents,
        0,
      ),
    [overview?.charts.revenueLast30Days],
  );

  const businesses30Total = useMemo(
    () =>
      (overview?.charts.businessesLast30Days ?? []).reduce(
        (sum, r) => sum + r.count,
        0,
      ),
    [overview?.charts.businessesLast30Days],
  );

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
            <span className={styles.pillBtn}>
              <CalendarDays className="size-3.5" aria-hidden />
              {dateRangeLabel()}
            </span>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                void loadOverview();
                void loadMeetingRequests();
              }}
              disabled={loading || meetingsLoading}
              aria-label="Refresh overview"
            >
              {loading ? (
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
          {loading && !kpis ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))
          ) : (
            <>
              <KpiCard
                label="Total Businesses"
                value={String(kpis?.totalBusinesses ?? 0)}
                changePct={kpis?.businessesChangePct}
                hint="vs prior 30 days"
                icon={Building2}
                accent="#7c3aed"
                soft="#f3e8ff"
              />
              <KpiCard
                label="Active Businesses"
                value={String(kpis?.activeBusinesses ?? 0)}
                changePct={kpis?.activeBusinessesChangePct}
                hint="Onboarding completed"
                icon={ShieldCheck}
                accent="#059669"
                soft="#ecfdf5"
              />
              <KpiCard
                label="Total Users"
                value={String(kpis?.totalUsers ?? 0)}
                changePct={kpis?.usersChangePct}
                hint="vs prior 30 days"
                icon={Users}
                accent="#2563eb"
                soft="#dbeafe"
              />
              <KpiCard
                label="New Users Today"
                value={String(kpis?.newUsersToday ?? 0)}
                changePct={kpis?.newUsersChangePct}
                hint="vs yesterday"
                icon={UserPlus}
                accent="#ea580c"
                soft="#ffedd5"
              />
              <KpiCard
                label="Orders Today"
                value={String(kpis?.ordersToday ?? 0)}
                changePct={kpis?.ordersChangePct}
                hint="Paid orders"
                icon={ShoppingBag}
                accent="#db2777"
                soft="#fce7f3"
              />
              <KpiCard
                label="Revenue Today"
                value={formatMoney(kpis?.revenueTodayCents ?? 0)}
                changePct={kpis?.revenueChangePct}
                hint="vs yesterday"
                icon={Wallet}
                accent="#059669"
                soft="#d1fae5"
              />
              <KpiCard
                label="Platform Health"
                value="99.9%"
                hint="All systems operational"
                icon={Activity}
                accent="#2563eb"
                soft="#dbeafe"
              />
            </>
          )}
        </div>

        <div className={styles.chartGrid}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Revenue Overview</h2>
                <p className={styles.cardSub}>Paid order revenue · last 30 days</p>
              </div>
              <p className={styles.statBig}>{formatMoney(revenue30Total)}</p>
            </div>
            <div className={styles.cardBody}>
              {loading && !overview ? (
                <div className={styles.loadingBox}>
                  <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
                </div>
              ) : (
                <div className={styles.chartPlot}>
                  <ResponsiveContainer width="100%" height={220} minWidth={0}>
                    <AreaChart data={revenueChart}>
                      <defs>
                        <linearGradient id="saRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND_PURPLE} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={BRAND_PURPLE} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#eef2f7" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatMoney(Math.round(Number(value) * 100)),
                          "Revenue",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={BRAND_PURPLE}
                        strokeWidth={2.5}
                        fill="url(#saRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>New Businesses</h2>
                <p className={styles.cardSub}>Registrations · last 30 days</p>
              </div>
              <p className={styles.statBig}>{businesses30Total}</p>
            </div>
            <div className={styles.cardBody}>
              {loading && !overview ? (
                <div className={styles.loadingBox}>
                  <Loader2 className="size-6 animate-spin" style={{ color: BRAND_BLUE }} />
                </div>
              ) : (
                <div className={styles.chartPlot}>
                  <ResponsiveContainer width="100%" height={220} minWidth={0}>
                    <BarChart data={businessChart}>
                      <CartesianGrid stroke="#eef2f7" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {businessChart.map((_, index) => (
                          <Cell
                            key={`biz-bar-${index}`}
                            fill={index % 2 === 0 ? BRAND_BLUE : BRAND_PURPLE}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Subscription Overview</h2>
                <p className={styles.cardSub}>Active / trialing plans</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.chartPlotSm}>
                <ResponsiveContainer width="100%" height={140} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={subscriptionPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={2}
                    >
                      {subscriptionPie.map((entry, i) => (
                        <Cell
                          key={entry.slug}
                          fill={
                            entry.slug === "empty"
                              ? "#e2e8f0"
                              : PLAN_COLORS[i % PLAN_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legend}>
                {(overview?.charts.subscriptionBreakdown ?? []).map((row, i) => {
                  const pct =
                    subscriptionTotal > 0
                      ? Math.round((row.count / subscriptionTotal) * 1000) / 10
                      : 0;
                  return (
                    <div key={row.planSlug} className={styles.legendRow}>
                      <span className={styles.legendLeft}>
                        <span
                          className={styles.swatch}
                          style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }}
                        />
                        {row.planName}
                      </span>
                      <span>
                        {row.count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
                {(overview?.charts.subscriptionBreakdown.length ?? 0) === 0 ? (
                  <p className={styles.empty}>No active subscriptions yet.</p>
                ) : (
                  <p className={styles.cardSub} style={{ marginTop: 4 }}>
                    {subscriptionTotal} subscriptions
                  </p>
                )}
              </div>
            </div>
          </div>
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
                    <th>Plan</th>
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
                    const plan = planTagMeta(b.planName, b.planSlug);
                    const PlanIcon = plan.Icon;
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
                              className={`${styles.ownerAvatar} ${ownerAvatarTone(ownerLabel)}`}
                            >
                              {initialsFromName(ownerLabel)}
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
                          <span className={`${styles.planTag} ${plan.className}`}>
                            <PlanIcon className="size-3.5" strokeWidth={2.25} aria-hidden />
                            {plan.label}
                          </span>
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
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u) => {
                    const role = roleTagMeta(u.roleName);
                    const RoleIcon = role.Icon;
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
                    const fullName = `${m.firstName} ${m.lastName}`.trim();
                    const committed = m.meetingCommitment === "yes";
                    const commitmentLabel = committed
                      ? "Committed"
                      : m.meetingCommitment === "not_sure"
                        ? "Not sure"
                        : m.meetingCommitment || "—";
                    const businessSub = [m.businessCategory, m.monthlyRevenue]
                      .filter(Boolean)
                      .join(" · ");
                    const roleLabel = (m.businessRole || "—").replaceAll("_", " ");
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
                              <div className={styles.meetingPersonName}>
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
                            <span className={styles.meetingsContactLine}>
                              <Mail className="size-4" aria-hidden />
                              {m.email}
                            </span>
                            <span className={styles.meetingsContactLine}>
                              <Phone className="size-4" aria-hidden />
                              {m.phone}
                            </span>
                          </div>
                          <div className={styles.meetingsBizCell}>
                            <span className={styles.meetingsBizIcon} aria-hidden>
                              <Briefcase className="size-4" strokeWidth={2.25} />
                            </span>
                            <div>
                              <div className={styles.meetingPersonName}>
                                {m.businessName || "—"}
                              </div>
                              {businessSub ? (
                                <div className={styles.bizMeta}>{businessSub}</div>
                              ) : null}
                            </div>
                          </div>
                          <span className={styles.meetingsRolePill}>{roleLabel}</span>
                          <span className={styles.meetingsContactLine}>
                            <MapPin className="size-4" aria-hidden />
                            {m.cityLocation || "—"}
                          </span>
                          <span className={styles.meetingsTimeline}>
                            <CalendarDays className="size-4" aria-hidden />
                            {m.startTimeline || "—"}
                          </span>
                          <div className={styles.meetingsRequested}>
                            <span className={styles.meetingsRequestedTop}>
                              <Clock3 className="size-4" aria-hidden />
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
