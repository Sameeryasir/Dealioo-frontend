"use client";

import { CheckCircle2, Shield } from "lucide-react";
import {
  formatFacebookScopeLabel,
  parseGrantedScopes,
} from "@/app/lib/facebook-oauth-scopes";

type FacebookPermissionsPanelProps = {
  businessId?: number | null;
  grantedScopes: string[];
  missingRequiredScopes: string[];
  requestedScopes?: string[];
  requiredScopes?: string[];
  connected: boolean;
  loading?: boolean;
};

const panelShellClass =
  "mt-4 rounded-[1.1rem] border border-[#e8edf5] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]";

export function FacebookPermissionsPanel({
  grantedScopes,
  connected,
  loading = false,
}: FacebookPermissionsPanelProps) {
  const granted = [...parseGrantedScopes(grantedScopes)];

  if (loading) {
    return (
      <div className={panelShellClass}>
        <p className="text-xs text-slate-500">Loading Facebook permissions…</p>
      </div>
    );
  }

  if (!connected || granted.length === 0) {
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
        {granted.map((scopeId) => (
          <li
            key={scopeId}
            className="rounded-[0.95rem] border border-emerald-200 bg-emerald-50/80 px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">
                  {formatFacebookScopeLabel(scopeId)}
                </p>
                <p className="mt-0.5 break-all text-[11px] leading-relaxed text-slate-500">
                  {scopeId}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Granted
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
