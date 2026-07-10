"use client";

import type { ReactNode } from "react";
import {
  editorCanvasSlotClass,
  editorCanvasSlotEmbeddedClass,
  editorNavbarSlotClass,
  editorSettingsSlotClass,
  editorSettingsSlotEmbeddedClass,
  editorShellClass,
  editorShellGridClass,
  editorShellGridEmbeddedClass,
  editorSidebarSlotClass,
  editorSidebarSlotEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-layout";

export function EditorShell({
  navbar,
  leftSidebar,
  canvas,
  settingsPanel,
  embedded = false,
}: {
  navbar?: ReactNode;
  leftSidebar?: ReactNode;
  canvas: ReactNode;
  settingsPanel: ReactNode;
  embedded?: boolean;
}) {
  const gridClass = embedded ? editorShellGridEmbeddedClass : editorShellGridClass;
  const sidebarClass = embedded
    ? editorSidebarSlotEmbeddedClass
    : editorSidebarSlotClass;
  const canvasClass = embedded ? editorCanvasSlotEmbeddedClass : editorCanvasSlotClass;
  const settingsClass = embedded
    ? editorSettingsSlotEmbeddedClass
    : editorSettingsSlotClass;

  return (
    <div className={editorShellClass}>
      <div className={gridClass}>
        {leftSidebar ? <div className={sidebarClass}>{leftSidebar}</div> : null}
        {!embedded && navbar ? (
          <div className={editorNavbarSlotClass}>{navbar}</div>
        ) : null}
        <div className={canvasClass}>{canvas}</div>
        <div className={settingsClass}>{settingsPanel}</div>
      </div>
    </div>
  );
}
