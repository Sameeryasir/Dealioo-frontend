"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Palette, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getLandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/registry";
import { LandingDesignMiniPreview } from "@/app/components/crm-template-editor/landing-designs/LandingDesignMiniPreview";
import {
  FUNNEL_LANDING_COPY_TEMPLATES,
  FUNNEL_COPY_TEMPLATE_TAGS,
  funnelCopyTemplatesForTag,
  type FunnelLandingCopyTemplate,
  type FunnelCopyTemplateTag,
} from "@/app/components/crm-template-editor/funnel-landing-copy-templates";
import {
  FUNNEL_PAGE_DESIGN_TEMPLATES,
  FUNNEL_TEMPLATE_TAGS,
  funnelDesignTemplatesForTag,
  type FunnelPageDesignTemplate,
  type FunnelTemplateTag,
} from "@/app/components/crm-template-editor/funnel-page-templates";
import { automationEase } from "@/app/lib/motion";

type GalleryTab = "design" | "copy";

export function FunnelPageTemplateGallery({
  open,
  onClose,
  activeDesignTemplateId,
  activeCopyTemplateId,
  onApplyDesign,
  onApplyCopy,
}: {
  open: boolean;
  onClose: () => void;
  activeDesignTemplateId: string | null;
  activeCopyTemplateId: string | null;
  onApplyDesign: (template: FunnelPageDesignTemplate) => void;
  onApplyCopy: (template: FunnelLandingCopyTemplate) => void;
}) {
  const [tab, setTab] = useState<GalleryTab>("design");
  const [designTag, setDesignTag] = useState<FunnelTemplateTag>("All");
  const [copyTag, setCopyTag] = useState<FunnelCopyTemplateTag>("All");
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

  const filteredCopy = useMemo(() => {
    const byTag = funnelCopyTemplatesForTag(copyTag);
    const q = query.trim().toLowerCase();
    if (!q) return byTag;
    return byTag.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.copy.heading.toLowerCase().includes(q) ||
        t.tags.some((x) => x.toLowerCase().includes(q)),
    );
  }, [copyTag, query]);

  const tags = tab === "design" ? FUNNEL_TEMPLATE_TAGS : FUNNEL_COPY_TEMPLATE_TAGS;
  const activeTag = tab === "design" ? designTag : copyTag;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
          <motion.button
            type="button"
            aria-label="Close templates"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="funnel-template-gallery-title"
            className="relative z-[1] flex max-h-[min(90vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: automationEase }}
          >
            <header className="shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    id="funnel-template-gallery-title"
                    className="text-base font-bold text-zinc-900"
                  >
                    Browse templates
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    <strong className="font-semibold text-zinc-700">
                      Page design
                    </strong>{" "}
                    changes colors, hero, layout, form & checkout.{" "}
                    <strong className="font-semibold text-zinc-700">
                      Starter copy
                    </strong>{" "}
                    only updates your landing text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex gap-1 rounded-xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => setTab("design")}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                    tab === "design"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900",
                  ].join(" ")}
                >
                  <Palette className="size-3.5" aria-hidden />
                  Page design
                  <span className="tabular-nums text-zinc-400">
                    {FUNNEL_PAGE_DESIGN_TEMPLATES.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("copy")}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                    tab === "copy"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900",
                  ].join(" ")}
                >
                  <FileText className="size-3.5" aria-hidden />
                  Starter copy
                  <span className="tabular-nums text-zinc-400">
                    {FUNNEL_LANDING_COPY_TEMPLATES.length}
                  </span>
                </button>
              </div>

              <div className="relative mt-3">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    tab === "design"
                      ? "Search page designs…"
                      : "Search starter copy…"
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                {tags.map((t) => {
                  const on = activeTag === t;
                  const count =
                    t === "All"
                      ? tab === "design"
                        ? FUNNEL_PAGE_DESIGN_TEMPLATES.length
                        : FUNNEL_LANDING_COPY_TEMPLATES.length
                      : tab === "design"
                        ? FUNNEL_PAGE_DESIGN_TEMPLATES.filter((x) =>
                            x.tags.includes(t as FunnelTemplateTag),
                          ).length
                        : FUNNEL_LANDING_COPY_TEMPLATES.filter((x) =>
                            x.tags.includes(t as FunnelCopyTemplateTag),
                          ).length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (tab === "design") {
                          setDesignTag(t as FunnelTemplateTag);
                        } else {
                          setCopyTag(t as FunnelCopyTemplateTag);
                        }
                      }}
                      className={[
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        on
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
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

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {tab === "design" ? (
                filteredDesigns.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-500">
                    No page designs match your search.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDesigns.map((template) => {
                      const selected = activeDesignTemplateId === template.id;
                      const tokens = getLandingDesignStyle(
                        template.landingDesign,
                      );
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => onApplyDesign(template)}
                          className={[
                            "relative overflow-hidden rounded-xl border p-3 text-left transition",
                            selected
                              ? "border-violet-500 ring-2 ring-violet-200"
                              : "border-zinc-200 hover:border-zinc-300 hover:shadow-md",
                          ].join(" ")}
                        >
                          {selected ? (
                            <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white">
                              <Check className="size-3" strokeWidth={3} aria-hidden />
                            </span>
                          ) : null}
                          <span className="mb-2 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                            Page design
                          </span>
                          <LandingDesignMiniPreview style={tokens} />
                          <p className="mt-2 text-sm font-semibold text-zinc-900">
                            {template.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                            {template.description}
                          </p>
                          <p className="mt-2 text-[10px] text-zinc-400">
                            Theme, hero, layout, form, checkout
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : filteredCopy.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No copy templates match your search.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredCopy.map((template) => {
                    const selected = activeCopyTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => onApplyCopy(template)}
                        className={[
                          "relative rounded-xl border p-4 text-left transition",
                          selected
                            ? "border-emerald-500 ring-2 ring-emerald-200"
                            : "border-zinc-200 hover:border-zinc-300 hover:shadow-md",
                        ].join(" ")}
                      >
                        {selected ? (
                          <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check className="size-3" strokeWidth={3} aria-hidden />
                          </span>
                        ) : null}
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Starter copy
                        </span>
                        <p className="mt-2 text-sm font-bold leading-snug text-zinc-900">
                          {template.copy.heading}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                          {template.copy.subheading}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-zinc-900">
                          {template.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {template.description}
                        </p>
                      </button>
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
