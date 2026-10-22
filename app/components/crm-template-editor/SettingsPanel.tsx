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

export function SettingsPanel({
  page,
  onChange,
  onBrowseTemplates,
  toolbar,
  embedded = false,
  contentFocus = null,
  onContentFocusChange,
  forceOpenSection = null,
}: {
  page: TemplatePage;
  onChange: (patch: TemplatePagePatch) => void;
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
        <div className="min-w-0">
          <span className="text-[0.72rem] font-extrabold text-[#0e182b]">
            Page settings
          </span>
          <span className="mt-0.5 block text-[0.68rem] font-medium text-slate-500">
            Template, content, media & sections
          </span>
        </div>
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

  if (embedded) {
    return (
      <aside
        className={`${shellClass} w-[17.5rem] max-w-[17.5rem] shrink-0 bg-white`}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          {toolbar ? (
            <div className={editorPanelTopShellClass}>{toolbar}</div>
          ) : null}
          {inspectorBody}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${shellClass} w-[15.5rem] max-w-[15.5rem] shrink-0`}>
      {toolbar ? (
        <div className="shrink-0 border-b border-[#e8edf5] bg-white px-3 py-2.5">
          {toolbar}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {inspectorBody}
      </div>
    </aside>
  );
}
