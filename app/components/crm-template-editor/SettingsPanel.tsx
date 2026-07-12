"use client";

import type { ReactNode } from "react";
import {
  editorPremiumCardClass,
  editorPanelTopShellClass,
  editorSettingsPanelShellClass,
  editorSettingsPanelShellEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";
import { TemplateEditorSidebar } from "@/app/components/crm-template-editor/TemplateEditorSidebar";
import type {
  TemplatePage,
  TemplatePagePatch,
} from "@/app/components/crm-template-editor/template-types";
import { SlidersHorizontal } from "lucide-react";

export function SettingsPanel({
  page,
  onChange,
  open,
  onBrowseTemplates,
  toolbar,
  embedded = false,
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
  open: boolean;
  onBrowseTemplates?: () => void;
  toolbar?: ReactNode;
  embedded?: boolean;
}) {
  const shellClass = embedded
    ? editorSettingsPanelShellEmbeddedClass
    : editorSettingsPanelShellClass;

  if (embedded) {
    if (!open) {
      return (
        <aside className={`${shellClass} w-full`}>
          <div className={`${editorPremiumCardClass} flex min-h-0 w-full flex-1 flex-col`}>
            {toolbar ? (
              <div className={editorPanelTopShellClass}>
                {toolbar}
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                <SlidersHorizontal className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <p className="m-0 text-[0.8rem] font-extrabold text-[#07111f]">
                Customize your page
              </p>
              <p className="m-0 text-[0.7rem] font-medium leading-relaxed text-slate-500">
                Pick a step and tap edit.
              </p>
            </div>
          </div>
        </aside>
      );
    }

    return (
      <aside className={`${shellClass} w-full`}>
        <div
          className={`${editorPremiumCardClass} flex min-h-0 w-full flex-1 flex-col`}
        >
          {toolbar ? (
            <div className={editorPanelTopShellClass}>
              {toolbar}
            </div>
          ) : null}
          <div className="shrink-0 border-b border-slate-200 px-3 py-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Page settings
            </span>
          </div>
          <div className="editor-settings-scroll editor-settings-scroll--embedded min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2">
            <TemplateEditorSidebar
              page={page}
              onChange={onChange}
              onBrowseTemplates={onBrowseTemplates}
              stackedLayout
              stackFillHeight
            />
          </div>
        </div>
      </aside>
    );
  }

  if (!open) {
    return (
      <aside className={shellClass}>
        {toolbar ? (
          <div className="shrink-0 border-b border-[#e8edf5] bg-white px-3 py-2.5">
            {toolbar}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/15">
            <SlidersHorizontal className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="m-0 text-[0.82rem] font-extrabold text-[#07111f]">
            Customize your page
          </p>
          <p className="m-0 max-w-[14rem] text-[0.72rem] font-medium leading-relaxed text-slate-500">
            Pick a funnel step to preview or edit.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={shellClass}>
      {toolbar ? (
        <div className="shrink-0 border-b border-[#e8edf5] bg-white px-3 py-2.5">
          {toolbar}
        </div>
      ) : null}
      <div className="shrink-0 border-b border-slate-200 px-3 py-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Page settings
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
        <TemplateEditorSidebar
          page={page}
          onChange={onChange}
          onBrowseTemplates={onBrowseTemplates}
        />
      </div>
    </aside>
  );
}
