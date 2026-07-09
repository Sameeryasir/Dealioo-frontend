"use client";

import type { ReactNode } from "react";
import AdminPanelSidebar from "@/app/components/AdminPanelSidebar";
import BusinessNavbar from "@/app/components/BusinessNavbar";

export function BusinessDashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rd-shell rd-shell--app">
      {/* Rounded workspace card — matches org-dashboard-workspace gaps/radius. */}
      <div className="rd-shell-frame">
        <AdminPanelSidebar />
        <div className="rd-shell-column">
          <BusinessNavbar />
          <main className="rd-main-scroll">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
