"use client";

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
} from "@/app/components/crm-template-editor/editor-layout";

export function EditorShell({
  navbar,
  leftSidebar,
  canvas,
  settingsPanel,
  assistantPanel,
  assistantLauncher,
  embedded = false,
}: {
  navbar?: ReactNode;
  leftSidebar?: ReactNode;
  canvas: ReactNode;
  settingsPanel: ReactNode;
  assistantPanel?: ReactNode;
  assistantLauncher?: ReactNode;
  embedded?: boolean;
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

  const grid = (
    <div className={gridClass}>
      {leftSidebar ? <div className={sidebarClass}>{leftSidebar}</div> : null}
      {!embedded && navbar ? (
        <div className={editorNavbarSlotClass}>{navbar}</div>
      ) : null}
      <div className={canvasClass}>{canvas}</div>
      <div className={`${settingsClass} relative`}>
        <div
          className={
            hasAssistant
              ? "pointer-events-none invisible h-full min-h-0 min-w-0"
              : "h-full min-h-0 min-w-0"
          }
          aria-hidden={hasAssistant}
        >
          {settingsPanel}
        </div>
        {hasAssistant ? (
          <div className="absolute inset-0 z-30 flex min-h-0 min-w-0 flex-col overflow-hidden bg-white [&>aside]:h-full [&>aside]:min-h-0 [&>aside]:min-w-0 [&>aside]:w-full">
            {assistantPanel}
          </div>
        ) : null}
        {!hasAssistant && assistantLauncher ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
            <div className="pointer-events-auto">{assistantLauncher}</div>
          </div>
        ) : null}
      </div>
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
