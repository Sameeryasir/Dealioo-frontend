export const editorWorkspaceColsClass =
  "lg:grid-cols-[12.5rem_minmax(0,1fr)_16.5rem] xl:grid-cols-[14rem_minmax(0,1fr)_19rem] 2xl:grid-cols-[clamp(15rem,16vw,17rem)_minmax(0,1fr)_clamp(17rem,20vw,21rem)]";

export const editorShellGridClass = [
  "grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden",
  editorWorkspaceColsClass,
  "lg:grid-rows-[auto_minmax(0,1fr)]",
].join(" ");

export const editorShellClass =
  "flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden bg-zinc-50 text-[#111827]";

export const editorSidebarSlotClass =
  "order-2 flex min-h-0 h-full flex-col lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1";

export const editorNavbarSlotClass =
  "order-1 min-h-0 w-full shrink-0 lg:order-none lg:col-span-2 lg:col-start-2 lg:row-start-1";

export const editorCanvasSlotClass =
  "order-3 flex min-h-0 h-full min-w-0 flex-col overflow-hidden lg:order-none lg:col-start-2 lg:row-start-2";

export const editorSettingsSlotClass =
  "order-4 flex min-h-0 max-h-[38vh] min-w-0 flex-col overflow-hidden overscroll-contain lg:order-none lg:col-start-3 lg:row-start-2 lg:h-full lg:max-h-full lg:overflow-hidden";

export const editorPanelScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

/**
 * Scrollable picker list, height fits ~3 option rows, then scrolls.
 * Row ≈ 4.25rem (preview + padding) × 3 + gaps ≈ 13.5rem.
 */
export const editorSidebarPickerScrollClass = [
  "max-h-[13.5rem] overflow-y-auto overscroll-y-contain pr-1",
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgb(212_212_216)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300/90",
  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400/90",
].join(" ");

/** Wrapper around picker lists in Media / Page design accordions. */
export const editorSidebarPickerPanelClass =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50/40 to-white p-1.5 shadow-sm ring-1 ring-zinc-950/[0.03]";

export const previewPhoneFrameClass =
  "@container/preview mx-auto w-full max-w-[min(390px,100%)] max-h-[calc(100dvh-5.5rem)] min-h-0 overflow-x-hidden overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80 [scrollbar-width:thin]";

export const funnelFullPagePreviewFrameClass =
  "@container/preview flex w-full min-h-dvh flex-col overflow-hidden sm:max-w-[min(390px,100%)] sm:min-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-zinc-200/80";
