"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid, Settings2, Workflow } from "lucide-react";
import {
  builderCanvasSlotClass,
  builderSettingsSlotClass,
  builderShellClass,
  builderShellGridClass,
  builderSidebarSlotClass,
} from "@/app/components/builder/builder-layout";

type MobilePane = "blocks" | "flow" | "settings";

const MOBILE_TABS: {
  id: MobilePane;
  label: string;
  icon: typeof Workflow;
}[] = [
  { id: "blocks", label: "Blocks", icon: LayoutGrid },
  { id: "flow", label: "Flow", icon: Workflow },
  { id: "settings", label: "Settings", icon: Settings2 },
];

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
  const [mobilePane, setMobilePane] = useState<MobilePane>("blocks");

  return (
    <div className={builderShellClass}>
      <div
        className="automation-builder-mobile-nav"
        role="tablist"
        aria-label="Builder panels"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mobilePane === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobilePane(tab.id)}
              className={`automation-builder-mobile-nav__tab ${
                active ? "is-active" : ""
              }`}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className={`${builderShellGridClass} automation-builder-grid--mobile-${mobilePane}`}
      >
        <div className={builderSidebarSlotClass}>{sidebar}</div>
        <div className={builderCanvasSlotClass}>{canvas}</div>
        <div className={builderSettingsSlotClass}>{settingsPanel}</div>
      </div>
      {overlay}
    </div>
  );
}
