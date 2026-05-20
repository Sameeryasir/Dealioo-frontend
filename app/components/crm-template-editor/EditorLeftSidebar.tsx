"use client";

import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { editorPanelScrollClass } from "@/app/components/crm-template-editor/editor-layout";
import {
  FUNNEL_PAGE_ORDER,
  TemplatePageList,
} from "@/app/components/crm-template-editor/TemplatePageList";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export function EditorLeftSidebar({
  pages,
  activeId,
  onSelect,
  onEditPage,
}: {
  pages: { id: TemplatePageId; label: string }[];
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onEditPage: (id: TemplatePageId) => void;
}) {
  const stepIndex = FUNNEL_PAGE_ORDER.indexOf(activeId);
  const progress = ((stepIndex + 1) / FUNNEL_PAGE_ORDER.length) * 100;

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-200/90 bg-white">
      <div className="shrink-0 border-b border-zinc-100 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
            <LayoutTemplate className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-zinc-900">
              Funnel editor
            </p>
            <p className="mt-0.5 text-[0.65rem] text-zinc-500">
              Step {stepIndex + 1} of {FUNNEL_PAGE_ORDER.length}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-200">
          <motion.div
            className="h-full rounded-full bg-zinc-900"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className={`${editorPanelScrollClass} scroll-smooth`}>
        <TemplatePageList
          pages={pages}
          activeId={activeId}
          onSelect={onSelect}
          onEditPage={onEditPage}
        />
      </div>
    </aside>
  );
}
