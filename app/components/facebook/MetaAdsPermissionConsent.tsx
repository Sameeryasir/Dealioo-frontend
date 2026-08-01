"use client";

import { HelpCircle } from "lucide-react";
import {
  META_ADS_PERMISSION_OPTIONS,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";

type MetaAdsPermissionConsentProps = {
  selectedScopes: MetaSelectableScopeId[];
  onChange: (scopes: MetaSelectableScopeId[]) => void;
  disabled?: boolean;
};

export function MetaAdsPermissionConsent({
  selectedScopes,
  onChange,
  disabled = false,
}: MetaAdsPermissionConsentProps) {
  const selected = new Set(selectedScopes);

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
    <div className="space-y-3">
      <h3 className="m-0 text-sm font-bold text-slate-900">
        Select the permissions Dealioo needs:
      </h3>
      <ul className="m-0 list-none space-y-2.5 p-0">
        {META_ADS_PERMISSION_OPTIONS.map((opt) => {
          const checked = selected.has(opt.id);
          const inputId = `meta-perm-${opt.id}`;
          return (
            <li
              key={opt.id}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                checked
                  ? "border-[#1877f2]/35 bg-[#f0f6ff]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 cursor-pointer accent-[#1877f2] disabled:cursor-not-allowed"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(opt.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    <label
                      htmlFor={inputId}
                      className="cursor-pointer text-sm font-semibold text-slate-900"
                    >
                      {opt.title}{" "}
                      <span className="font-normal text-slate-500">
                        ({opt.id})
                      </span>
                    </label>
                    <span
                      className="relative mt-0.5 inline-flex text-slate-400"
                      title={opt.tooltip}
                    >
                      <HelpCircle className="size-3.5 shrink-0" aria-hidden />
                      <span className="sr-only">{opt.tooltip}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {opt.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="m-0 text-[11px] leading-relaxed text-slate-500">
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
          public_profile
        </code>{" "}
        is requested automatically to identify the Facebook user connecting the
        account.
      </p>
    </div>
  );
}
