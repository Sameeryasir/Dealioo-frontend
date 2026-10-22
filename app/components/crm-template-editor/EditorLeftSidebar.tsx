"use client";

import {
  FUNNEL_PAGE_ORDER,
  TemplatePageList,
} from "@/app/components/crm-template-editor/TemplatePageList";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";
import { Filter } from "lucide-react";

export function EditorLeftSidebar({
  activeId,
  onSelect,
  onPreviewPage,
  compact = false,
  pageOrder = FUNNEL_PAGE_ORDER,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onPreviewPage?: (id: TemplatePageId) => void;
  compact?: boolean;
  pageOrder?: TemplatePageId[];
}) {
  const order = pageOrder.length > 0 ? pageOrder : FUNNEL_PAGE_ORDER;
  const stepIndex = Math.max(0, order.indexOf(activeId));
  const progress = ((stepIndex + 1) / order.length) * 100;

  const header = (
    <div className="relative shrink-0 overflow-hidden border-b border-[#eef2f7] bg-gradient-to-b from-[#f8faff] to-white px-3.5 py-3.5 sm:px-4">
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-[#1877f2]/[0.06]"
        aria-hidden
      />
      <div className="relative flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_16px_rgba(24,119,242,0.28)]">
          <Filter className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400">
            Funnel builder
          </p>
          <p className="m-0 mt-1 text-[1.02rem] font-bold leading-tight tracking-tight text-[#0e182b]">
            Step {stepIndex + 1} of {order.length}
          </p>
        </div>
      </div>

      <div className="relative mt-3.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1877f2] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="m-0 mt-2 text-[0.72rem] font-medium text-slate-500">
          Build your customer journey
        </p>
      </div>
    </div>
  );

  const pageList = (
    <TemplatePageList
      activeId={activeId}
      onSelect={onSelect}
      onPreviewPage={onPreviewPage}
      compact={compact}
      pageOrder={order}
    />
  );

  if (compact) {
    return (
      <aside className="flex h-full min-h-0 w-[17.5rem] max-w-[17.5rem] shrink-0 flex-col overflow-hidden border-r border-[#e8edf5] bg-white">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfcfe] px-3 py-3.5">
          {pageList}
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 w-[17.5rem] max-w-[17.5rem] shrink-0 flex-col border-r border-[#e8edf5] bg-white">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth bg-[#fbfcfe] px-3 py-3.5 sm:px-3.5">
        {pageList}
      </div>
    </aside>
  );
}
