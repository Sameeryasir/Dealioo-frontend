"use client";

import { CampaignHeaderAccountMenu } from "@/app/components/campaign/CampaignHeaderAccountMenu";
import { CampaignHeaderTabs } from "@/app/components/campaign/CampaignHeaderTabs";
import {
  formatCampaignHeaderPrice,
  parseCampaignHeaderPrice,
} from "@/app/components/campaign/campaign-header-utils";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { campaignDashboardTabFromPathname } from "@/app/lib/campaign-dashboard-tab";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import { ArrowLeft, PanelLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const BusinessNotifications = dynamic(
  () => import("@/app/components/BusinessNotifications"),
  { ssr: false },
);

export type CampaignHeaderProps = {
  businessId: number;
  campaignId?: number;
  offer?: string;
  price?: number | string;
  campaign?: Funnel | null;
  embedded?: boolean;
};

export default function CampaignHeader({
  businessId,
  campaignId,
  offer,
  price,
  campaign,
  embedded = false,
}: CampaignHeaderProps) {
  const pathname = usePathname();
  const { can, permissionList, isOwnerLike } =
    useBusinessMembershipPermissions(businessId);
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpand();

  const campaignsHref = `/business/${businessId}/dashboard/campaigns`;
  const offerLine = offer?.trim() ?? "";
  const priceText = useMemo(() => {
    const n = parseCampaignHeaderPrice(price);
    return n != null ? formatCampaignHeaderPrice(n) : null;
  }, [price]);
  const offerPriceLine = useMemo(() => {
    const parts = [offerLine, priceText].filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(".");
  }, [offerLine, priceText]);
  const campaignTitle =
    campaign?.campaignName?.trim() || offerPriceLine || "Campaign";

  const activeTabId =
    campaignId != null
      ? campaignDashboardTabFromPathname(pathname, businessId, campaignId)
      : "overview";

  const tabs = (
    <CampaignHeaderTabs
      businessId={businessId}
      campaignId={campaignId}
      activeTabId={activeTabId}
      immersive={embedded}
      campaignsHref={campaignsHref}
      isOwnerLike={isOwnerLike}
      can={can}
      permissionList={permissionList}
    />
  );

  return (
    <header
      className={
        embedded
          ? "campaign-immersive-patti__header shrink-0"
          : "shrink-0 border-b border-zinc-200 bg-white"
      }
    >
      {embedded ? (
        <div className="campaign-immersive-patti__inner">
          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--start gap-2">
            {activeTabId === "automations" ? null : (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                aria-expanded={sidebarExpanded}
                aria-controls="rd-sidebar-nav"
                aria-label={sidebarExpanded ? "Close menu" : "Open menu"}
              >
                <PanelLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
              </button>
            )}
            <Link
              href={campaignsHref}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
              aria-label="Back to campaigns"
            >
              <ArrowLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
            </Link>
            <div className="campaign-immersive-patti__side-title min-w-0 flex-1 md:max-w-[14rem] md:flex-none">
              <p
                className="m-0 truncate text-[0.78rem] font-extrabold tracking-tight text-[#07111f] md:text-[0.8rem] xl:text-[0.88rem]"
                title={campaignTitle}
              >
                {campaignTitle}
              </p>
              {offerPriceLine ? (
                <p className="m-0 truncate text-[0.62rem] font-medium text-slate-500 md:text-[0.65rem]">
                  {offerPriceLine}
                </p>
              ) : null}
            </div>
          </div>

          {tabs}

          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--end shrink-0 gap-1.5">
            <BusinessNotifications />
            <CampaignHeaderAccountMenu />
          </div>
        </div>
      ) : (
        <>
          <div className="flex w-full flex-nowrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <Link
                href={campaignsHref}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-[#f8fafc] text-[#07111f] outline-none transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                aria-label="Back to campaigns"
              >
                <ArrowLeft className="size-4" aria-hidden strokeWidth={2.25} />
              </Link>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-left text-[0.95rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.05rem]">
                  {campaignTitle}
                </p>
                {offerPriceLine && campaign?.campaignName?.trim() ? (
                  <p className="truncate text-left text-[0.72rem] font-medium text-slate-500 sm:text-[0.78rem]">
                    {offerPriceLine}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <BusinessNotifications />
              <CampaignHeaderAccountMenu />
            </div>
          </div>
          {tabs}
        </>
      )}
    </header>
  );
}
