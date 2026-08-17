"use client";

import {
  BarChart3,
  Check,
  Megaphone,
  Shield,
  type LucideIcon,
} from "lucide-react";
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

const PREFERRED_SCOPE_ORDER = ["ads_management", "ads_read"] as const;

const SCOPE_ICONS: Record<string, LucideIcon> = {
  ads_management: Megaphone,
  ads_read: BarChart3,
};

const panelShellClass =
  "rounded-[0.95rem] border border-[#E8EDF5] bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.05)] sm:p-5";

const HIDDEN_DISPLAY_SCOPES = new Set(["email"]);

function orderedGrantedScopes(grantedScopes: string[]): string[] {
  const granted = parseGrantedScopes(grantedScopes);
  const preferred = PREFERRED_SCOPE_ORDER.filter((id) => granted.has(id));
  const extra = [...granted].filter(
    (id) =>
      !PREFERRED_SCOPE_ORDER.includes(id as (typeof PREFERRED_SCOPE_ORDER)[number]) &&
      !HIDDEN_DISPLAY_SCOPES.has(id),
  );
  return [...preferred, ...extra];
}

export function FacebookPermissionsPanel({
  grantedScopes,
  connected,
  loading = false,
}: FacebookPermissionsPanelProps) {
  if (loading && !connected) {
    return null;
  }

  if (loading) {
    return (
      <div className={panelShellClass}>
        <p className="m-0 text-xs text-slate-500">Loading Facebook permissions…</p>
      </div>
    );
  }

  const granted = orderedGrantedScopes(grantedScopes);

  if (!connected || granted.length === 0) {
    return null;
  }

  return (
    <section className={`${panelShellClass} space-y-4`}>
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F1FF] text-[#1877F2]">
          <Shield className="size-4" strokeWidth={2.1} aria-hidden />
        </span>
        <div>
          <h3 className="m-0 text-[0.95rem] font-bold tracking-tight text-slate-900">
            Permissions granted
          </h3>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            What Dealioo can access from your Meta account.
          </p>
        </div>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
        {granted.map((scopeId) => {
          const Icon = SCOPE_ICONS[scopeId] ?? Shield;
          return (
            <li
              key={scopeId}
              className="flex items-center gap-3 rounded-[0.9rem] border border-emerald-200 bg-[#F4FBF6] px-3.5 py-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[0.82rem] font-semibold text-slate-900">
                  {formatFacebookScopeLabel(scopeId)}
                </p>
                <p className="m-0 mt-0.5 font-mono text-[0.68rem] text-slate-400">
                  {scopeId}
                </p>
                <span className="mt-1.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-emerald-700">
                  Granted
                </span>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Icon className="size-4" strokeWidth={2} aria-hidden />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
