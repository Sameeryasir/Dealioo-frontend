"use client";

import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import {
  FACEBOOK_OAUTH_SCOPE_DETAILS,
  parseGrantedScopes,
} from "@/app/lib/facebook-oauth-scopes";

type FacebookPermissionsPanelProps = {
  grantedScopes: string[];
  missingRequiredScopes: string[];
  connected: boolean;
};

export function FacebookPermissionsPanel({
  grantedScopes,
  missingRequiredScopes,
  connected,
}: FacebookPermissionsPanelProps) {
  const granted = parseGrantedScopes(grantedScopes);
  const hasStoredScopes = granted.size > 0;

  if (!hasStoredScopes && !connected) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3">
        <p className="text-xs leading-relaxed text-zinc-400">
          Permissions are saved after you connect. Tap{" "}
          <span className="font-semibold text-zinc-300">Connect with Facebook</span>{" "}
          — Meta will ask you to approve ad access. We store what you grant here so
          you can see exactly what Only Deals can do.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-[#1877F2]" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Permissions granted at connect
        </p>
      </div>

      {missingRequiredScopes.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-amber-300"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-amber-100">
            Required permission
            {missingRequiredScopes.length === 1 ? "" : "s"} missing:{" "}
            <span className="font-semibold">
              {missingRequiredScopes.join(", ")}
            </span>
            . Remove Facebook and connect again — approve every ad permission
            Meta shows.
          </p>
        </div>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2">
        {FACEBOOK_OAUTH_SCOPE_DETAILS.map((scope) => {
          const isGranted = granted.has(scope.id);
          return (
            <li
              key={scope.id}
              className={`rounded-xl border px-3 py-2.5 ${
                isGranted
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-zinc-700 bg-zinc-950/30"
              }`}
            >
              <div className="flex items-start gap-2">
                {isGranted ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-zinc-500"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-100">
                    {scope.label}
                    {scope.required ? (
                      <span className="ml-1.5 font-normal text-zinc-500">
                        (required)
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                    {scope.description}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${
                      isGranted ? "text-emerald-400" : "text-zinc-500"
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

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Even with all permissions granted, Meta may still block publishing if your
        Facebook account is not an Administrator on the Only Deals Meta app while
        the app is in Development mode.
      </p>
    </div>
  );
}
