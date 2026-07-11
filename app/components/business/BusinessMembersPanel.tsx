"use client";

/**
 * Change: Business team members list + invite flow.
 * Why: Owners can invite Manager/Staff users and manage active members.
 * Related: business-members.ts, members/page.tsx, BusinessSettingsPanel.tsx
 */

import {
  AlertCircle,
  Briefcase,
  Check,
  Clock3,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Send,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/app/components/skeleton";
import { standardEase } from "@/app/lib/motion";
import {
  getDefaultPermissionsForRole,
  getPermissionLabel,
  PERMISSION_OPTIONS,
} from "@/app/lib/member-permissions";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getBusinessMembers,
  inviteBusinessMember,
  removeBusinessMember,
} from "@/app/services/member/business-members";
import { businessMemberQueryKeys } from "@/app/services/member/member-query-keys";
import {
  type BusinessMemberListItem,
  type BusinessMemberPermission,
  type BusinessMemberRole,
} from "@/app/services/member/types";

const panelCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const fieldInputClass =
  "h-12 w-full rounded-2xl border border-[#e8edf5] bg-[#f8fafc]/80 pl-11 pr-4 text-sm text-[#07111f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/40 focus:bg-white focus:ring-4 focus:ring-[#1877f2]/10";

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

function memberStatusBadge(status: BusinessMemberListItem["status"]) {
  if (status === "owner") {
    return "bg-[#ecfdf5] text-emerald-700 ring-emerald-200";
  }
  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-[#e8f2ff] text-[#1877f2] ring-[#bfdbfe]";
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

function InviteMemberModal({
  open,
  onClose,
  businessId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  businessId: number;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BusinessMemberRole>("Manager");
  const [permissions, setPermissions] = useState<BusinessMemberPermission[]>(
    () => getDefaultPermissionsForRole("Manager"),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("Manager");
    setPermissions(getDefaultPermissionsForRole("Manager"));
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteBusinessMember({
        businessId,
        email: email.trim(),
        role,
        permissions,
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      setError(getApiErrorMessage(err, "Could not send the invitation."));
    },
  });

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === role) ?? ROLE_OPTIONS[0],
    [role],
  );

  const emailPreview = email.trim();
  const canSubmit =
    emailPreview.length > 0 &&
    permissions.length > 0 &&
    !inviteMutation.isPending;

  const handleRoleChange = (nextRole: BusinessMemberRole) => {
    setRole(nextRole);
    setPermissions(getDefaultPermissionsForRole(nextRole));
  };

  const togglePermission = (permission: BusinessMemberPermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const selectAllPermissions = () => {
    setPermissions(PERMISSION_OPTIONS.map((option) => option.value));
  };

  const clearAllPermissions = () => {
    setPermissions([]);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="invite-member-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: standardEase }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[3px]"
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
            className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-[#e8edf5] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03]"
          >
            <div className="relative overflow-hidden border-b border-[#e8edf5]/80 bg-gradient-to-br from-[#e8f2ff] via-white to-[#f8fafc] px-6 py-5">
              <span
                className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-[#1877f2]/10 blur-2xl"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -left-6 bottom-0 size-24 rounded-full bg-[#6366f1]/10 blur-2xl"
                aria-hidden
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-white shadow-lg shadow-[#1877f2]/30">
                    <UserPlus className="size-6" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#bfdbfe]">
                      <Sparkles className="size-3" aria-hidden />
                      Team invite
                    </div>
                    <h2
                      id="invite-member-title"
                      className="mt-2 text-xl font-extrabold tracking-tight text-[#07111f]"
                    >
                      Add a new member
                    </h2>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                      Send a secure email invitation, choose a role, and decide
                      exactly what this teammate can access.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e8edf5] bg-white/90 text-slate-500 transition hover:bg-white hover:text-[#07111f]"
                  aria-label="Close"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                inviteMutation.mutate();
              }}
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLE_OPTIONS.map((option) => {
                    const selected = role === option.value;
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRoleChange(option.value)}
                        disabled={inviteMutation.isPending}
                        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                          selected
                            ? `border-[#1877f2] bg-[#f4f8ff] shadow-[0_10px_24px_rgba(24,119,242,0.12)] ring-2 ${option.ring}`
                            : "border-[#e8edf5] bg-white hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${option.accent} text-white shadow-md`}
                          >
                            <Icon className="size-5" strokeWidth={2.25} aria-hidden />
                          </span>
                          {selected ? (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                              <Check className="size-3.5" strokeWidth={3} aria-hidden />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-bold text-[#07111f]">
                          {option.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
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
                  Choose what this person can open in your business dashboard.
                  Role presets are applied automatically, but you control the
                  final access.
                </p>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {PERMISSION_OPTIONS.map((option) => {
                    const enabled = permissions.includes(option.value);
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => togglePermission(option.value)}
                        disabled={inviteMutation.isPending}
                        aria-pressed={enabled}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                          enabled
                            ? "border-[#1877f2] bg-[#f4f8ff] ring-1 ring-[#1877f2]/20"
                            : "border-[#e8edf5] bg-white hover:border-[#dbeafe] hover:bg-[#f8fbff]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            enabled
                              ? "bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-white"
                              : "bg-[#f1f5f9] text-slate-500"
                          }`}
                        >
                          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#07111f]">
                              {option.label}
                            </span>
                            <span
                              className={`inline-flex size-5 items-center justify-center rounded-full border ${
                                enabled
                                  ? "border-[#1877f2] bg-[#1877f2] text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Check className="size-3" strokeWidth={3} aria-hidden />
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
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

              <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8fafc] to-white p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Invitation preview
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-sm font-bold text-white">
                    {(emailPreview.split("@")[0] || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#07111f]">
                      {emailPreview || "teammate@company.com"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Will join as{" "}
                      <span className="font-semibold text-[#1877f2]">
                        {selectedRole.label}
                      </span>{" "}
                      with {permissions.length} access area
                      {permissions.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.68rem] font-bold text-[#1877f2] ring-1 ring-[#bfdbfe] sm:inline-flex">
                    {permissions.length} enabled
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {permissions.length > 0 ? (
                    permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#1877f2] ring-1 ring-[#bfdbfe]"
                      >
                        {getPermissionLabel(permission)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-amber-700">
                      No access selected yet
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
                  Secure link expires in 7 days after sending.
                </div>
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

              <div className="flex flex-col-reverse gap-2 border-t border-[#f1f5f9] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={inviteMutation.isPending}
                  className="h-11 cursor-pointer rounded-xl border border-[#e8edf5] px-5 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#0d5bb8] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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

export function BusinessMembersPanel({
  businessId,
  embedded = false,
}: {
  businessId: number;
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
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

  const members = membersQuery.data?.members ?? [];
  const isLoading = membersQuery.isLoading;
  const loadError = membersQuery.isError
    ? getApiErrorMessage(membersQuery.error, "Could not load members.")
    : null;

  return (
    <>
      <section className={embedded ? "space-y-4" : "space-y-5"}>
        <div
          className={`flex flex-wrap items-start justify-between gap-3 ${
            embedded ? "" : "px-1"
          }`}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#07111f] sm:text-2xl">
              Members
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Invite teammates, assign roles, and control exactly what each person
              can access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="group inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#1877f2] to-[#0d5bb8] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/25 transition hover:brightness-105"
          >
            <span className="flex size-7 items-center justify-center rounded-xl bg-white/15 transition group-hover:bg-white/20">
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            Invite member
          </button>
        </div>

        <div className={embedded ? "" : panelCardClass}>
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
              <span className="relative mb-5 flex size-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[#e8f2ff] to-white text-[#1877f2] shadow-[0_12px_30px_rgba(24,119,242,0.12)] ring-1 ring-[#bfdbfe]">
                <Users className="size-9" strokeWidth={2} aria-hidden />
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-white shadow-md">
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
                className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1877f2] to-[#0d5bb8] px-5 text-sm font-bold text-white shadow-lg shadow-[#1877f2]/20 transition hover:brightness-105"
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
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="px-5 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Access
                    </th>
                    <th className="px-5 py-3 text-right text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const initial =
                      member.name.trim().charAt(0).toUpperCase() || "?";
                    const canRemove =
                      member.status === "active" &&
                      member.id != null &&
                      member.id > 0;
                    const isRemoving =
                      canRemove && removingMemberId === member.id;

                    return (
                      <tr
                        key={`${member.status}-${member.email}-${member.id ?? "owner"}`}
                        className="border-b border-[#f8fafc] last:border-0"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.75rem] font-bold text-white">
                              {initial}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#07111f]">
                                {member.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                          {member.role}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-bold ring-1 ${memberStatusBadge(member.status)}`}
                          >
                            {memberStatusLabel(member.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <MemberAccessPills member={member} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (member.id == null) return;
                                removeMutation.mutate(member.id);
                              }}
                              disabled={isRemoving || removeMutation.isPending}
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
                              Remove
                            </button>
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
    </>
  );
}
