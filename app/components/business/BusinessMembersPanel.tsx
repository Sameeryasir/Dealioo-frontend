"use client";

import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  Hourglass,
  Loader2,
  LockOpen,
  Megaphone,
  MessageSquare,
  Plus,
  ScanLine,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { InviteMemberModal } from "@/app/components/business/InviteMemberModal";
import { Skeleton } from "@/app/components/skeleton";
import { standardEase } from "@/app/lib/motion";
import { getPermissionLabel } from "@/app/lib/member-permissions";
import { subscribeBusinessMembers } from "@/app/lib/pusher-client";
import {
  isPusherConfigured,
  memberJoinedToListItem,
} from "@/app/lib/pusher-members";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getBusinessMembers,
  removeBusinessMember,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import {
  FULL_ACCESS_PERMISSION,
  type BusinessMemberListItem,
  type BusinessMembersResponse,
} from "@/app/services/member/types";

const LOGO = {
  blue: "#0B69FC",
  pink: "#F83071",
  orange: "#FD7137",
  purple: "#AD20E3",
  green: "#00B34C",
  yellow: "#FCB825",
} as const;

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

function statusBadgeClass(_status: BusinessMemberListItem["status"]) {
  return "bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#dbeafe]";
}

function memberStatusLabel(status: BusinessMemberListItem["status"]) {
  if (status === "pending") return "Pending";
  if (status === "owner") return "Active";
  return "Accepted";
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
}: {
  member: BusinessMemberListItem | null;
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  isRemoving: boolean;
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
    member.status !== "owner" && member.id != null && member.id > 0;
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-details-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: standardEase }}
            className="relative flex max-h-[min(92vh,44rem)] w-full max-w-[40rem] flex-col overflow-hidden rounded-2xl border border-[#e2eaf5] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold leading-none ${avatarTone(member)}`}
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
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close member details"
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-medium text-slate-400">
                    Role
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#2563eb]">
                      <Briefcase
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    <span className="truncate text-sm font-bold text-[#07111f]">
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 border-l border-[#e8edf5] pl-3">
                  <p className="text-[0.7rem] font-medium text-slate-400">
                    Status
                  </p>
                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          member.status === "pending"
                            ? "bg-[#1877f2]"
                            : "bg-[#1877f2]"
                        }`}
                      />
                      {memberStatusLabel(member.status)}
                    </span>
                  </div>
                  {member.status === "pending" ? (
                    <p className="mt-2 text-[0.72rem] leading-snug text-slate-500">
                      Status stays Pending until they finish signup or sign in
                      and join. Opening the invite link alone does not accept
                      the invite.
                    </p>
                  ) : null}
                </div>
              </div>

              {showDates ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {member.invitedAt ? (
                    <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]">
                          <CalendarDays
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-medium text-slate-400">
                            Invited
                          </p>
                          <p className="mt-0.5 text-[0.78rem] font-semibold leading-snug text-[#07111f]">
                            {formatMemberDate(member.invitedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                  {member.expiresAt ? (
                    <div className="rounded-xl border border-[#dbeafe] bg-[#f5f9ff] px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]">
                          <CalendarDays
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-medium text-slate-400">
                            Expires
                          </p>
                          <p className="mt-0.5 text-[0.78rem] font-semibold leading-snug text-[#07111f]">
                            {formatMemberDate(member.expiresAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="min-h-[11rem] rounded-xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <ShieldCheck
                      className="size-4 shrink-0 text-[#1877f2]"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <p className="truncate text-[0.72rem] font-bold uppercase tracking-wide text-[#1877f2]">
                      Access &amp; permissions
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e8f2ff] px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#1877f2] ring-1 ring-[#dbeafe]">
                    {permissionCount} permission
                    {permissionCount === 1 ? "" : "s"}
                  </span>
                </div>

                {permissionVisuals.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-3">
                    {permissionVisuals.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center">
                          {index > 0 ? (
                            <span
                              className="mx-1.5 hidden h-4 w-px bg-[#e2e8f0] sm:inline-block"
                              aria-hidden
                            />
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#334155]">
                            <span
                              className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md ${item.iconBg} ${item.iconColor}`}
                            >
                              <Icon
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                            </span>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2.5 text-sm text-slate-500">No access set</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#eef2f8] px-6 py-4 sm:flex-row sm:justify-end">
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailsMember, setDetailsMember] =
    useState<BusinessMemberListItem | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<BusinessMemberListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const membersQuery = useQuery({
    queryKey: businessMemberQueryKeys.list(businessId),
    queryFn: () => getBusinessMembers(businessId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isPusherConfigured() || businessId < 1) {
      return;
    }

    return subscribeBusinessMembers(businessId, (payload) => {
      if (payload.businessId !== businessId) return;

      const activeMember = memberJoinedToListItem(payload);
      const emailKey = activeMember.email.trim().toLowerCase();

      queryClient.setQueryData<BusinessMembersResponse>(
        businessMemberQueryKeys.list(businessId),
        (previous) => {
          if (!previous) {
            return { members: [activeMember] };
          }

          let replacedPending = false;
          const nextMembers: BusinessMemberListItem[] = [];

          for (const row of previous.members) {
            const sameInvite =
              row.status === "pending" &&
              (row.id === payload.invitationId ||
                row.email.trim().toLowerCase() === emailKey);
            const sameActive =
              row.status === "active" &&
              (row.id === activeMember.id ||
                row.email.trim().toLowerCase() === emailKey);

            if (sameInvite || sameActive) {
              if (!replacedPending) {
                nextMembers.push(activeMember);
                replacedPending = true;
              }
              continue;
            }

            nextMembers.push(row);
          }

          if (!replacedPending) {
            const ownerIndex = nextMembers.findIndex(
              (row) => row.status === "owner",
            );
            const insertAt =
              ownerIndex >= 0
                ? (() => {
                    let i = ownerIndex + 1;
                    while (
                      i < nextMembers.length &&
                      nextMembers[i].status === "active"
                    ) {
                      i += 1;
                    }
                    return i;
                  })()
                : nextMembers.length;
            nextMembers.splice(insertAt, 0, activeMember);
          }

          return { members: nextMembers };
        },
      );

      setDetailsMember((current) => {
        if (!current) return current;
        const same =
          (current.status === "pending" &&
            (current.id === payload.invitationId ||
              current.email.trim().toLowerCase() === emailKey)) ||
          (current.status === "active" &&
            (current.id === activeMember.id ||
              current.email.trim().toLowerCase() === emailKey));
        return same ? activeMember : current;
      });
    });
  }, [businessId, queryClient]);

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeBusinessMember(memberId),
    onMutate: (memberId) => {
      setRemovingMemberId(memberId);
      setActionError(null);
    },
    onSuccess: async () => {
      setDetailsMember(null);
      setMemberToRemove(null);
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.list(businessId),
      });
    },
    onError: (err: unknown) => {
      setActionError(getApiErrorMessage(err, "Could not remove the member."));
    },
    onSettled: () => {
      setRemovingMemberId(null);
    },
  });

  const isPendingInvite = memberToRemove?.status === "pending";
  const removeTargetLabel =
    memberToRemove?.name?.trim() ||
    memberToRemove?.email ||
    "this teammate";

  const members = membersQuery.data?.members ?? [];
  const isLoading = membersQuery.isLoading;
  const loadError = membersQuery.isError
    ? getApiErrorMessage(membersQuery.error, "Could not load members.")
    : null;

  const stats = useMemo(() => {
    const activeCount = members.filter((m) => m.status !== "pending").length;
    const pendingCount = members.filter((m) => m.status === "pending").length;
    const fullAccessCount = members.filter((m) => m.status === "owner").length;
    const roleCount = new Set(
      members.map((m) => m.role.trim().toLowerCase()).filter(Boolean),
    ).size;
    return { activeCount, pendingCount, fullAccessCount, roleCount };
  }, [members]);

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
                Invite teammates, assign roles, and control access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] transition hover:opacity-90"
            style={{ background: LOGO.blue }}
          >
            <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            Invite member
          </button>
        </div>

        {!isLoading && !loadError ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#1877f2]">
                    Total Members
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">
                    {stats.activeCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Active users in this business
                  </p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                  <Users className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#1877f2]">Roles</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">
                    {stats.roleCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Different roles assigned
                  </p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                  <Shield className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#1877f2]">
                    Pending Invites
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">
                    {stats.pendingCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Awaiting acceptance
                  </p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                  <Hourglass className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#1877f2]">
                    Full Access
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f172a]">
                    {stats.fullAccessCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Members with full access
                  </p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
                  <LockOpen className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
              </div>
            </div>
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
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="relative mb-5 flex size-20 items-center justify-center rounded-[1.35rem] bg-[#e8f2ff] text-[#1877f2] shadow-[0_12px_30px_rgba(24,119,242,0.12)] ring-1 ring-[#bfdbfe]">
                <Users className="size-9" strokeWidth={2} aria-hidden />
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-md">
                  <UserPlus className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
              </span>
              <p className="text-base font-bold text-[#07111f]">
                Build your team
              </p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                You are the only member right now. Invite managers or staff to
                collaborate on campaigns, orders, and daily operations.
              </p>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                style={{
                  background: LOGO.blue,
                  boxShadow: "0 10px 24px rgba(11,105,252,0.22)",
                }}
              >
                <UserPlus className="size-4" strokeWidth={2.25} aria-hidden />
                Invite your first member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="border-b border-[#eef2f7] px-5 py-3.5">
                <p className="text-sm font-bold text-[#0f172a]">
                  {members.length} Member
                  {members.length === 1 ? "" : "s"}
                </p>
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
                    const canViewDetails = member.status !== "owner";
                    const canRemove =
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
                          <span className="text-sm font-semibold text-[#0f172a]">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="text-sm font-medium text-slate-600">
                            {memberStatusLabel(member.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          {canViewDetails || canRemove ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              {canViewDetails ? (
                                <button
                                  type="button"
                                  onClick={() => setDetailsMember(member)}
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
                                    <Trash2 className="size-3.5" aria-hidden />
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
        </div>
      </section>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        businessId={businessId}
        onSuccess={() => {
          void queryClient.invalidateQueries({
            queryKey: businessMemberQueryKeys.list(businessId),
          });
        }}
      />

      <MemberDetailsModal
        member={detailsMember}
        open={detailsMember != null}
        onClose={() => setDetailsMember(null)}
        isRemoving={
          detailsMember?.id != null && removingMemberId === detailsMember.id
        }
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
          removeMutation.mutate(memberToRemove.id);
        }}
      />
    </>
  );
}
