export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1;
}

export function parsePositiveInt(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n =
    typeof raw === "number"
      ? raw
      : Number.parseInt(String(raw).trim(), 10);
  return isPositiveInt(n) ? n : null;
}

export function parseNonNegativeInt(raw: unknown, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
