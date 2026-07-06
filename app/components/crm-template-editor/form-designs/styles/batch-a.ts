import type { FormDesign, FormDesignStyle } from "../types";

export const formDesignStylesBatchA: Partial<Record<FormDesign, FormDesignStyle>> = {
  stacked_input_form: {
    shellClass: "",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-500",
    fieldClass:
      "h-10 w-full rounded-lg border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "card",
  },
  two_column_form: {
    shellClass: "",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-600",
    fieldClass:
      "h-10 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 shadow-sm",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "grid grid-cols-1 gap-4",
    splitVariant: null,
    swatchKind: "card",
  },
  floating_label_form: {
    shellClass:
      "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.04]",
    labelClass:
      "relative -mb-2 ml-2 block w-fit bg-white px-1 text-[0.6rem] font-semibold text-zinc-500",
    fieldClass:
      "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 pt-3 shadow-sm",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "card",
  },
  underline_input_form: {
    shellClass: "border-b border-zinc-200/90 pb-2 pt-1",
    labelClass:
      "mb-1 block text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-zinc-400",
    fieldClass:
      "h-10 w-full rounded-none border-0 border-b-2 border-zinc-300 bg-transparent shadow-none",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "underline",
  },
  outlined_material_form: {
    shellClass:
      "rounded-xl border border-zinc-300/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.04]",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-600",
    fieldClass:
      "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "card",
  },
  soft_shadow_form: {
    shellClass:
      "rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-950/[0.05]",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-500",
    fieldClass:
      "h-10 w-full rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-3 shadow-inner",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "rounded",
  },
  glassmorphism_form: {
    shellClass:
      "rounded-2xl border border-white/50 bg-white/40 p-5 shadow-lg shadow-zinc-900/10 ring-1 ring-white/60 backdrop-blur-md",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-600",
    fieldClass:
      "h-10 w-full rounded-xl border border-white/40 bg-white/50 px-3 shadow-sm backdrop-blur-sm",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "glass",
  },
  neumorphism_form: {
    shellClass: "rounded-2xl bg-zinc-100/90 p-5 shadow-[8px_8px_16px_#d4d4d8,-8px_-8px_16px_#ffffff]",
    labelClass: "mb-1.5 block text-[0.65rem] font-semibold text-zinc-500",
    fieldClass:
      "h-10 w-full rounded-xl border-0 bg-zinc-100 px-3 shadow-[inset_2px_2px_6px_#d4d4d8,inset_-2px_-2px_6px_#ffffff]",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "rounded",
  },
  pill_input_form: {
    shellClass: "rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm",
    labelClass: "mb-1.5 block text-[0.65rem] font-medium text-zinc-500",
    fieldClass:
      "h-11 w-full rounded-full border border-zinc-200 bg-zinc-50/80 px-4 shadow-inner",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-4",
    splitVariant: null,
    swatchKind: "pill",
  },
  sharp_edge_form: {
    shellClass: "border border-zinc-800 bg-white p-5 shadow-md",
    labelClass: "mb-1 block text-[0.65rem] font-bold uppercase tracking-wide text-zinc-800",
    fieldClass:
      "h-10 w-full rounded-none border-2 border-zinc-900 bg-white px-2 shadow-none",
    rowClass: "min-w-0 text-left",
    fieldsContainerClass: "space-y-3",
    splitVariant: null,
    swatchKind: "card",
  },
};
