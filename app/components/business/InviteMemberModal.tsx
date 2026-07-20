"use client";

import {
  AlertCircle,
  Briefcase,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Send,
  Shield,
  Sparkles,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { standardEase } from "@/app/lib/motion";
import {
  getDefaultPermissionsForRole,
  getPermissionOptionsForRole,
} from "@/app/lib/member-permissions";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { inviteBusinessMember } from "@/app/services/member/business-members";
import {
  type BusinessMemberPermission,
  type BusinessMemberRole,
} from "@/app/services/member/types";

const fieldInputClass =
  "h-11 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc]/80 pl-11 pr-4 text-base text-[#07111f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/40 focus:bg-white focus:ring-4 focus:ring-[#1877f2]/10 sm:h-12 sm:rounded-2xl sm:text-sm";

const ROLE_OPTIONS: {
  value: BusinessMemberRole;
  label: string;
  description: string;
  icon: typeof Briefcase;
  accent: string;
  ring: string;
}[] = [
  {
    value: "Manager",
    label: "Manager",
    description: "Help run campaigns, orders, and daily business operations.",
    icon: Briefcase,
    accent: "from-[#1877f2] to-[#0d5bb8]",
    ring: "ring-[#1877f2]/25",
  },
  {
    value: "Staff",
    label: "Staff",
    description: "Support the team with focused access to assigned work.",
    icon: UserCog,
    accent: "from-[#6366f1] to-[#4f46e5]",
    ring: "ring-indigo-300/40",
  },
];

function resetInviteFormState(
  setEmail: (value: string) => void,
  setRole: (value: BusinessMemberRole) => void,
  setPermissions: (value: BusinessMemberPermission[]) => void,
  setError: (value: string | null) => void,
) {
  setEmail("");
  setRole("Manager");
  setPermissions(getDefaultPermissionsForRole("Manager"));
  setError(null);
}

export function InviteMemberForm({
  businessId,
  onSuccess,
  onCancel,
  variant = "modal",
}: {
  businessId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "modal" | "inline";
}) {
  const isInline = variant === "inline";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BusinessMemberRole>("Manager");
  const [permissions, setPermissions] = useState<BusinessMemberPermission[]>(
    () => getDefaultPermissionsForRole("Manager"),
  );
  const [error, setError] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteBusinessMember({
        businessId,
        email: email.trim(),
        role,
        permissions,
      }),
    onSuccess: () => {
      resetInviteFormState(setEmail, setRole, setPermissions, setError);
      onSuccess?.();
    },
    onError: (err: unknown) => {
      setError(getApiErrorMessage(err, "Could not send the invitation."));
    },
  });

  const permissionOptions = useMemo(
    () => getPermissionOptionsForRole(role),
    [role],
  );

  const canSubmit =
    email.trim().length > 0 &&
    permissions.length > 0 &&
    !inviteMutation.isPending;

  const handleRoleChange = (nextRole: BusinessMemberRole) => {
    setRole(nextRole);
    setPermissions(getDefaultPermissionsForRole(nextRole));
  };

  const togglePermission = (permission: BusinessMemberPermission) => {
    setPermissions((current) => {
      const isOn = current.includes(permission);

      if (isOn && permission === "meta_ads") {
        return current.filter(
          (item) => item !== "meta_ads" && item !== "meta_campaigns",
        );
      }

      if (isOn) {
        return current.filter((item) => item !== permission);
      }

      if (permission === "meta_campaigns") {
        const next = new Set<BusinessMemberPermission>(current);
        next.add("meta_ads");
        next.add("meta_campaigns");
        return [...next];
      }

      return [...current, permission];
    });
  };

  const selectAllPermissions = () => {
    setPermissions(permissionOptions.map((option) => option.value));
  };

  const clearAllPermissions = () => {
    setPermissions([]);
  };

  return (
    <form
      className={`flex min-h-0 flex-1 flex-col ${
        isInline
          ? "w-full max-w-full overflow-hidden rounded-[1.15rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:rounded-[1.35rem]"
          : ""
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        inviteMutation.mutate();
      }}
    >
      <div
        className={`relative overflow-hidden border-b border-[#e8edf5]/80 bg-gradient-to-br from-[#e8f2ff] via-white to-[#f8fafc] ${
          isInline ? "px-3.5 py-3.5 sm:px-5 sm:py-4" : "px-4 py-4 sm:px-6 sm:py-5"
        }`}
      >
        <span
          className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-[#1877f2]/10 blur-2xl sm:size-36"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-white shadow-lg shadow-[#1877f2]/30 sm:size-12 sm:rounded-2xl">
              <UserPlus
                className="size-5 sm:size-6"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#bfdbfe] sm:px-2.5 sm:py-1 sm:text-[0.68rem]">
                <Sparkles className="size-3" aria-hidden />
                Team invite
              </div>
              <h2
                id="invite-member-title"
                className="mt-1.5 text-lg font-extrabold tracking-tight text-[#07111f] sm:mt-2 sm:text-xl"
              >
                Add a new member
              </h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                Send a secure email invitation, choose a role, and decide exactly
                what this teammate can access.
              </p>
            </div>
          </div>

          {!isInline && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e8edf5] bg-white/90 text-slate-500 transition hover:bg-white hover:text-[#07111f]"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto sm:space-y-5 ${
          isInline ? "px-3.5 py-4 sm:px-5 sm:py-5" : "px-4 py-4 sm:px-6 sm:py-5"
        }`}
      >
        <div>
          <label
            htmlFor="invite-member-email"
            className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
          >
            <Mail className="size-3.5 text-[#1877f2]" aria-hidden />
            Work email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="invite-member-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              className={fieldInputClass}
              disabled={inviteMutation.isPending}
            />
          </div>
        </div>

        <div>
          <span className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
            <Shield className="size-3.5 text-[#1877f2]" aria-hidden />
            Choose role
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  disabled={inviteMutation.isPending}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 sm:rounded-2xl sm:p-4 ${
                    selected
                      ? `border-[#1877f2] bg-[#f4f8ff] shadow-[0_10px_24px_rgba(24,119,242,0.12)] ring-2 ${option.ring}`
                      : "border-[#e8edf5] bg-white hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ${option.accent} text-white shadow-md sm:size-10 sm:rounded-xl`}
                    >
                      <Icon
                        className="size-4 sm:size-5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    {selected ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-white sm:size-6">
                        <Check className="size-3 sm:size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2.5 text-sm font-bold text-[#07111f] sm:mt-3">
                    {option.label}
                  </p>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-500 sm:text-xs">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
              <KeyRound className="size-3.5 text-[#1877f2]" aria-hidden />
              Access permissions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                disabled={inviteMutation.isPending}
                className="cursor-pointer text-[0.72rem] font-semibold text-[#1877f2] transition hover:text-[#0d5bb8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Allow all
              </button>
              <span className="text-slate-300" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={clearAllPermissions}
                disabled={inviteMutation.isPending}
                className="cursor-pointer text-[0.72rem] font-semibold text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Deny all
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            Choose what this person can open in your business dashboard. Role
            presets are applied automatically, but you control the final access.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
            {permissionOptions.map((option) => {
              const enabled = permissions.includes(option.value);
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => togglePermission(option.value)}
                  disabled={inviteMutation.isPending}
                  aria-pressed={enabled}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition sm:gap-3 sm:rounded-2xl sm:p-3.5 ${
                    enabled
                      ? "border-[#1877f2] bg-[#f4f8ff] ring-1 ring-[#1877f2]/20"
                      : "border-[#e8edf5] bg-white hover:border-[#dbeafe] hover:bg-[#f8fbff]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 sm:rounded-xl ${
                      enabled
                        ? "bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-white"
                        : "bg-[#f1f5f9] text-slate-500"
                    }`}
                  >
                    <Icon className="size-3.5 sm:size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[0.8125rem] font-bold text-[#07111f] sm:text-sm">
                        {option.label}
                      </span>
                      <span
                        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          enabled
                            ? "border-[#1877f2] bg-[#1877f2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.7rem] leading-relaxed text-slate-500 sm:text-xs">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {permissions.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Select at least one permission before sending the invite.
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
          >
            <AlertCircle
              className="mt-px size-3.5 shrink-0"
              strokeWidth={2.25}
              aria-hidden
            />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <div
        className={`flex flex-col-reverse gap-2 border-t border-[#f1f5f9] sm:flex-row sm:justify-end ${
          isInline ? "px-3.5 py-3.5 sm:px-5 sm:py-4" : "px-4 py-3.5 sm:px-6 sm:py-4"
        }`}
      >
        {!isInline && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={inviteMutation.isPending}
            className="h-11 w-full cursor-pointer rounded-xl border border-[#e8edf5] px-5 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#0d5bb8] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 ${
            isInline ? "w-full sm:w-auto sm:min-w-[11rem]" : "w-full sm:w-auto"
          }`}
        >
          {inviteMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending invitation…
            </>
          ) : (
            <>
              <Send className="size-4" strokeWidth={2.25} aria-hidden />
              Send invitation
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function InviteMemberModal({
  open,
  onClose,
  businessId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  businessId: number;
  onSuccess?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="invite-member-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: standardEase }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07111f]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-member-title"
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: standardEase }}
            className="relative flex max-h-[min(92vh,100dvh)] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] sm:max-h-[92vh] sm:rounded-[1.5rem]"
          >
            <InviteMemberForm
              businessId={businessId}
              variant="modal"
              onCancel={onClose}
              onSuccess={() => {
                onSuccess?.();
                onClose();
              }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
