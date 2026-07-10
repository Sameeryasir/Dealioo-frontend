export const editorSidebarRootClass =
  "flex w-full flex-col gap-2 bg-transparent p-2 [&_button]:cursor-pointer [&_select]:cursor-pointer";

export const editorPremiumCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

export const editorPremiumStepCardClass =
  "overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02] transition-all duration-200";

export const editorPanelTopShellClass =
  "editor-panel-top-shell shrink-0 border-b border-[#e8edf5] px-3 py-4";

export const editorPanelTopFootClass =
  "editor-panel-top-foot flex w-full shrink-0 items-center";

export const editorSettingsPanelShellEmbeddedClass =
  "hidden h-full min-h-0 w-full flex-col gap-2 overflow-hidden lg:flex";

export const editorSettingsPanelShellClass =
  "hidden h-full min-h-0 flex-col overflow-hidden border-l border-[#e8edf5] bg-[#f8fafc] lg:flex !rounded-none !border-y-0 !border-r-0";

export const editorSettingsPanelShellLeftClass =
  "hidden h-full min-h-0 flex-col overflow-hidden border-r border-[#e8edf5] bg-[#f8fafc] lg:flex !rounded-none !border-y-0 !border-l-0";

export const editorSettingsPanelScrollClass = [
  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
  "[scrollbar-gutter:stable] [scrollbar-width:thin]",
  "[scrollbar-color:rgb(232_237_245)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1]",
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#94a3b8]",
].join(" ");

export const editorAccordionShellOpenClass =
  "overflow-hidden rounded-[1.1rem] border border-[#1877f2]/25 bg-white shadow-[0_8px_24px_rgba(24,119,242,0.1)] ring-1 ring-[#1877f2]/10 transition-[box-shadow,border-color] duration-200";

export const editorAccordionShellClosedClass =
  "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,background-color] duration-200 hover:border-[#1877f2]/20 hover:shadow-[0_8px_22px_rgba(24,119,242,0.08)]";

export const editorAccordionHeaderButtonClass =
  "flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors duration-200";

export const editorAccordionIconOpenClass =
  "flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white ring-1 ring-[#1877f2]/20 transition-[background-color] duration-200";

export const editorAccordionIconClosedClass =
  "flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/12 transition-[background-color,color] duration-200";

export const editorAccordionTitleClass =
  "block text-[0.8125rem] font-extrabold leading-tight tracking-tight text-[#07111f]";

export const editorAccordionHintClass =
  "mt-0.5 block truncate text-[0.65rem] leading-snug text-slate-500";

export const editorAccordionChevronOpenClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#1877f2]/15 transition-[background-color,color] duration-200";

export const editorAccordionChevronClosedClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-[background-color,color] duration-200";

export const editorAccordionBodyClass =
  "border-t border-[#eef2f7] bg-[#f8fafc]/50 px-3 pb-3 pt-2";

export const editorFieldIconChipClass =
  "flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#1877f2]/20 bg-[#1877f2] text-white";

export const editorFieldIconChipInlineClass =
  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#1877f2]/20 bg-[#1877f2] text-white sm:size-8 sm:rounded-xl";

export const editorFieldLabelClass =
  "text-xs font-bold tracking-tight text-[#07111f]";

export const editorFieldLabelInlineClass =
  "max-w-[5.5rem] truncate text-xs font-bold tracking-tight text-[#07111f] sm:max-w-[7.5rem]";

export const editorFieldLabelPlainClass =
  "mb-1 block text-xs font-semibold tracking-tight text-slate-600";

export const editorContentInputClass =
  "w-full rounded-xl border border-[#e8edf5] bg-white px-3.5 py-2.5 text-sm text-[#07111f] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 hover:border-[#1877f2]/30 hover:shadow-[0_2px_8px_rgba(24,119,242,0.06)] focus:border-[#1877f2]/45 focus:shadow-[0_0_0_3px_rgba(24,119,242,0.12)] focus:ring-0";

export const editorInlineInputClass = `${editorContentInputClass} min-h-10 min-w-0 flex-1 py-2 text-sm`;

export const editorSidebarBodyTextClass = "text-xs leading-relaxed text-slate-500";

export const editorSidebarBodyStrongClass = "font-bold text-[#07111f]";

export const editorSidebarPrimaryButtonClass =
  "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1877f2] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#166fe0] active:scale-[0.99]";

export const editorColorPickerShellClass =
  "mt-1.5 flex items-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-2.5 py-1.5 ring-1 ring-inset ring-white";

export const editorColorPickerBadgeClass =
  "shrink-0 rounded-md bg-[#1877f2] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm";

export const editorColorPickerDividerClass =
  "h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-[#e8edf5] to-transparent";

export const editorColorPickerSwatchClass =
  "group relative block size-7 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-white shadow-[0_1px_4px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-[#e8edf5] transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_2px_8px_rgba(24,119,242,0.14)] hover:ring-[#1877f2]/25";

export const editorColorPickerHexInputClass =
  "min-w-0 flex-1 border-0 bg-transparent py-0 font-mono text-[11px] outline-none transition-colors duration-200";

export const editorColorPickerResetClass =
  "shrink-0 rounded-md border border-[#e8edf5] bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm transition-[border-color,background-color,color] duration-200 hover:border-[#1877f2]/25 hover:bg-[#f4f8ff] hover:text-[#1877f2]";

export const editorSidebarPickerRowSelectedClass =
  "border-[#1877f2] bg-[#1877f2] text-white ring-1 ring-[#1877f2]/20";

export const editorSidebarPickerRowClass =
  "border-[#e8edf5] bg-white text-[#07111f] shadow-sm hover:border-[#1877f2]/25 hover:bg-[#f4f8ff]/60";

export const editorSidebarMediaFrameClass =
  "overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc] shadow-[inset_0_1px_3px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]";

export const editorSidebarSecondaryButtonClass =
  "inline-flex items-center gap-2 rounded-full border border-[#e8edf5] bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-[border-color,background-color,color] duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700";

export const editorSidebarUploadButtonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#1877f2] bg-[#1877f2] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#166fe0]";

export const editorSidebarSectionDividerClass = "border-t border-[#e8edf5]";

export const editorFunnelStepSelectedClass =
  "border-[#1877f2]/30 bg-[#f4f8ff] shadow-[0_6px_18px_rgba(24,119,242,0.1)] ring-1 ring-[#1877f2]/15";

export const editorFunnelStepIdleClass =
  "border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:border-[#1877f2]/20 hover:bg-[#fafcff] hover:shadow-[0_6px_16px_rgba(24,119,242,0.07)]";

export const editorFunnelStepIconSelectedClass =
  "bg-[#1877f2] text-white ring-1 ring-[#1877f2]/25";

export const editorFunnelStepIconIdleClass =
  "bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/12";

export const editorFunnelRailStepSelectedClass =
  "bg-[#1877f2]/10";

export const editorFunnelRailStepIdleClass =
  "bg-transparent hover:bg-[#f4f8ff]/70";

export const editorFunnelSignupGradient =
  "linear-gradient(90deg, #1877f2 0%, #833aba 55%, #ea5a8f 100%)";

export const editorFunnelSignupGradientVertical =
  "linear-gradient(180deg, #1877f2 0%, #833aba 55%, #ea5a8f 100%)";

export const editorFunnelSignupGradientTrailIdle =
  "linear-gradient(180deg, rgba(24,119,242,0.32) 0%, rgba(131,58,186,0.18) 55%, #e8edf5 100%)";

export const editorFunnelStepIconRailLeftClass = "left-[1.65rem]";

export const editorSidebarCaptionClass = "mb-2 text-xs font-semibold text-slate-600";

export const editorSidebarCheckboxLabelClass =
  "flex cursor-pointer items-center gap-2 text-xs text-slate-600 transition-colors duration-200 hover:text-[#07111f]";

export const editorSidebarFormFieldRowClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1 text-left text-[#07111f] transition-colors duration-200 hover:bg-[#f4f8ff]/70";

export const editorSidebarFormFieldIconOnClass =
  "border-[#1877f2] bg-[#1877f2] text-white";

export const editorSidebarFormFieldIconOffClass =
  "border-[#e8edf5] bg-white text-slate-400";
