"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getLandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/registry";
import { LandingDesignMiniPreview } from "@/app/components/crm-template-editor/landing-designs/LandingDesignMiniPreview";
import {
  FUNNEL_PAGE_DESIGN_TEMPLATES,
  FUNNEL_TEMPLATE_TAGS,
  funnelDesignTemplatesForTag,
  type FunnelPageDesignTemplate,
  type FunnelTemplateTag,
} from "@/app/components/crm-template-editor/funnel-page-templates";
import {
  editorCardClass,
  editorTheme,
} from "@/app/components/crm-template-editor/editor-theme";
import { automationEase } from "@/app/lib/motion";

const galleryFocusInputClass =
  "w-full rounded-[0.7rem] border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-9 pr-3 text-sm font-medium text-[#0e182b] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] hover:bg-white focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15";

export function FunnelPageTemplateGallery({
  open,
  onClose,
  activeDesignTemplateId,
  onApplyDesign,
}: {
  open: boolean;
  onClose: () => void;
  activeDesignTemplateId: string | null;
  onApplyDesign: (template: FunnelPageDesignTemplate) => void;
}) {
  const [designTag, setDesignTag] = useState<FunnelTemplateTag>("All");
  const [query, setQuery] = useState("");

  const filteredDesigns = useMemo(() => {
    const byTag = funnelDesignTemplatesForTag(designTag);
    const q = query.trim().toLowerCase();
    if (!q) return byTag;
    return byTag.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((x) => x.toLowerCase().includes(q)),
    );
  }, [designTag, query]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
          <motion.button
            type="button"
            aria-label="Close templates"
            className="absolute inset-0 bg-[#07111f]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="funnel-template-gallery-title"
            className="relative z-[1] flex max-h-[min(92vh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-[#e8edf5] bg-white shadow-[0_28px_64px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: automationEase }}
          >
            <header className="shrink-0 border-b border-[#eef2f7] bg-[#f8faff] px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-[0.8rem] bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)]">
                      <Sparkles className="size-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    <div>
                      <h2
                        id="funnel-template-gallery-title"
                        className="text-[1.05rem] font-extrabold tracking-tight text-[#0e182b]"
                      >
                        Browse templates
                      </h2>
                      <p className="mt-0.5 text-[0.78rem] font-medium text-slate-500">
                        Pick a page design to update colors, hero, layout, form &
                        checkout.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-500 transition hover:border-[#bfdbfe] hover:bg-[#f8fafc] hover:text-[#1877f2]"
                  aria-label="Close"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="relative mt-3">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search page designs…"
                  className={galleryFocusInputClass}
                />
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                {FUNNEL_TEMPLATE_TAGS.map((t) => {
                  const on = designTag === t;
                  const count =
                    t === "All"
                      ? FUNNEL_PAGE_DESIGN_TEMPLATES.length
                      : FUNNEL_PAGE_DESIGN_TEMPLATES.filter((x) =>
                          x.tags.includes(t),
                        ).length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDesignTag(t)}
                      className={[
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        on
                          ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
                          : "bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe] hover:bg-[#dbeafe]",
                      ].join(" ")}
                    >
                      {t}
                      <span className="ml-1 tabular-nums opacity-70">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </header>

            <div
              className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
              style={{ backgroundColor: editorTheme.background }}
            >
              {filteredDesigns.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1877f2]">
                    <Palette className="size-5" aria-hidden />
                  </span>
                  <p className="m-0 text-sm font-bold text-[#0e182b]">
                    No page designs match
                  </p>
                  <p className="m-0 mt-1 text-sm text-slate-500">
                    Try a different search or category.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDesigns.map((template, index) => {
                    const selected = activeDesignTemplateId === template.id;
                    const tokens = getLandingDesignStyle(template.landingDesign);
                    return (
                      <motion.button
                        key={template.id}
                        type="button"
                        onClick={() => onApplyDesign(template)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.28,
                          delay: Math.min(index * 0.03, 0.24),
                          ease: automationEase,
                        }}
                        className={[
                          editorCardClass,
                          "group relative overflow-hidden p-3 text-left transition duration-200",
                          selected
                            ? "border-[#93c5fd] ring-2 ring-[#1877f2]/25 shadow-[0_14px_32px_rgba(24,119,242,0.16)]"
                            : "hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_14px_32px_rgba(24,119,242,0.12)]",
                        ].join(" ")}
                      >
                        {selected ? (
                          <span className="absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.35)]">
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          </span>
                        ) : null}

                        <LandingDesignMiniPreview style={tokens} wide />

                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1877f2] ring-1 ring-[#dbeafe]">
                              <Palette className="size-2.5" aria-hidden />
                              Page design
                            </span>
                            <p className="mt-1.5 truncate text-[0.92rem] font-extrabold tracking-tight text-[#0e182b]">
                              {template.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug text-slate-500">
                              {template.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span
                            className="flex shrink-0 gap-1"
                            aria-hidden
                          >
                            <span
                              className="size-2.5 rounded-full ring-1 ring-black/5"
                              style={{ backgroundColor: tokens.primary }}
                            />
                            <span
                              className="size-2.5 rounded-full ring-1 ring-black/5"
                              style={{ backgroundColor: tokens.secondary }}
                            />
                            <span
                              className="size-2.5 rounded-full ring-1 ring-black/5"
                              style={{
                                backgroundColor: tokens.backgroundDefault,
                              }}
                            />
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
