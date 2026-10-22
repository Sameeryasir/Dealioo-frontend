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
import {
  type PlatformDashboardKpi,
  type PlatformDashboardPeriod,
} from "@/app/services/admin/get-platform-dashboard";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Building2,
  Loader2,
  RefreshCw,
  Sparkles,
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

const PERIODS: Array<{ id: PlatformDashboardPeriod; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

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
  return (
    <span
      className={`${styles.kpiTrend} ${up ? styles.kpiTrendUp : styles.kpiTrendDown}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value).toFixed(1)}%
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
  icon: Icon,
  accent,
  soft,
  ready,
}: {
  label: string;
  kpi: PlatformDashboardKpi;
  money?: boolean;
  icon: typeof Wallet;
  accent: string;
  soft: string;
  ready: boolean;
}) {
  const animated = useCountUp(kpi.value, ready);
  const display = money
    ? formatMoney(Math.round(animated))
    : String(Math.round(animated));

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
          <p
            className={styles.kpiValue}
            aria-label={`${label}: ${
              money ? formatMoney(kpi.value) : String(kpi.value)
            }`}
          >
            {display}
          </p>
        </div>
        <div className={styles.kpiIcon}>
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
      <TrendBadge value={kpi.changePct} />
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
  const [period, setPeriod] = useState<PlatformDashboardPeriod>("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const dashboardMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);
  const viewerTimeZone = useMemo(() => getUserTimeZone(), []);

  const {
    data: panel,
    isLoading,
    isFetching,
    error: errorMessage,
    refetch,
  } = usePlatformDashboardQuery({
    period,
    month: monthFilter,
    timezone: viewerTimeZone,
  });

  const refreshing = isFetching && Boolean(panel);
  const blankLoading = isLoading && !panel;
  const kpis = panel?.kpis;
  const charts = panel?.charts;
  const periodLabel = panel?.label || "This period";

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
              Dealioo plan earnings and growth.
            </p>
          </div>
          <div className={styles.heroTools}>
            <div className={styles.periodPills} role="group" aria-label="Time range">
              {PERIODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={`${styles.periodPill} ${
                    period === item.id ? styles.periodPillActive : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
              </div>

            {period === "month" ? (
                <ActivityMonthCalendarPicker
                  value={monthFilter}
                  onChange={setMonthFilter}
                  compact
                  showAllMonths={false}
                  monthCount={dashboardMonthCount}
                />
            ) : null}

            <button
              type="button"
              className={styles.iconBtn}
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

        {blankLoading ? (
          <OverviewKpiSkeleton />
        ) : (
          <div className={styles.kpiGridFour}>
            <PanelKpiCard
              label="Monthly income"
              kpi={kpis?.mrr ?? { value: 0, changePct: 0, sparkline: [], hint: "" }}
              money
              icon={Wallet}
            accent="#e1306c"
            soft="#fdf2f8"
            ready={Boolean(kpis)}
          />
            <PanelKpiCard
              label="Paying customers"
              kpi={
                kpis?.payingSubscriptions ?? {
                  value: 0,
                  changePct: 0,
                  sparkline: [],
                  hint: "",
                }
              }
              icon={Activity}
              accent="#833aba"
              soft="#f3e8ff"
              ready={Boolean(kpis)}
            />
            <PanelKpiCard
              label="New plan money"
              kpi={
                kpis?.planEarnings ?? {
                  value: 0,
                  changePct: 0,
                  sparkline: [],
                  hint: "",
                }
              }
              money
            icon={Wallet}
              accent="#1877f2"
              soft="#e8f2ff"
              ready={Boolean(kpis)}
            />
            <PanelKpiCard
              label="New plans"
              kpi={
                kpis?.newPlans ?? {
                  value: 0,
                  changePct: 0,
                  sparkline: [],
                  hint: "",
                }
              }
              icon={Sparkles}
              accent="#f77737"
              soft="#fff7ed"
            ready={Boolean(kpis)}
          />
        </div>
        )}

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
                    charts?.planEarnings.reduce((s, r) => s + r.value, 0) ?? 0,
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
                    charts?.subscriptions.reduce((s, r) => s + r.value, 0) ?? 0,
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
      </div>
    </section>
  );
}
