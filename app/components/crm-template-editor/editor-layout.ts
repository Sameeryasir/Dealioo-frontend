export const editorWorkspaceColsClass =
  "lg:grid-cols-[10.25rem_minmax(0,1fr)_14.25rem] xl:grid-cols-[11rem_minmax(0,1fr)_15.5rem] 2xl:grid-cols-[11.5rem_minmax(0,1fr)_16.5rem]";

export const editorWorkspaceColsEmbeddedClass =
  "lg:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem]";

export const editorFunnelRailWidthClass = "w-full max-w-full";

export const editorShellEmbeddedClass =
  "crm-editor-embedded-shell relative flex h-full min-h-0 w-full max-h-full flex-1 flex-col overflow-hidden bg-white text-[#07111f]";

export const editorShellGridWrapEmbeddedClass =
  "crm-editor-embedded-grid-wrap flex min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden";

export const editorShellGridEmbeddedClass = [
  "crm-editor-embedded-grid grid h-full w-full grid-cols-1",
  editorWorkspaceColsEmbeddedClass,
  "lg:items-stretch",
].join(" ");

export const editorShellGridClass = [
  "grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden",
  editorWorkspaceColsClass,
  "lg:grid-rows-[auto_minmax(0,1fr)]",
].join(" ");

export const editorShellClass =
  "relative flex h-full min-h-0 w-full max-h-full flex-1 flex-col overflow-hidden bg-[#eef2f7] text-[#07111f]";

export const editorSidebarSlotClass =
  "order-2 flex min-h-0 h-full flex-col lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1";

export const editorSidebarSlotEmbeddedClass =
  "order-2 flex h-full min-h-0 w-full flex-col self-stretch max-lg:border-b max-lg:border-[#e8edf5] lg:order-none lg:col-start-1 lg:row-start-1";

export const editorNavbarSlotClass =
  "order-1 min-h-0 w-full shrink-0 lg:order-none lg:col-span-2 lg:col-start-2 lg:row-start-1";

export const editorCanvasSlotClass =
  "order-3 flex min-h-0 h-full min-w-0 flex-col overflow-hidden lg:order-none lg:col-start-2 lg:row-start-2";

export const editorCanvasSlotEmbeddedClass =
  "order-3 flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center self-stretch overflow-hidden lg:order-none lg:col-start-2 lg:row-start-1";

export const editorSettingsSlotClass =
  "order-4 flex h-full min-h-0 max-h-[32vh] min-w-0 flex-col overflow-hidden overscroll-contain lg:order-none lg:col-start-3 lg:row-start-2 lg:max-h-none lg:overflow-hidden [&>aside]:h-full [&>aside]:min-h-0";

export const editorSettingsSlotEmbeddedClass =
  "order-4 flex h-full min-h-0 w-full flex-col self-stretch overflow-hidden lg:order-none lg:col-start-3 lg:row-start-1 [&>aside]:h-full [&>aside]:min-h-0";

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
  "overflow-hidden rounded-[1.05rem] border border-[#e8edf5] bg-white p-1.5 ring-1 ring-black/[0.02]";

export const editorPreviewStageClass =
  "@container/preview-stage relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden p-0.5 sm:p-1";

export const editorPreviewStageEmbeddedClass =
  "@container/preview-stage relative flex h-full min-h-0 w-full max-w-[20.5rem] flex-1 flex-col items-stretch justify-start overflow-hidden p-0";

export const previewPhoneFrameClass = [
  "@container/preview",
  "w-full min-h-0 max-h-full shrink-0",
  "max-w-[min(100%,26rem)] sm:max-w-[min(100%,30rem)] lg:max-w-[min(100%,34rem)] xl:max-w-[min(100%,38rem)] 2xl:max-w-[min(100%,42rem)]",
  "aspect-[390/844]",
  "overflow-x-hidden overflow-y-auto",
  "rounded-[1.2rem] bg-white",
  "shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
  "ring-1 ring-[#e8edf5]",
  "[scrollbar-width:thin]",
].join(" ");

export const previewPhoneFrameEmbeddedClass = [
  "@container/preview",
  "h-full min-h-0 w-full max-w-[20.5rem] flex-1",
  "overflow-x-hidden overflow-y-auto",
  "rounded-[1.2rem] bg-white",
  "shadow-[0_12px_32px_rgba(15,23,42,0.1)]",
  "ring-1 ring-[#e8edf5]",
  "[scrollbar-width:thin]",
].join(" ");

export const funnelFullPagePreviewFrameClass =
  "@container/preview flex w-full min-h-dvh flex-col overflow-hidden sm:max-w-[min(390px,100%)] sm:min-h-[calc(100dvh-2rem)] sm:rounded-[1.65rem] sm:shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:ring-2 sm:ring-[#e8edf5]";
