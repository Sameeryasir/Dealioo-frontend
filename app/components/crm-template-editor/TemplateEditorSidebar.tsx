"use client";
import { type ChangeEvent, useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  MousePointerClick,
  Palette,
  Phone,
  Search,
  Trash2,
  Upload,
  User,
  UserPlus,
  UserRound,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CHECKOUT_TEMPLATE_OPTIONS,
  CheckoutTemplateType,
  normalizeCheckoutTemplate,
} from "@/app/components/crm-template-editor/checkout-template-types";
import { ContentTextColorPicker } from "@/app/components/crm-template-editor/ContentTextColorPicker";
import {
  editorSidebarPickerPanelClass,
  editorSidebarPickerScrollClass,
} from "@/app/components/crm-template-editor/editor-layout";
import {
  editorAccordionBodyClass,
  editorAccordionChevronClosedClass,
  editorAccordionChevronOpenClass,
  editorAccordionHeaderButtonClass,
  editorAccordionHintClass,
  editorAccordionTitleClass,
  editorContentBlockCardClass,
  editorContentInputClass,
  editorFieldIconChipClass,
  editorFieldIconChipInlineClass,
  editorFieldLabelClass,
  editorFieldLabelInlineClass,
  editorFieldLabelPlainClass,
  editorSidebarBodyStrongClass,
  editorSidebarBodyTextClass,
  editorSidebarCaptionClass,
  editorSidebarFormFieldIconOffClass,
  editorSidebarFormFieldIconOnClass,
  editorSidebarFormFieldRowClass,
  editorSidebarMediaFrameClass,
  editorSidebarPickerRowClass,
  editorSidebarPickerRowSelectedClass,
  editorSidebarPrimaryButtonClass,
  editorSidebarRootClass,
  editorSidebarSecondaryButtonClass,
  editorSidebarUploadButtonClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";
import { formDesignUsesSplitLayout } from "@/app/components/crm-template-editor/form-design-registry";
import { FormDesignSwatch } from "@/app/components/crm-template-editor/form-designs/FormDesignSwatch";
import { CheckoutTemplatePickerOption } from "@/app/components/crm-template-editor/CheckoutTemplatePickerOption";
import { HeroDesignPickerOption } from "@/app/components/crm-template-editor/hero-designs/HeroDesignPickerOption";
import { getHeroDesignStyle, normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import {
  LANDING_SECTION_LABELS,
  landingSectionOrder,
} from "@/app/components/crm-template-editor/landing-sections";
import { SortableSectionList } from "@/app/components/crm-template-editor/SortableSectionList";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { uploadCampaignImage } from "@/app/services/campaign/upload-campaign-image";
import {
  FORM_DESIGN_OPTIONS,
  FORM_FIELD_OPTIONS,
  HERO_DESIGN_OPTIONS,
} from "@/app/components/crm-template-editor/template-data";
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  imageScaleStyle,
  normalizeImageScale,
} from "@/app/components/crm-template-editor/template-image";
import type {
  FormDesign,
  FormFieldId,
  HeroDesign,
  LandingTemplatePage,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePagePatch,
} from "@/app/components/crm-template-editor/template-types";

type SectionId =
  | "templates"
  | "sections"
  | "content"
  | "media"
  | "form"
  | "checkout-templates"
  | "style";

const FORM_FIELD_ICONS: Record<FormFieldId, LucideIcon> = {
  firstName: User,
  lastName: UserRound,
  email: Mail,
  phone: Phone,
};

const SECTION_ICONS: Partial<Record<SectionId, LucideIcon>> = {
  templates: LayoutTemplate,
  sections: Box,
  content: FileText,
  media: ImageIcon,
  form: UserPlus,
  "checkout-templates": CreditCard,
  style: Search,
};

const SECTION_ICON_COLORS: Record<
  SectionId,
  { softBg: string; softFg: string; solidBg: string }
> = {
  templates: { softBg: "#f3e8ff", softFg: "#7c3aed", solidBg: "#7c3aed" },
  content: { softBg: "#e8f1ff", softFg: "#1877f2", solidBg: "#1877f2" },
  media: { softBg: "#dcfce7", softFg: "#16a34a", solidBg: "#16a34a" },
  sections: { softBg: "#ffedd5", softFg: "#ea580c", solidBg: "#ea580c" },
  style: { softBg: "#fce7f3", softFg: "#db2777", solidBg: "#db2777" },
  form: { softBg: "#e0f2fe", softFg: "#0284c7", solidBg: "#0284c7" },
  "checkout-templates": {
    softBg: "#eef2ff",
    softFg: "#4f46e5",
    solidBg: "#4f46e5",
  },
};

const SECTION_TONES: Record<
  SectionId,
  { openShell: string; closedShell: string }
> = {
  templates: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#c4b5fd] bg-white shadow-[0_8px_22px_rgba(124,58,237,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#ddd6fe]",
  },
  content: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#93c5fd] bg-white shadow-[0_8px_22px_rgba(24,119,242,0.08)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#dbeafe]",
  },
  media: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#86efac] bg-white shadow-[0_8px_22px_rgba(22,163,74,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#bbf7d0]",
  },
  style: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#f9a8d4] bg-white shadow-[0_8px_22px_rgba(219,39,119,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#fbcfe8]",
  },
  sections: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#fdba74] bg-white shadow-[0_8px_22px_rgba(234,88,12,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#fed7aa]",
  },
  form: {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#7dd3fc] bg-white shadow-[0_8px_22px_rgba(2,132,199,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#bae6fd]",
  },
  "checkout-templates": {
    openShell:
      "overflow-hidden rounded-[1.1rem] border border-[#c7d2fe] bg-white shadow-[0_8px_22px_rgba(79,70,229,0.1)] transition-colors duration-150",
    closedShell:
      "overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-[#e0e7ff]",
  },
};

function SectionIconChip({
  id,
  open,
  Icon,
}: {
  id: SectionId;
  open: boolean;
  Icon: LucideIcon;
}) {
  const colors = SECTION_ICON_COLORS[id];
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-[0.7rem]"
      style={{
        backgroundColor: open ? colors.solidBg : colors.softBg,
        color: open ? "#ffffff" : colors.softFg,
        boxShadow: open ? `0 6px 14px ${colors.solidBg}40` : undefined,
      }}
      aria-hidden
    >
      <Icon className="size-4" strokeWidth={2.25} />
    </span>
  );
}

const STACKED_SECTION_LABELS: Partial<
  Record<SectionId, { title: string; hint: string }>
> = {
  templates: { title: "Template", hint: "Starter template selected" },
  content: { title: "Content", hint: "Edit text, colors & styles" },
  media: { title: "Media", hint: "Images, videos & icons" },
  sections: { title: "Sections", hint: "Manage page sections" },
  style: { title: "SEO", hint: "Search listing & meta" },
};

const STACKED_SECTION_ORDER: Partial<Record<SectionId, string>> = {
  templates: "order-1",
  content: "order-2",
  media: "order-3",
  sections: "order-4",
  style: "order-5",
};

const SECTION_HINTS: Partial<Record<SectionId, string>> = {
  templates: "Starter template selected",
  sections: "Manage page sections",
  content: "Edit text, colors & styles",
  media: "Images, videos & icons",
  form: "Fields & form layout",
  "checkout-templates": "Layout & display options",
  style: "Search listing & meta",
};

type ContentFocus =
  | "heading"
  | "subheading"
  | "body"
  | "button"
  | "global"
  | "navBack"
  | "navNext"
  | null;

const CONTENT_ITEM_COLORS = {
  heading: { softBg: "#e8f1ff", softFg: "#1877f2" },
  subheading: { softBg: "#f3e8ff", softFg: "#7c3aed" },
  body: { softBg: "#cffafe", softFg: "#0891b2" },
  button: { softBg: "#ffedd5", softFg: "#ea580c" },
  global: { softBg: "#eef2ff", softFg: "#4f46e5" },
  navBack: { softBg: "#f1f5f9", softFg: "#475569" },
  navNext: { softBg: "#dcfce7", softFg: "#16a34a" },
} as const;

function previewText(value: string, empty = "Add text…") {
  const trimmed = value.trim();
  if (!trimmed) return empty;
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

function ContentRailItem({
  title,
  preview,
  badge = "1",
  softBg,
  softFg,
  icon,
  onClick,
}: {
  title: string;
  preview: string;
  badge?: string;
  softBg: string;
  softFg: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className="relative flex w-full items-center gap-2.5 rounded-xl px-0.5 py-2 text-left transition-colors hover:bg-[#f8fafc]"
      >
        <span
          className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-[#bfdbfe]"
          aria-hidden
        >
          <span
            className="flex size-7 items-center justify-center rounded-full text-[0.62rem] font-extrabold"
            style={{ backgroundColor: softBg, color: softFg }}
          >
            {icon}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.8rem] font-bold leading-tight text-[#0e182b]">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[0.7rem] leading-snug text-slate-500">
            {preview}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-[#e8f1ff] text-[0.65rem] font-bold text-[#1877f2]">
            {badge}
          </span>
          <ChevronRight
            className="size-4 text-slate-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      </button>
    </li>
  );
}

function ContentFocusEditor({
  label,
  hint,
  softBg,
  softFg,
  icon,
  onBack,
  children,
}: {
  label: string;
  hint: string;
  softBg: string;
  softFg: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-500 transition-colors hover:border-[#bfdbfe] hover:bg-[#f8fafc] hover:text-[#1877f2]"
          aria-label={`Back to content list`}
        >
          <ChevronLeft className="size-3.5" strokeWidth={2.25} />
        </button>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-[0.55rem] text-[0.62rem] font-extrabold"
          style={{ backgroundColor: softBg, color: softFg }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.82rem] font-extrabold leading-tight text-[#0e182b]">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[0.68rem] leading-snug text-slate-500">
            {hint}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

const contentFocusInputClass =
  "w-full rounded-[0.7rem] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[0.8rem] font-medium leading-snug text-[#0e182b] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-slate-400 hover:border-[#cbd5e1] hover:bg-white focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15 focus:ring-offset-0";

const accordionEase = [0.22, 1, 0.36, 1] as const;

const accordionPanelOpen = {
  duration: 0.28,
  delay: 0.04,
  ease: accordionEase,
} as const;
const accordionPanelClose = {
  duration: 0.22,
  delay: 0.02,
  ease: accordionEase,
} as const;
const accordionChevronTransition = {
  duration: 0.22,
  ease: accordionEase,
} as const;

function UpgradePlanNavRow({
  id,
  title,
  hint,
}: {
  id: SectionId;
  title: string;
  hint?: string;
}) {
  const Icon = SECTION_ICONS[id] ?? FileText;
  const tone = SECTION_TONES[id];
  const subtitle = hint ?? SECTION_HINTS[id];

  return (
    <motion.div className={tone.closedShell}>
      <a
        href="/dashboard/upgrade-plan"
        className={editorAccordionHeaderButtonClass}
        title={`${title} — Upgrade plan to unlock`}
      >
        <SectionIconChip id={id} open={false} Icon={Icon} />
        <span className="min-w-0 flex-1">
          <span className={editorAccordionTitleClass}>{title}</span>
          {subtitle ? (
            <span className={editorAccordionHintClass}>{subtitle}</span>
          ) : null}
        </span>
        <span className={editorAccordionChevronClosedClass}>
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
      </a>
    </motion.div>
  );
}

function AccordionSection({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
  variant = "card",
  orderClassName,
}: {
  id: SectionId;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
  variant?: "card" | "stack";
  orderClassName?: string;
}) {
  const Icon = SECTION_ICONS[id] ?? FileText;
  const tone = SECTION_TONES[id];
  const subtitle = hint ?? SECTION_HINTS[id];
  const accent = SECTION_ICON_COLORS[id].softFg;

  if (variant === "stack") {
    return (
      <div
        className={`flex w-full flex-col overflow-hidden rounded-[1.1rem] border bg-white transition-colors duration-150 ${
          open
            ? "editor-settings-card--open shrink-0"
            : "editor-settings-card--closed shrink-0 border-[#e8edf5] hover:border-[#dbeafe]"
        } ${orderClassName ?? ""}`}
        style={
          open
            ? {
                borderColor: accent,
                boxShadow: `0 8px 22px ${accent}22`,
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={() => onToggle(id)}
          title={subtitle ? `${title} — ${subtitle}` : title}
          className="editor-settings-stack-trigger flex w-full shrink-0 items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50/60"
        >
          <SectionIconChip id={id} open={open} Icon={Icon} />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.88rem] font-extrabold leading-tight text-[#0e182b]">
              {title}
            </span>
            {subtitle ? (
              <span className="mt-0.5 block truncate text-[0.72rem] text-slate-500">
                {subtitle}
              </span>
            ) : null}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={accordionChevronTransition}
            className="flex size-6 shrink-0 items-center justify-center text-slate-400"
            style={open ? { color: accent } : undefined}
          >
            <ChevronDown className="size-4" strokeWidth={2.25} aria-hidden />
          </motion.span>
        </button>
        {open ? (
          <div className="editor-settings-stack-panel border-t border-[#eef2f7] bg-white px-3.5 pb-3.5 pt-3">
            <div className="space-y-3">{children}</div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.div
      className={`${open ? tone.openShell : tone.closedShell} ${orderClassName ?? ""}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={editorAccordionHeaderButtonClass}
      >
        <SectionIconChip id={id} open={open} Icon={Icon} />
        <span className="min-w-0 flex-1">
          <span className={editorAccordionTitleClass}>{title}</span>
          {subtitle ? (
            <span className={editorAccordionHintClass}>{subtitle}</span>
          ) : null}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={accordionChevronTransition}
          className={
            open ? editorAccordionChevronOpenClass : editorAccordionChevronClosedClass
          }
          style={open ? { color: accent } : undefined}
        >
          <ChevronDown className="size-4" strokeWidth={2.25} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`panel-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{
              height: 0,
              opacity: 0,
              transition: accordionPanelClose,
            }}
            transition={accordionPanelOpen}
            className="overflow-hidden"
          >
            <div className={editorAccordionBodyClass}>
              <div className="space-y-3">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({
  label,
  icon,
  as = "label",
  layout = "stacked",
  appearance = "default",
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  as?: "label" | "div";
  layout?: "stacked" | "inline";
  appearance?: "default" | "block";
  children: React.ReactNode;
}) {
  const groupLabelId = useId();

  if (icon) {
    const chipClass = editorFieldIconChipInlineClass;

    if (layout === "inline") {
      const left = (
        <span className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <span className={chipClass} aria-hidden>
            {icon}
          </span>
          <span
            id={as === "div" ? groupLabelId : undefined}
            className={editorFieldLabelInlineClass}
            title={label}
          >
            {label}
          </span>
        </span>
      );
      const right = (
        <span className="min-w-0 flex-1">{children}</span>
      );

      if (as === "div") {
        return (
          <div
            className="flex w-full items-center gap-2.5 sm:gap-3"
            role="group"
            aria-labelledby={groupLabelId}
          >
            {left}
            {right}
          </div>
        );
      }

      return (
        <label className="flex w-full cursor-text items-center gap-2.5 sm:gap-3">
          {left}
          {right}
        </label>
      );
    }

    const labelRow = (
      <span className="mb-2 flex items-center gap-2.5 pr-6">
        <span className={editorFieldIconChipClass} aria-hidden>
          {icon}
        </span>
        <span
          id={as === "div" ? groupLabelId : undefined}
          className={editorFieldLabelClass}
        >
          {label}
        </span>
      </span>
    );

    const grip =
      appearance === "block" ? (
        <span
          className="absolute right-2.5 top-2.5 text-slate-300"
          aria-hidden
          title="Drag to reorder"
        >
          <GripVertical className="size-4" strokeWidth={2} />
        </span>
      ) : null;

    if (as === "div") {
      return (
        <div
          className={appearance === "block" ? editorContentBlockCardClass : "block"}
          role="group"
          aria-labelledby={groupLabelId}
        >
          {grip}
          {labelRow}
          {children}
        </div>
      );
    }

    return (
      <label
        className={appearance === "block" ? editorContentBlockCardClass : "block"}
      >
        {grip}
        {labelRow}
        {children}
      </label>
    );
  }

  return (
    <label className="block">
      <span className={editorFieldLabelPlainClass}>{label}</span>
      {children}
    </label>
  );
}

export function TemplateEditorSidebar({
  page,
  onChange,
  onBrowseTemplates,
  stackedLayout = false,
  stackFillHeight = false,
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
  onBrowseTemplates?: () => void;
  stackedLayout?: boolean;
  stackFillHeight?: boolean;
}) {
  const mediaFileId = useId();
  const [openSection, setOpenSection] = useState<SectionId | null>("content");
  const [contentFocus, setContentFocus] = useState<ContentFocus>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const heroImageSrc = resolveUploadImageUrl(page.imageUrl);

  useEffect(() => {
    setOpenSection("content");
    setContentFocus(null);
  }, [page.id]);

  const toggle = useCallback((id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    if (openSection !== "content") setContentFocus(null);
  }, [openSection]);

  const isOpen = useCallback(
    (id: SectionId) => openSection === id,
    [openSection],
  );

  const signup = page.id === "signup" ? (page as SignUpTemplatePage) : null;
  const payment = page.id === "payment" ? (page as PaymentTemplatePage) : null;
  const showLandingHeroEditor = page.id === "landing";
  const landingPage =
    page.id === "landing" ? (page as LandingTemplatePage) : null;
  const activeHeroDesign = normalizeHeroDesign(landingPage?.heroDesign);

  const onImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setImageUploadError(null);
    setImageUploading(true);
    try {
      const { imageUrl } = await uploadCampaignImage(file);
      onChange({ imageUrl });
    } catch (err) {
      setImageUploadError(
        err instanceof Error ? err.message : "Could not upload image.",
      );
    } finally {
      setImageUploading(false);
    }
  };

  const toggleFormField = (fieldId: FormFieldId) => {
    if (!signup) return;
    const set = new Set(signup.formFieldIds);
    if (set.has(fieldId)) {
      if (set.size <= 1) return;
      set.delete(fieldId);
    } else {
      set.add(fieldId);
    }
    onChange({ formFieldIds: Array.from(set) });
  };

  const accordionVariant = stackedLayout ? "stack" : "card";
  const sectionLabel = (id: SectionId, defaultTitle: string) =>
    STACKED_SECTION_LABELS[id]?.title ?? defaultTitle;
  const sectionHint = (id: SectionId) =>
    stackedLayout
      ? STACKED_SECTION_LABELS[id]?.hint
      : SECTION_HINTS[id];
  const sectionOrder = (id: SectionId) =>
    stackedLayout ? STACKED_SECTION_ORDER[id] : undefined;

  const heroDesignPicker = (
    <div className={editorSidebarPickerPanelClass}>
      <div className={editorSidebarPickerScrollClass}>
        <div className="grid grid-cols-1 gap-2 pb-1">
          {HERO_DESIGN_OPTIONS.map((opt) => {
            const on = activeHeroDesign === opt.value;
            const tokens = getHeroDesignStyle(opt.value);
            return (
              <HeroDesignPickerOption
                key={opt.value}
                label={opt.label}
                description={opt.description}
                selected={on}
                style={tokens}
                onSelect={() =>
                  onChange({ heroDesign: opt.value as HeroDesign })
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={
        stackedLayout && stackFillHeight
          ? "editor-settings-stack editor-settings-stack--embedded w-full flex flex-col gap-1 px-0.5 py-1"
          : stackedLayout
            ? "flex w-full flex-col gap-1.5 px-0.5 py-0.5"
            : editorSidebarRootClass
      }
    >
        {showLandingHeroEditor ? (
          <>
            <AccordionSection
              id="templates"
              title={sectionLabel("templates", "Template")}
              hint={sectionHint("templates")}
              open={isOpen("templates")}
              onToggle={toggle}
              variant={accordionVariant}
              orderClassName={sectionOrder("templates")}
            >
              <p className={editorSidebarBodyTextClass}>
                <strong className={editorSidebarBodyStrongClass}>Page design</strong>{" "}
                sets colors, hero, layout, form & checkout. Use{" "}
                <strong className={editorSidebarBodyStrongClass}>Starter copy</strong>{" "}
                in Templates for headline & body text only.
              </p>
              <button
                type="button"
                onClick={onBrowseTemplates}
                className={editorSidebarPrimaryButtonClass}
              >
                <LayoutTemplate className="size-3.5" aria-hidden />
                Browse templates
              </button>
            </AccordionSection>

            <AccordionSection
              id="content"
              title={sectionLabel("content", "Content")}
              hint={sectionHint("content")}
              open={isOpen("content")}
              onToggle={toggle}
              variant={accordionVariant}
              orderClassName={sectionOrder("content")}
            >
              {contentFocus === null ? (
                <div className="space-y-1">
                  <ul className="relative m-0 list-none space-y-0.5 p-0">
                    <span
                      className="pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px bg-[#bfdbfe]"
                      aria-hidden
                    />
                    <ContentRailItem
                      title="Heading"
                      preview={previewText(page.heading)}
                      softBg={CONTENT_ITEM_COLORS.heading.softBg}
                      softFg={CONTENT_ITEM_COLORS.heading.softFg}
                      icon={
                        <span className="text-[0.62rem] font-extrabold leading-none">
                          H1
                        </span>
                      }
                      onClick={() => setContentFocus("heading")}
                    />
                    <ContentRailItem
                      title="Subheading"
                      preview={previewText(page.subheading)}
                      softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                      softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                      icon={
                        <span className="text-[0.62rem] font-extrabold leading-none">
                          H2
                        </span>
                      }
                      onClick={() => setContentFocus("subheading")}
                    />
                    <ContentRailItem
                      title="Body text"
                      preview={previewText(page.body)}
                      softBg={CONTENT_ITEM_COLORS.body.softBg}
                      softFg={CONTENT_ITEM_COLORS.body.softFg}
                      icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                      onClick={() => setContentFocus("body")}
                    />
                    <ContentRailItem
                      title="Button text"
                      preview={previewText(page.buttonText, "Add button label…")}
                      softBg={CONTENT_ITEM_COLORS.button.softBg}
                      softFg={CONTENT_ITEM_COLORS.button.softFg}
                      icon={
                        <MousePointerClick
                          className="size-3.5"
                          strokeWidth={2.25}
                        />
                      }
                      onClick={() => setContentFocus("button")}
                    />
                  </ul>

                  <button
                    type="button"
                    onClick={() => setContentFocus("global")}
                    className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-2.5 py-2.5 text-left transition-colors hover:border-[#c7d2fe] hover:bg-white"
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-[0.65rem]"
                      style={{
                        backgroundColor: CONTENT_ITEM_COLORS.global.softBg,
                        color: CONTENT_ITEM_COLORS.global.softFg,
                      }}
                      aria-hidden
                    >
                      <Palette className="size-4" strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8rem] font-bold text-[#0e182b]">
                        Global styles
                      </span>
                      <span className="mt-0.5 block text-[0.7rem] text-slate-500">
                        Page design & colors
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-slate-400"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </button>
                </div>
              ) : null}

              {contentFocus === "heading" ? (
                <ContentFocusEditor
                  label="Heading"
                  hint="Main title shown at the top of the page"
                  softBg={CONTENT_ITEM_COLORS.heading.softBg}
                  softFg={CONTENT_ITEM_COLORS.heading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H1
                    </span>
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={page.heading}
                      onChange={(e) => onChange({ heading: e.target.value })}
                      className={contentFocusInputClass}
                      placeholder="Enter heading…"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text color
                    </span>
                    <ContentTextColorPicker
                      value={landingPage?.headingColor ?? ""}
                      onChange={(headingColor) => onChange({ headingColor })}
                    />
                  </div>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "subheading" ? (
                <ContentFocusEditor
                  label="Subheading"
                  hint="Supporting line under the main heading"
                  softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                  softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H2
                    </span>
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <textarea
                      value={page.subheading}
                      onChange={(e) => onChange({ subheading: e.target.value })}
                      rows={3}
                      className={`${contentFocusInputClass} min-h-[4.5rem] resize-y`}
                      placeholder="Enter subheading…"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text color
                    </span>
                    <ContentTextColorPicker
                      value={landingPage?.subheadingColor ?? ""}
                      onChange={(subheadingColor) =>
                        onChange({ subheadingColor })
                      }
                    />
                  </div>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "body" ? (
                <ContentFocusEditor
                  label="Body text"
                  hint="Main paragraph copy for this page"
                  softBg={CONTENT_ITEM_COLORS.body.softBg}
                  softFg={CONTENT_ITEM_COLORS.body.softFg}
                  icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <textarea
                      value={page.body}
                      onChange={(e) => onChange({ body: e.target.value })}
                      rows={4}
                      className={`${contentFocusInputClass} min-h-[6rem] resize-y`}
                      placeholder="Enter body text…"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text color
                    </span>
                    <ContentTextColorPicker
                      value={landingPage?.bodyColor ?? ""}
                      onChange={(bodyColor) => onChange({ bodyColor })}
                    />
                  </div>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "button" ? (
                <ContentFocusEditor
                  label="Button text"
                  hint="Label shown on the call-to-action button"
                  softBg={CONTENT_ITEM_COLORS.button.softBg}
                  softFg={CONTENT_ITEM_COLORS.button.softFg}
                  icon={
                    <MousePointerClick className="size-3.5" strokeWidth={2.25} />
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={page.buttonText}
                      onChange={(e) => onChange({ buttonText: e.target.value })}
                      className={contentFocusInputClass}
                      placeholder="Enter button label…"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text color
                    </span>
                    <ContentTextColorPicker
                      value={landingPage?.buttonTextColor ?? ""}
                      onChange={(buttonTextColor) =>
                        onChange({ buttonTextColor })
                      }
                      fallbackHex="#FFFFFF"
                    />
                  </div>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "global" ? (
                <ContentFocusEditor
                  label="Global styles"
                  hint="Page design presets for colors and layout"
                  softBg={CONTENT_ITEM_COLORS.global.softBg}
                  softFg={CONTENT_ITEM_COLORS.global.softFg}
                  icon={<Palette className="size-4" strokeWidth={2.25} />}
                  onBack={() => setContentFocus(null)}
                >
                  {heroDesignPicker}
                </ContentFocusEditor>
              ) : null}
            </AccordionSection>

            <AccordionSection
              id="media"
              title={sectionLabel("media", "Media")}
              hint={sectionHint("media")}
              open={isOpen("media")}
              onToggle={toggle}
              variant={accordionVariant}
              orderClassName={sectionOrder("media")}
            >
              <div className="space-y-4">
                <Field
                  as="div"
                  label="Hero image"
                  icon={<ImageIcon className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <div className={editorSidebarMediaFrameClass}>
                    {heroImageSrc ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={heroImageSrc}
                          alt=""
                          className="h-full w-full object-cover"
                          style={imageScaleStyle(page.imageScale)}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-4 text-center">
                        <span className="text-xs font-medium text-zinc-400">
                          No image yet
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      id={mediaFileId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onImageFile}
                    />
                    <label
                      htmlFor={mediaFileId}
                      className={`${editorSidebarUploadButtonClass}${imageUploading ? " pointer-events-none opacity-60" : ""}`}
                    >
                      <Upload
                        className="size-3.5 shrink-0 text-white"
                        strokeWidth={2}
                        aria-hidden
                      />
                      {imageUploading ? "Uploading…" : "Upload image"}
                    </label>
                    {page.imageUrl.trim() ? (
                      <button
                        type="button"
                        onClick={() => onChange({ imageUrl: "", imageScale: 1 })}
                        className={editorSidebarSecondaryButtonClass}
                      >
                        <Trash2
                          className="size-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Remove
                      </button>
                    ) : null}
                  </div>
                  {imageUploadError ? (
                    <p className="mt-2 text-xs text-red-600">{imageUploadError}</p>
                  ) : null}
                </Field>

                {page.imageUrl.trim() ? (
                  <Field
                    as="div"
                    label="Image zoom"
                    icon={<ZoomIn className="size-4 shrink-0" strokeWidth={2} />}
                  >
                    <div className="mb-2 flex justify-end">
                      <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-900 ring-1 ring-inset ring-zinc-950/[0.04]">
                        {Math.round(normalizeImageScale(page.imageScale) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      className="h-2 w-full cursor-pointer accent-black"
                      min={Math.round(IMAGE_SCALE_MIN * 100)}
                      max={Math.round(IMAGE_SCALE_MAX * 100)}
                      step={1}
                      value={Math.round(
                        normalizeImageScale(page.imageScale) * 100,
                      )}
                      onChange={(e) =>
                        onChange({ imageScale: Number(e.target.value) / 100 })
                      }
                      aria-label="Image zoom level"
                    />
                    <p className="mt-2 text-[0.65rem] leading-relaxed text-zinc-500">
                      Lower zoom shows more of the photo; higher zoom crops to
                      the center.
                    </p>
                  </Field>
                ) : null}
              </div>
            </AccordionSection>

            <AccordionSection
              id="sections"
              title={sectionLabel("sections", "Sections")}
              hint={sectionHint("sections")}
              open={isOpen("sections")}
              onToggle={toggle}
              variant={accordionVariant}
              orderClassName={sectionOrder("sections")}
            >
              <p className={`mb-3 ${editorSidebarBodyTextClass}`}>
                Drag to reorder blocks on the landing page.
              </p>
              {landingPage ? (
                <SortableSectionList
                  items={landingSectionOrder(landingPage)}
                  labels={LANDING_SECTION_LABELS}
                  onReorder={(contentSectionOrder) =>
                    onChange({ contentSectionOrder })
                  }
                />
              ) : null}
            </AccordionSection>
          </>
        ) : null}

        {payment ? (
          <>
            <AccordionSection
              id="content"
              title={sectionLabel("content", "Content")}
              hint={sectionHint("content") ?? "Edit text, colors & styles"}
              open={isOpen("content")}
              onToggle={toggle}
              variant={accordionVariant}
            >
              {contentFocus === null ? (
                <ul className="relative m-0 list-none space-y-0.5 p-0">
                  <span
                    className="pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px bg-[#bfdbfe]"
                    aria-hidden
                  />
                  <ContentRailItem
                    title="Payment details title"
                    preview={previewText(payment.heading)}
                    softBg={CONTENT_ITEM_COLORS.heading.softBg}
                    softFg={CONTENT_ITEM_COLORS.heading.softFg}
                    icon={
                      <span className="text-[0.62rem] font-extrabold leading-none">
                        H1
                      </span>
                    }
                    onClick={() => setContentFocus("heading")}
                  />
                  <ContentRailItem
                    title="Intro text"
                    preview={previewText(payment.subheading)}
                    softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                    softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                    icon={
                      <span className="text-[0.62rem] font-extrabold leading-none">
                        H2
                      </span>
                    }
                    onClick={() => setContentFocus("subheading")}
                  />
                  <ContentRailItem
                    title="Submit button text"
                    preview={previewText(payment.buttonText, "Add button label…")}
                    softBg={CONTENT_ITEM_COLORS.button.softBg}
                    softFg={CONTENT_ITEM_COLORS.button.softFg}
                    icon={
                      <MousePointerClick
                        className="size-3.5"
                        strokeWidth={2.25}
                      />
                    }
                    onClick={() => setContentFocus("button")}
                  />
                </ul>
              ) : null}

              {contentFocus === "heading" ? (
                <ContentFocusEditor
                  label="Payment details title"
                  hint="Title shown above the payment summary"
                  softBg={CONTENT_ITEM_COLORS.heading.softBg}
                  softFg={CONTENT_ITEM_COLORS.heading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H1
                    </span>
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={payment.heading}
                      onChange={(e) => onChange({ heading: e.target.value })}
                      className={contentFocusInputClass}
                      placeholder="Enter title…"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "subheading" ? (
                <ContentFocusEditor
                  label="Intro text"
                  hint="Short intro under the payment title"
                  softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                  softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H2
                    </span>
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <textarea
                      value={payment.subheading}
                      onChange={(e) => onChange({ subheading: e.target.value })}
                      rows={3}
                      className={`${contentFocusInputClass} min-h-[4.5rem] resize-y`}
                      placeholder="Enter intro text…"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "button" ? (
                <ContentFocusEditor
                  label="Submit button text"
                  hint="Label on the pay / submit button"
                  softBg={CONTENT_ITEM_COLORS.button.softBg}
                  softFg={CONTENT_ITEM_COLORS.button.softFg}
                  icon={
                    <MousePointerClick className="size-3.5" strokeWidth={2.25} />
                  }
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={payment.buttonText}
                      onChange={(e) => onChange({ buttonText: e.target.value })}
                      className={contentFocusInputClass}
                      placeholder="Enter button label…"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}
            </AccordionSection>

            <UpgradePlanNavRow
              id="checkout-templates"
              title="Checkout templates"
            />
            <UpgradePlanNavRow id="form" title="Form design" />
          </>
        ) : null}

        {page.id === "confirmation" ? (
          <AccordionSection
            id="content"
            title={sectionLabel("content", "Content")}
            hint={sectionHint("content") ?? "Edit text, colors & styles"}
            open={isOpen("content")}
            onToggle={toggle}
            variant={accordionVariant}
          >
            {contentFocus === null ? (
              <ul className="relative m-0 list-none space-y-0.5 p-0">
                <span
                  className="pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px bg-[#bfdbfe]"
                  aria-hidden
                />
                <ContentRailItem
                  title="Heading"
                  preview={previewText(page.heading)}
                  softBg={CONTENT_ITEM_COLORS.heading.softBg}
                  softFg={CONTENT_ITEM_COLORS.heading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H1
                    </span>
                  }
                  onClick={() => setContentFocus("heading")}
                />
                <ContentRailItem
                  title="Subheading"
                  preview={previewText(page.subheading)}
                  softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                  softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                  icon={
                    <span className="text-[0.62rem] font-extrabold leading-none">
                      H2
                    </span>
                  }
                  onClick={() => setContentFocus("subheading")}
                />
                <ContentRailItem
                  title="Body text"
                  preview={previewText(page.body)}
                  softBg={CONTENT_ITEM_COLORS.body.softBg}
                  softFg={CONTENT_ITEM_COLORS.body.softFg}
                  icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                  onClick={() => setContentFocus("body")}
                />
              </ul>
            ) : null}

            {contentFocus === "heading" ? (
              <ContentFocusEditor
                label="Heading"
                hint="Main title on the thank-you page"
                softBg={CONTENT_ITEM_COLORS.heading.softBg}
                softFg={CONTENT_ITEM_COLORS.heading.softFg}
                icon={
                  <span className="text-[0.62rem] font-extrabold leading-none">
                    H1
                  </span>
                }
                onBack={() => setContentFocus(null)}
              >
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                    Text
                  </span>
                  <input
                    type="text"
                    value={page.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                    className={contentFocusInputClass}
                    placeholder="Enter heading…"
                  />
                </label>
              </ContentFocusEditor>
            ) : null}

            {contentFocus === "subheading" ? (
              <ContentFocusEditor
                label="Subheading"
                hint="Supporting line under the heading"
                softBg={CONTENT_ITEM_COLORS.subheading.softBg}
                softFg={CONTENT_ITEM_COLORS.subheading.softFg}
                icon={
                  <span className="text-[0.62rem] font-extrabold leading-none">
                    H2
                  </span>
                }
                onBack={() => setContentFocus(null)}
              >
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                    Text
                  </span>
                  <textarea
                    value={page.subheading}
                    onChange={(e) => onChange({ subheading: e.target.value })}
                    rows={3}
                    className={`${contentFocusInputClass} min-h-[4.5rem] resize-y`}
                    placeholder="Enter subheading…"
                  />
                </label>
              </ContentFocusEditor>
            ) : null}

            {contentFocus === "body" ? (
              <ContentFocusEditor
                label="Body text"
                hint="Main message on the confirmation page"
                softBg={CONTENT_ITEM_COLORS.body.softBg}
                softFg={CONTENT_ITEM_COLORS.body.softFg}
                icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                onBack={() => setContentFocus(null)}
              >
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                    Text
                  </span>
                  <textarea
                    value={page.body}
                    onChange={(e) => onChange({ body: e.target.value })}
                    rows={4}
                    className={`${contentFocusInputClass} min-h-[6rem] resize-y`}
                    placeholder="Enter body text…"
                  />
                </label>
              </ContentFocusEditor>
            ) : null}
          </AccordionSection>
        ) : null}

        {signup ? (
          <>
            <AccordionSection
              id="content"
              title={sectionLabel("content", "Content")}
              hint={sectionHint("content") ?? "Edit text, colors & styles"}
              open={isOpen("content")}
              onToggle={toggle}
              variant={accordionVariant}
            >
              {contentFocus === null ? (
                <ul className="relative m-0 list-none space-y-0.5 p-0">
                  <span
                    className="pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px bg-[#bfdbfe]"
                    aria-hidden
                  />
                  <ContentRailItem
                    title="Intro text"
                    preview={previewText(page.body, "Shown above the form…")}
                    softBg={CONTENT_ITEM_COLORS.body.softBg}
                    softFg={CONTENT_ITEM_COLORS.body.softFg}
                    icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                    onClick={() => setContentFocus("body")}
                  />
                  <ContentRailItem
                    title="Back button text"
                    preview={previewText(signup.navBackLabel, "Add label…")}
                    softBg={CONTENT_ITEM_COLORS.navBack.softBg}
                    softFg={CONTENT_ITEM_COLORS.navBack.softFg}
                    icon={
                      <ChevronLeft className="size-3.5" strokeWidth={2.25} />
                    }
                    onClick={() => setContentFocus("navBack")}
                  />
                  <ContentRailItem
                    title="Next button text"
                    preview={previewText(signup.navNextLabel, "Add label…")}
                    softBg={CONTENT_ITEM_COLORS.navNext.softBg}
                    softFg={CONTENT_ITEM_COLORS.navNext.softFg}
                    icon={
                      <ChevronRight className="size-3.5" strokeWidth={2.25} />
                    }
                    onClick={() => setContentFocus("navNext")}
                  />
                </ul>
              ) : null}

              {contentFocus === "body" ? (
                <ContentFocusEditor
                  label="Intro text"
                  hint="Shown above the form on the sign up page"
                  softBg={CONTENT_ITEM_COLORS.body.softBg}
                  softFg={CONTENT_ITEM_COLORS.body.softFg}
                  icon={<AlignLeft className="size-3.5" strokeWidth={2.25} />}
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <textarea
                      value={page.body}
                      onChange={(e) => onChange({ body: e.target.value })}
                      rows={4}
                      className={`${contentFocusInputClass} min-h-[6rem] resize-y`}
                      placeholder="Shown above the form on the sign up page"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "navBack" ? (
                <ContentFocusEditor
                  label="Back button text"
                  hint="Label for the back navigation button"
                  softBg={CONTENT_ITEM_COLORS.navBack.softBg}
                  softFg={CONTENT_ITEM_COLORS.navBack.softFg}
                  icon={<ChevronLeft className="size-3.5" strokeWidth={2.25} />}
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={signup.navBackLabel}
                      onChange={(e) =>
                        onChange({ navBackLabel: e.target.value })
                      }
                      className={contentFocusInputClass}
                      placeholder="Back"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}

              {contentFocus === "navNext" ? (
                <ContentFocusEditor
                  label="Next button text"
                  hint="Label for the continue / next button"
                  softBg={CONTENT_ITEM_COLORS.navNext.softBg}
                  softFg={CONTENT_ITEM_COLORS.navNext.softFg}
                  icon={<ChevronRight className="size-3.5" strokeWidth={2.25} />}
                  onBack={() => setContentFocus(null)}
                >
                  <label className="block">
                    <span className="mb-1 block text-[0.68rem] font-semibold text-slate-500">
                      Text
                    </span>
                    <input
                      type="text"
                      value={signup.navNextLabel}
                      onChange={(e) =>
                        onChange({ navNextLabel: e.target.value })
                      }
                      className={contentFocusInputClass}
                      placeholder="Continue"
                    />
                  </label>
                </ContentFocusEditor>
              ) : null}
            </AccordionSection>

            <AccordionSection
              id="form"
              title="Form design"
              hint="Fields & form layout"
              open={isOpen("form")}
              onToggle={toggle}
              variant={accordionVariant}
            >
              <div>
                <p className={editorSidebarCaptionClass}>Form fields</p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {FORM_FIELD_OPTIONS.map((f) => {
                    const on = signup.formFieldIds.includes(f.id);
                    const Icon = FORM_FIELD_ICONS[f.id];
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleFormField(f.id)}
                        title={
                          on
                            ? `Included, click to remove (${f.label})`
                            : `Not included, click to add (${f.label})`
                        }
                        className={editorSidebarFormFieldRowClass}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-sm ring-1 ring-black/5 transition-[border-color,background-color,color] duration-200 ${
                            on
                              ? editorSidebarFormFieldIconOnClass
                              : editorSidebarFormFieldIconOffClass
                          }`}
                          aria-hidden
                        >
                          <Icon className="size-4 shrink-0" strokeWidth={2} />
                        </span>
                        <span
                          className={`text-xs font-semibold ${on ? "text-zinc-900" : "text-zinc-500"}`}
                        >
                          {f.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-2">
                <p className={editorSidebarCaptionClass}>Design preset</p>
                <div className="max-h-72 overflow-y-auto overscroll-y-contain pr-0.5 sm:max-h-96">
                  <div className="grid grid-cols-1 gap-2.5">
                    {FORM_DESIGN_OPTIONS.filter(
                      (opt) => !formDesignUsesSplitLayout(opt.value),
                    ).map((opt) => {
                      const on = signup.formDesign === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            onChange({ formDesign: opt.value as FormDesign })
                          }
                          className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition duration-200 ${
                            on
                              ? editorSidebarPickerRowSelectedClass
                              : editorSidebarPickerRowClass
                          }`}
                        >
                          <FormDesignSwatch design={opt.value} selected={on} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold tracking-tight">
                              {opt.label}
                            </span>
                            <span
                              className={`mt-1 block text-[0.65rem] font-normal leading-snug ${
                                on ? "text-slate-600" : "text-zinc-500"
                              }`}
                            >
                              {opt.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionSection>
          </>
        ) : null}
    </div>
  );
}
