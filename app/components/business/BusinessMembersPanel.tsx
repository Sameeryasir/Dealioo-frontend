"use client";

import {
  AlertCircle,
  Eye,
  KeyRound,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { InviteMemberModal } from "@/app/components/business/InviteMemberModal";
import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { standardEase } from "@/app/lib/motion";
import { getPermissionLabel } from "@/app/lib/member-permissions";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getBusinessMembers,
  removeBusinessMember,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import { type BusinessMemberListItem } from "@/app/services/member/types";

const LOGO = {
  blue: "#0B69FC",
  pink: "#F83071",
  orange: "#FD7137",
  purple: "#AD20E3",
  green: "#00B34C",
  yellow: "#FCB825",
} as const;

const panelCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

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

function memberStatusBadge(status: BusinessMemberListItem["status"]) {
  // Status column uses orange — keep badges in that family (not green like Access).
  if (status === "owner") {
    return "bg-[#fff4ed] text-[#c2410c] ring-[#fdba74]";
  }
  if (status === "pending") {
    return "bg-[#fff8eb] text-[#b45309] ring-[#fcd34d]";
  }
  return "bg-[#fff4ed] text-[#FD7137] ring-[#fdba74]";
}

function memberStatusLabel(status: BusinessMemberListItem["status"]) {
  if (status === "owner") return "Owner";
  if (status === "pending") return "Pending";
  return "Active";
}

function MemberAccessPills({
  member,
}: {
  member: BusinessMemberListItem;
}) {
  if (member.status === "owner") {
    return (
      <span className="inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[0.68rem] font-bold text-emerald-700 ring-1 ring-emerald-200">
        Full access
      </span>
    );
  }

  if (member.permissions.length === 0) {
    return <span className="text-xs text-slate-400">No access set</span>;
  }

  const visible = member.permissions.slice(0, 3);
  const hiddenCount = member.permissions.length - visible.length;

  return (
    <div className="flex max-w-[16rem] flex-wrap gap-1.5">
      {visible.map((permission) => (
        <span
          key={permission}
          className="inline-flex rounded-full bg-[#f4f8ff] px-2 py-0.5 text-[0.68rem] font-semibold text-[#1877f2] ring-1 ring-[#bfdbfe]"
        >
          {getPermissionLabel(permission)}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-slate-600">
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  );
}

function MembersTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
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
  const permissionLabels =
    member.permissions.length > 0
      ? member.permissions.map((permission) => getPermissionLabel(permission))
      : [];

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
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e2eaf5] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f8] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-sm font-bold leading-none text-[#1877f2] ring-1 ring-[#bfdbfe]">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p
                    id="member-details-title"
                    className="truncate text-base font-bold text-[#07111f]"
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
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close member details"
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <p className="text-slate-600">
                  <span className="text-slate-400">Role</span>{" "}
                  <span className="font-semibold text-[#07111f]">
                    {member.role}
                  </span>
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${memberStatusBadge(member.status)}`}
                >
                  {memberStatusLabel(member.status)}
                </span>
              </div>

              {(member.invitedAt || member.expiresAt) && (
                <div className="space-y-1 text-sm text-slate-600">
                  {member.invitedAt ? (
                    <p>
                      <span className="text-slate-400">Invited</span>{" "}
                      {formatMemberDate(member.invitedAt)}
                    </p>
                  ) : null}
                  {member.expiresAt ? (
                    <p>
                      <span className="text-slate-400">Expires</span>{" "}
                      {formatMemberDate(member.expiresAt)}
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Access
                </p>
                {permissionLabels.length > 0 ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-[#07111f]">
                    {permissionLabels.join(" · ")}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-500">No access set</p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#eef2f8] px-5 py-3.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              {canRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={isRemoving}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
  // Ask before remove so owners do not revoke access by accident.
  const [memberToRemove, setMemberToRemove] =
    useState<BusinessMemberListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const membersQuery = useQuery({
    queryKey: businessMemberQueryKeys.list(businessId),
    queryFn: () => getBusinessMembers(businessId),
    staleTime: 30_000,
  });

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

  return (
    <>
      <section className={embedded ? "space-y-4" : "space-y-5"}>
        <div className={embedded ? "" : panelCardClass}>
          <div className="relative border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]"
                  aria-hidden
                >
                  <UserRound className="size-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <h1 className="text-base font-extrabold tracking-tight text-[#07111f] sm:text-lg">
                    Members
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Invite teammates, assign roles, and control access
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-xs font-semibold leading-none text-white shadow-sm transition hover:opacity-90"
                style={{ background: LOGO.blue }}
              >
                <Plus className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                Invite member
              </button>
            </div>
          </div>

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
              {actionError ? (
                <div
                  role="alert"
                  className="mx-5 mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
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
                  <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
                    <th className="whitespace-nowrap px-5 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={UserRound}
                        label="Member"
                        iconClassName="text-[#0B69FC]"
                        labelClassName="text-[#0B69FC]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={Shield}
                        label="Role"
                        iconClassName="text-[#AD20E3]"
                        labelClassName="text-[#AD20E3]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={UserPlus}
                        label="Status"
                        iconClassName="text-[#FD7137]"
                        labelClassName="text-[#FD7137]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={KeyRound}
                        label="Access"
                        iconClassName="text-[#00B34C]"
                        labelClassName="text-[#00B34C]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-right align-middle">
                      <span className="inline-flex items-center justify-end text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#FCB825]">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => {
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
                        className={`border-b border-[#f1f5f9] transition-colors last:border-b-0 hover:bg-[#f0f5ff] ${
                          index % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                        }`}
                      >
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-sm font-bold leading-none text-[#1877f2] ring-1 ring-[#bfdbfe]">
                              {initials}
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="truncate text-sm font-bold text-[#07111f]">
                                {member.name}
                              </p>
                              <p className="mt-0.5 truncate text-[0.7rem] font-medium text-slate-400">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-sm font-medium text-slate-700">
                          {member.role}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-bold ring-1 ${memberStatusBadge(member.status)}`}
                          >
                            {memberStatusLabel(member.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <MemberAccessPills member={member} />
                        </td>
                        <td className="px-5 py-3.5 align-middle text-right">
                          {canViewDetails || canRemove ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              {canViewDetails ? (
                                <button
                                  type="button"
                                  onClick={() => setDetailsMember(member)}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#FCB825]/50 hover:bg-[#FFF8E8] hover:text-[#FCB825]"
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
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                            <span className="text-xs text-slate-400">—</span>
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
          detailsMember?.id != null &&
          removingMemberId === detailsMember.id
        }
        onRemove={() => {
          if (detailsMember == null) return;
          setMemberToRemove(detailsMember);
        }}
      />

      <ConfirmDialog
        open={memberToRemove != null}
        titleId="remove-member-confirm-title"
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
          memberToRemove?.id != null &&
          removingMemberId === memberToRemove.id
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
