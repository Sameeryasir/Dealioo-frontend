import { formDesignStylesBatchA } from "@/app/components/crm-template-editor/form-designs/styles/batch-a";
import { formDesignStylesBatchB } from "@/app/components/crm-template-editor/form-designs/styles/batch-b";
import { formDesignStylesBatchC } from "@/app/components/crm-template-editor/form-designs/styles/batch-c";
import { formDesignStylesBatchD } from "@/app/components/crm-template-editor/form-designs/styles/batch-d";
import type { FormDesign, FormDesignStyle } from "@/app/components/crm-template-editor/form-designs/types";


const FORM_DESIGN_STYLES_MERGED = {
  ...formDesignStylesBatchA,
  ...formDesignStylesBatchB,
  ...formDesignStylesBatchC,
  ...formDesignStylesBatchD,
};

export const FORM_DESIGN_STYLES =
  FORM_DESIGN_STYLES_MERGED as Record<FormDesign, FormDesignStyle>;

export function getFormDesignStyle(design: FormDesign): FormDesignStyle {
  return FORM_DESIGN_STYLES[design];
}

export const SPLIT_FORM_DESIGNS = new Set<FormDesign>(
  (Object.keys(FORM_DESIGN_STYLES) as FormDesign[]).filter(
    (id) => FORM_DESIGN_STYLES[id].splitVariant !== null,
  ),
);

export function formDesignUsesSplitLayout(design: FormDesign): boolean {
  return getFormDesignStyle(design).splitVariant !== null;
}

export const formDesignHidesTopHero = formDesignUsesSplitLayout;

export function getFormFieldStyles(design: FormDesign): {
  label: string;
  field: string;
} {
  const s = getFormDesignStyle(design);
  return { label: s.labelClass, field: s.fieldClass };
}

export function getNonSplitShellClass(design: FormDesign): string {
  return getFormDesignStyle(design).shellClass;
}

export function getSplitShellExtraClass(design: FormDesign): string {
  const v = getFormDesignStyle(design).splitVariant;
  if (v === "shop") return "ring-1 ring-slate-200/50";
  if (v === "gradient") return "ring-1 ring-fuchsia-200/50";
  if (v === "warm") return "ring-1 ring-amber-900/10";
  return "";
}

export function getSplitImageColumnClass(design: FormDesign): string {
  const v = getFormDesignStyle(design).splitVariant;
  const neutral =
    "relative min-h-[140px] overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-100";
  if (v === "neutral") return `${neutral}`;
  if (v === "gradient") {
    return "relative min-h-[140px] overflow-hidden bg-gradient-to-br from-fuchsia-600/90 via-rose-500/80 to-amber-400/90";
  }
  if (v === "warm") {
    return "relative min-h-[140px] overflow-hidden bg-gradient-to-br from-amber-900/90 to-zinc-900";
  }
  if (v === "shop") {
    return `${neutral}`;
  }
  return neutral;
}
