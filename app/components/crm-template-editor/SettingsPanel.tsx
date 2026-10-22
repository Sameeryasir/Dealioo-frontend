"use client";

import type { ReactNode } from "react";
import {
  editorPanelTopShellClass,
  editorSettingsPanelShellClass,
  editorSettingsPanelShellEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";
import { TemplateEditorSidebar } from "@/app/components/crm-template-editor/TemplateEditorSidebar";
import type { EditorContentFocus } from "@/app/components/crm-template-editor/editor-selection";
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
  contentFocus = null,
  onContentFocusChange,
  forceOpenSection = null,
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
  open: boolean;
  onBrowseTemplates?: () => void;
  toolbar?: ReactNode;
  embedded?: boolean;
  contentFocus?: EditorContentFocus;
  onContentFocusChange?: (focus: EditorContentFocus) => void;
  forceOpenSection?:
    | "templates"
    | "sections"
    | "content"
    | "media"
    | "form"
    | "checkout-templates"
    | "style"
    | null;
}) {
  const shellClass = embedded
    ? editorSettingsPanelShellEmbeddedClass
    : editorSettingsPanelShellClass;

  const inspectorBody = (
    <>
      <div className="shrink-0 border-b border-[#eef2f7] px-3 py-2.5">
        <span className="text-[0.72rem] font-extrabold text-[#0e182b]">
          Page settings
        </span>
        <span className="mt-0.5 block text-[0.68rem] font-medium text-slate-500">
          Template, content, media & sections
        </span>
      </div>
      <div
        className={
          embedded
            ? "editor-settings-scroll editor-settings-scroll--embedded min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-2.5 py-2"
            : "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-2 py-2"
        }
      >
        <TemplateEditorSidebar
          page={page}
          onChange={onChange}
          onBrowseTemplates={onBrowseTemplates}
          stackedLayout={embedded}
          stackFillHeight={embedded}
          contentFocus={contentFocus}
          onContentFocusChange={onContentFocusChange}
          forceOpenSection={forceOpenSection}
        />
      </div>
    </>
  );

  const emptyState = (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#1877f2]/15">
        <SlidersHorizontal className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="m-0 text-[0.8rem] font-extrabold text-[#07111f]">
        Customize your page
      </p>
      <p className="m-0 text-[0.7rem] font-medium leading-relaxed text-slate-500">
        Pick a step to edit page settings.
      </p>
    </div>
  );

  if (embedded) {
    return (
      <aside className={`${shellClass} w-full bg-white`}>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          {toolbar ? (
            <div className={editorPanelTopShellClass}>{toolbar}</div>
          ) : null}
          {open ? inspectorBody : emptyState}
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
      {open ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          {inspectorBody}
        </div>
      ) : (
        emptyState
      )}
    </aside>
  );
}
