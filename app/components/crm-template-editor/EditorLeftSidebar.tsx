"use client";

import { motion } from "framer-motion";
import { editorPremiumCardClass, editorPanelTopShellClass, editorFunnelProgressFillGradient } from "@/app/components/crm-template-editor/editor-sidebar-theme";
import {
  FUNNEL_PAGE_ORDER,
  TemplatePageList,
} from "@/app/components/crm-template-editor/TemplatePageList";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export function EditorLeftSidebar({
  activeId,
  onSelect,
  onPreviewPage,
  compact = false,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onPreviewPage?: (id: TemplatePageId) => void;
  compact?: boolean;
}) {
  const stepIndex = FUNNEL_PAGE_ORDER.indexOf(activeId);
  const progress = ((stepIndex + 1) / FUNNEL_PAGE_ORDER.length) * 100;

  if (compact) {
    return (
      <aside
        className={`${editorPremiumCardClass} flex h-full min-h-0 w-full flex-col`}
      >
        <div className={`${editorPanelTopShellClass} editor-funnel-top-shell`}>
          <div className="editor-funnel-top-stack w-full">
            <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Funnel
            </p>
            <p className="m-0 mt-2 text-[0.9375rem] font-semibold leading-tight text-slate-900">
              Step {stepIndex + 1} of {FUNNEL_PAGE_ORDER.length}
            </p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-full rounded-full"
                style={{ background: editorFunnelProgressFillGradient }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="m-0 mt-2 text-[0.7rem] font-normal text-slate-500">
              Select a step to preview or edit
            </p>
          </div>
        </div>

        <div className="shrink-0 px-2.5 pb-3 pt-2">
          <TemplatePageList
            activeId={activeId}
            onSelect={onSelect}
            onPreviewPage={onPreviewPage}
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
            className="h-full rounded-full"
            style={{ background: editorFunnelProgressFillGradient }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="scroll-smooth">
        <TemplatePageList
          activeId={activeId}
          onSelect={onSelect}
          onPreviewPage={onPreviewPage}
          compact={compact}
        />
      </div>
    </aside>
  );
}
