export const editorSidebarRootClass =
  "flex w-full flex-col gap-1.5 bg-transparent p-2 [&_button]:cursor-pointer [&_select]:cursor-pointer";

export const editorPremiumCardClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm";

export const editorPremiumStepCardClass =
  "overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors duration-150";

export const editorPanelTopShellClass =
  "editor-panel-top-shell shrink-0 border-b border-slate-200 px-3 py-3";

export const editorPanelTopFootClass =
  "editor-panel-top-foot flex w-full shrink-0 items-center";

export const editorSettingsPanelShellEmbeddedClass =
  "hidden h-full min-h-0 w-full flex-col gap-2 overflow-hidden lg:flex";

export const editorSettingsPanelShellClass =
  "hidden h-full min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-slate-50 lg:flex !rounded-none !border-y-0 !border-r-0";

export const editorSettingsPanelShellLeftClass =
  "hidden h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 lg:flex !rounded-none !border-y-0 !border-l-0";

export const editorSettingsPanelScrollClass = [
  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
  "[scrollbar-gutter:stable] [scrollbar-width:thin]",
  "[scrollbar-color:rgb(226_232_240)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300",
  "[&::-webkit-scrollbar-thumb:hover]:bg-slate-400",
].join(" ");

export const editorAccordionShellOpenClass =
  "overflow-hidden rounded-md border border-slate-200 bg-white transition-colors duration-150";

export const editorAccordionShellClosedClass =
  "overflow-hidden rounded-md border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50/50";

export const editorAccordionHeaderButtonClass =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150";

export const editorAccordionIconOpenClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-white transition-colors duration-150";

export const editorAccordionIconClosedClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md bg-[#e8f2ff] text-[#1877f2] transition-colors duration-150";

export const editorAccordionTitleClass =
  "block text-[0.8125rem] font-semibold leading-tight text-slate-900";

export const editorAccordionHintClass =
  "mt-0.5 block truncate text-[0.7rem] leading-snug text-slate-500";

export const editorAccordionChevronOpenClass =
  "flex size-6 shrink-0 items-center justify-center text-slate-500 transition-colors duration-150";

export const editorAccordionChevronClosedClass =
  "flex size-6 shrink-0 items-center justify-center text-slate-400 transition-colors duration-150";

export const editorAccordionBodyClass =
  "border-t border-slate-100 bg-slate-50/50 px-3 pb-3 pt-2.5";

export const editorFieldIconChipClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-white";

export const editorFieldIconChipInlineClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-white sm:size-7";

export const editorFieldLabelClass =
  "text-xs font-semibold text-slate-700";

export const editorFieldLabelInlineClass =
  "max-w-[5.5rem] truncate text-xs font-semibold text-slate-700 sm:max-w-[7.5rem]";

export const editorFieldLabelPlainClass =
  "mb-1 block text-xs font-medium text-slate-600";

export const editorContentInputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 focus:ring-offset-0";

export const editorInlineInputClass = `${editorContentInputClass} min-h-9 min-w-0 flex-1 py-2 text-sm`;

export const editorSidebarBodyTextClass = "text-xs leading-relaxed text-slate-500";

export const editorSidebarBodyStrongClass = "font-semibold text-slate-900";

export const editorSidebarPrimaryButtonClass =
  "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1877f2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#166fe0] active:scale-[0.99]";

export const editorColorPickerShellClass =
  "mt-1.5 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5";

export const editorColorPickerBadgeClass =
  "shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white";

export const editorColorPickerDividerClass =
  "h-4 w-px shrink-0 bg-slate-200";

export const editorColorPickerSwatchClass =
  "group relative block size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 transition-[border-color] duration-150 hover:border-slate-400";

export const editorColorPickerHexInputClass =
  "min-w-0 flex-1 border-0 bg-transparent py-0 font-mono text-[11px] outline-none transition-colors duration-150";

export const editorColorPickerResetClass =
  "shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50";

export const editorSidebarPickerRowSelectedClass =
  "border-[#1877f2] bg-[#e8f2ff] text-slate-900 ring-1 ring-[#1877f2]/25";

export const editorSidebarPickerRowClass =
  "border-slate-200 bg-white text-slate-900 transition-colors duration-200 hover:border-[#1877f2] hover:bg-[#f4f8ff] hover:ring-1 hover:ring-[#1877f2]/20 focus-visible:border-[#1877f2] focus-visible:bg-[#f4f8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30";

export const editorSidebarMediaFrameClass =
  "overflow-hidden rounded-md border border-slate-200 bg-slate-50";

export const editorSidebarSecondaryButtonClass =
  "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700";

export const editorSidebarUploadButtonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#1877f2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#166fe0]";

export const editorSidebarSectionDividerClass = "border-t border-slate-200";

export const editorFunnelStepSelectedClass =
  "bg-slate-50";

export const editorFunnelStepIdleClass =
  "hover:bg-slate-50/70";

export const editorFunnelStepIconSelectedClass =
  "bg-[#1877f2] text-white";

export const editorFunnelStepIconIdleClass =
  "bg-[#e8f2ff] text-[#1877f2]";

export const editorFunnelRailStepSelectedClass =
  "bg-slate-100";

export const editorFunnelRailStepIdleClass =
  "bg-transparent hover:bg-slate-50";

export const editorFunnelSignupGradient =
  "linear-gradient(90deg, #1877f2 0%, #4b5563 100%)";

export const editorFunnelProgressFillGradient =
  "linear-gradient(90deg, #1877f2 0%, #3b8ded 45%, #60a5fa 100%)";

export const editorFunnelSignupGradientVertical =
  "linear-gradient(180deg, #1877f2 0%, #4b5563 100%)";

export const editorFunnelSignupGradientTrailIdle =
  "linear-gradient(180deg, rgba(24,119,242,0.25) 0%, #e2e8f0 100%)";

export const editorFunnelStepIconRailLeftClass = "left-[1.65rem]";

export const editorSidebarCaptionClass = "mb-2 text-xs font-medium text-slate-600";

export const editorSidebarCheckboxLabelClass =
  "flex cursor-pointer items-center gap-2 text-xs text-slate-600 transition-colors duration-150 hover:text-slate-900";

export const editorSidebarFormFieldRowClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md py-1 text-left text-slate-900 transition-colors duration-150 hover:bg-slate-50";

export const editorSidebarFormFieldIconOnClass =
  "border-[#1877f2] bg-[#1877f2] text-white";

export const editorSidebarFormFieldIconOffClass =
  "border-slate-200 bg-white text-slate-400";
