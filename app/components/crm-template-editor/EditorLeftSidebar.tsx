"use client";

import {
  FUNNEL_PAGE_ORDER,
  TemplatePageList,
} from "@/app/components/crm-template-editor/TemplatePageList";
import { FUNNEL_STEP_META } from "@/app/components/crm-template-editor/editor-ui/funnel-step-meta";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";

export function EditorLeftSidebar({
  activeId,
  onSelect,
  onPreviewPage,
  compact = false,
  pageOrder = FUNNEL_PAGE_ORDER,
  collapsed: collapsedProp,
  onCollapsedChange,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onPreviewPage?: (id: TemplatePageId) => void;
  compact?: boolean;
  pageOrder?: TemplatePageId[];
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const order = pageOrder.length > 0 ? pageOrder : FUNNEL_PAGE_ORDER;
  const stepIndex = Math.max(0, order.indexOf(activeId));
  const steps = FUNNEL_STEP_META.filter((step) => order.includes(step.id));
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;
  const setCollapsed = (next: boolean) => {
    onCollapsedChange?.(next);
    if (collapsedProp === undefined) setCollapsedInternal(next);
  };

  if (collapsed) {
    return (
      <aside className="flex h-full min-h-0 w-12 shrink-0 flex-col items-center gap-1.5 bg-white py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="mb-1 flex size-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
        <nav className="flex w-full flex-col items-center gap-1.5" aria-label="Funnel steps">
          {steps.map((step) => {
            const Icon = step.icon;
            const selected = activeId === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(step.id)}
                title={step.title}
                aria-label={step.title}
                aria-current={selected ? "page" : undefined}
                className={`flex size-9 items-center justify-center rounded-lg transition ${
                  selected
                    ? "bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            );
          })}
        </nav>
      </aside>
    );
  }

  const header = (
    <div className="shrink-0 border-b border-[#eef2f7] bg-white px-3.5 py-3.5 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]">
            <Filter className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Funnel Builder
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <p className="m-0 mt-3 text-[1.05rem] font-extrabold leading-tight tracking-tight text-[#0e182b]">
        Step {stepIndex + 1} of {order.length}
      </p>

      <p className="m-0 mt-2 text-[0.76rem] font-medium text-slate-500">
        Build your customer journey
      </p>
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
      <aside className="flex h-full min-h-0 w-[17.5rem] max-w-[17.5rem] shrink-0 flex-col overflow-hidden bg-white">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{pageList}</div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 w-[17.5rem] max-w-[17.5rem] shrink-0 flex-col bg-white">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-3 sm:px-3.5">
        {pageList}
      </div>
    </aside>
  );
}
