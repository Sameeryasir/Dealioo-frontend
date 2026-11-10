"use client";

import { FUNNEL_STEP_META } from "@/app/components/crm-template-editor/editor-ui/funnel-step-meta";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";
import { Eye, SlidersHorizontal } from "lucide-react";

export type FunnelEditorMobilePanel = "preview" | "settings";

export function FunnelEditorMobileChrome({
  activeId,
  pageOrder,
  onSelectStep,
  mobilePanel,
  onMobilePanelChange,
}: {
  activeId: TemplatePageId;
  pageOrder: TemplatePageId[];
  onSelectStep: (id: TemplatePageId) => void;
  mobilePanel: FunnelEditorMobilePanel;
  onMobilePanelChange: (panel: FunnelEditorMobilePanel) => void;
}) {
  const steps = FUNNEL_STEP_META.filter((step) => pageOrder.includes(step.id));

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 border-b border-[#e8edf5] bg-white px-2.5 py-2 lg:hidden">
      <div
        className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Funnel steps"
      >
        {steps.map((step, index) => {
          const active = step.id === activeId;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectStep(step.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.7rem] font-semibold transition ${
                active
                  ? "bg-[#1877f2] text-white shadow-sm"
                  : "bg-[#f4f7fb] text-slate-600 hover:bg-[#e8f1ff] hover:text-[#1877f2]"
              }`}
            >
              <span
                className={`inline-flex size-4 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              {step.title}
            </button>
          );
        })}
      </div>

      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-[#f4f7fb] p-1"
        role="tablist"
        aria-label="Editor panels"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "preview"}
          onClick={() => onMobilePanelChange("preview")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.72rem] font-bold transition ${
            mobilePanel === "preview"
              ? "bg-white text-[#1877f2] shadow-sm"
              : "text-slate-600"
          }`}
        >
          <Eye className="size-3.5" strokeWidth={2.25} aria-hidden />
          Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "settings"}
          onClick={() => onMobilePanelChange("settings")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.72rem] font-bold transition ${
            mobilePanel === "settings"
              ? "bg-white text-[#1877f2] shadow-sm"
              : "text-slate-600"
          }`}
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={2.25} aria-hidden />
          Edit
        </button>
      </div>
    </div>
  );
}
