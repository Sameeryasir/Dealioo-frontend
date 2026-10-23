"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OverviewChartTooltip } from "@/app/components/campaign/overview/charts/OverviewChartTooltip";
import { overviewAxisInterval } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { Skeleton } from "@/app/components/skeleton";
import { BusinessesByRegionCard } from "@/app/components/super-admin/BusinessesByRegionCard";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import {
  activityCalendarYearMonthCount,
  currentActivityMonthKey,
} from "@/app/lib/activity-month-filter";
import { getUserTimeZone } from "@/app/lib/datetime";
import { getSetupUser } from "@/app/lib/setup-user";
import {
  shouldShowOverviewChartDots,
  useCompactChartDots,
} from "@/app/hooks/use-compact-chart-dots";
import { usePlatformDashboardQuery } from "@/app/hooks/use-platform-dashboard-query";
import { type PlatformDashboardKpi } from "@/app/services/admin/get-platform-dashboard";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Loader2,
  Percent,
  RefreshCw,
  Rocket,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
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

type OverviewView = "revenue" | "growth" | "sales";

const OVERVIEW_VIEWS: Array<{ id: OverviewView; label: string }> = [
  { id: "revenue", label: "Revenue" },
  { id: "growth", label: "Growth" },
  { id: "sales", label: "Sales" },
];

const EMPTY_KPI: PlatformDashboardKpi = {
  value: 0,
  changePct: 0,
  sparkline: [],
  hint: "",
};

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

function formatMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatMoneyDollars(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const abs = Math.abs(value);
  const label = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return (
    <span
      className={`${styles.kpiTrend} ${up ? styles.kpiTrendUp : styles.kpiTrendDown}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}%
    </span>
  );
}

function OverviewKpiSkeleton() {
  return (
    <div className={styles.kpiGridFour} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className="min-w-0 w-full space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="size-9 shrink-0 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function OverviewChartSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col justify-end gap-3 px-1 py-1 ${
        compact ? "min-h-[200px]" : "min-h-[220px]"
      }`}
      aria-busy="true"
    >
      <Skeleton
        className={`w-full flex-1 rounded-xl ${
          compact ? "min-h-[160px]" : "min-h-[180px]"
        }`}
      />
      <div className="flex justify-between gap-2">
        <Skeleton className="h-2.5 w-8" />
        <Skeleton className="h-2.5 w-8" />
        <Skeleton className="h-2.5 w-8" />
        <Skeleton className="h-2.5 w-8" />
        <Skeleton className="h-2.5 w-8" />
      </div>
    </div>
  );
}

function useCountUp(target: number, ready: boolean, durationMs = 900): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;

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

    const startedAt = performance.now();

    const tick = (now: number) => {
        if (cancelled) return;
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
    };

    frame = requestAnimationFrame(start);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [durationMs, ready, target]);

  return display;
}

function PanelKpiCard({
  label,
  kpi,
  money,
  percent,
  icon: Icon,
  accent,
  soft,
  ready,
  hideTrend,
}: {
  label: string;
  kpi: PlatformDashboardKpi;
  money?: boolean;
  percent?: boolean;
  icon: typeof Wallet;
  accent: string;
  soft: string;
  ready: boolean;
  hideTrend?: boolean;
}) {
  const animated = useCountUp(kpi.value, ready);
  const rounded = percent
    ? Math.round(animated * 10) / 10
    : Math.round(animated);
  const display = money
    ? formatMoney(Math.round(animated))
    : percent
      ? `${rounded}%`
      : String(rounded);
  const ariaValue = money
    ? formatMoney(kpi.value)
    : percent
      ? `${kpi.value}%`
      : String(kpi.value);

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
        <div className="min-w-0">
          <p className={styles.kpiLabel}>{label}</p>
          <p className={styles.kpiValue} aria-label={`${label}: ${ariaValue}`}>
            {display}
          </p>
        </div>
        <div className={styles.kpiIcon}>
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
      {hideTrend ? (
        <div className={styles.kpiTrendSpacer} aria-hidden />
      ) : (
        <TrendBadge value={kpi.changePct} />
      )}
    </div>
  );
}

function PlatformTrendChart({
  data,
  stroke,
  seriesName,
  money,
  refreshing = false,
}: {
  data: Array<{ label: string; value: number }>;
  stroke: string;
  seriesName: string;
  money?: boolean;
  refreshing?: boolean;
}) {
  const compactScreen = useCompactChartDots();
  const showDots = shouldShowOverviewChartDots(compactScreen, data.length);
  const chartHeight = compactScreen ? 220 : 260;

  return (
    <div
      className={`${styles.chartMotion} w-full min-w-0 ${
        refreshing ? styles.chartMotionRefreshing : ""
      }`}
      style={{ height: chartHeight }}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={
            compactScreen
              ? { top: 4, right: 8, left: 0, bottom: 0 }
              : { top: 8, right: 12, left: 4, bottom: 4 }
          }
        >
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{
              fill: "#64748b",
              fontSize: compactScreen ? 10 : 12,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
            interval={overviewAxisInterval(data.length)}
            height={compactScreen ? 28 : 36}
            dy={compactScreen ? 4 : 8}
          />
          <YAxis
            allowDecimals={Boolean(money)}
            tick={{
              fill: "#94a3b8",
              fontSize: compactScreen ? 10 : 12,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
            width={money ? (compactScreen ? 40 : 48) : compactScreen ? 32 : 40}
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
            dataKey="value"
            name={seriesName}
            stroke={stroke}
            strokeWidth={compactScreen ? 2.25 : 2.75}
            dot={
              showDots
                ? {
                    r: 4,
                    fill: stroke,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }
                : false
            }
            activeDot={{
              r: compactScreen ? 5 : 6,
              fill: stroke,
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
            isAnimationActive
            animationDuration={750}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SuperAdminDashboard() {
  const displayName = getSetupUser()?.name?.trim() || "Super Admin";
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [overviewView, setOverviewView] = useState<OverviewView>("revenue");
  const dashboardMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);
  const viewerTimeZone = useMemo(() => getUserTimeZone(), []);

  const {
    data: panel,
    isLoading,
    isFetching,
    error: errorMessage,
    refetch,
  } = usePlatformDashboardQuery({
    period: "month",
    month: monthFilter,
    timezone: viewerTimeZone,
  });

  const refreshing = isFetching && Boolean(panel);
  // While a new range loads, show skeletons instead of the previous range's numbers.
  const blankLoading = isLoading || !panel;
  const kpis = panel?.kpis;
  const charts = panel?.charts;
  const isCurrentPeriod = panel?.isCurrentPeriod !== false;
  const periodLabel = panel?.label || "This month";
  const ready = Boolean(kpis) && !blankLoading;

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
              Switch views to focus on revenue, growth, or sales — one story at a
              time.
            </p>
          </div>
          <div className={styles.heroTools}>
            <div className={styles.toolbarMonth}>
              <ActivityMonthCalendarPicker
                value={monthFilter}
                onChange={setMonthFilter}
                compact
                showAllMonths={false}
                monthCount={dashboardMonthCount}
              />
            </div>

            <span className={styles.toolbarDivider} aria-hidden />
            <button
              type="button"
              className={styles.toolbarRefresh}
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh overview"
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div
          className={styles.viewPills}
          role="tablist"
          aria-label="Overview focus"
        >
          {OVERVIEW_VIEWS.map((item) => {
            const selected = overviewView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`${styles.viewPill} ${
                  selected ? styles.viewPillActive : ""
                }`}
                onClick={() => setOverviewView(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void refetch()}
            />
          </div>
        ) : null}

        {overviewView === "revenue" ? (
          <>
            <div className={styles.kpiSection}>
              {blankLoading ? (
                <OverviewKpiSkeleton />
              ) : (
                <div
                  className={
                    isCurrentPeriod
                      ? styles.kpiGridFour
                      : styles.kpiGridTwo
                  }
                >
                  <PanelKpiCard
                    label={
                      isCurrentPeriod
                        ? "Monthly income"
                        : "Subscription income"
                    }
                    kpi={kpis?.mrr ?? EMPTY_KPI}
                    money
                    icon={Wallet}
                    accent="#e1306c"
                    soft="#fdf2f8"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label={
                      isCurrentPeriod
                        ? "Paying customers"
                        : "New subscriptions"
                    }
                    kpi={kpis?.payingSubscriptions ?? EMPTY_KPI}
                    icon={Activity}
                    accent="#833aba"
                    soft="#f3e8ff"
                    ready={ready}
                  />
                  {isCurrentPeriod ? (
                    <>
                      <PanelKpiCard
                        label="New plan money"
                        kpi={kpis?.planEarnings ?? EMPTY_KPI}
                        money
                        icon={Wallet}
                        accent="#1877f2"
                        soft="#e8f2ff"
                        ready={ready}
                      />
                      <PanelKpiCard
                        label="New plans"
                        kpi={kpis?.newPlans ?? EMPTY_KPI}
                        icon={Sparkles}
                        accent="#f77737"
                        soft="#fff7ed"
                        ready={ready}
                      />
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className={styles.chartGridTop}>
              <OverviewChartShell
                title="Plan Earnings"
                subtitle={periodLabel}
                accent="pink"
                icon={Wallet}
                stat={
                  blankLoading
                    ? "—"
                    : formatMoneyDollars(
                        charts?.planEarnings.reduce((s, r) => s + r.value, 0) ??
                          0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.planEarnings ?? []}
                    stroke="#f87171"
                    seriesName="Plan Earnings"
                    money
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <OverviewChartShell
                title="New Subscriptions"
                subtitle={periodLabel}
                accent="orange"
                icon={Sparkles}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.subscriptions.reduce((s, r) => s + r.value, 0) ??
                          0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.subscriptions ?? []}
                    stroke="#c084fc"
                    seriesName="New Subscriptions"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>
            </div>

            <div className={styles.chartGridBottomTwo}>
              <OverviewChartShell
                title="New Businesses"
                subtitle={periodLabel}
                accent="blue"
                icon={Building2}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.businesses.reduce((s, r) => s + r.value, 0) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton compact />
                ) : (
                  <PlatformTrendChart
                    data={charts?.businesses ?? []}
                    stroke="#4ade80"
                    seriesName="New Businesses"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <BusinessesByRegionCard
                regions={panel?.regions ?? []}
                loading={blankLoading}
              />
            </div>
          </>
        ) : null}

        {overviewView === "growth" ? (
          <>
            <div className={styles.kpiSection}>
              {blankLoading ? (
                <OverviewKpiSkeleton />
              ) : (
                <div className={styles.kpiGridThree}>
                  <PanelKpiCard
                    label="New users"
                    kpi={kpis?.newUsers ?? EMPTY_KPI}
                    icon={UserPlus}
                    accent="#0ea5e9"
                    soft="#e0f2fe"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label={
                      isCurrentPeriod
                        ? "Active businesses"
                        : "New businesses"
                    }
                    kpi={kpis?.activeBusinesses ?? EMPTY_KPI}
                    icon={Building2}
                    accent="#10b981"
                    soft="#ecfdf5"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label="Onboarding completed"
                    kpi={kpis?.onboardingCompletedPct ?? EMPTY_KPI}
                    percent={isCurrentPeriod}
                    icon={CheckCircle2}
                    accent="#6366f1"
                    soft="#eef2ff"
                    ready={ready}
                  />
                </div>
              )}
            </div>

            <div className={styles.chartGridTop}>
              <OverviewChartShell
                title="New Users"
                subtitle={periodLabel}
                accent="blue"
                icon={UserPlus}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.users.reduce((s, r) => s + r.value, 0) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.users ?? []}
                    stroke="#38bdf8"
                    seriesName="New Users"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <OverviewChartShell
                title="New Businesses"
                subtitle={periodLabel}
                accent="blue"
                icon={Building2}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.businesses.reduce((s, r) => s + r.value, 0) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.businesses ?? []}
                    stroke="#4ade80"
                    seriesName="New Businesses"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>
            </div>

            <div className={styles.chartGridBottomTwo}>
              <OverviewChartShell
                title="Onboarding completions"
                subtitle={periodLabel}
                accent="orange"
                icon={CheckCircle2}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.onboardingCompleted.reduce(
                          (s, r) => s + r.value,
                          0,
                        ) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton compact />
                ) : (
                  <PlatformTrendChart
                    data={charts?.onboardingCompleted ?? []}
                    stroke="#818cf8"
                    seriesName="Onboarding completions"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <BusinessesByRegionCard
                regions={panel?.regions ?? []}
                loading={blankLoading}
              />
            </div>
          </>
        ) : null}

        {overviewView === "sales" ? (
          <>
            <div className={styles.kpiSection}>
              {blankLoading ? (
                <OverviewKpiSkeleton />
              ) : (
                <div className={styles.kpiGridFive}>
                  <PanelKpiCard
                    label="Meetings booked"
                    kpi={kpis?.meetingsBooked ?? EMPTY_KPI}
                    icon={CalendarDays}
                    accent="#2563eb"
                    soft="#dbeafe"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label="Meetings attended"
                    kpi={kpis?.meetingsAttended ?? EMPTY_KPI}
                    icon={ClipboardList}
                    accent="#7c3aed"
                    soft="#f5f3ff"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label="Deals won"
                    kpi={kpis?.dealsWon ?? EMPTY_KPI}
                    icon={Handshake}
                    accent="#059669"
                    soft="#ecfdf5"
                    ready={ready}
                  />
                  <PanelKpiCard
                    label="Ready to create"
                    kpi={kpis?.readyToCreate ?? EMPTY_KPI}
                    icon={Rocket}
                    accent="#ea580c"
                    soft="#fff7ed"
                    ready={ready}
                    hideTrend
                  />
                  <PanelKpiCard
                    label="Conversion rate"
                    kpi={kpis?.conversionRate ?? EMPTY_KPI}
                    percent
                    icon={Percent}
                    accent="#db2777"
                    soft="#fdf2f8"
                    ready={ready}
                  />
                </div>
              )}
            </div>

            <div className={styles.chartGridTop}>
              <OverviewChartShell
                title="Meetings booked"
                subtitle={periodLabel}
                accent="blue"
                icon={CalendarDays}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.meetingsBooked.reduce(
                          (s, r) => s + r.value,
                          0,
                        ) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.meetingsBooked ?? []}
                    stroke="#60a5fa"
                    seriesName="Meetings booked"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <OverviewChartShell
                title="Meetings attended"
                subtitle={periodLabel}
                accent="orange"
                icon={ClipboardList}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.meetingsAttended.reduce(
                          (s, r) => s + r.value,
                          0,
                        ) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton />
                ) : (
                  <PlatformTrendChart
                    data={charts?.meetingsAttended ?? []}
                    stroke="#a78bfa"
                    seriesName="Meetings attended"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>
            </div>

            <div className={styles.chartGridBottomTwo}>
              <OverviewChartShell
                title="Deals won"
                subtitle={periodLabel}
                accent="blue"
                icon={Handshake}
                stat={
                  blankLoading
                    ? "—"
                    : String(
                        charts?.dealsWon.reduce((s, r) => s + r.value, 0) ?? 0,
                      )
                }
                minHeightClass="min-h-[280px]"
              >
                {blankLoading ? (
                  <OverviewChartSkeleton compact />
                ) : (
                  <PlatformTrendChart
                    data={charts?.dealsWon ?? []}
                    stroke="#34d399"
                    seriesName="Deals won"
                    refreshing={refreshing}
                  />
                )}
              </OverviewChartShell>

              <div className={styles.salesInsightCard}>
                <p className={styles.salesInsightTitle}>Sales funnel</p>
                <p className={styles.salesInsightCopy}>
                  How meetings move from booked → attended → won this period.
                </p>
                {blankLoading ? (
                  <div className={styles.salesFunnelSkeleton} aria-busy="true">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-[85%] rounded-xl" />
                    <Skeleton className="h-10 w-[70%] rounded-xl" />
                  </div>
                ) : (
                  <>
                    <div className={styles.salesFunnelSteps}>
                      {(
                        [
                          {
                            key: "booked",
                            label: "Booked",
                            value: kpis?.meetingsBooked.value ?? 0,
                            color: "#2563eb",
                          },
                          {
                            key: "attended",
                            label: "Attended",
                            value: kpis?.meetingsAttended.value ?? 0,
                            color: "#7c3aed",
                          },
                          {
                            key: "won",
                            label: "Deals won",
                            value: kpis?.dealsWon.value ?? 0,
                            color: "#059669",
                          },
                        ] as const
                      ).map((step) => {
                        const booked = Math.max(
                          kpis?.meetingsBooked.value ?? 0,
                          1,
                        );
                        const widthPct = Math.max(
                          18,
                          Math.min(100, (step.value / booked) * 100),
                        );
                        return (
                          <div key={step.key} className={styles.salesFunnelRow}>
                            <div className={styles.salesFunnelMeta}>
                              <span>{step.label}</span>
                              <strong>{step.value}</strong>
                            </div>
                            <div className={styles.salesFunnelTrack}>
                              <div
                                className={styles.salesFunnelFill}
                                style={
                                  {
                                    width: `${widthPct}%`,
                                    background: step.color,
                                  } as CSSProperties
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.salesInsightStats}>
                      <div>
                        <p className={styles.salesInsightLabel}>Show-up rate</p>
                        <p className={styles.salesInsightValue}>
                          {(() => {
                            const booked = kpis?.meetingsBooked.value ?? 0;
                            const attended =
                              kpis?.meetingsAttended.value ?? 0;
                            if (booked <= 0) return "0%";
                            return `${Math.round((attended / booked) * 1000) / 10}%`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className={styles.salesInsightLabel}>Win rate</p>
                        <p className={styles.salesInsightValue}>
                          {`${kpis?.conversionRate.value ?? 0}%`}
                        </p>
                      </div>
                      <div>
                        <p className={styles.salesInsightLabel}>
                          Ready to create
                        </p>
                        <p className={styles.salesInsightValue}>
                          {String(kpis?.readyToCreate.value ?? 0)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
