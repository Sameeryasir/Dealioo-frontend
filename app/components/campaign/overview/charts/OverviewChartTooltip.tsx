"use client";

type PayloadItem = {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
  payload?: Record<string, unknown>;
};

const SERIES_COLORS: Record<string, string> = {
  Signups: "#34a853",
  signups: "#34a853",
  Payments: "#1877f2",
  payments: "#1877f2",
  value: "#1877f2",
  "Signup Only": "#f77737",
  "Paid After Signup": "#34a853",
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

  const rows = payload.filter((item, index, arr) => {
    const seriesKey = String(item.name ?? item.dataKey ?? index);
    return (
      arr.findIndex(
        (entry) =>
          String(entry.name ?? entry.dataKey ?? "") === seriesKey,
      ) === index
    );
  });

  return (
    <div className="rounded-2xl border border-[#e8edf5]/80 bg-[#07111f]/95 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(7,17,31,0.35)] backdrop-blur-sm">
      {label ? (
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      ) : null}
      <ul className="m-0 space-y-1.5 p-0">
        {rows.map((item, index) => {
          const title = String(item.name ?? item.dataKey ?? "Value");
          const value = Number(item.value ?? 0);
          const row = item.payload;
          const dotColor =
            item.color ??
            SERIES_COLORS[title] ??
            SERIES_COLORS[String(item.dataKey ?? "")] ??
            "#1877f2";
          const extra =
            typeof row?.pct === "number"
              ? ` · ${row.pct.toFixed(1)}%`
              : typeof row?.count === "number"
                ? ` · ${row.count.toLocaleString()} total`
                : "";

          return (
            <li
              key={`${title}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden
                />
                <span className="text-[0.72rem] font-semibold text-slate-300">
                  {title}
                </span>
              </span>
              <span className="text-[0.82rem] font-extrabold tabular-nums text-white">
                {value.toLocaleString()}
                {extra}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
