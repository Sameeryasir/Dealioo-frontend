"use client";

import { Filter } from "lucide-react";
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

  const header = (
    <div className="shrink-0 border-b border-[#eef2f7] bg-white px-3.5 py-3.5 sm:px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]">
          <Filter className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          Funnel Builder
        </p>
      </div>

      <p className="m-0 mt-3 text-[1.05rem] font-extrabold leading-tight tracking-tight text-[#0e182b]">
        Step {stepIndex + 1} of {order.length}
      </p>

      <p className="m-0 mt-2 text-[0.76rem] font-medium text-slate-500">
        Build your customer journey
      </p>
    </div>
  );

  if (compact) {
    return (
      <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-none">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <TemplatePageList
            activeId={activeId}
            onSelect={onSelect}
            onPreviewPage={onPreviewPage}
            compact={compact}
            pageOrder={order}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 w-full max-w-full flex-col border-r border-[#e8edf5] bg-white">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-3 sm:px-3.5">
        <TemplatePageList
          activeId={activeId}
          onSelect={onSelect}
          onPreviewPage={onPreviewPage}
          compact={compact}
          pageOrder={order}
        />
      </div>
    </aside>
  );
}
