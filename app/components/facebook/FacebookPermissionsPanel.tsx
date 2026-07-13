"use client";

/**
 * Change: Light-theme Facebook permissions panel for Settings integrations.
 * Why: Matches the white dashboard settings UI instead of the old dark modal styles.
 */

import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import {
  FACEBOOK_OAUTH_SCOPE_DETAILS,
  parseGrantedScopes,
} from "@/app/lib/facebook-oauth-scopes";

type FacebookPermissionsPanelProps = {
  grantedScopes: string[];
  missingRequiredScopes: string[];
  connected: boolean;
  loading?: boolean;
};

const panelShellClass =
  "mt-4 rounded-[1.1rem] border border-[#e8edf5] bg-gradient-to-b from-[#f8faff] to-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)]";

export function FacebookPermissionsPanel({
  grantedScopes,
  missingRequiredScopes,
  connected,
  loading = false,
}: FacebookPermissionsPanelProps) {
  const granted = parseGrantedScopes(grantedScopes);
  const hasStoredScopes = granted.size > 0;

  if (loading) {
    return (
      <div className={panelShellClass}>
        <p className="text-xs text-slate-500">Loading Facebook permissions…</p>
      </div>
    );
  }

  if (!hasStoredScopes && !connected) {
    return (
      <div className={panelShellClass}>
        <p className="text-xs leading-relaxed text-slate-500">
          Connect Facebook to see which ad permissions Dealioo can use.
        </p>
      </div>
    );
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

      {missingRequiredScopes.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-amber-900">
            Required permission
            {missingRequiredScopes.length === 1 ? "" : "s"} missing:{" "}
            <span className="font-semibold">
              {missingRequiredScopes.join(", ")}
            </span>
            . Remove Facebook and connect again, approving every ad permission
            Meta shows.
          </p>
        </div>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {FACEBOOK_OAUTH_SCOPE_DETAILS.map((scope) => {
          const isGranted = granted.has(scope.id);
          return (
            <li
              key={scope.id}
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
                    {scope.label}
                    {scope.required ? (
                      <span className="ml-1.5 font-normal text-slate-500">
                        (required)
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {scope.description}
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
