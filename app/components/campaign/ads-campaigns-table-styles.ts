export const adsCampaignsTable = {
  searchLabel: "relative block",
  searchIcon:
    "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400",
  searchInput:
    "h-9 w-52 rounded-lg border border-[#e8edf5] bg-white pl-8 pr-3 text-xs text-[#07111f] outline-none focus:border-[#1877f2]/40 focus:ring-2 focus:ring-[#1877f2]/15 sm:w-64",

  scroll: "table-h-scroll",
  table: "min-w-[820px] w-full border-collapse text-left text-sm",

  theadRow: "border-b border-[#e8edf5] bg-[#f8fafc]/60",
  thSelect:
    "whitespace-nowrap px-4 py-3 text-left align-middle text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800 first:pl-5",
  th: "whitespace-nowrap px-4 py-3 text-left align-middle text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800",
  thActions:
    "sticky right-0 z-[1] whitespace-nowrap bg-[#f8fafc]/60 px-4 py-3 pl-2 text-right align-middle text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800 last:pr-5",

  row: "group cursor-pointer align-middle text-[#07111f] transition-colors duration-150 hover:bg-[#e8f2ff]/70",
  tdSelect: "border-b border-[#f1f5f9] px-4 py-3 text-left align-middle first:pl-5",
  td: "border-b border-[#f1f5f9] px-4 py-3 text-left align-middle text-sm text-slate-700",
  tdNum:
    "border-b border-[#f1f5f9] px-4 py-3 text-left align-middle text-sm tabular-nums text-slate-700",
  tdActions:
    "sticky right-0 z-[1] border-b border-[#f1f5f9] bg-white px-4 py-3 pl-2 text-right align-middle last:pr-5 group-hover:bg-[#e8f2ff]/70",

  skeletonCell: "border-b border-[#f1f5f9] px-4 py-3",
  skeletonBar: "h-12 animate-pulse rounded-xl bg-[#f1f5f9]",
  emptyCell: "py-10 text-center",

  selectDotBase: "flex size-5 items-center justify-center rounded-full",
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
    "mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e8edf5] px-2.5 py-3 text-xs text-slate-500 sm:px-3",
  paginationBtn:
    "inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white p-1.5 text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-40",
  paginationPage: "min-w-6 text-center text-sm font-medium tabular-nums text-slate-700",
} as const;

export function adsCampaignSelectDotClass(selected: boolean): string {
  return `${adsCampaignsTable.selectDotBase} ${
    selected ? adsCampaignsTable.selectDotOn : adsCampaignsTable.selectDotOff
  }`;
}
