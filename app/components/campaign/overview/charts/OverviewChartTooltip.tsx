"use client";

type PayloadItem = {
  name?: string;
  value?: number;
  dataKey?: string;
  payload?: Record<string, unknown>;
};

export function OverviewChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white px-3 py-2 shadow-lg ring-1 ring-zinc-950/5">
      {label ? (
        <p className="mb-1.5 text-xs font-semibold text-zinc-500">{label}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((item) => {
          const title = String(item.name ?? item.dataKey ?? "");
          const value = Number(item.value ?? 0);
          const row = item.payload;
          const extra =
            typeof row?.pct === "number"
              ? `, ${row.pct.toFixed(1)}% of signups`
              : typeof row?.count === "number"
                ? `, ${row.count.toLocaleString()} total`
                : "";

          return (
            <li key={title}>
              <p className="text-xs font-semibold text-zinc-900">{title}</p>
              <p className="text-sm font-semibold tabular-nums text-zinc-700">
                {value.toLocaleString()}
                {extra}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
