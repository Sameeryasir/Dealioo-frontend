export const editorWorkspaceColsEmbeddedClass =
  "lg:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem]";

export const editorWorkspaceColsEmbeddedAiOpenClass =
  "lg:grid-cols-[16rem_minmax(0,1fr)_22rem] xl:grid-cols-[16.5rem_minmax(0,1fr)_24rem]";

export const editorWorkspaceColsEmbeddedWithAssistantClass =
  "lg:grid-cols-[15rem_minmax(0,1fr)_15rem_18rem] xl:grid-cols-[16rem_minmax(0,1fr)_16rem_19rem]";

export const editorWorkspaceColsClass =
  "lg:grid-cols-[10.25rem_minmax(0,1fr)_14.25rem] xl:grid-cols-[11rem_minmax(0,1fr)_15.5rem] 2xl:grid-cols-[11.5rem_minmax(0,1fr)_16.5rem]";

export const editorWorkspaceColsAiOpenClass =
  "lg:grid-cols-[10.25rem_minmax(0,1fr)_20rem] xl:grid-cols-[11rem_minmax(0,1fr)_22rem] 2xl:grid-cols-[11.5rem_minmax(0,1fr)_24rem]";

export const editorWorkspaceColsWithAssistantClass =
  "lg:grid-cols-[10.25rem_minmax(0,1fr)_13rem_16rem] xl:grid-cols-[11rem_minmax(0,1fr)_14rem_17rem] 2xl:grid-cols-[11.5rem_minmax(0,1fr)_15rem_18rem]";

export const editorFunnelRailWidthClass = "w-full max-w-full";

export const editorShellEmbeddedClass =
  "crm-editor-embedded-shell relative flex h-full min-h-0 w-full max-h-full flex-1 flex-col overflow-hidden bg-[#f4f6fa] text-slate-900";

export const editorShellGridWrapEmbeddedClass =
  "crm-editor-embedded-grid-wrap flex min-h-0 w-full flex-1 overflow-hidden";

export const editorShellGridEmbeddedClass = [
  "crm-editor-embedded-grid grid h-full w-full grid-cols-1",
  editorWorkspaceColsEmbeddedClass,
  "lg:items-stretch",
].join(" ");

export const editorShellGridEmbeddedAiOpenClass = [
  "crm-editor-embedded-grid grid h-full w-full grid-cols-1",
  editorWorkspaceColsEmbeddedAiOpenClass,
  "lg:items-stretch",
].join(" ");

export const editorShellGridEmbeddedWithAssistantClass = [
  "crm-editor-embedded-grid grid h-full w-full grid-cols-1",
  editorWorkspaceColsEmbeddedWithAssistantClass,
  "lg:items-stretch",
].join(" ");

export const editorShellGridClass = [
  "grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden",
  editorWorkspaceColsClass,
  "lg:grid-rows-[auto_minmax(0,1fr)]",
].join(" ");

export const editorShellGridAiOpenClass = [
  "grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden",
  editorWorkspaceColsAiOpenClass,
  "lg:grid-rows-[auto_minmax(0,1fr)]",
].join(" ");

export const editorShellGridWithAssistantClass = [
  "grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden",
  editorWorkspaceColsWithAssistantClass,
  "lg:grid-rows-[auto_minmax(0,1fr)]",
].join(" ");

export const editorShellClass =
  "relative flex h-full min-h-0 w-full max-h-full flex-1 flex-col overflow-hidden bg-[#eef2f7] text-[#07111f]";

export const editorSidebarSlotClass =
  "order-2 flex min-h-0 h-full flex-col lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1";

export const editorSidebarSlotEmbeddedClass =
  "order-2 z-[2] flex h-full min-h-0 w-full flex-col self-stretch border-r border-[#e8edf5] bg-white max-lg:border-b max-lg:border-[#e8edf5] lg:order-none lg:col-start-1 lg:row-start-1";

export const editorNavbarSlotClass =
  "order-1 min-h-0 w-full shrink-0 lg:order-none lg:col-span-2 lg:col-start-2 lg:row-start-1";

export const editorNavbarSlotWithAssistantClass =
  "order-1 min-h-0 w-full shrink-0 lg:order-none lg:col-span-3 lg:col-start-2 lg:row-start-1";

export const editorCanvasSlotClass =
  "order-3 flex min-h-0 h-full min-w-0 flex-col overflow-hidden lg:order-none lg:col-start-2 lg:row-start-2";

export const editorCanvasSlotEmbeddedClass =
  "order-3 flex h-full min-h-0 w-full min-w-0 flex-col self-stretch overflow-hidden lg:order-none lg:col-start-2 lg:row-start-1";

export const editorSettingsSlotClass =
  "order-4 flex h-full min-h-0 max-h-[32vh] min-w-0 flex-col overflow-hidden overscroll-contain lg:order-none lg:col-start-3 lg:row-start-2 lg:max-h-none lg:overflow-hidden [&>aside]:h-full [&>aside]:min-h-0";

export const editorSettingsSlotEmbeddedClass =
  "order-4 z-[2] flex h-full min-h-0 w-full flex-col self-stretch overflow-hidden border-l border-[#e8edf5] bg-white lg:order-none lg:col-start-3 lg:row-start-1 [&>aside]:h-full [&>aside]:min-h-0";

export const editorAssistantSlotClass =
  "order-5 flex h-full min-h-0 max-h-[32vh] min-w-0 flex-col overflow-hidden overscroll-contain lg:order-none lg:col-start-4 lg:row-start-2 lg:max-h-none lg:overflow-hidden [&>aside]:h-full [&>aside]:min-h-0";

export const editorAssistantSlotEmbeddedClass =
  "order-5 flex h-full min-h-0 w-full flex-col self-stretch overflow-hidden max-lg:border-t max-lg:border-[#e8edf5] lg:order-none lg:col-start-4 lg:row-start-1 [&>aside]:h-full [&>aside]:min-h-0";

export const editorPanelScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export const editorSidebarPickerScrollClass = [
  "max-h-[13.5rem] overflow-y-auto overscroll-y-contain pr-1",
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgb(232_237_245)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1]",
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#94a3b8]",
].join(" ");

export const editorSidebarPickerPanelClass =
  "overflow-hidden rounded-md border border-slate-200 bg-white p-1.5";

export const editorPreviewStageClass =
  "@container/preview-stage relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden p-1 sm:p-2";

export const editorPreviewStageEmbeddedClass =
  "@container/preview-stage relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden p-1";

export const previewPhoneFrameClass = [
  "@container/preview",
  "flex w-full flex-col",
  "overflow-hidden",
  "rounded-2xl bg-white",
  "shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
  "ring-1 ring-slate-200/90",
].join(" ");

export const previewPhoneFrameEmbeddedClass = [
  "@container/preview",
  "flex w-full flex-col",
  "overflow-hidden",
  "rounded-2xl bg-white",
  "shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
  "ring-1 ring-slate-200/90",
].join(" ");

export const funnelFullPagePreviewFrameClass =
  "@container/preview flex w-full min-h-dvh flex-col overflow-hidden sm:max-w-[min(390px,100%)] sm:min-h-[calc(100dvh-2rem)] sm:rounded-lg sm:shadow-sm sm:ring-1 sm:ring-slate-200";
