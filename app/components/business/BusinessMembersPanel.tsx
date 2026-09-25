"use client";

import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { InvitePermissionSections } from "@/app/components/business/BusinessPermissionsMatrix";
import { Skeleton } from "@/app/components/skeleton";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { getSetupUser } from "@/app/lib/setup-user";
import { standardEase } from "@/app/lib/motion";
import { subscribeBusinessMembers } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-members";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { toast } from "sonner";
import {
  cancelPendingBusinessInvitation,
  copyPendingBusinessInvitationLink,
  getBusinessMembers,
  removeBusinessMember,
  resendPendingBusinessInvitation,
} from "@/app/services/member/business-members";

const InviteMemberModal = dynamic(
  () =>
    import("@/app/components/business/InviteMemberModal").then(
      (mod) => mod.InviteMemberModal,
    ),
  { ssr: false },
);
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import {
  BUSINESS_MEMBER_PERMISSIONS,
  FULL_ACCESS_PERMISSION,
  type BusinessMemberListItem,
  type BusinessMemberPermission,
  type BusinessMemberRole,
} from "@/app/services/member/types";

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
  return "bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#bfdbfe]";
}

function statusDotClass(status: BusinessMemberListItem["status"]) {
  if (status === "pending") return "bg-[#ea580c]";
  return "bg-[#1877f2]";
}

function memberStatusLabel(status: BusinessMemberListItem["status"]) {
  if (status === "pending") return "Pending";
  return "Active";
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

function formatJoinedDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function teamRoleLabel(member: BusinessMemberListItem): string {
  if (member.status === "owner") return "Admin (Owner)";
  return member.role?.trim() || "Member";
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

function memberInviteRole(
  member: BusinessMemberListItem,
): BusinessMemberRole {
  if (member.role === "Staff" || member.role === "Scanner") {
    return member.role;
  }
  return "Manager";
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
  const hasFullAccess =
    member.status === "owner" ||
    member.permissions.includes(FULL_ACCESS_PERMISSION);
  const grantedPermissions = member.permissions.filter(
    (permission): permission is BusinessMemberPermission =>
      (BUSINESS_MEMBER_PERMISSIONS as readonly string[]).includes(permission),
  );
  const permissionCount = hasFullAccess ? 1 : grantedPermissions.length;
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
                      <span className="ml-2 text-sm font-medium text-[#07111f]">
                        {teamRoleLabel(member)}
                      </span>
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

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="m-0 truncate text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#07111f]">
                      Access &amp; permissions
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[0.68rem] font-semibold text-[#07111f] ring-1 ring-[#e8edf5]">
                    {permissionCount} permission
                    {permissionCount === 1 ? "" : "s"}
                  </span>
                </div>

                {hasFullAccess || grantedPermissions.length > 0 ? (
                  <div className="mt-3.5">
                    <InvitePermissionSections
                      role={memberInviteRole(member)}
                      permissions={grantedPermissions}
                      allOn={hasFullAccess}
                      grantedOnly
                      showToggles={false}
                    />
                  </div>
                ) : (
                  <p className="m-0 mt-3 text-sm text-slate-500">No access set</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#eef2f8] bg-white px-5 py-4 sm:px-6">
              {canManageInvite || canEditAccess ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  {canManageInvite ? (
                    <>
                      <button
                        type="button"
                        onClick={onResend}
                        disabled={isResending || isCopying || isRemoving}
                        className="inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dbe7ff] bg-[#f5f9ff] px-3 text-sm font-semibold text-[#1877f2] transition hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm font-semibold text-[#1877f2] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canManageMembers = isAdminOrSuperAdminUser();
  const { can, isOwnerLike, isFetched: membershipFetched, role, permissionList } =
    useBusinessMembershipPermissions(businessId);
  const canViewTeam = canManageMembers || isOwnerLike || can("members");
  const loggedInUserId = getSetupUser()?.id ?? null;
  const openSelfDetailsRequested =
    searchParams.get("openSelfDetails") === "1";
  const openSelfDetailsHandledRef = useRef(false);
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

  useEffect(() => {
    if (!openSelfDetailsRequested) {
      openSelfDetailsHandledRef.current = false;
      return;
    }
    if (openSelfDetailsHandledRef.current) return;
    if (!canViewTeam) return;

    const email = getSetupUser()?.email?.trim() ?? "";
    if (!email) return;
    if (debouncedSearch.toLowerCase() === email.toLowerCase()) return;

    setSearchQuery(email);
    setDebouncedSearch(email);
    setPage(1);
  }, [canViewTeam, debouncedSearch, openSelfDetailsRequested]);

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
    enabled: membershipFetched && canViewTeam,
  });

  useEffect(() => {
    if (!openSelfDetailsRequested) return;
    if (openSelfDetailsHandledRef.current) return;
    if (loggedInUserId == null || loggedInUserId < 1) return;

    const clearSelfDetailsQuery = () => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("openSelfDetails");
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    };

    if (!canViewTeam) {
      if (!membershipFetched) return;
      const setupUser = getSetupUser();
      if (!setupUser) return;

      openSelfDetailsHandledRef.current = true;
      setDetailsMember({
        id: null,
        userId: setupUser.id,
        name: setupUser.name,
        email: setupUser.email,
        role: role?.trim() || "Staff",
        status: "active",
        permissions: permissionList,
      });
      return;
    }

    if (membersQuery.isLoading || membersQuery.isFetching) return;

    const members = membersQuery.data?.members ?? [];
    const selfMember = members.find(
      (member) =>
        Number(member.userId) === Number(loggedInUserId) && member.userId > 0,
    );
    if (!selfMember) return;

    openSelfDetailsHandledRef.current = true;
    setDetailsMember(selfMember);
    setSearchQuery("");
    setDebouncedSearch("");
    clearSelfDetailsQuery();
  }, [
    canViewTeam,
    loggedInUserId,
    membersQuery.data?.members,
    membersQuery.isFetching,
    membersQuery.isLoading,
    membershipFetched,
    openSelfDetailsRequested,
    pathname,
    permissionList,
    role,
    router,
    searchParams,
  ]);

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
      toast.success(result.message || "Invitation resent.");
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });
    },
    onError: (err: unknown) => {
      toast.error(
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
        toast.success(
          "Invite link copied. Previous emailed links no longer work.",
        );
      } catch {
        toast.message(result.inviteUrl);
      }
      await queryClient.invalidateQueries({
        queryKey: businessMemberQueryKeys.lists(businessId),
      });
    },
    onError: (err: unknown) => {
      toast.error(
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

  if (membershipFetched && !canViewTeam) {
    return (
      <MemberDetailsModal
        member={detailsMember}
        open={detailsMember != null}
        onClose={() => {
          setDetailsMember(null);
          router.replace(`/business/${businessId}/dashboard`);
        }}
        isRemoving={false}
        canManageMembers={false}
        isResending={false}
        isCopying={false}
        onResend={() => undefined}
        onCopyLink={() => undefined}
        onEditInvite={() => undefined}
        onRemove={() => undefined}
      />
    );
  }

  return (
    <>
      <section className={embedded ? "space-y-5" : "space-y-6"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-[1.75rem]">
              Team
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isLoading
                ? "Loading workspace access…"
                : `${total} ${total === 1 ? "person has" : "people have"} access to this workspace`}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
            {!isLoading && !loadError ? (
              <label className="relative block w-full sm:max-w-[15rem] sm:flex-1 lg:w-56 lg:flex-none">
                <span className="sr-only">Search people</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search people"
                  className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#0f172a] outline-none transition placeholder:text-slate-400 focus:border-[#cbd5e1] focus:ring-2 focus:ring-slate-200"
                />
              </label>
            ) : null}

            {canManageMembers ? (
              <button
                type="button"
                onClick={openInviteModal}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(24,119,242,0.22)] transition hover:bg-[#166fe0]"
              >
                <UserPlus className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                Invite Person
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white">
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
                  ? "Invite people to collaborate on campaigns, orders, and daily operations."
                  : "When teammates join this business, they will show up here."}
              </p>
              {canManageMembers ? (
                <button
                  type="button"
                  onClick={openInviteModal}
                  className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/25 transition hover:bg-[#166fe0]"
                >
                  <UserPlus className="size-4" strokeWidth={2.25} aria-hidden />
                  Invite Person
                </button>
              ) : null}
            </div>
          ) : (
            <>
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
                    No people match your search
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
                        <th className="whitespace-nowrap px-5 py-3 text-left text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                          Name
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-left text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                          Joined
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-left text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
                          Role
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
                        const canOpenRow =
                          canViewDetails ||
                          (canManageMembers && member.status === "owner");

                        return (
                          <tr
                            key={`${member.status}-${member.email}-${member.id ?? "owner"}`}
                            className={`border-b border-[#f1f5f9] transition-colors last:border-b-0 ${
                              canOpenRow
                                ? "cursor-pointer hover:bg-[#f8fafc]"
                                : "hover:bg-[#fafafa]"
                            }`}
                            onClick={() => {
                              if (!canViewDetails) return;
                              setDetailsMember(member);
                            }}
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`relative flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none ${avatarTone(member)}`}
                                >
                                  {initials}
                                </span>
                                <div className="min-w-0 leading-tight">
                                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-bold text-[#0f172a]">
                                      {member.name}
                                    </p>
                                    {isLoggedInMember ? (
                                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500">
                                        You
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-0.5 truncate text-[0.72rem] font-medium text-slate-400">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(member.status)}`}
                              >
                                {memberStatusLabel(member.status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-middle text-sm font-medium text-slate-500">
                              {formatJoinedDate(
                                member.joinedAt ?? member.invitedAt,
                              )}
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="inline-flex rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {teamRoleLabel(member)}
                              </span>
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
                    {total === 1 ? "person" : "people"}
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

      {inviteOpen ? (
        <InviteMemberModal
          open={inviteOpen}
          onClose={() => {
            setInviteOpen(false);
            setEditInvite(null);
          }}
          businessId={businessId}
          editInvite={editInvite}
          onSuccess={() => {
            void queryClient.invalidateQueries({
              queryKey: businessMemberQueryKeys.lists(businessId),
            });
          }}
        />
      ) : null}

      <MemberDetailsModal
        member={detailsMember}
        open={detailsMember != null}
        onClose={() => {
          setDetailsMember(null);
        }}
        isRemoving={
          detailsMember?.id != null && removingMemberId === detailsMember.id
        }
        canManageMembers={canManageMembers}
        isResending={resendMutation.isPending}
        isCopying={copyLinkMutation.isPending}
        onResend={() => {
          if (detailsMember?.id == null) return;
          resendMutation.mutate(detailsMember.id);
        }}
        onCopyLink={() => {
          if (detailsMember?.id == null) return;
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

      <DeleteConfirmationDialog
        open={memberToRemove != null}
        itemName={removeTargetLabel}
        zIndex={90}
        title={isPendingInvite ? "Remove this access?" : "Remove this member?"}
        description={
          isPendingInvite ? (
            <>
              Are you sure you want to cancel the invitation for{" "}
              <span className="font-semibold text-[#1877f2]">
                {removeTargetLabel}
              </span>
              ? They will no longer be able to join with this invite. This
              cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#1877f2]">
                {removeTargetLabel}
              </span>{" "}
              from this business? They will lose access immediately. This cannot
              be undone.
            </>
          )
        }
        confirmText={isPendingInvite ? "Remove access" : "Remove member"}
        checkboxLabel={
          isPendingInvite
            ? `Are you sure you want to cancel the invitation for ${removeTargetLabel}?`
            : `Are you sure you want to remove ${removeTargetLabel} from this business?`
        }
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
