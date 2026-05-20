"use client";

import type { ReactNode } from "react";
import {
  builderCanvasSlotClass,
  builderSettingsSlotClass,
  builderShellClass,
  builderShellGridClass,
  builderSidebarSlotClass,
} from "@/app/components/builder/builder-layout";

export function BuilderShell({
  sidebar,
  canvas,
  settingsPanel,
  overlay,
}: {
  sidebar: ReactNode;
  canvas: ReactNode;
  settingsPanel: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className={builderShellClass}>
      <div className={builderShellGridClass}>
        <div className={builderSidebarSlotClass}>{sidebar}</div>
        <div className={builderCanvasSlotClass}>{canvas}</div>
        <div className={builderSettingsSlotClass}>{settingsPanel}</div>
      </div>
      {overlay}
    </div>
  );
}
