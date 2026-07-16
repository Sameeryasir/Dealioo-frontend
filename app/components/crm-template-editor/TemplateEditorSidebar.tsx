"use client";
import { type ChangeEvent, useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Heading1,
  Heading2,
  Image as ImageIcon,
  LayoutTemplate,
  ListOrdered,
  Mail,
  MousePointerClick,
  Phone,
  Trash2,
  Upload,
  User,
  UserPlus,
  UserRound,
  ZoomIn,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FUNNEL_STEP_META } from "@/app/components/crm-template-editor/editor-ui/funnel-step-meta";
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
  editorAccordionIconClosedClass,
  editorAccordionIconOpenClass,
  editorAccordionShellClosedClass,
  editorAccordionShellOpenClass,
  editorAccordionTitleClass,
  editorContentInputClass,
  editorFieldIconChipClass,
  editorFieldIconChipInlineClass,
  editorFieldLabelClass,
  editorFieldLabelInlineClass,
  editorFieldLabelPlainClass,
  editorInlineInputClass,
  editorSidebarBodyStrongClass,
  editorSidebarBodyTextClass,
  editorSidebarCaptionClass,
  editorSidebarCheckboxLabelClass,
  editorSidebarFormFieldIconOffClass,
  editorSidebarFormFieldIconOnClass,
  editorSidebarFormFieldRowClass,
  editorSidebarMediaFrameClass,
  editorSidebarPickerRowClass,
  editorSidebarPickerRowSelectedClass,
  editorSidebarPrimaryButtonClass,
  editorSidebarRootClass,
  editorSidebarSecondaryButtonClass,
  editorSidebarSectionDividerClass,
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
  sections: ListOrdered,
  content: FileText,
  media: ImageIcon,
  form: UserPlus,
  "checkout-templates": CreditCard,
  style: Palette,
};

const STACKED_SECTION_LABELS: Partial<
  Record<SectionId, { title: string; hint: string }>
> = {
  templates: { title: "Template", hint: "Starter template selected" },
  content: { title: "Content", hint: "Headline, text and buttons" },
  media: { title: "Media", hint: "Hero image and positioning" },
  sections: { title: "Sections & Order", hint: "Arrange page sections" },
  style: { title: "Style", hint: "Colors, fonts and buttons" },
};

const STACKED_SECTION_ORDER: Partial<Record<SectionId, string>> = {
  templates: "order-1",
  content: "order-2",
  media: "order-3",
  sections: "order-4",
  style: "order-5",
};

const SECTION_HINTS: Partial<Record<SectionId, string>> = {
  templates: "Design presets & starter copy",
  sections: "Drag blocks on the page",
  content: "Headlines, body & buttons",
  media: "Upload hero & adjust zoom",
  form: "Fields & form layout",
  "checkout-templates": "Layout & display options",
};

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
  const subtitle = hint ?? SECTION_HINTS[id];

  return (
    <motion.div className={editorAccordionShellClosedClass}>
      <a
        href="/dashboard/upgrade-plan"
        className={editorAccordionHeaderButtonClass}
        title={`${title} — Upgrade plan to unlock`}
      >
        <span className={editorAccordionIconClosedClass} aria-hidden>
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
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
  const subtitle = hint ?? SECTION_HINTS[id];

  if (variant === "stack") {
    return (
      <div
        className={`flex w-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-colors duration-150 ${
          open
            ? "editor-settings-card--open shrink-0 border-slate-300"
            : "editor-settings-card--closed shrink-0 hover:border-slate-300"
        } ${orderClassName ?? ""}`}
      >
        <button
          type="button"
          onClick={() => onToggle(id)}
          title={subtitle ? `${title} — ${subtitle}` : title}
          className="editor-settings-stack-trigger flex w-full shrink-0 items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
              open
                ? "bg-[#1877f2] text-white"
                : "bg-[#e8f2ff] text-[#1877f2]"
            }`}
            aria-hidden
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.8125rem] font-semibold leading-tight text-slate-900">
              {title}
            </span>
            {subtitle && !open ? (
              <span className="mt-0.5 block truncate text-[0.7rem] text-slate-500">
                {subtitle}
              </span>
            ) : null}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={accordionChevronTransition}
            className="flex size-6 shrink-0 items-center justify-center text-slate-400"
          >
            <ChevronDown className="size-3.5" strokeWidth={2} aria-hidden />
          </motion.span>
        </button>
        {open ? (
          <div className="editor-settings-stack-panel border-t border-slate-100 bg-slate-50/40 px-3 pb-3 pt-2.5">
            <div className="space-y-3">{children}</div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.div
      className={`${open ? editorAccordionShellOpenClass : editorAccordionShellClosedClass} ${orderClassName ?? ""}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={editorAccordionHeaderButtonClass}
      >
        <span
          className={open ? editorAccordionIconOpenClass : editorAccordionIconClosedClass}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={editorAccordionTitleClass}>{title}</span>
          {subtitle && !open ? (
            <span className={editorAccordionHintClass}>{subtitle}</span>
          ) : null}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={accordionChevronTransition}
          className={
            open ? editorAccordionChevronOpenClass : editorAccordionChevronClosedClass
          }
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
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  as?: "label" | "div";
  layout?: "stacked" | "inline";
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
      <span className="mb-2 flex items-center gap-2.5">
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

    if (as === "div") {
      return (
        <div className="block" role="group" aria-labelledby={groupLabelId}>
          {labelRow}
          {children}
        </div>
      );
    }

    return (
      <label className="block">
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
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const heroImageSrc = resolveUploadImageUrl(page.imageUrl);

  useEffect(() => {
    setOpenSection(null);
  }, [page.id]);

  const toggle = useCallback((id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

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
    stackedLayout
      ? (STACKED_SECTION_LABELS[id]?.title ?? defaultTitle)
      : defaultTitle;
  const sectionHint = (id: SectionId) =>
    stackedLayout ? STACKED_SECTION_LABELS[id]?.hint : undefined;
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
              title={sectionLabel("templates", "Starter templates")}
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
              id="sections"
              title={sectionLabel("sections", "Section order")}
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

            <AccordionSection
              id="content"
              title={sectionLabel("content", "Content")}
              hint={sectionHint("content")}
              open={isOpen("content")}
              onToggle={toggle}
              variant={accordionVariant}
              orderClassName={sectionOrder("content")}
            >
              <div className="space-y-5">
                <Field
                  label="Heading"
                  icon={<Heading1 className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <input
                    type="text"
                    value={page.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                    className={editorContentInputClass}
                  />
                  <ContentTextColorPicker
                    value={landingPage?.headingColor ?? ""}
                    onChange={(headingColor) => onChange({ headingColor })}
                  />
                </Field>
                <Field
                  label="Subheading"
                  icon={<Heading2 className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <textarea
                    value={page.subheading}
                    onChange={(e) => onChange({ subheading: e.target.value })}
                    rows={3}
                    className={`${editorContentInputClass} resize-y`}
                  />
                  <ContentTextColorPicker
                    value={landingPage?.subheadingColor ?? ""}
                    onChange={(subheadingColor) => onChange({ subheadingColor })}
                  />
                </Field>
                <Field
                  label="Body text"
                  icon={<FileText className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <textarea
                    value={page.body}
                    onChange={(e) => onChange({ body: e.target.value })}
                    rows={8}
                    className={`${editorContentInputClass} resize-y`}
                  />
                  <ContentTextColorPicker
                    value={landingPage?.bodyColor ?? ""}
                    onChange={(bodyColor) => onChange({ bodyColor })}
                  />
                </Field>
                <Field
                  label="Button text"
                  icon={
                    <MousePointerClick
                      className="size-4 shrink-0"
                      strokeWidth={2}
                    />
                  }
                >
                  <input
                    type="text"
                    value={page.buttonText}
                    onChange={(e) => onChange({ buttonText: e.target.value })}
                    className={editorContentInputClass}
                  />
                  <ContentTextColorPicker
                    value={landingPage?.buttonTextColor ?? ""}
                    onChange={(buttonTextColor) => onChange({ buttonTextColor })}
                    fallbackHex="#FFFFFF"
                  />
                </Field>
              </div>
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
                {!stackedLayout ? heroDesignPicker : null}

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

            {stackedLayout ? (
              <AccordionSection
                id="style"
                title={sectionLabel("style", "Style")}
                hint={sectionHint("style")}
                open={isOpen("style")}
                onToggle={toggle}
                variant={accordionVariant}
                orderClassName={sectionOrder("style")}
              >
                {heroDesignPicker}
              </AccordionSection>
            ) : null}
          </>
        ) : null}

        {payment ? (
          <>
            <AccordionSection
              id="content"
              title="Summary"
              open={isOpen("content")}
              onToggle={toggle}
            >
              <div className="space-y-4">
                <Field
                  label="Payment details title"
                  icon={<Heading1 className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <input
                    type="text"
                    value={payment.heading}
                    onChange={(e) => onChange({ heading: e.target.value })}
                    className={editorContentInputClass}
                  />
                </Field>
                <Field
                  label="Intro text"
                  icon={<Heading2 className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <textarea
                    value={payment.subheading}
                    onChange={(e) => onChange({ subheading: e.target.value })}
                    rows={3}
                    className={`${editorContentInputClass} resize-y`}
                  />
                </Field>
                <Field
                  label="Submit button text"
                  icon={
                    <MousePointerClick
                      className="size-4 shrink-0"
                      strokeWidth={2}
                    />
                  }
                >
                  <input
                    type="text"
                    value={payment.buttonText}
                    onChange={(e) => onChange({ buttonText: e.target.value })}
                    className={editorContentInputClass}
                  />
                </Field>
              </div>
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
            title="Content"
            open={isOpen("content")}
            onToggle={toggle}
          >
            <div className="space-y-5">
              <Field
                label="Heading"
                icon={<Heading1 className="size-4 shrink-0" strokeWidth={2} />}
              >
                <input
                  type="text"
                  value={page.heading}
                  onChange={(e) => onChange({ heading: e.target.value })}
                  className={editorContentInputClass}
                />
              </Field>
              <Field
                label="Subheading"
                icon={<Heading2 className="size-4 shrink-0" strokeWidth={2} />}
              >
                <textarea
                  value={page.subheading}
                  onChange={(e) => onChange({ subheading: e.target.value })}
                  rows={3}
                  className={`${editorContentInputClass} resize-y`}
                />
              </Field>
              <Field
                label="Body text"
                icon={<FileText className="size-4 shrink-0" strokeWidth={2} />}
              >
                <textarea
                  value={page.body}
                  onChange={(e) => onChange({ body: e.target.value })}
                  rows={8}
                  className={`${editorContentInputClass} resize-y`}
                />
              </Field>
            </div>
          </AccordionSection>
        ) : null}

        {signup ? (
          <>
            <AccordionSection
              id="content"
              title="Content"
              open={isOpen("content")}
              onToggle={toggle}
            >
              <Field
                label="Intro text"
                icon={<FileText className="size-4 shrink-0" strokeWidth={2} />}
              >
                <textarea
                  value={page.body}
                  onChange={(e) => onChange({ body: e.target.value })}
                  rows={6}
                  className={`${editorContentInputClass} resize-y`}
                  placeholder="Shown above the form on the sign up page"
                />
              </Field>
            </AccordionSection>

            <AccordionSection
              id="form"
              title="Form design"
              open={isOpen("form")}
              onToggle={toggle}
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
            <div className={`space-y-3 ${editorSidebarSectionDividerClass} pt-4`}>
              <Field
                layout="inline"
                label="Back button text"
                icon={
                  <ChevronLeft className="size-3.5 shrink-0 sm:size-4" strokeWidth={2} />
                }
              >
                <input
                  type="text"
                  value={signup.navBackLabel}
                  onChange={(e) =>
                    onChange({ navBackLabel: e.target.value })
                  }
                  className={editorInlineInputClass}
                />
              </Field>
              <Field
                layout="inline"
                label="Next button text"
                icon={
                  <ChevronRight className="size-3.5 shrink-0 sm:size-4" strokeWidth={2} />
                }
              >
                <input
                  type="text"
                  value={signup.navNextLabel}
                  onChange={(e) =>
                    onChange({ navNextLabel: e.target.value })
                  }
                  className={editorInlineInputClass}
                />
              </Field>
            </div>
          </AccordionSection>
          </>
        ) : null}
    </div>
  );
}
