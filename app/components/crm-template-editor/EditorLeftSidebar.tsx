"use client";

import { motion } from "framer-motion";
import { editorPanelScrollClass } from "@/app/components/crm-template-editor/editor-layout";
import {
  FUNNEL_PAGE_ORDER,
  TemplatePageList,
} from "@/app/components/crm-template-editor/TemplatePageList";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export function EditorLeftSidebar({
  activeId,
  onSelect,
  onEditPage,
  compact = false,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onEditPage: (id: TemplatePageId) => void;
  compact?: boolean;
}) {
  const stepIndex = FUNNEL_PAGE_ORDER.indexOf(activeId);
  const progress = ((stepIndex + 1) / FUNNEL_PAGE_ORDER.length) * 100;

  if (compact) {
    return (
      <aside className="relative flex h-full min-h-0 w-full max-w-full flex-col gap-3 bg-transparent px-1 py-1.5 lg:gap-3.5 lg:px-0 lg:py-2">
        <div className="shrink-0 rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)] lg:px-3.5 lg:py-3">
          <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1877f2] lg:text-[0.66rem]">
            Funnel
          </p>
          <p className="m-0 mt-1 text-[0.82rem] font-extrabold text-[#07111f] lg:text-[0.9rem]">
            Step {stepIndex + 1} of {FUNNEL_PAGE_ORDER.length}
          </p>
          <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e8edf5]">
            <motion.div
              className="h-full rounded-full bg-[#1877f2]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className={`${editorPanelScrollClass} min-h-0 scroll-smooth`}>
          <TemplatePageList
            activeId={activeId}
            onSelect={onSelect}
            onEditPage={onEditPage}
            compact={compact}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 w-full max-w-full flex-col border-r border-[#e8edf5] bg-[#f8fafc]">
      <div className="relative shrink-0 border-b border-[#e8edf5] bg-white px-3 py-2.5">
        <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
          Funnel flow
        </p>
        <p className="m-0 mt-1 text-[0.9rem] font-extrabold leading-tight tracking-tight text-[#07111f]">
          Your funnel
        </p>
        <p className="m-0 mt-0.5 text-[0.65rem] font-medium text-slate-500">
          Step {stepIndex + 1} of {FUNNEL_PAGE_ORDER.length}
        </p>

        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#e8edf5]">
          <motion.div
            className="h-full rounded-full bg-[#1877f2]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className={`${editorPanelScrollClass} scroll-smooth`}>
        <TemplatePageList
          activeId={activeId}
          onSelect={onSelect}
          onEditPage={onEditPage}
          compact={compact}
        />
      </div>
    </aside>
  );
}
