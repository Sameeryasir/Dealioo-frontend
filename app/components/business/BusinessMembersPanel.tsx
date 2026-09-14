"use client";

import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Filter,
  Hourglass,
  Loader2,
  LockOpen,
  Megaphone,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { InviteMemberModal } from "@/app/components/business/InviteMemberModal";
import { Skeleton } from "@/app/components/skeleton";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { getSetupUser } from "@/app/lib/setup-user";
import { standardEase } from "@/app/lib/motion";
import { getPermissionLabel } from "@/app/lib/member-permissions";
import { subscribeBusinessMembers } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-members";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  cancelPendingBusinessInvitation,
  copyPendingBusinessInvitationLink,
  getBusinessMembers,
  removeBusinessMember,
  resendPendingBusinessInvitation,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import {
  FULL_ACCESS_PERMISSION,
  type BusinessMemberListItem,
  type BusinessMemberPermission,
  type BusinessMemberRole,
} from "@/app/services/member/types";

const LOGO = {
  blue: "#0B69FC",
  pink: "#F83071",
  orange: "#FD7137",
  purple: "#AD20E3",
  green: "#00B34C",
  yellow: "#FCB825",
} as const;

const MEMBERS_PAGE_SIZE = 8;

function memberInitials(member: BusinessMemberListItem): string {
  const parts = member.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const email = member.email.trim();
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  return (email.charAt(0) || "?").toUpperCase();
}

/** Same colorful initials as activity log / guest roster / chat. */
const AVATAR_TONES = [
  "bg-[#7c3aed] text-white",
  "bg-[#16a34a] text-white",
  "bg-[#2563eb] text-white",
  "bg-[#db2777] text-white",
  "bg-[#0f766e] text-white",
  "bg-[#d97706] text-white",
  "bg-[#e11d48] text-white",
] as const;

function avatarTone(member: BusinessMemberListItem): string {
  const seed = member.id ?? member.email ?? member.name;
  const numeric =
    typeof seed === "number"
      ? seed
      : Array.from(String(seed)).reduce(
          (sum, char, index) => sum + char.charCodeAt(0) * (index + 1),
          0,
        );
  const index = Math.abs(numeric) % AVATAR_TONES.length;
  return AVATAR_TONES[index] ?? AVATAR_TONES[0];
}

function statusBadgeClass(status: BusinessMemberListItem["status"]) {
  if (status === "pending") {
    return "bg-[#fff4e8] text-[#c05600] ring-1 ring-[#fed7aa]";
  }
  return "bg-[#e9f9ef] text-[#15803d] ring-1 ring-[#bbf7d0]";
}

function statusDotClass(status: BusinessMemberListItem["status"]) {
  if (status === "pending") return "bg-[#ea580c]";
  return "bg-[#16a34a]";
}

function memberStatusLabel(status: BusinessMemberListItem["status"]) {
  if (status === "pending") return "Pending";
  return "Active";
}

function MembersKpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: "blue" | "purple" | "orange" | "green";
}) {
  const tones = {
    blue: {
      title: "text-[#1877f2]",
      iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
    },
    purple: {
      title: "text-[#7c3aed]",
      iconWrap: "bg-[#f3e8ff] text-[#7c3aed]",
    },
    orange: {
      title: "text-[#ea580c]",
      iconWrap: "bg-[#fff4e8] text-[#ea580c]",
    },
    green: {
      title: "text-[#16a34a]",
      iconWrap: "bg-[#e9f9ef] text-[#16a34a]",
    },
  } as const;
  const palette = tones[tone];

  return (
    <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${palette.iconWrap}`}
        >
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <p className={`m-0 text-xs font-semibold ${palette.title}`}>{title}</p>
      </div>
      <p className="m-0 mt-3 text-3xl font-extrabold tracking-tight text-[#0f172a]">
        {value}
      </p>
      <p className="m-0 mt-1 text-xs font-medium text-slate-500">{hint}</p>
    </div>
  );
}

function MembersTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function formatMemberDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type MemberPermissionVisual = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

function getMemberPermissionVisuals(
  member: BusinessMemberListItem,
): MemberPermissionVisual[] {
  if (
    member.status === "owner" ||
    member.permissions.includes(FULL_ACCESS_PERMISSION)
  ) {
    return [
      {
        key: "full_access",
        label: "Full access",
        icon: CheckCircle2,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      },
    ];
  }

  const items: MemberPermissionVisual[] = [];
  const campaignActionLabels: string[] = [];

  for (const permission of member.permissions) {
    if (permission === "campaigns" || permission.startsWith("campaigns_")) {
      if (permission === "campaigns") {
        campaignActionLabels.push("Full");
      } else if (permission === "campaigns_view") {
        campaignActionLabels.push("View");
      } else if (permission === "campaigns_create") {
        campaignActionLabels.push("Create");
      } else if (permission === "campaigns_edit") {
        campaignActionLabels.push("Edit");
      } else if (permission === "campaigns_delete") {
        campaignActionLabels.push("Delete");
      }
      continue;
    }

    if (
      permission === "meta_ads" ||
      permission === "meta_campaigns" ||
      permission.startsWith("meta_campaigns_")
    ) {
      const isView =
        permission === "meta_ads" || permission === "meta_campaigns_view";
      const isCreate =
        permission === "meta_campaigns" ||
        permission === "meta_campaigns_create";
      const isDelete = permission === "meta_campaigns_delete";
      items.push({
        key: permission,
        label: getPermissionLabel(permission),
        icon: isView ? Eye : isCreate ? Plus : isDelete ? Trash2 : Megaphone,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }

    if (permission.startsWith("google_campaigns_")) {
      const isView = permission === "google_campaigns_view";
      const isCreate = permission === "google_campaigns_create";
      const isDelete = permission === "google_campaigns_delete";
      items.push({
        key: permission,
        label: getPermissionLabel(permission),
        icon: isView ? Eye : isCreate ? Plus : isDelete ? Trash2 : Megaphone,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }

    if (permission.startsWith("automations_")) {
      const isCreate = permission === "automations_create";
      const isEdit = permission === "automations_edit";
      const isDelete = permission === "automations_delete";
      items.push({
        key: permission,
        label: getPermissionLabel(permission),
        icon: isCreate ? Plus : isDelete ? Trash2 : isEdit ? Pencil : Workflow,
        iconBg: "bg-[#ede9fe]",
        iconColor: "text-[#7c3aed]",
      });
      continue;
    }

    if (permission === "funnels_edit") {
      items.push({
        key: permission,
        label: "Update funnel",
        icon: Filter,
        iconBg: "bg-[#ecfdf5]",
        iconColor: "text-[#059669]",
      });
      continue;
    }

    if (permission === "orders") {
      items.push({
        key: permission,
        label: "Orders",
        icon: ShoppingBag,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }
    if (permission === "activity") {
      items.push({
        key: permission,
        label: "Activity",
        icon: BarChart3,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }
    if (permission === "chats") {
      items.push({
        key: permission,
        label: "Chats",
        icon: MessageSquare,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }
    if (permission === "scanning") {
      items.push({
        key: permission,
        label: "Scanning",
        icon: ScanLine,
        iconBg: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      });
      continue;
    }

    items.push({
      key: permission,
      label: getPermissionLabel(permission),
      icon: Shield,
      iconBg: "bg-[#e8f2ff]",
      iconColor: "text-[#1877f2]",
    });
  }

  if (campaignActionLabels.length > 0) {
    items.push({
      key: "campaigns_grouped",
      label: campaignActionLabels.join(" · "),
      icon: Megaphone,
      iconBg: "bg-[#e8f2ff]",
      iconColor: "text-[#1877f2]",
    });
  }

  return items;
}

function MemberDetailsModal({
  member,
  open,
  onClose,
  onRemove,
  isRemoving,
  canManageMembers,
  onResend,
  onCopyLink,
  onEditInvite,
  isResending,
  isCopying,
  actionMessage,
}: {
  member: BusinessMemberListItem | null;
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  isRemoving: boolean;
  canManageMembers: boolean;
  onResend: () => void;
  onCopyLink: () => void;
  onEditInvite: () => void;
  isResending: boolean;
  isCopying: boolean;
  actionMessage: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!member) return null;

  const initials = memberInitials(member);
  const canRemove =
    canManageMembers &&
    member.status !== "owner" &&
    member.id != null &&
    member.id > 0;
  const canEditAccess =
    canManageMembers &&
    member.status !== "owner" &&
    member.id != null &&
    member.id > 0;
  const isPending = member.status === "pending";
  const canManageInvite =
    canManageMembers && isPending && member.id != null && member.id > 0;
  const permissionVisuals = getMemberPermissionVisuals(member);
  const permissionCount =
    member.status === "owner" ||
    member.permissions.includes(FULL_ACCESS_PERMISSION)
      ? permissionVisuals.length
      : member.permissions.length;
  const showDates = Boolean(member.invitedAt || member.expiresAt);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="member-details-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: standardEase }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07111f]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-details-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: standardEase }}
            className="relative flex max-h-[min(94vh,100dvh)] w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)] sm:max-h-[min(92vh,46rem)] sm:rounded-[1.35rem]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* --- Fixed white header (not in scroll) --- */}
            <div className="shrink-0 border-b border-[#eef2f7] bg-white px-5 pt-5 pb-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className={`flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold leading-none ring-4 ring-[#f8fafc] ${avatarTone(member)}`}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p
                      id="member-details-title"
                      className="truncate text-lg font-bold tracking-tight text-[#07111f]"
                    >
                      {member.name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {member.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close member details"
                >
                  <X className="size-4" strokeWidth={2.25} aria-hidden />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3">
                  <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Role
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                      <Briefcase
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    <span className="truncate text-sm font-medium text-[#07111f]">
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3">
                  <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Status
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${statusDotClass(member.status)}`}
                      />
                      {memberStatusLabel(member.status)}
                    </span>
                  </div>
                </div>
              </div>

              {isPending ? (
                <p className="m-0 mt-3 text-[0.72rem] leading-relaxed text-slate-500">
                  Stays Pending until they finish signup or sign in and join.
                  Opening the invite link alone does not accept it.
                </p>
              ) : null}

              {showDates ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {member.invitedAt ? (
                    <div className="rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                          <CalendarDays
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            Invited
                          </p>
                          <p className="m-0 mt-0.5 truncate text-sm font-medium text-[#07111f]">
                            {formatMemberDate(member.invitedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                  {member.expiresAt ? (
                    <div className="rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                          <CalendarDays
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            Expires
                          </p>
                          <p className="m-0 mt-0.5 truncate text-sm font-medium text-[#07111f]">
                            {formatMemberDate(member.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* --- Scrollable permissions only --- */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]">
                      <ShieldCheck
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    <p className="m-0 truncate text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#1877f2]">
                      Access &amp; permissions
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[0.68rem] font-semibold text-[#1877f2] ring-1 ring-[#e8edf5]">
                    {permissionCount} permission
                    {permissionCount === 1 ? "" : "s"}
                  </span>
                </div>

                {permissionVisuals.length > 0 ? (
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {permissionVisuals.map((item) => {
                      const Icon = item.icon;
                      return (
                        <span
                          key={item.key}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#e8edf5] bg-white px-2.5 py-1.5 text-[0.75rem] font-medium text-[#334155]"
                        >
                          <span
                            className={`inline-flex size-5 shrink-0 items-center justify-center rounded-md ${item.iconBg} ${item.iconColor}`}
                          >
                            <Icon
                              className="size-3"
                              strokeWidth={2.25}
                              aria-hidden
                            />
                          </span>
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="m-0 mt-3 text-sm text-slate-500">No access set</p>
                )}
              </div>
            </div>

            {/* --- Fixed footer --- */}
            <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#eef2f8] bg-white px-5 py-4 sm:px-6">
              {actionMessage ? (
                <p className="m-0 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#1877f2]">
                  {actionMessage}
                </p>
              ) : null}

              {canManageInvite || canEditAccess ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {canManageInvite ? (
                    <>
                      <button
                        type="button"
                        onClick={onResend}
                        disabled={isResending || isCopying || isRemoving}
                        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dbe7ff] bg-[#f5f9ff] px-4 text-sm font-semibold text-[#1877f2] transition hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isResending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <RefreshCw className="size-4" aria-hidden />
                        )}
                        Resend invite
                      </button>
                      <button
                        type="button"
                        onClick={onCopyLink}
                        disabled={isResending || isCopying || isRemoving}
                        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCopying ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Copy className="size-4" aria-hidden />
                        )}
                        Copy link
                      </button>
                    </>
                  ) : null}
                  {canEditAccess ? (
                    <button
                      type="button"
                      onClick={onEditInvite}
                      disabled={isResending || isCopying || isRemoving}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    >
                      <Pencil className="size-4" aria-hidden />
                      Edit access
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                {canRemove ? (
                  <button
                    type="button"
                    onClick={onRemove}
                    disabled={isRemoving}
                    className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRemoving ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                    {member.status === "pending" ? "Remove access" : "Remove"}
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function BusinessMembersPanel({
  businessId,
  embedded = false,
}: {
  businessId: number;
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();
  const canManageMembers = isAdminOrSuperAdminUser();
  const loggedInUserId = getSetupUser()?.id ?? null;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editInvite, setEditInvite] = useState<{
    kind: "pending" | "active";
    id: number;
    email: string;
    role: BusinessMemberRole;
    permissions: BusinessMemberPermission[];
  } | null>(null);
  const [detailsMember, setDetailsMember] =
    useState<BusinessMemberListItem | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<BusinessMemberListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailsActionMessage, setDetailsActionMessage] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const listOptions = useMemo(
    () => ({
      page,
      limit: MEMBERS_PAGE_SIZE,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );

  const membersQuery = useQuery({
    queryKey: businessMemberQueryKeys.list(businessId, listOptions),
    queryFn: () => getBusinessMembers(businessId, listOptions),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!isPusherConfigured() || businessId < 1) {
      return;
    }

    return subscribeBusinessMembers(businessId, (payload) => {
      if (payload.businessId !== businessId) return;

      void queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });

      setDetailsMember((current) => {
        if (!current) return current;
        const emailKey = payload.member.email.trim().toLowerCase();
        const same =
          (current.status === "pending" &&
            (current.id === payload.invitationId ||
              current.email.trim().toLowerCase() === emailKey)) ||
          (current.status === "active" &&
            current.email.trim().toLowerCase() === emailKey);
        if (!same) return current;
        return {
          ...current,
          id: payload.member.id,
          userId: payload.member.userId,
          status: "active",
          name: payload.member.name?.trim() || current.name,
          email: payload.member.email,
          role: payload.member.role || current.role,
        };
      });
    });
  }, [businessId, queryClient]);

  const removeMutation = useMutation({
    mutationFn: (member: BusinessMemberListItem) => {
      if (member.id == null || member.id < 1) {
        return Promise.reject(new Error("Missing member id."));
      }
      if (member.status === "pending") {
        return cancelPendingBusinessInvitation({
          businessId,
          invitationId: member.id,
        });
      }
      return removeBusinessMember(member.id);
    },
    onMutate: (member) => {
      setRemovingMemberId(member.id ?? null);
      setActionError(null);
    },
    onSuccess: async () => {
      setDetailsMember(null);
      setMemberToRemove(null);
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });
    },
    onError: (err: unknown) => {
      setActionError(getApiErrorMessage(err, "Could not remove the member."));
    },
    onSettled: () => {
      setRemovingMemberId(null);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: number) =>
      resendPendingBusinessInvitation({ businessId, invitationId }),
    onSuccess: async (result) => {
      setDetailsActionMessage(result.message || "Invitation resent.");
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });
    },
    onError: (err: unknown) => {
      setDetailsActionMessage(
        getApiErrorMessage(err, "Could not resend the invitation."),
      );
    },
  });

  const copyLinkMutation = useMutation({
    mutationFn: (invitationId: number) =>
      copyPendingBusinessInvitationLink({ businessId, invitationId }),
    onSuccess: async (result) => {
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
        setDetailsActionMessage(
          "Invite link copied. Previous emailed links no longer work.",
        );
      } catch {
        setDetailsActionMessage(result.inviteUrl);
      }
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });
    },
    onError: (err: unknown) => {
      setDetailsActionMessage(
        getApiErrorMessage(err, "Could not create an invite link."),
      );
    },
  });

  const isPendingInvite = memberToRemove?.status === "pending";
  const removeTargetLabel =
    memberToRemove?.name?.trim() ||
    memberToRemove?.email ||
    "this teammate";

  const members = membersQuery.data?.members ?? [];
  const meta = membersQuery.data?.meta;
  const stats = membersQuery.data?.stats ?? {
    activeCount: 0,
    pendingCount: 0,
    fullAccessCount: 0,
    roleCount: 0,
  };
  const isLoading = membersQuery.isLoading;
  const loadError = membersQuery.isError
    ? getApiErrorMessage(membersQuery.error, "Could not load members.")
    : null;

  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const pageFrom = total === 0 ? 0 : (safePage - 1) * MEMBERS_PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * MEMBERS_PAGE_SIZE, total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openInviteModal = () => {
    setEditInvite(null);
    setInviteOpen(true);
  };

  const openEditInvite = (member: BusinessMemberListItem) => {
    if (member.id == null || member.id < 1) return;
    if (member.status === "owner") return;
    const role =
      member.role === "Staff" ||
      member.role === "Manager" ||
      member.role === "Scanner"
        ? member.role
        : "Staff";
    setDetailsMember(null);
    setEditInvite({
      kind: member.status === "pending" ? "pending" : "active",
      id: member.id,
      email: member.email,
      role,
      permissions: member.permissions.filter(
        (item): item is BusinessMemberPermission =>
          item !== FULL_ACCESS_PERMISSION,
      ),
    });
    setInviteOpen(true);
  };

  return (
    <>
      <section className={embedded ? "space-y-4" : "space-y-5"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2563eb]"
              aria-hidden
            >
              <Users className="size-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-[#0f172a] sm:text-2xl">
                Members
              </h1>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {canManageMembers
                  ? "Invite teammates, assign roles, and control access"
                  : "See who is on this business and review their access"}
              </p>
            </div>
          </div>

          {canManageMembers ? (
            <button
              type="button"
              onClick={openInviteModal}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] transition hover:opacity-90"
              style={{ background: LOGO.blue }}
            >
              <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              Invite member
            </button>
          ) : null}
        </div>

        {canManageMembers && !isLoading && !loadError ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MembersKpiCard
              title="Total Members"
              value={stats.activeCount}
              hint="Active users in this business"
              icon={Users}
              tone="blue"
            />
            <MembersKpiCard
              title="Roles"
              value={stats.roleCount}
              hint="Different roles assigned"
              icon={Shield}
              tone="purple"
            />
            <MembersKpiCard
              title="Pending Invites"
              value={stats.pendingCount}
              hint="Awaiting acceptance"
              icon={Hourglass}
              tone="orange"
            />
            <MembersKpiCard
              title="Full Access"
              value={stats.fullAccessCount}
              hint="Members with full access"
              icon={LockOpen}
              tone="green"
            />
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {isLoading ? (
            <MembersTableSkeleton />
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <AlertCircle
                className="size-8 text-red-500"
                strokeWidth={2}
                aria-hidden
              />
              <p className="max-w-md text-sm text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={() => void membersQuery.refetch()}
                className="h-10 cursor-pointer rounded-xl border border-[#e8edf5] px-4 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fafc]"
              >
                Try again
              </button>
            </div>
          ) : total === 0 && !debouncedSearch ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="relative mb-5 flex size-20 items-center justify-center rounded-[1.35rem] bg-[#e8f2ff] text-[#1877f2] shadow-[0_12px_30px_rgba(24,119,242,0.12)] ring-1 ring-[#bfdbfe]">
                <Users className="size-9" strokeWidth={2} aria-hidden />
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-md">
                  <UserPlus className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
              </span>
              <p className="text-base font-bold text-[#07111f]">
                {canManageMembers ? "Build your team" : "No other members yet"}
              </p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                {canManageMembers
                  ? "You are the only member right now. Invite managers or staff to collaborate on campaigns, orders, and daily operations."
                  : "When teammates join this business, they will show up here. You can open Details to see their role and access."}
              </p>
              {canManageMembers ? (
                <button
                  type="button"
                  onClick={openInviteModal}
                  className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                  style={{
                    background: LOGO.blue,
                    boxShadow: "0 10px 24px rgba(11,105,252,0.22)",
                  }}
                >
                  <UserPlus className="size-4" strokeWidth={2.25} aria-hidden />
                  Invite your first member
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-[#eef2f7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                    <Users className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-bold text-[#0f172a]">
                      {total} Member
                      {total === 1 ? "" : "s"}
                    </p>
                    <p className="m-0 mt-0.5 text-xs font-medium text-slate-500">
                      {canManageMembers
                        ? "Manage your team members and their access"
                        : "People with access to this business"}
                    </p>
                  </div>
                </div>
                <label className="relative block w-full sm:max-w-[16rem]">
                  <span className="sr-only">Search members</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search members..."
                    className="h-10 w-full rounded-xl border border-[#e8edf5] bg-white py-2 pl-9 pr-3 text-sm text-[#0f172a] outline-none transition placeholder:text-slate-400 focus:border-[#bfdbfe] focus:ring-2 focus:ring-[#dbeafe]"
                  />
                </label>
              </div>

              {actionError ? (
                <div
                  role="alert"
                  className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <AlertCircle
                    className="mt-px size-3.5 shrink-0"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>{actionError}</span>
                </div>
              ) : null}

              {total === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="m-0 text-sm font-semibold text-[#0f172a]">
                    No members match your search
                  </p>
                  <p className="m-0 mt-1 text-xs text-slate-500">
                    Try a different name, email, or role.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#eef2f7]">
                        <th className="whitespace-nowrap px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                          Member
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                          Role
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => {
                        const initials = memberInitials(member);
                        const isLoggedInMember =
                          loggedInUserId != null &&
                          Number(member.userId) === Number(loggedInUserId) &&
                          member.userId > 0;
                        const canViewDetails = canManageMembers
                          ? member.status !== "owner"
                          : isLoggedInMember;
                        const canRemove =
                          canManageMembers &&
                          member.status !== "owner" &&
                          member.id != null &&
                          member.id > 0;
                        const isRemoving =
                          canRemove && removingMemberId === member.id;

                        return (
                          <tr
                            key={`${member.status}-${member.email}-${member.id ?? "owner"}`}
                            className="border-b border-[#f1f5f9] transition-colors last:border-b-0 hover:bg-[#f8fbff]"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`relative flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none ${avatarTone(member)}`}
                                >
                                  {initials}
                                </span>
                                <div className="min-w-0 leading-tight">
                                  <p className="truncate text-sm font-bold text-[#0f172a]">
                                    {member.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-[0.72rem] font-medium text-slate-400">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <span className="text-sm font-normal text-[#0f172a]">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}
                              >
                                <span
                                  className={`size-1.5 rounded-full ${statusDotClass(member.status)}`}
                                />
                                {memberStatusLabel(member.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle text-right">
                              {canViewDetails || canRemove ? (
                                <div className="inline-flex items-center justify-end gap-2">
                                  {canViewDetails ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDetailsActionMessage(null);
                                        setDetailsMember(member);
                                      }}
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                      <Eye className="size-3.5" aria-hidden />
                                      Details
                                    </button>
                                  ) : null}
                                  {canRemove ? (
                                    <button
                                      type="button"
                                      onClick={() => setMemberToRemove(member)}
                                      disabled={
                                        isRemoving || removeMutation.isPending
                                      }
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isRemoving ? (
                                        <Loader2
                                          className="size-3.5 animate-spin"
                                          aria-hidden
                                        />
                                      ) : (
                                        <Trash2
                                          className="size-3.5"
                                          aria-hidden
                                        />
                                      )}
                                      {member.status === "pending"
                                        ? "Remove access"
                                        : "Remove"}
                                    </button>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {total > 0 ? (
                <div className="flex flex-col gap-3 border-t border-[#eef2f7] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs font-medium text-slate-500">
                    Showing {pageFrom}–{pageTo} of {total}{" "}
                    member
                    {total === 1 ? "" : "s"}
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={safePage <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <span className="min-w-[4.5rem] text-center text-xs font-semibold text-slate-600">
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(totalPages, current + 1),
                        )
                      }
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setEditInvite(null);
        }}
        businessId={businessId}
        editInvite={editInvite}
        onSuccess={() => {
          setDetailsActionMessage(null);
          void queryClient.invalidateQueries({
            queryKey: businessMemberQueryKeys.lists(businessId),
          });
        }}
      />

      <MemberDetailsModal
        member={detailsMember}
        open={detailsMember != null}
        onClose={() => {
          setDetailsMember(null);
          setDetailsActionMessage(null);
        }}
        isRemoving={
          detailsMember?.id != null && removingMemberId === detailsMember.id
        }
        canManageMembers={canManageMembers}
        isResending={resendMutation.isPending}
        isCopying={copyLinkMutation.isPending}
        actionMessage={detailsActionMessage}
        onResend={() => {
          if (detailsMember?.id == null) return;
          setDetailsActionMessage(null);
          resendMutation.mutate(detailsMember.id);
        }}
        onCopyLink={() => {
          if (detailsMember?.id == null) return;
          setDetailsActionMessage(null);
          copyLinkMutation.mutate(detailsMember.id);
        }}
        onEditInvite={() => {
          if (detailsMember == null) return;
          openEditInvite(detailsMember);
        }}
        onRemove={() => {
          if (detailsMember == null) return;
          setMemberToRemove(detailsMember);
        }}
      />

      <ConfirmDialog
        open={memberToRemove != null}
        titleId="remove-member-confirm-title"
        zIndex={90}
        title={isPendingInvite ? "Remove access?" : "Remove member?"}
        description={
          isPendingInvite ? (
            <>
              Cancel the invitation for{" "}
              <span className="font-semibold text-[#07111f]">
                {removeTargetLabel}
              </span>
              ? They will no longer be able to join with this invite.
            </>
          ) : (
            <>
              Remove{" "}
              <span className="font-semibold text-[#07111f]">
                {removeTargetLabel}
              </span>{" "}
              from this business? They will lose access immediately.
            </>
          )
        }
        tone="danger"
        confirmLabel={isPendingInvite ? "Remove access" : "Remove"}
        loadingLabel="Removing…"
        isLoading={
          memberToRemove?.id != null && removingMemberId === memberToRemove.id
        }
        onCancel={() => {
          if (removeMutation.isPending) return;
          setMemberToRemove(null);
        }}
        onConfirm={() => {
          if (memberToRemove?.id == null) return;
          removeMutation.mutate(memberToRemove);
        }}
      />
    </>
  );
}
