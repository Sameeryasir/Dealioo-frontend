import type { ReactNode } from "react";
import {
  editorCanvasSlotClass,
  editorCanvasSlotEmbeddedClass,
  editorNavbarSlotClass,
  editorSettingsSlotClass,
  editorSettingsSlotEmbeddedClass,
  editorShellClass,
  editorShellEmbeddedClass,
  editorShellGridAiOpenClass,
  editorShellGridClass,
  editorShellGridEmbeddedAiOpenClass,
  editorShellGridEmbeddedClass,
  editorShellGridWrapEmbeddedClass,
  editorSidebarSlotClass,
  editorSidebarSlotEmbeddedClass,
  editorWorkspaceToolbarSlotEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-layout";
import type { FunnelEditorMobilePanel } from "@/app/components/crm-template-editor/FunnelEditorMobileChrome";

export function EditorShell({
  navbar,
  workspaceToolbar,
  mobileChrome,
  leftSidebar,
  canvas,
  settingsPanel,
  assistantPanel,
  assistantLauncher,
  embedded = false,
  mobilePanel = "preview",
}: {
  navbar?: ReactNode;
  workspaceToolbar?: ReactNode;
  mobileChrome?: ReactNode;
  leftSidebar?: ReactNode;
  canvas: ReactNode;
  settingsPanel?: ReactNode;
  assistantPanel?: ReactNode;
  assistantLauncher?: ReactNode;
  embedded?: boolean;
  mobilePanel?: FunnelEditorMobilePanel;
}) {
  const hasAssistant = assistantPanel != null;
  const gridClass = embedded
    ? hasAssistant
      ? editorShellGridEmbeddedAiOpenClass
      : editorShellGridEmbeddedClass
    : hasAssistant
      ? editorShellGridAiOpenClass
      : editorShellGridClass;
  const shellClass = embedded ? editorShellEmbeddedClass : editorShellClass;
  const sidebarClass = embedded
    ? editorSidebarSlotEmbeddedClass
    : editorSidebarSlotClass;
  const canvasClass = embedded
    ? editorCanvasSlotEmbeddedClass
    : editorCanvasSlotClass;
  const settingsClass = embedded
    ? editorSettingsSlotEmbeddedClass
    : editorSettingsSlotClass;

  const mobilePreview = mobilePanel === "preview";
  const mobileSettings = mobilePanel === "settings";

  const grid = (
    <div
      className={`${gridClass} ${
        embedded
          ? mobilePreview
            ? "crm-editor-embedded-grid--mobile-preview"
            : "crm-editor-embedded-grid--mobile-settings"
          : ""
      }`}
    >
      {embedded && workspaceToolbar ? (
        <div className={editorWorkspaceToolbarSlotEmbeddedClass}>
          {workspaceToolbar}
          {mobileChrome}
        </div>
      ) : null}
      {leftSidebar ? <div className={sidebarClass}>{leftSidebar}</div> : null}
      {!embedded && navbar ? (
        <div className={editorNavbarSlotClass}>{navbar}</div>
      ) : null}
      <div
        className={`${canvasClass} ${
          embedded && mobileSettings ? "max-lg:hidden" : ""
        }`}
      >
        {canvas}
      </div>
      {settingsPanel != null || hasAssistant || assistantLauncher ? (
        <div
          className={`${settingsClass} relative ${
            embedded && mobileSettings ? "max-lg:!flex" : ""
          }`}
        >
          {settingsPanel != null ? (
            <div
              className={
                hasAssistant
                  ? "pointer-events-none invisible h-full min-h-0 min-w-0"
                  : "h-full min-h-0 min-w-0 w-full"
              }
              aria-hidden={hasAssistant}
            >
              {settingsPanel}
            </div>
          ) : null}
          {hasAssistant ? (
            <div className="absolute inset-0 z-30 flex min-h-0 min-w-0 flex-col overflow-hidden bg-white [&>aside]:h-full [&>aside]:min-h-0 [&>aside]:min-w-0 [&>aside]:w-full">
              {assistantPanel}
            </div>
          ) : null}
          {!hasAssistant && assistantLauncher ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 max-lg:hidden">
              <div className="pointer-events-auto">{assistantLauncher}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={shellClass}>
      {embedded ? (
        <div className={editorShellGridWrapEmbeddedClass}>{grid}</div>
      ) : (
        grid
      )}
    </div>
  );
}
