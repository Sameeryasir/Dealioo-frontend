"use client";
import { type ChangeEvent, useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  FileText,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Mail,
  MousePointerClick,
  Phone,
  Trash2,
  Upload,
  User,
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
  | "checkout-templates";

const FORM_FIELD_ICONS: Record<FormFieldId, LucideIcon> = {
  firstName: User,
  lastName: UserRound,
  email: Mail,
  phone: Phone,
};

function defaultOpenSection(_pageId: TemplatePage["id"]): SectionId | null {
  return "content";
}

const accordionEase = [0.22, 1, 0.36, 1] as const;

/** Slower open/close so the sidebar accordion feels deliberate, not snappy. */
const accordionPanelOpen = {
  duration: 0.48,
  delay: 0.1,
  ease: accordionEase,
} as const;
const accordionPanelClose = {
  duration: 0.4,
  delay: 0.06,
  ease: accordionEase,
} as const;
const accordionChevronTransition = {
  duration: 0.42,
  delay: 0.06,
  ease: accordionEase,
} as const;

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-200">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${
          open
            ? "bg-zinc-50 text-zinc-900"
            : "text-zinc-900 hover:bg-zinc-50/80"
        }`}
      >
        {title}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={accordionChevronTransition}
          className="flex text-zinc-400"
        >
          <ChevronDown className="size-4" strokeWidth={2} aria-hidden />
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
            <div className="space-y-3 px-4 pb-4 pt-0.5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
    const chipClass =
      "flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-black text-white shadow-sm ring-1 ring-white/10 sm:size-9 sm:rounded-xl";

    if (layout === "inline") {
      const left = (
        <span className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <span className={chipClass} aria-hidden>
            {icon}
          </span>
          <span
            id={as === "div" ? groupLabelId : undefined}
            className="max-w-[5.5rem] truncate text-xs font-semibold tracking-tight text-zinc-800 sm:max-w-[7.5rem]"
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
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-900 bg-black text-white shadow-sm ring-1 ring-white/10"
          aria-hidden
        >
          {icon}
        </span>
        <span
          id={as === "div" ? groupLabelId : undefined}
          className="text-xs font-semibold tracking-tight text-zinc-800"
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
      <span className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const contentInputClass =
  "w-full rounded-xl border border-zinc-200/95 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-900/0 transition placeholder:text-zinc-400 focus:border-zinc-300 focus:shadow-md focus:ring-2 focus:ring-zinc-900/10";

const inlineInputClass = `${contentInputClass} min-h-10 min-w-0 flex-1 py-2 text-sm`;

export function TemplateEditorSidebar({
  page,
  onChange,
  onBrowseTemplates,
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
  onBrowseTemplates?: () => void;
}) {
  const mediaFileId = useId();
  const [openSection, setOpenSection] = useState<SectionId | null>(() =>
    defaultOpenSection(page.id),
  );

  useEffect(() => {
    setOpenSection(defaultOpenSection(page.id));
  }, [page.id]);

  /** Only one section open — tapping another closes the rest. */
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

  const onImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const out = reader.result;
      if (typeof out === "string") onChange({ imageUrl: out });
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="w-full bg-white [&_button]:cursor-pointer [&_select]:cursor-pointer">
        {showLandingHeroEditor ? (
          <>
            <AccordionSection
              id="templates"
              title="Starter templates"
              open={isOpen("templates")}
              onToggle={toggle}
            >
              <p className="text-xs leading-relaxed text-zinc-500">
                <strong className="font-semibold text-zinc-700">Page design</strong>{" "}
                sets colors, hero, layout, form & checkout. Use{" "}
                <strong className="font-semibold text-zinc-700">Starter copy</strong>{" "}
                in Templates for headline & body text only.
              </p>
              <button
                type="button"
                onClick={onBrowseTemplates}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-black px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-900"
              >
                <LayoutTemplate className="size-3.5" aria-hidden />
                Browse templates
              </button>
            </AccordionSection>

            <AccordionSection
              id="sections"
              title="Section order"
              open={isOpen("sections")}
              onToggle={toggle}
            >
              <p className="mb-3 text-xs text-zinc-500">
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
                    className={contentInputClass}
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
                    className={`${contentInputClass} resize-y`}
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
                    className={`${contentInputClass} resize-y`}
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
                    className={contentInputClass}
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
              title="Media"
              open={isOpen("media")}
              onToggle={toggle}
            >
              <div className="space-y-4">
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

                <Field
                  as="div"
                  label="Hero image"
                  icon={<ImageIcon className="size-4 shrink-0" strokeWidth={2} />}
                >
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-inner ring-1 ring-zinc-950/[0.04]">
                    {page.imageUrl.trim() ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={page.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          style={imageScaleStyle(page.imageScale)}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-4 text-center">
                        <span className="text-xs font-medium text-zinc-500">
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
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black bg-black px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-900"
                    >
                      <Upload
                        className="size-3.5 shrink-0 text-white"
                        strokeWidth={2}
                        aria-hidden
                      />
                      Upload image
                    </label>
                    {page.imageUrl.trim() ? (
                      <button
                        type="button"
                        onClick={() => onChange({ imageUrl: "", imageScale: 1 })}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-900/25 bg-zinc-100 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-900"
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
                </Field>

                {page.imageUrl.trim() ? (
                  <Field
                    as="div"
                    label="Image zoom"
                    icon={<ZoomIn className="size-4 shrink-0" strokeWidth={2} />}
                  >
                    <div className="mb-2 flex justify-end">
                      <span className="rounded-lg bg-zinc-200/90 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-900">
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
                    <p className="mt-2 text-[0.65rem] leading-relaxed text-zinc-600">
                      Lower zoom shows more of the photo; higher zoom crops to
                      the center.
                    </p>
                  </Field>
                ) : null}
              </div>
            </AccordionSection>
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
                    className={contentInputClass}
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
                    className={`${contentInputClass} resize-y`}
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
                    className={contentInputClass}
                  />
                </Field>
              </div>
            </AccordionSection>

            <AccordionSection
              id="checkout-templates"
              title="Checkout templates"
              open={isOpen("checkout-templates")}
              onToggle={toggle}
            >
              <p className="mb-2 text-xs font-medium text-zinc-600">
                Choose a checkout layout
              </p>
              <div className={editorSidebarPickerPanelClass}>
                <div className={editorSidebarPickerScrollClass}>
                  <div className="grid grid-cols-1 gap-2 pb-1">
                    {CHECKOUT_TEMPLATE_OPTIONS.map((opt) => (
                      <CheckoutTemplatePickerOption
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        value={opt.value}
                        selected={
                          normalizeCheckoutTemplate(payment.checkoutTemplate) ===
                          opt.value
                        }
                        onSelect={() =>
                          onChange({
                            checkoutTemplate: opt.value as CheckoutTemplateType,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3 border-t border-zinc-200/80 pt-4">
                <p className="text-xs font-medium text-zinc-600">Display options</p>
                {(
                  [
                    ["showCoupon", "Coupon field"],
                    ["showPhoneField", "Phone field"],
                    ["showAddressField", "Billing address"],
                    ["showOrderSummary", "Order summary"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={payment[key]}
                      onChange={(e) =>
                        onChange({ [key]: e.target.checked })
                      }
                      className="size-4 rounded border-zinc-300"
                    />
                    {label}
                  </label>
                ))}
                <Field
                  label="Button color"
                  icon={<MousePointerClick className="size-4 shrink-0" />}
                >
                  <input
                    type="color"
                    value={payment.checkoutTheme.buttonColor}
                    onChange={(e) =>
                      onChange({
                        checkoutTheme: {
                          ...payment.checkoutTheme,
                          buttonColor: e.target.value,
                        },
                      })
                    }
                    className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200"
                  />
                </Field>
                <Field
                  label="Page background"
                  icon={<ImageIcon className="size-4 shrink-0" />}
                >
                  <input
                    type="color"
                    value={payment.checkoutTheme.background}
                    onChange={(e) =>
                      onChange({
                        checkoutTheme: {
                          ...payment.checkoutTheme,
                          background: e.target.value,
                        },
                        backgroundColor: e.target.value,
                      })
                    }
                    className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200"
                  />
                </Field>
              </div>
            </AccordionSection>

            <AccordionSection
              id="form"
              title="Form design"
              open={isOpen("form")}
              onToggle={toggle}
            >
              <p className="mb-2 text-xs font-medium text-zinc-600">
                Design preset
              </p>
              <div className="max-h-72 overflow-y-auto overscroll-y-contain pr-0.5 sm:max-h-96">
                <div className="grid grid-cols-1 gap-2.5">
                  {FORM_DESIGN_OPTIONS.filter(
                    (opt) => !formDesignUsesSplitLayout(opt.value),
                  ).map((opt) => {
                    const on = payment.formDesign === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          onChange({ formDesign: opt.value as FormDesign })
                        }
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition ${
                          on
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md ring-1 ring-black/20"
                            : "border-zinc-200/90 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/90"
                        }`}
                      >
                        <FormDesignSwatch design={opt.value} selected={on} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold tracking-tight">
                            {opt.label}
                          </span>
                          <span
                            className={`mt-1 block text-[0.65rem] font-normal leading-snug ${
                              on ? "text-zinc-300" : "text-zinc-500"
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
            </AccordionSection>
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
                  className={contentInputClass}
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
                  className={`${contentInputClass} resize-y`}
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
                  className={`${contentInputClass} resize-y`}
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
                  className={contentInputClass}
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
                  className={`${contentInputClass} resize-y`}
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
              <p className="mb-2 text-xs font-medium text-zinc-600">
                Form fields
              </p>
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
                          ? `Included — click to remove (${f.label})`
                          : `Not included — click to add (${f.label})`
                      }
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1 text-left text-zinc-800 transition hover:bg-zinc-50"
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-sm ring-1 ring-black/5 ${
                          on
                            ? "border-zinc-900 bg-black text-white"
                            : "border-zinc-200/90 bg-white text-zinc-400"
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
              <p className="mb-2 text-xs font-medium text-zinc-600">
                Design preset
              </p>
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
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition ${
                        on
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-md ring-1 ring-black/20"
                          : "border-zinc-200/90 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/90"
                      }`}
                    >
                      <FormDesignSwatch design={opt.value} selected={on} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold tracking-tight">
                          {opt.label}
                        </span>
                        <span
                          className={`mt-1 block text-[0.65rem] font-normal leading-snug ${
                            on ? "text-zinc-300" : "text-zinc-500"
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
            <div className="space-y-3 border-t border-zinc-200 pt-4">
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
                  className={inlineInputClass}
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
                  className={inlineInputClass}
                />
              </Field>
            </div>
          </AccordionSection>
          </>
        ) : null}
    </div>
  );
}
