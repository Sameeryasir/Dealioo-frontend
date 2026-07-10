"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminPanelSidebar from "@/app/components/AdminPanelSidebar";
import BusinessNavbar from "@/app/components/BusinessNavbar";
import {
  SidebarExpandProvider,
  useSidebarExpand,
} from "@/app/contexts/sidebar-expand-context";
import { isCampaignImmersivePath } from "@/app/lib/campaign-immersive-route";

function DashboardShellInner({ children }: { children: ReactNode }) {
  const { expanded } = useSidebarExpand();
  const pathname = usePathname();
  const immersiveCampaign = isCampaignImmersivePath(pathname);

  return (
    <div
      className={`rd-shell rd-shell--app ${
        immersiveCampaign ? "rd-shell--campaign-immersive" : ""
      }`}
    >
      <div
        className={`rd-shell-frame ${expanded ? "rd-shell-frame--sidebar-expanded" : "rd-shell-frame--sidebar-collapsed"}`}
      >
        <AdminPanelSidebar />
        <div className="rd-shell-column">
          {immersiveCampaign ? null : <BusinessNavbar />}
          <main
            className={`rd-main-scroll ${
              immersiveCampaign ? "rd-main-scroll--campaign-immersive" : ""
            } ${expanded ? "rd-main-scroll--sidebar-expanded" : "rd-main-scroll--sidebar-collapsed"}`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function BusinessDashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarExpandProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarExpandProvider>
  );
}
