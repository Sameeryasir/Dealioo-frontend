"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Megaphone,
  Shield,
  type LucideIcon,
} from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import {
  META_ADS_PERMISSION_OPTIONS,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";

type MetaAdsPermissionConsentProps = {
  selectedScopes: MetaSelectableScopeId[];
  onChange: (scopes: MetaSelectableScopeId[]) => void;
  disabled?: boolean;
};

const PERMISSION_VISUALS: Record<
  MetaSelectableScopeId,
  { Icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  ads_read: {
    Icon: BarChart3,
    iconWrap: "bg-[#e8f1ff]",
    iconColor: "text-[#1877F2]",
  },
  ads_management: {
    Icon: Megaphone,
    iconWrap: "bg-[#eaf8ef]",
    iconColor: "text-[#22c55e]",
  },
};

export function MetaAdsPermissionConsent({
  selectedScopes,
  onChange,
  disabled = false,
}: MetaAdsPermissionConsentProps) {
  const selected = new Set(selectedScopes);
  const [expandedId, setExpandedId] = useState<MetaSelectableScopeId | null>(
    null,
  );

  const toggle = (id: MetaSelectableScopeId) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(
      META_ADS_PERMISSION_OPTIONS.map((opt) => opt.id).filter((scopeId) =>
        next.has(scopeId),
      ),
    );
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-start gap-2.5">
        <Shield
          className="mt-0.5 size-[18px] shrink-0 text-[#1877F2]"
          strokeWidth={2}
          aria-hidden
        />
        <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] leading-snug text-[#1c1e21]">
          <DealiooLogo
            src="/black-logo.png"
            className="inline-block h-[15px] w-auto"
            width={562}
            height={144}
          />
          <span>will request the following permissions from Meta:</span>
        </p>
      </div>

      <ul className="m-0 list-none space-y-2.5 p-0" role="list">
        {META_ADS_PERMISSION_OPTIONS.map((opt) => {
          const checked = selected.has(opt.id);
          const expanded = expandedId === opt.id;
          const visual = PERMISSION_VISUALS[opt.id];
          const { Icon } = visual;
          const checkboxId = `meta-perm-${opt.id}`;

          return (
            <li key={opt.id}>
              <div
                className={`rounded-xl border bg-white transition-colors ${
                  checked ? "border-[#1877F2]/45" : "border-[#dadde1]"
                }`}
              >
                <div className="flex items-start gap-3 px-3.5 py-3.5">
                  <span
                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${visual.iconWrap}`}
                    aria-hidden
                  >
                    <Icon className={`size-5 ${visual.iconColor}`} strokeWidth={2} />
                  </span>

                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(opt.id)}
                    className="mt-2.5 size-4 shrink-0 cursor-pointer rounded-[3px] border-[#ccd0d5] accent-[#1877F2] disabled:cursor-not-allowed"
                  />

                  <label
                    htmlFor={checkboxId}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="block text-[15px] font-semibold leading-snug text-[#1c1e21]">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-[#65676b]">
                      {opt.description}
                    </span>
                  </label>

                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Hide details for ${opt.title}`
                        : `Show details for ${opt.title}`
                    }
                    disabled={disabled}
                    onClick={() =>
                      setExpandedId((current) =>
                        current === opt.id ? null : opt.id,
                      )
                    }
                    className="mt-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8a8d91] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21] disabled:cursor-not-allowed"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>

                {expanded ? (
                  <div className="border-t border-[#e4e6eb] px-3.5 py-3 text-[13px] leading-relaxed text-[#65676b]">
                    {opt.tooltip}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
