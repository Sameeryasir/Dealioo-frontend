"use client";

import { ScannerCreateGuestPanel } from "@/app/components/business/ScannerCreateGuestPanel";
import { ScannerSearchGuestPanel } from "@/app/components/business/ScannerSearchGuestPanel";
import { type ScanningTabId } from "@/app/lib/scanning-routes";
import { scannerShellClass } from "@/app/lib/scanner-ui";
import { ScanLine, Search, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

export const scannerCardClass = scannerShellClass;

const SCANNER_TABS: Array<{
  id: ScanningTabId;
  label: string;
  icon: typeof ScanLine;
}> = [
  { id: "scan", label: "Scan QR", icon: ScanLine },
  { id: "search", label: "Search Guest", icon: Search },
  { id: "create", label: "New Guest", icon: UserPlus },
];

const ScannerScanCodePanel = dynamic(
  () =>
    import("@/app/components/business/ScannerScanCodePanel").then(
      (mod) => mod.ScannerScanCodePanel,
    ),
  { ssr: false },
);

function ScannerNavTab({
  active,
  label,
  icon: Icon,
  onSelect,
}: {
  active: boolean;
  label: string;
  icon: typeof ScanLine;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-[0.8rem] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1777f2] ${
        active
          ? "bg-[#1777f2] text-white shadow-[0_8px_20px_rgba(23,119,242,0.28)]"
          : "bg-white text-[#0e182b] ring-1 ring-[#e2e8f0] hover:bg-[#e8f1ff] hover:text-[#1777f2] hover:ring-[#dbeafe]"
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
  const [activeTab, setActiveTab] = useState<ScanningTabId>("scan");
  const [hideScannerTabs, setHideScannerTabs] = useState(false);

  return (
    <section
      className="rd-premium rd-premium--fill"
      aria-label="Scan and redeem"
    >
      <div className="rd-premium-page">
        <article className={`${scannerShellClass} rd-premium-panel`}>
          {!hideScannerTabs ? (
            <div
              className="shrink-0 border-b border-[#eef2f7] bg-gradient-to-r from-[#f8fafc] via-white to-[#f4f8ff] px-5 pt-4 pb-3.5 sm:px-6 sm:pt-4 sm:pb-4"
              aria-label="Scanner navigation"
            >
              <div className="flex flex-wrap items-center gap-2" role="tablist">

                {SCANNER_TABS.map(({ id, label, icon }) => (
                  <ScannerNavTab
                    key={id}
                    label={label}
                    icon={icon}
                    active={id === activeTab}
                    onSelect={() => setActiveTab(id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={
              activeTab === "search"
                ? "rd-premium-panel__body flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] p-0 2xl:justify-center"
                : "rd-premium-panel__body flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#f8fafc] px-4 py-4 sm:px-5 sm:py-5 2xl:justify-center"
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
