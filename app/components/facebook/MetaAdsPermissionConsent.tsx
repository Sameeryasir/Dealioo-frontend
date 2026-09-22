"use client";

import { useState } from "react";
import { ChevronDown, Shield } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import {
  META_ADS_PERMISSION_OPTIONS,
  toggleMetaSelectableScope,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";

type MetaAdsPermissionConsentProps = {
  selectedScopes: MetaSelectableScopeId[];
  onChange: (scopes: MetaSelectableScopeId[]) => void;
  disabled?: boolean;
  variant?: "default" | "compact";
};

export function MetaAdsPermissionConsent({
  selectedScopes,
  onChange,
  disabled = false,
  variant = "default",
}: MetaAdsPermissionConsentProps) {
  const selected = new Set(selectedScopes);
  const [expandedId, setExpandedId] = useState<MetaSelectableScopeId | null>(
    null,
  );
  const compact = variant === "compact";

  const toggle = (id: MetaSelectableScopeId) => {
    if (disabled) return;
    onChange(toggleMetaSelectableScope(selectedScopes, id));
  };

  if (compact) {
    return (
      <div className="space-y-2.5 sm:space-y-3">
        <p className="m-0 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Permissions
        </p>
        <ul className="m-0 list-none space-y-2 p-0 sm:space-y-2.5" role="list">
          {META_ADS_PERMISSION_OPTIONS.map((opt) => {
            const checked = selected.has(opt.id);
            const checkboxId = `meta-perm-compact-${opt.id}`;

            return (
              <li key={opt.id}>
                <label
                  htmlFor={checkboxId}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors sm:gap-3 sm:px-4 sm:py-3.5 ${
                    checked
                      ? "border-[#1877F2]/50 bg-[#F5F9FF]"
                      : "border-[#E8EDF5] bg-white hover:border-[#C5D8F6]"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(opt.id)}
                    className="mt-1 size-3.5 shrink-0 cursor-pointer rounded-[3px] border-[#ccd0d5] accent-[#1877F2] disabled:cursor-not-allowed sm:size-4"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-snug text-slate-900 sm:text-[15px]">
                      {opt.title}
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
                      {opt.description}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 sm:text-[12px]">
                      {opt.tooltip}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <p className="m-0 text-[16px] font-bold leading-snug text-[#1c1e21]">
          Choose Meta permissions
        </p>
        <div className="flex items-start gap-2.5">
          <Shield
            className="mt-0.5 size-[18px] shrink-0 text-[#1877F2]"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] leading-snug text-[#1c1e21]">
              <DealiooLogo
                src="/black-logo.png"
                className="inline-block h-[15px] w-auto"
                width={562}
                height={144}
              />
              <span>will request only what you check below:</span>
            </p>
            <p className="m-0 text-[13px] leading-snug text-[#65676b]">
              Tick one or more. ads_management pairs with pages_show_list.
              pages_read_engagement also selects ads_management and
              pages_show_list.
            </p>
          </div>
        </div>
      </div>

      <ul className="m-0 list-none space-y-2.5 p-0" role="list">
        {META_ADS_PERMISSION_OPTIONS.map((opt) => {
          const checked = selected.has(opt.id);
          const expanded = expandedId === opt.id;
          const checkboxId = `meta-perm-${opt.id}`;

          return (
            <li key={opt.id}>
              <div
                className={`rounded-xl border bg-white transition-colors ${
                  checked
                    ? "border-[#1877F2] bg-[#F5F9FF] shadow-[0_0_0_1px_rgba(24,119,242,0.12)]"
                    : "border-[#E5EAF2] hover:border-[#C5D8F6]"
                }`}
              >
                <div className="flex items-start gap-3 px-3.5 py-3.5">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(opt.id)}
                    className="mt-1 size-4 shrink-0 cursor-pointer rounded-[3px] border-[#ccd0d5] accent-[#1877F2] disabled:cursor-not-allowed"
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
