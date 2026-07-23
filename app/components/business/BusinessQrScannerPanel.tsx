"use client";

import { ScanLine, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { ScannerCreateGuestPanel } from "@/app/components/business/ScannerCreateGuestPanel";
import { ScannerScanCodePanel } from "@/app/components/business/ScannerScanCodePanel";
import { ScannerSearchGuestPanel } from "@/app/components/business/ScannerSearchGuestPanel";

export const scannerCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

type ScannerTabId = "scan" | "search" | "create";

const SCANNER_TABS: Array<{
  id: ScannerTabId;
  label: string;
  icon: typeof ScanLine;
}> = [
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "search", label: "Search", icon: Search },
  { id: "create", label: "New Guest", icon: UserPlus },
];

function FilterPill({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof ScanLine;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.76rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)]"
          : "bg-white text-[#0e182b] ring-1 ring-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#1877f2] hover:ring-[#dbeafe]"
      }`}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}

export function BusinessQrScannerPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [activeTab, setActiveTab] = useState<ScannerTabId>("scan");
  const [hideScannerTabs, setHideScannerTabs] = useState(false);

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Scan and redeem">
      <div className="rd-premium-page">
        <article className={`${scannerCardClass} rd-premium-panel`}>
          {!hideScannerTabs ? (
            <div
              className="shrink-0 border-b border-[#e8edf5] bg-white pl-6 pr-5 pt-5 pb-3.5 sm:pl-7 sm:pr-6 sm:pt-5 sm:pb-4"
              aria-label="Scanner actions"
            >
              <div className="flex flex-wrap items-center gap-2" role="tablist">
                {SCANNER_TABS.map(({ id, label, icon }) => (
                  <FilterPill
                    key={id}
                    label={label}
                    icon={icon}
                    active={id === activeTab}
                    onClick={() => setActiveTab(id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={
              activeTab === "search"
                ? "rd-premium-panel__body flex min-h-0 flex-1 flex-col overflow-hidden p-0"
                : "rd-premium-panel__body min-h-0 flex-1 !block overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5"
            }
            role="tabpanel"
          >
            {activeTab === "scan" ? (
              <ScannerScanCodePanel
                businessId={businessId}
                onCreateGuest={() => setActiveTab("create")}
              />
            ) : null}

            {activeTab === "search" ? (
              <ScannerSearchGuestPanel
                businessId={businessId}
                onCreateGuest={() => setActiveTab("create")}
                onHideScannerTabsChange={setHideScannerTabs}
              />
            ) : null}

            {activeTab === "create" ? (
              <ScannerCreateGuestPanel businessId={businessId} />
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
