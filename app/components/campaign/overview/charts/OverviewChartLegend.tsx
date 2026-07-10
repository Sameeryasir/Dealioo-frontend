"use client";

export function OverviewChartLegend({
  items,
}: {
  items: { label: string; value?: string; color: string }[];
}) {
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap items-center justify-center gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f8fafc] px-2.5 py-1 ring-1 ring-[#e8edf5]"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-[0.68rem] font-semibold text-slate-600">
            {item.label}
          </span>
          {item.value ? (
            <span className="text-[0.68rem] font-extrabold text-[#07111f]">
              {item.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
