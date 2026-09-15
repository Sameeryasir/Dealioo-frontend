"use client";

import {
  getDefaultPermissionsForRole,
  getModulePermissionOptionsForRole,
  hasAnyCampaignPermission,
  roleSupportsAutomationModule,
  roleSupportsCampaignModule,
  roleSupportsFunnelModule,
  roleSupportsGoogleCampaignModule,
  roleSupportsMetaCampaignModule,
} from "@/app/lib/member-permissions";
import { InvitePermissionSections } from "@/app/components/business/BusinessPermissionsMatrix";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { inviteBusinessMember, updateActiveBusinessMember, updatePendingBusinessInvitation } from "@/app/services/member/business-members";
import {
  AUTOMATION_ACTION_PERMISSIONS,
  CAMPAIGN_ACTION_PERMISSIONS,
  GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
  META_CAMPAIGN_ACTION_PERMISSIONS,
  type BusinessMemberPermission,
  type BusinessMemberRole,
} from "@/app/services/member/types";
import {
  AlertCircle,
  Briefcase,
  Check,
  KeyRound,
  Loader2,
  Mail,
  ScanLine,
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

type MemberAccessEdit = {
  kind: "pending" | "active";
  id: number;
  email: string;
  role: BusinessMemberRole;
  permissions: BusinessMemberPermission[];
};

const fieldInputClass =
  "h-11 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc]/80 pl-11 pr-4 text-base text-[#07111f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/40 focus:bg-white focus:ring-4 focus:ring-[#1877f2]/10 sm:h-12 sm:rounded-2xl sm:text-sm";

const ROLE_OPTIONS: {
  value: BusinessMemberRole;
  label: string;
  description: string;
  icon: typeof Briefcase;
  accent: string;
  ring: string;
  recommended?: boolean;
}[] = [
  {
    value: "Manager",
    label: "Manager",
    description:
      "Full access to manage campaigns, orders, customers, and team performance.",
    icon: Briefcase,
    accent: "bg-[#1877f2]",
    ring: "ring-[#1877f2]/25",
    recommended: true,
  },
  {
    value: "Staff",
    label: "Staff",
    description: "Limited access to assigned tasks and customer interactions.",
    icon: UserCog,
    accent: "bg-[#6366f1]",
    ring: "ring-indigo-300/40",
  },
  {
    value: "Scanner",
    label: "Scanner",
    description: "In-store access to scan codes and view orders only.",
    icon: ScanLine,
    accent: "bg-[#0f766e]",
    ring: "ring-teal-300/40",
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
  editInvite = null,
}: {
  businessId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "modal" | "inline";
  editInvite?: MemberAccessEdit | null;
}) {
  const isInline = variant === "inline";
  const isEdit = editInvite != null;
  const isActiveEdit = editInvite?.kind === "active";
  const [email, setEmail] = useState(editInvite?.email ?? "");
  const [role, setRole] = useState<BusinessMemberRole>(
    editInvite?.role ?? "Manager",
  );
  const [permissions, setPermissions] = useState<BusinessMemberPermission[]>(
    () =>
      editInvite?.permissions?.length
        ? editInvite.permissions
        : getDefaultPermissionsForRole(editInvite?.role ?? "Manager"),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editInvite) return;
    setEmail(editInvite.email);
    setRole(editInvite.role);
    setPermissions(
      editInvite.permissions.length > 0
        ? editInvite.permissions
        : getDefaultPermissionsForRole(editInvite.role),
    );
    setError(null);
  }, [editInvite]);

  const inviteMutation = useMutation({
    mutationFn: () => {
      if (isEdit && editInvite) {
        if (editInvite.kind === "active") {
          return updateActiveBusinessMember({
            memberId: editInvite.id,
            role,
            permissions,
          });
        }
        return updatePendingBusinessInvitation({
          businessId,
          invitationId: editInvite.id,
          role,
          permissions,
        });
      }
      return inviteBusinessMember({
        businessId,
        email: email.trim(),
        role,
        permissions,
      });
    },
    onSuccess: () => {
      if (!isEdit) {
        resetInviteFormState(setEmail, setRole, setPermissions, setError);
      }
      onSuccess?.();
    },
    onError: (err: unknown) => {
      setError(
        getApiErrorMessage(
          err,
          isEdit
            ? isActiveEdit
              ? "Could not update member access."
              : "Could not update the invitation."
            : "Could not send the invitation.",
        ),
      );
    },
  });

  const modulePermissionOptions = useMemo(
    () => getModulePermissionOptionsForRole(role),
    [role],
  );
  const showCampaignModule = roleSupportsCampaignModule(role);
  const showMetaCampaignModule = roleSupportsMetaCampaignModule(role);
  const showGoogleCampaignModule = roleSupportsGoogleCampaignModule(role);
  const showAutomationModule = roleSupportsAutomationModule(role);
  const showFunnelModule = roleSupportsFunnelModule(role);

  const canSubmit =
    email.trim().length > 0 &&
    permissions.length > 0 &&
    !inviteMutation.isPending;

  const handleRoleChange = (nextRole: BusinessMemberRole) => {
    setRole(nextRole);
    setPermissions(getDefaultPermissionsForRole(nextRole));
  };

  const stripLegacyCampaignFlags = (
    list: BusinessMemberPermission[],
  ): BusinessMemberPermission[] =>
    list.filter(
      (item) =>
        item !== "campaigns" &&
        item !== "meta_ads" &&
        item !== "meta_campaigns",
    );

  const togglePermission = (permission: BusinessMemberPermission) => {
    setPermissions((current) => {
      const base = stripLegacyCampaignFlags(current);
      const isOn = base.includes(permission);
      const automationKeys = new Set<string>(AUTOMATION_ACTION_PERMISSIONS);

      if (!isOn && automationKeys.has(permission) && !hasAnyCampaignPermission(base)) {
        return base;
      }

      if (isOn) {
        const next = base.filter((item) => item !== permission);
        if (!hasAnyCampaignPermission(next)) {
          return next.filter((item) => !automationKeys.has(item));
        }
        return next;
      }

      return [...base, permission];
    });
  };

  const selectAllPermissions = () => {
    const moduleValues = modulePermissionOptions.map((option) => option.value);
    const next: BusinessMemberPermission[] = [...moduleValues];
    if (showCampaignModule) {
      next.push(...CAMPAIGN_ACTION_PERMISSIONS);
    }
    if (showMetaCampaignModule) {
      next.push(...META_CAMPAIGN_ACTION_PERMISSIONS);
    }
    if (showGoogleCampaignModule) {
      next.push(...GOOGLE_CAMPAIGN_ACTION_PERMISSIONS);
    }
    if (showAutomationModule) {
      next.push(...AUTOMATION_ACTION_PERMISSIONS);
    }
    if (showFunnelModule) {
      next.push("funnels_edit");
    }
    if (role === "Manager") {
      next.push("members", "settings");
    }
    setPermissions(next);
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
        className={`relative shrink-0 border-b border-[#e8edf5] bg-white ${
          isInline ? "px-3.5 py-3.5 sm:px-5 sm:py-4" : "px-4 py-4 sm:px-6 sm:py-5"
        }`}
      >
        <div className="relative flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3.5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe] sm:size-12"
              aria-hidden
            >
              <UserPlus className="size-5 sm:size-6" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1 pr-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#bfdbfe] sm:px-2.5 sm:py-1 sm:text-[0.68rem]">
                <Sparkles className="size-3" aria-hidden />
                {isEdit ? (isActiveEdit ? "Member access" : "Pending invite") : "Team invite"}
              </div>
              <h2
                id="invite-member-title"
                className="mt-1.5 text-lg font-extrabold tracking-tight text-[#07111f] sm:mt-2 sm:text-xl"
              >
                {isEdit
                  ? isActiveEdit
                    ? "Edit member access"
                    : "Edit invitation"
                  : "Add a new member"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                {isEdit
                  ? isActiveEdit
                    ? "Change their role and module permissions. They keep the same account — access updates right away."
                    : "Update their role and permissions before they accept. Changes apply to this pending invite."
                  : "Send a secure email invitation, choose a role, and decide exactly what this teammate can access. They stay Pending until they finish signup or sign in — opening the link alone does not accept the invite."}
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
          isInline
            ? "px-3.5 py-4 pb-5 sm:px-5 sm:py-5 sm:pb-6"
            : "px-4 py-4 pb-5 sm:px-6 sm:py-5 sm:pb-6"
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
              disabled={inviteMutation.isPending || isEdit}
              readOnly={isEdit}
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
                      className={`flex size-9 items-center justify-center rounded-lg ${option.accent} text-white shadow-md sm:size-10 sm:rounded-xl`}
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
                    {option.recommended ? (
                      <span className="ml-2 inline-flex rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#1877f2]">
                        Recommended
                      </span>
                    ) : null}
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
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-base font-semibold text-[#111827]">
              <KeyRound className="size-4 text-[#2563eb]" aria-hidden />
              Access permissions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                disabled={inviteMutation.isPending}
                className="cursor-pointer text-sm font-medium text-[#2563eb] transition hover:text-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Allow all
              </button>
              <span className="text-[#d1d5db]" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={clearAllPermissions}
                disabled={inviteMutation.isPending}
                className="cursor-pointer text-sm font-medium text-[#6b7280] transition hover:text-[#374151] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Deny all
              </button>
            </div>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-[#6b7280]">
            Choose exactly what this person can access. You can change these
            anytime.
          </p>

          <InvitePermissionSections
            role={role}
            permissions={permissions}
            disabled={inviteMutation.isPending}
            onToggle={togglePermission}
          />

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
        className={`flex shrink-0 flex-col-reverse gap-2 border-t border-[#f1f5f9] bg-white sm:flex-row sm:justify-end ${
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
          className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 ${
            isInline ? "w-full sm:w-auto sm:min-w-[11rem]" : "w-full sm:w-auto"
          }`}
        >
          {inviteMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {isEdit ? "Saving…" : "Sending invitation…"}
            </>
          ) : (
            <>
              <Send className="size-4" strokeWidth={2.25} aria-hidden />
              {isEdit ? "Save changes" : "Send invitation"}
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
  editInvite = null,
}: {
  open: boolean;
  onClose: () => void;
  businessId: number;
  onSuccess?: () => void;
  editInvite?: MemberAccessEdit | null;
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
            className="relative flex max-h-[min(92vh,100dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] sm:max-h-[92vh] sm:rounded-[1.5rem]"
          >
            <InviteMemberForm
              businessId={businessId}
              variant="modal"
              editInvite={editInvite}
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
