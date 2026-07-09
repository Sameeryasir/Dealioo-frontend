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
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.75rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
          : "bg-[#f4f7fb] text-slate-800 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
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

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Scan and redeem">
      <div className="rd-premium-page">
        <header className="shrink-0 px-0.5">
          <h1 className="m-0 text-[clamp(1.15rem,2vw,1.45rem)] font-extrabold tracking-tight text-black">
            Scan &amp; Redeem
          </h1>
          <p className="m-0 mt-1 max-w-[42ch] text-[0.8rem] font-medium leading-snug text-slate-700">
            Scan a pass, search for a guest, or create a new guest profile.
          </p>
        </header>

        <article className={`${scannerCardClass} rd-premium-panel`}>
          <div
            className="flex shrink-0 flex-col gap-3 border-b border-[#e8edf5] px-4 py-3.5 sm:px-5"
            aria-label="Scanner actions"
          >
            <div
              className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
            >
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

            <div>
              <h2 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-black">
                {activeTab === "scan"
                  ? "Scan QR code"
                  : activeTab === "search"
                    ? "Find a guest"
                    : "Add a guest"}
              </h2>
              <p className="m-0 mt-0.5 text-[0.72rem] font-semibold text-slate-700">
                {activeTab === "scan"
                  ? "Use your camera to redeem a customer pass."
                  : activeTab === "search"
                    ? "Search by name, email, or phone."
                    : "Create a profile, then attach deals at the counter."}
              </p>
            </div>
          </div>

          <div
            className={`rd-premium-panel__body px-4 py-4 sm:px-5 sm:py-5${
              activeTab === "scan" ? " rd-premium-panel__body--center" : ""
            }`}
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
