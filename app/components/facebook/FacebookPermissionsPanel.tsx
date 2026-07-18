"use client";

import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import {
  buildFacebookScopeDisplayList,
  formatFacebookScopeLabel,
  parseGrantedScopes,
} from "@/app/lib/facebook-oauth-scopes";

type FacebookPermissionsPanelProps = {
  grantedScopes: string[];
  missingRequiredScopes: string[];
  requestedScopes?: string[];
  requiredScopes?: string[];
  connected: boolean;
  loading?: boolean;
};

const panelShellClass =
  "mt-4 rounded-[1.1rem] border border-[#e8edf5] bg-gradient-to-b from-[#f8faff] to-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]";

export function FacebookPermissionsPanel({
  grantedScopes,
  missingRequiredScopes,
  requestedScopes = [],
  requiredScopes = [],
  connected,
  loading = false,
}: FacebookPermissionsPanelProps) {
  const granted = parseGrantedScopes(grantedScopes);
  const required = parseGrantedScopes(requiredScopes);
  const scopeIds = buildFacebookScopeDisplayList({
    requestedScopes,
    grantedScopes,
    requiredScopes,
    missingRequiredScopes,
  });
  if (loading) {
    return (
      <div className={panelShellClass}>
        <p className="text-xs text-slate-500">Loading Facebook permissions…</p>
      </div>
    );
  }

  // Only show after connect — listing requested scopes as "Not granted" is confusing.
  if (!connected) {
    return null;
  }

  return (
    <div className={`${panelShellClass} space-y-3`}>
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]">
          <Shield className="size-4" aria-hidden />
        </span>
        <div>
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
            Permissions granted
          </p>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            What Dealioo can access from your Meta account.
          </p>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {scopeIds.map((scopeId) => {
          const isGranted = granted.has(scopeId);
          const isRequired = required.has(scopeId);
          return (
            <li
              key={scopeId}
              className={`rounded-[0.95rem] border px-3 py-2.5 ${
                isGranted
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-[#e8edf5] bg-white"
              }`}
            >
              <div className="flex items-start gap-2">
                {isGranted ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {formatFacebookScopeLabel(scopeId)}
                    {isRequired ? (
                      <span className="ml-1.5 font-normal text-slate-500">
                        (required)
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 break-all text-[11px] leading-relaxed text-slate-500">
                    {scopeId}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                      isGranted ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {isGranted ? "Granted" : "Not granted"}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Meta may block publishing if your account is not an Administrator on the
        Dealioo app while it is in Development mode.
      </p>
    </div>
  );
}
