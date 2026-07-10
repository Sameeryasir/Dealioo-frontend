"use client";

import type { ReactNode } from "react";
import {
  editorSettingsPanelScrollClass,
  editorSettingsPanelShellClass,
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
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
  open: boolean;
  onBrowseTemplates?: () => void;
  toolbar?: ReactNode;
}) {
  const shellClass = editorSettingsPanelShellClass;

  if (!open) {
    return (
      <aside className={shellClass}>
        {toolbar ? (
          <div className="shrink-0 border-b border-[#e8edf5] bg-white px-3 py-2.5">
            {toolbar}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/15">
            <SlidersHorizontal className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="m-0 text-[0.82rem] font-extrabold text-[#07111f]">
            Customize your page
          </p>
          <p className="m-0 max-w-[14rem] text-[0.72rem] font-medium leading-relaxed text-slate-500">
            Pick a funnel step and tap the pencil to edit content, media, and
            layout.
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
      <div className="shrink-0 border-b border-[#e8edf5] px-2.5 py-1.5">
        <span className="inline-flex items-center rounded-full bg-[#1877f2]/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          Page settings
        </span>
      </div>
      <div className={editorSettingsPanelScrollClass}>
        <TemplateEditorSidebar
          page={page}
          onChange={onChange}
          onBrowseTemplates={onBrowseTemplates}
        />
      </div>
    </aside>
  );
}
