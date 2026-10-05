export const adsCampaignsTable = {
  searchLabel: "relative block",
  searchIcon:
    "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400",
  searchInput:
    "h-9 w-52 rounded-lg border border-[#e8edf5] bg-white pl-8 pr-3 text-xs text-[#07111f] outline-none focus:border-[#1877f2]/40 focus:ring-2 focus:ring-[#1877f2]/15 sm:w-64",

  scroll: "overflow-x-auto",
  table:
    "min-w-[820px] w-full border-separate border-spacing-0 text-left text-sm",

  theadRow:
    "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
  thSelect: "border-b border-[#eef2f7] pb-2 pr-2 font-semibold",
  th: "border-b border-[#eef2f7] pb-2 pr-3 font-semibold",
  thActions:
    "sticky right-0 z-[1] border-b border-[#eef2f7] bg-white pb-2 pl-2 text-right font-semibold",

  row: "group cursor-pointer align-middle text-[#07111f] transition hover:bg-[#f8fbff]",
  tdSelect: "border-b border-[#f1f5f9] py-3 pr-2",
  td: "border-b border-[#f1f5f9] py-3 pr-3",
  tdNum: "border-b border-[#f1f5f9] py-3 pr-3 tabular-nums",
  tdActions:
    "sticky right-0 z-[1] border-b border-[#f1f5f9] bg-white py-3 pl-2 group-hover:bg-[#f8fbff]",

  skeletonCell: "border-b border-[#f1f5f9] py-3",
  skeletonBar: "h-12 animate-pulse rounded-xl bg-[#f1f5f9]",
  emptyCell: "py-10 text-center",

  selectDotBase:
    "flex size-5 items-center justify-center rounded-full",
  selectDotOn: "bg-[#1877f2] text-white",
  selectDotOff: "border border-[#dbe3ef] bg-white text-transparent",

  statusBadge:
    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",

  campaignNameWrap: "min-w-0 max-w-[18rem]",
  campaignName: "truncate font-semibold",
  campaignMetaId: "mt-0.5 truncate font-mono text-[11px] text-slate-400",

  actionRow: "flex items-center justify-end gap-1",
  actionBtn:
    "rounded-lg p-1.5 text-slate-400 transition hover:bg-[#eef5ff] hover:text-[#1877f2] disabled:opacity-50",
  actionBtnDanger:
    "rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50",

  paginationBar:
    "mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500",
  paginationBtn:
    "rounded-lg border border-[#e8edf5] p-1.5 disabled:opacity-40",
  paginationPage:
    "min-w-6 text-center font-semibold text-[#07111f]",
} as const;

export function adsCampaignSelectDotClass(selected: boolean): string {
  return `${adsCampaignsTable.selectDotBase} ${
    selected ? adsCampaignsTable.selectDotOn : adsCampaignsTable.selectDotOff
  }`;
}
