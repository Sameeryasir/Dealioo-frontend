"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminPanelSidebar from "@/app/components/AdminPanelSidebar";
import BusinessNavbar from "@/app/components/BusinessNavbar";
import {
  SidebarExpandProvider,
  useSidebarExpand,
} from "@/app/contexts/sidebar-expand-context";
import { isAdsTrackingPath } from "@/app/lib/ads-tracking-route";
import { isAutomationBuilderPath } from "@/app/lib/automation-builder-route";
import { isCampaignImmersivePath } from "@/app/lib/campaign-immersive-route";
import { isGoogleAdsPath } from "@/app/lib/google-ads-route";
import { isGuestChatsPath } from "@/app/lib/guest-chats-route";
import { isMembersPath } from "@/app/lib/members-route";
import { isMetaAdsPath } from "@/app/lib/meta-ads-route";
import { isProgramPath } from "@/app/lib/program-route";

function DashboardShellInner({ children }: { children: ReactNode }) {
  const { expanded } = useSidebarExpand();
  const pathname = usePathname();
  const immersiveCampaign = isCampaignImmersivePath(pathname);
  const guestChatsFullPage = isGuestChatsPath(pathname);
  const metaAdsFullPage = isMetaAdsPath(pathname);
  const adsTrackingFullPage = isAdsTrackingPath(pathname);
  const programFullPage = isProgramPath(pathname);
  const membersFullPage = isMembersPath(pathname);
  const googleAdsFullPage = isGoogleAdsPath(pathname);
  const automationBuilder = isAutomationBuilderPath(pathname);
  const hideAppSidebar = automationBuilder;

  return (
    <div
      className={`rd-shell rd-shell--app ${
        immersiveCampaign ? "rd-shell--campaign-immersive" : ""
      } ${guestChatsFullPage ? "rd-shell--guest-chats" : ""} ${
        metaAdsFullPage ? "rd-shell--meta-ads" : ""
      } ${adsTrackingFullPage ? "rd-shell--ads-tracking" : ""} ${
        programFullPage ? "rd-shell--program" : ""
      } ${membersFullPage ? "rd-shell--members" : ""} ${
        googleAdsFullPage ? "rd-shell--google-ads" : ""
      } ${automationBuilder ? "rd-shell--automation-builder" : ""}`}
    >
      <div
        className={`rd-shell-frame ${
          hideAppSidebar
            ? "rd-shell-frame--sidebar-hidden"
            : expanded
              ? "rd-shell-frame--sidebar-expanded"
              : "rd-shell-frame--sidebar-collapsed"
        }`}
      >
        {hideAppSidebar ? null : <AdminPanelSidebar />}
        <div className="rd-shell-column">
          {immersiveCampaign ? (
            <div
              id="campaign-immersive-patti-host"
              className="campaign-immersive-patti"
            />
          ) : (
            <BusinessNavbar />
          )}
          <main
            className={`rd-main-scroll ${
              immersiveCampaign ? "rd-main-scroll--campaign-immersive" : ""
            } ${
              guestChatsFullPage ? "rd-main-scroll--guest-chats" : ""
            } ${
              metaAdsFullPage ? "rd-main-scroll--meta-ads" : ""
            } ${
              adsTrackingFullPage ? "rd-main-scroll--ads-tracking" : ""
            } ${
              programFullPage ? "rd-main-scroll--program" : ""
            } ${
              membersFullPage ? "rd-main-scroll--members" : ""
            } ${
              googleAdsFullPage ? "rd-main-scroll--google-ads" : ""
            } ${
              hideAppSidebar
                ? "rd-main-scroll--sidebar-hidden"
                : expanded
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
