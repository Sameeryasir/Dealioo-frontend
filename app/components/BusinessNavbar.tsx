"use client";

import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { getSetupUser } from "@/app/lib/setup-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { ArrowLeft, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";

const ORG_DASHBOARD_HREF = "/dashboard";

export default function BusinessNavbar() {
  const { expanded: sidebarExpanded, toggle: toggleSidebar } = useSidebarExpand();
  const [user, setUser] = useState<VerifyOtpUser | null>(null);

  useEffect(() => {
    setUser(getSetupUser());
  }, []);

  const displayName = user?.name?.trim() || "Account";

  return (
    <header className="rd-topbar" aria-label="Dashboard tools">
      <div className="rd-topbar-inner relative flex h-[var(--rd-header-h)] items-center justify-between gap-2.5 sm:gap-3">
        <div className="rd-topbar-leading relative z-[2] flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#07111f] shadow-[0_4px_12px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#1877f2]/30 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
            aria-expanded={sidebarExpanded}
            aria-controls="rd-sidebar-nav"
            aria-label={sidebarExpanded ? "Close menu" : "Open menu"}
          >
            <PanelLeft className="size-4" strokeWidth={2.25} aria-hidden />
          </button>

          <Link
            href={ORG_DASHBOARD_HREF}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-[#e8edf5] bg-white px-2.5 py-1.5 text-[0.78rem] font-semibold text-[#07111f] shadow-[0_4px_12px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#1877f2]/30 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/25 sm:px-3 sm:text-[0.8125rem]"
            aria-label="Switch business — back to all businesses"
          >
            <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="truncate">Switch business</span>
          </Link>
        </div>

        <div
          id="automation-builder-topbar-center-host"
          className="automation-builder-topbar-center-host"
        />

        <div className="rd-topbar-trailing relative z-[2] flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div
            id="automation-builder-topbar-actions-host"
            className="automation-builder-topbar-actions-host flex items-center"
          />
          <div className="flex shrink-0 items-center">
            <div
              className="inline-flex rounded-full border border-[#e8edf5] bg-gradient-to-b from-white to-[#f8faff] p-1 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
              aria-label={`Signed in as ${displayName}`}
            >
              <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#e1306c] p-[2px] shadow-[0_4px_10px_rgba(24,119,242,0.22)]">
                <UserAccountAvatar user={user} className="size-full" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
