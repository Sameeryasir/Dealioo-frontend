export const DASHBOARD_KPI_ICON = {
  blue: "bg-[#e8f2ff] text-[#1877f2]",
  green: "bg-[#ecfdf5] text-[#34a853]",
  orange: "bg-[#fff7ed] text-[#f77737]",
  pink: "bg-[#fdf2f8] text-[#e1306c]",
} as const;

export const TABLE_HEAD_ICON_CLASS = "text-slate-600";
export const TABLE_HEAD_LABEL_CLASS = "text-slate-800";

export const DASHBOARD_EVENT_BADGE = {
  visited:
    "inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[0.72rem] font-bold text-[#166534] ring-1 ring-[#bbf7d0]/80",
  visitedDot: "size-2 rounded-full bg-[#34a853]",
  redeemed:
    "inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-1 text-[0.72rem] font-bold text-[#c2410c] ring-1 ring-[#fed7aa]/80",
  redeemedDot: "size-2 rounded-full bg-[#f77737]",
  prepaid:
    "inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.72rem] font-bold text-[#1877f2] ring-1 ring-[#bfdbfe]/80",
  prepaidDot: "size-2 rounded-full bg-[#1877f2]",
  messageSent:
    "inline-flex items-center gap-1.5 rounded-full bg-[#fdf2f8] px-2.5 py-1 text-[0.72rem] font-bold text-[#be185d] ring-1 ring-[#fbcfe8]/80",
  messageSentDot: "size-2 rounded-full bg-[#e1306c]",
  default:
    "inline-flex items-center gap-1.5 rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[0.72rem] font-bold text-slate-600 ring-1 ring-[#e8edf5]",
} as const;
