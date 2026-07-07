export type CronIntervalUnit = "minutes" | "hours" | "days";
export type CronFrequency = "daily" | "weekly" | "interval";
export type CronDayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const CRON_INTERVAL_MIN = 1;

export const CRON_DAYS: { id: CronDayOfWeek; label: string }[] = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

function configString(
  config: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function configNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function configCronFrequency(config: Record<string, unknown>): CronFrequency {
  if (config.frequency === "weekly") return "weekly";
  if (config.frequency === "interval") return "interval";
  return "daily";
}

export function configCronIntervalUnit(
  config: Record<string, unknown>,
): CronIntervalUnit {
  const value = config.unit;
  if (value === "hours" || value === "days" || value === "minutes") return value;
  return "minutes";
}

export function configCronIntervalValue(config: Record<string, unknown>): number {
  const fromInterval = configNumber(config, "interval", 0);
  if (fromInterval >= CRON_INTERVAL_MIN) {
    return Math.max(CRON_INTERVAL_MIN, Math.floor(fromInterval));
  }
  const legacyMinutes = configNumber(config, "intervalMinutes", 5);
  return Math.max(CRON_INTERVAL_MIN, Math.floor(legacyMinutes));
}

export function clampCronInterval(value: number): number {
  if (!Number.isFinite(value)) return CRON_INTERVAL_MIN;
  return Math.max(CRON_INTERVAL_MIN, Math.floor(value));
}

export function cronIntervalUnitLabel(value: number, unit: CronIntervalUnit): string {
  if (unit === "minutes") return value === 1 ? "minute" : "minutes";
  if (unit === "hours") return value === 1 ? "hour" : "hours";
  return value === 1 ? "day" : "days";
}

export function configCronDay(config: Record<string, unknown>): CronDayOfWeek {
  const value = config.dayOfWeek;
  const match = CRON_DAYS.find((d) => d.id === value);
  return match?.id ?? "monday";
}

function formatCronTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = Number.parseInt(hStr ?? "9", 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatCronScheduleSummary(config: Record<string, unknown>): string {
  const frequency = configCronFrequency(config);
  if (frequency === "interval") {
    const value = configCronIntervalValue(config);
    const unit = configCronIntervalUnit(config);
    return `Every ${value} ${cronIntervalUnitLabel(value, unit)}`;
  }
  const time = configString(config, "time", "09:00");
  const timeLabel = formatCronTime12h(time);
  if (frequency === "weekly") {
    const day = CRON_DAYS.find((d) => d.id === configCronDay(config))?.label ?? "Mon";
    return `Every ${day} at ${timeLabel}`;
  }
  return `Every day at ${timeLabel}`;
}

export function getCronFrequencyBadge(config: Record<string, unknown>): string {
  const frequency = configCronFrequency(config);
  if (frequency === "interval") return "Interval";
  if (frequency === "weekly") return "Weekly";
  return "Daily";
}
