"use client";

import SuperAdminSidebar from "@/app/components/SuperAdminSidebar";
import SuperAdminTopBar from "@/app/components/SuperAdminTopBar";
import {
  SidebarExpandProvider,
  useSidebarExpand,
} from "@/app/contexts/sidebar-expand-context";
import type { ReactNode } from "react";

function SuperAdminShellInner({ children }: { children: ReactNode }) {
  const { expanded } = useSidebarExpand();

  return (
    <div className="rd-shell rd-shell--app">
      <div
        className={`rd-shell-frame ${
          expanded
            ? "rd-shell-frame--sidebar-expanded"
            : "rd-shell-frame--sidebar-collapsed"
        }`}
      >
        <SuperAdminSidebar />
        <div className="rd-shell-column">
          <SuperAdminTopBar />
          <main
            className={`rd-main-scroll ${
              expanded
                ? "rd-main-scroll--sidebar-expanded"
                : "rd-main-scroll--sidebar-collapsed"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarExpandProvider>
      <SuperAdminShellInner>{children}</SuperAdminShellInner>
    </SidebarExpandProvider>
  );
}
