/**
 * Visual tokens for the funnel editor right sidebar (settings / content panel).
 * Premium light surfaces, aligned with the left funnel steps panel (white + zinc).
 * Layout classes (padding, gap, sizes) stay in components.
 */

export const editorSidebarRootClass =
  "flex w-full flex-col gap-3 bg-transparent p-3 [&_button]:cursor-pointer [&_select]:cursor-pointer";

export const editorSettingsPanelShellClass =
  "hidden h-full min-h-0 flex-col overflow-hidden border-l border-zinc-200/90 bg-[#f8f9fb] bg-gradient-to-b from-[#fafbfc] via-white to-zinc-50/90 lg:flex !rounded-none !border-y-0 !border-r-0 shadow-[-4px_0_24px_rgba(15,23,42,0.04)]";

export const editorSettingsPanelScrollClass = [
  "min-h-0 max-h-full flex-1 overflow-y-auto overscroll-contain",
  "[scrollbar-gutter:stable] [scrollbar-width:thin]",
  "[scrollbar-color:rgb(212_212_216)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300/90",
  "[&::-webkit-scrollbar-thumb:hover]:bg-zinc-400/90",
].join(" ");

export const editorAccordionShellOpenClass =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.07),0_1px_0_rgba(255,255,255,0.8)_inset] ring-1 ring-zinc-950/[0.04] transition-[box-shadow,border-color] duration-200";

export const editorAccordionShellClosedClass =
  "overflow-hidden rounded-xl border border-zinc-200/80 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,background-color] duration-200 hover:border-zinc-300/90 hover:bg-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]";

export const editorAccordionHeaderButtonClass =
  "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-200";

export const editorAccordionIconOpenClass =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-[0_2px_8px_rgba(15,23,42,0.18)] ring-1 ring-zinc-900/10 transition-[background-color,box-shadow] duration-200";

export const editorAccordionIconClosedClass =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-950/[0.04] transition-[background-color,color] duration-200";

export const editorAccordionTitleClass =
  "block text-[0.8125rem] font-semibold leading-tight tracking-tight text-zinc-900";

export const editorAccordionHintClass =
  "mt-0.5 block truncate text-[0.65rem] leading-snug text-zinc-500";

export const editorAccordionChevronOpenClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-950/[0.05] transition-[background-color,color] duration-200";

export const editorAccordionChevronClosedClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-[background-color,color] duration-200";

export const editorAccordionBodyClass =
  "border-t border-zinc-100 bg-gradient-to-b from-zinc-50/50 to-white px-3.5 pb-4 pt-3";

export const editorFieldIconChipClass =
  "flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-900/90 bg-zinc-900 text-white shadow-[0_2px_6px_rgba(15,23,42,0.14)] ring-1 ring-white/10";

export const editorFieldIconChipInlineClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-900/90 bg-zinc-900 text-white shadow-[0_2px_6px_rgba(15,23,42,0.14)] ring-1 ring-white/10 sm:size-9 sm:rounded-xl";

export const editorFieldLabelClass =
  "text-xs font-semibold tracking-tight text-zinc-800";

export const editorFieldLabelInlineClass =
  "max-w-[5.5rem] truncate text-xs font-semibold tracking-tight text-zinc-800 sm:max-w-[7.5rem]";

export const editorFieldLabelPlainClass =
  "mb-1 block text-xs font-medium tracking-tight text-zinc-600";

export const editorContentInputClass =
  "w-full rounded-xl border border-zinc-200/95 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 hover:border-zinc-300 hover:shadow-[0_2px_6px_rgba(15,23,42,0.05)] focus:border-zinc-400 focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08),0_2px_8px_rgba(15,23,42,0.06)] focus:ring-0";

export const editorInlineInputClass = `${editorContentInputClass} min-h-10 min-w-0 flex-1 py-2 text-sm`;

export const editorSidebarBodyTextClass = "text-xs leading-relaxed text-zinc-500";

export const editorSidebarBodyStrongClass = "font-semibold text-zinc-700";

export const editorSidebarPrimaryButtonClass =
  "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(15,23,42,0.2)] transition-[background,box-shadow,transform] duration-200 hover:bg-zinc-800 hover:shadow-[0_4px_14px_rgba(15,23,42,0.22)] active:scale-[0.99]";

export const editorColorPickerShellClass =
  "mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50/80 px-2.5 py-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ring-1 ring-inset ring-white";

export const editorColorPickerBadgeClass =
  "shrink-0 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm";

export const editorColorPickerDividerClass =
  "h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-200 to-transparent";

export const editorColorPickerSwatchClass =
  "group relative block size-7 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-white shadow-[0_1px_4px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-zinc-200/90 transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_2px_8px_rgba(15,23,42,0.14)] hover:ring-zinc-300";

export const editorColorPickerHexInputClass =
  "min-w-0 flex-1 border-0 bg-transparent py-0 font-mono text-[11px] outline-none transition-colors duration-200";

export const editorColorPickerResetClass =
  "shrink-0 rounded-md border border-zinc-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600 shadow-sm transition-[border-color,background-color,color] duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900";

/** Picker / list rows inside accordions */
export const editorSidebarPickerRowSelectedClass =
  "border-zinc-900 bg-zinc-900 text-white shadow-md ring-1 ring-zinc-900/10";

export const editorSidebarPickerRowClass =
  "border-zinc-200/90 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/90";

export const editorSidebarMediaFrameClass =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-50 shadow-[inset_0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.03]";

export const editorSidebarSecondaryButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800 shadow-sm transition-[border-color,background-color,color] duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-800";

export const editorSidebarUploadButtonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background,box-shadow] duration-200 hover:bg-zinc-800";

export const editorSidebarSectionDividerClass = "border-t border-zinc-200/80";

export const editorSidebarCaptionClass = "mb-2 text-xs font-medium text-zinc-600";

export const editorSidebarCheckboxLabelClass =
  "flex cursor-pointer items-center gap-2 text-xs text-zinc-600 transition-colors duration-200 hover:text-zinc-800";

export const editorSidebarFormFieldRowClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1 text-left text-zinc-800 transition-colors duration-200 hover:bg-zinc-50";

export const editorSidebarFormFieldIconOnClass =
  "border-zinc-900 bg-zinc-900 text-white";

export const editorSidebarFormFieldIconOffClass =
  "border-zinc-200/90 bg-white text-zinc-400";
