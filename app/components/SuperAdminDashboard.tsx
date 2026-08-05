"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  getPlatformAdminOverview,
  type PlatformAdminOverview,
} from "@/app/services/admin/get-platform-overview";
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  CircleMinus,
  CircleOff,
  Clock3,
  CreditCard,
  Crown,
  Hash,
  Loader2,
  Mail,
  Megaphone,
  MoreVertical,
  Store,
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
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

const PLAN_COLORS = ["#1877f2", "#0ea5e9", "#0f766e", "#d97706", "#94a3b8"];
const BRAND_BLUE = "#1877f2";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "New business registered",
    body: "Coders Lodge completed onboarding and is now active.",
    time: "12 min ago",
    type: "business" as const,
    unread: true,
  },
  {
    id: "n2",
    title: "Payment received",
    body: "Demo Bistro Islamabad paid US$49.00 for Growth AI.",
    time: "41 min ago",
    type: "payment" as const,
    unread: true,
  },
  {
    id: "n3",
    title: "User joined platform",
    body: "sameer.yasir@coderslodge.com signed up as Admin.",
    time: "2h ago",
    type: "user" as const,
    unread: true,
  },
  {
    id: "n4",
    title: "Stripe connection issue",
    body: "Butt karahi Stripe account needs re-authorization.",
    time: "5h ago",
    type: "alert" as const,
    unread: false,
  },
  {
    id: "n5",
    title: "Campaign published",
    body: "Weekend Pass campaign went live for test business.",
    time: "Yesterday",
    type: "campaign" as const,
    unread: false,
  },
  {
    id: "n6",
    title: "Subscription upgraded",
    body: "A user moved from Starter to Growth AI (annual).",
    time: "2d ago",
    type: "payment" as const,
    unread: false,
  },
];

function notificationIcon(type: (typeof MOCK_NOTIFICATIONS)[number]["type"]) {
  if (type === "payment") return CreditCard;
  if (type === "user") return UserPlus;
  if (type === "alert") return AlertTriangle;
  if (type === "campaign") return Megaphone;
  return Building2;
}

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const displayName = getSetupUser()?.name?.trim() || "Super Admin";
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

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

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    setBusinessPage(1);
    setUserPage(1);
  }, [query]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [notificationsOpen]);

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

  const businessTotalPages = Math.max(
    1,
    Math.ceil(filteredBusinesses.length / TABLE_PAGE_SIZE),
  );
  const userTotalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE),
  );

  useEffect(() => {
    if (businessPage > businessTotalPages) setBusinessPage(businessTotalPages);
  }, [businessPage, businessTotalPages]);

  useEffect(() => {
    if (userPage > userTotalPages) setUserPage(userTotalPages);
  }, [userPage, userTotalPages]);

  const pagedBusinesses = useMemo(() => {
    const start = (businessPage - 1) * TABLE_PAGE_SIZE;
    return filteredBusinesses.slice(start, start + TABLE_PAGE_SIZE);
  }, [businessPage, filteredBusinesses]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * TABLE_PAGE_SIZE;
    return filteredUsers.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredUsers, userPage]);

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
            <p className={styles.eyebrow}>Super Admin</p>
            <p className={styles.greeting}>
              {greetingForNow()}, {firstName(displayName)}
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
                placeholder="Search businesses, users…"
              />
            </label>
            <span className={styles.pillBtn}>
              <CalendarDays className="size-3.5" aria-hidden />
              {dateRangeLabel()}
            </span>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => void loadOverview()}
              disabled={loading}
              aria-label="Refresh overview"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </button>
            <div className={styles.bellWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="size-4" />
              </button>
              {unreadCount > 0 ? (
                <span className={styles.bellBadge}>
                  {Math.min(unreadCount, 99)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {notificationsOpen ? (
            <>
              <motion.button
                type="button"
                key="sa-notify-backdrop"
                className={styles.drawerBackdrop}
                aria-label="Close notifications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setNotificationsOpen(false)}
              />
              <motion.aside
                key="sa-notify-panel"
                className={styles.drawerPanel}
                role="dialog"
                aria-modal="true"
                aria-label="Notifications"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.drawerHead}>
                  <div className={styles.drawerHeadCopy}>
                    <div className={styles.drawerTitleRow}>
                      <h2 className={styles.drawerTitle}>Notifications</h2>
                      {unreadCount > 0 ? (
                        <span className={styles.drawerBadge}>{unreadCount} new</span>
                      ) : null}
                    </div>
                    <p className={styles.drawerSub}>
                      Platform alerts and account activity
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.drawerClose}
                    aria-label="Close"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className={styles.drawerTabs} role="tablist" aria-label="Filter">
                  <span className={`${styles.drawerTab} ${styles.drawerTabActive}`}>
                    All
                  </span>
                  <span className={styles.drawerTab}>Unread</span>
                </div>

                <div className={styles.drawerList}>
                  {MOCK_NOTIFICATIONS.map((item) => {
                    const Icon = notificationIcon(item.type);
                    return (
                      <article
                        key={item.id}
                        className={`${styles.notifyItem} ${
                          item.unread ? styles.notifyItemUnread : ""
                        }`}
                      >
                        <div
                          className={`${styles.notifyIcon} ${
                            item.type === "payment"
                              ? styles.notifyIconGreen
                              : item.type === "alert"
                                ? styles.notifyIconOrange
                                : item.type === "campaign"
                                  ? styles.notifyIconTeal
                                  : styles.notifyIconBlue
                          }`}
                        >
                          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                        </div>
                        <div className={styles.notifyCopy}>
                          <div className={styles.notifyTop}>
                            <h3 className={styles.notifyTitle}>{item.title}</h3>
                            {item.unread ? (
                              <span className={styles.notifyUnreadDot} aria-hidden />
                            ) : null}
                          </div>
                          <p className={styles.notifyBody}>{item.body}</p>
                          <time className={styles.notifyTime}>{item.time}</time>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className={styles.drawerFooter}>
                  <button type="button" className={styles.drawerFooterBtn}>
                    Mark all as read
                  </button>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

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
                accent={BRAND_BLUE}
                soft="#e8f1ff"
              />
              <KpiCard
                label="Active Businesses"
                value={String(kpis?.activeBusinesses ?? 0)}
                changePct={kpis?.activeBusinessesChangePct}
                hint="Onboarding completed"
                icon={ShieldCheck}
                accent="#0f766e"
                soft="#ecfdf5"
              />
              <KpiCard
                label="Total Users"
                value={String(kpis?.totalUsers ?? 0)}
                changePct={kpis?.usersChangePct}
                hint="vs prior 30 days"
                icon={Users}
                accent="#0369a1"
                soft="#e0f2fe"
              />
              <KpiCard
                label="New Users Today"
                value={String(kpis?.newUsersToday ?? 0)}
                changePct={kpis?.newUsersChangePct}
                hint="vs yesterday"
                icon={UserPlus}
                accent="#b45309"
                soft="#fff7ed"
              />
              <KpiCard
                label="Orders Today"
                value={String(kpis?.ordersToday ?? 0)}
                changePct={kpis?.ordersChangePct}
                hint="Paid orders"
                icon={ShoppingBag}
                accent="#be185d"
                soft="#fdf2f8"
              />
              <KpiCard
                label="Revenue Today"
                value={formatMoney(kpis?.revenueTodayCents ?? 0)}
                changePct={kpis?.revenueChangePct}
                hint="vs yesterday"
                icon={Wallet}
                accent="#0f766e"
                soft="#ecfdf5"
              />
              <KpiCard
                label="Platform Health"
                value="99.9%"
                hint="All systems operational"
                icon={ShieldCheck}
                accent="#15803d"
                soft="#f0fdf4"
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
                          <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity={0} />
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
                        stroke={BRAND_BLUE}
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
                      <Bar dataKey="count" fill={BRAND_BLUE} radius={[6, 6, 0, 0]} />
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

        <div className={`${styles.card} ${styles.tableCard}`}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Active Businesses</h2>
              <p className={styles.cardSub}>
                {filteredBusinesses.length} businesses on the platform
              </p>
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
                                <Store className="size-4" strokeWidth={2.25} aria-hidden />
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
                                {b.ownerEmail ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.planTag} ${plan.className}`}>
                            <PlanIcon className="size-3.5" aria-hidden />
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
                            <span className={styles.statusDot} aria-hidden />
                            {b.onboardingCompleted ? "Active" : "Setup"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.createdStack}>
                            <span>{formatRelative(b.createdAt)}</span>
                            <span className={styles.createdSub}>
                              {formatAbsoluteDate(b.createdAt)}
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

        <div className={`${styles.card} ${styles.tableCard}`}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Users</h2>
              <p className={styles.cardSub}>
                {filteredUsers.length} accounts in the users table
              </p>
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
                            <Hash className="size-3" aria-hidden />
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
                            <Mail className="size-3.5" aria-hidden />
                            {u.email}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.roleTag} ${role.className}`}>
                            <RoleIcon className="size-3.5" aria-hidden />
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
                              <CheckCircle2 className="size-3.5" aria-hidden />
                            ) : (
                              <CircleOff className="size-3.5" aria-hidden />
                            )}
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.metaWithIcon}>
                            <CalendarDays className="size-3.5" aria-hidden />
                            {formatRelative(u.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span className={styles.metaWithIcon}>
                            <Clock3 className="size-3.5" aria-hidden />
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

      </div>
    </section>
  );
}
