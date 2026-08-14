"use client";

import {
  AlertCircle,
  Briefcase,
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Mail,
  Megaphone,
  Send,
  Shield,
  Sparkles,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { standardEase } from "@/app/lib/motion";
import {
  CAMPAIGN_ACTION_OPTIONS,
  CAMPAIGNS_MODULE_ACCENT,
  GOOGLE_CAMPAIGN_ACTION_OPTIONS,
  GOOGLE_CAMPAIGNS_MODULE_ACCENT,
  META_CAMPAIGN_ACTION_OPTIONS,
  META_CAMPAIGNS_MODULE_ACCENT,
  getDefaultPermissionsForRole,
  getModulePermissionOptionsForRole,
  getSelectedCampaignActions,
  getSelectedGoogleCampaignActions,
  getSelectedMetaCampaignActions,
  roleSupportsCampaignModule,
  roleSupportsGoogleCampaignModule,
  roleSupportsMetaCampaignModule,
  type PermissionAccent,
} from "@/app/lib/member-permissions";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { inviteBusinessMember } from "@/app/services/member/business-members";
import {
  CAMPAIGN_ACTION_PERMISSIONS,
  GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
  META_CAMPAIGN_ACTION_PERMISSIONS,
  type BusinessMemberPermission,
  type BusinessMemberRole,
  type CampaignActionPermission,
  type GoogleCampaignActionPermission,
  type MetaCampaignActionPermission,
} from "@/app/services/member/types";

type PermissionIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  monochrome?: boolean;
}>;

function ModuleActionPicker<T extends string>({
  options,
  selected,
  disabled,
  onToggle,
  accent = "blue",
}: {
  options: { value: T; label: string }[];
  selected: T[];
  disabled?: boolean;
  onToggle: (action: T) => void;
  accent?: "blue" | "meta" | "google";
}) {
  const tones =
    accent === "meta"
      ? {
          panel: "from-[#f0f7ff] to-[#e7f3ff]/90",
          checkedBorder: "border-[#0081FB]/40",
          checkedRing: "ring-[#0081FB]/20",
          checkedShadow: "shadow-[0_4px_12px_rgba(0,129,251,0.14)]",
          boxOn:
            "border-[#0081FB] bg-[#0081FB] shadow-[0_2px_6px_rgba(0,129,251,0.35)]",
          labelOn: "text-[#0064c8]",
          hoverBorder: "hover:border-[#b3d7ff]",
          hoverCheck: "group-hover:border-[#0081FB]",
        }
      : accent === "google"
        ? {
            panel: "from-[#fffdf5] to-[#fff8e1]/90",
            checkedBorder: "border-[#FBBC04]/50",
            checkedRing: "ring-[#FBBC04]/25",
            checkedShadow: "shadow-[0_4px_12px_rgba(251,188,4,0.18)]",
            boxOn:
              "border-[#FBBC04] bg-[#FBBC04] shadow-[0_2px_6px_rgba(251,188,4,0.4)]",
            labelOn: "text-[#b06000]",
            hoverBorder: "hover:border-[#fde68a]",
            hoverCheck: "group-hover:border-[#FBBC04]",
          }
        : {
            panel: "from-[#f8fafc] to-[#eff6ff]/80",
            checkedBorder: "border-[#2563eb]/35",
            checkedRing: "ring-[#2563eb]/15",
            checkedShadow: "shadow-[0_4px_12px_rgba(37,99,235,0.12)]",
            boxOn:
              "border-[#2563eb] bg-[#2563eb] shadow-[0_2px_6px_rgba(37,99,235,0.35)]",
            labelOn: "text-[#1e3a8a]",
            hoverBorder: "hover:border-[#bfdbfe]",
            hoverCheck: "group-hover:border-[#93c5fd]",
          };

  return (
    <div
      className={`mt-3 w-full rounded-xl border border-white/80 bg-gradient-to-b ${tones.panel} p-2`}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((action) => {
          const checked = selected.includes(action.value);

          return (
            <button
              key={action.value}
              type="button"
              disabled={disabled}
              aria-pressed={checked}
              onClick={() => onToggle(action.value)}
              className={`group flex min-h-[2.25rem] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                checked
                  ? `${tones.checkedBorder} ${tones.checkedShadow} ring-1 ${tones.checkedRing}`
                  : `border-[#e5e7eb] ${tones.hoverBorder} hover:bg-white hover:shadow-sm`
              }`}
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-200 ${
                  checked
                    ? `${tones.boxOn} text-white`
                    : `border-[#d1d5db] bg-[#f9fafb] ${tones.hoverCheck}`
                }`}
                aria-hidden
              >
                <Check
                  className={`size-2.5 transition-all duration-200 ${
                    checked
                      ? "scale-100 opacity-100"
                      : "scale-75 opacity-0"
                  }`}
                  strokeWidth={3}
                />
              </span>
              <span
                className={`truncate text-xs font-semibold tracking-tight ${
                  checked ? tones.labelOn : "text-[#111827]"
                }`}
              >
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fieldInputClass =
  "h-11 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc]/80 pl-11 pr-4 text-base text-[#07111f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/40 focus:bg-white focus:ring-4 focus:ring-[#1877f2]/10 sm:h-12 sm:rounded-2xl sm:text-sm";

function PermissionToggle({
  enabled,
  onColorClass,
  disabled,
  label,
  onClick,
}: {
  enabled: boolean;
  onColorClass: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        enabled ? onColorClass : "bg-[#d1d5db]"
      }`}
    >
      <span
        className={`absolute top-[2px] size-[18px] rounded-full bg-white shadow-sm transition-[left] ${
          enabled ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

function PermissionModuleCard({
  icon: Icon,
  accent,
  label,
  description,
  enabled,
  disabled,
  expandable,
  expanded,
  onToggleExpand,
  onToggleEnabled,
  brandIcon = false,
  children,
}: {
  icon: PermissionIcon;
  accent: PermissionAccent;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onToggleEnabled: () => void;
  brandIcon?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.iconBg} ${accent.iconColor}`}
        >
          {brandIcon ? (
            <Icon className="size-5" aria-hidden />
          ) : (
            <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold leading-snug text-[#111827]">
            {label}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-[#6b7280]">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <PermissionToggle
            enabled={enabled}
            onColorClass={accent.toggleOn}
            disabled={disabled}
            label={`Toggle ${label}`}
            onClick={onToggleEnabled}
          />
          {expandable ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
              disabled={disabled || !enabled}
              onClick={onToggleExpand}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-[#9ca3af] outline-none transition hover:bg-[#f3f4f6] hover:text-[#4b5563] focus-visible:ring-2 focus-visible:ring-[#2563eb]/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronDown
                className={`size-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>

      {expandable && enabled && expanded ? (
        <div className="w-full">{children}</div>
      ) : null}
    </div>
  );
}

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
  const [campaignsExpanded, setCampaignsExpanded] = useState(true);
  const [metaCampaignsExpanded, setMetaCampaignsExpanded] = useState(true);
  const [googleCampaignsExpanded, setGoogleCampaignsExpanded] = useState(true);

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

  const modulePermissionOptions = useMemo(
    () => getModulePermissionOptionsForRole(role),
    [role],
  );
  const showCampaignModule = roleSupportsCampaignModule(role);
  const showMetaCampaignModule = roleSupportsMetaCampaignModule(role);
  const showGoogleCampaignModule = roleSupportsGoogleCampaignModule(role);
  const selectedCampaignActions = useMemo(
    () => getSelectedCampaignActions(permissions),
    [permissions],
  );
  const selectedMetaCampaignActions = useMemo(
    () => getSelectedMetaCampaignActions(permissions),
    [permissions],
  );
  const selectedGoogleCampaignActions = useMemo(
    () => getSelectedGoogleCampaignActions(permissions),
    [permissions],
  );
  const campaignsModuleEnabled = selectedCampaignActions.length > 0;
  const metaCampaignsModuleEnabled = selectedMetaCampaignActions.length > 0;
  const googleCampaignsModuleEnabled =
    selectedGoogleCampaignActions.length > 0;

  const canSubmit =
    email.trim().length > 0 &&
    permissions.length > 0 &&
    !inviteMutation.isPending;

  const handleRoleChange = (nextRole: BusinessMemberRole) => {
    setRole(nextRole);
    setPermissions(getDefaultPermissionsForRole(nextRole));
    setCampaignsExpanded(true);
    setMetaCampaignsExpanded(true);
    setGoogleCampaignsExpanded(true);
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
      const isOn = current.includes(permission);
      if (isOn) {
        return current.filter((item) => item !== permission);
      }
      return [...current, permission];
    });
  };

  const setCampaignModuleEnabled = (enabled: boolean) => {
    setPermissions((current) => {
      const withoutCampaignKeys = stripLegacyCampaignFlags(current).filter(
        (item) =>
          item !== "campaigns_view" &&
          !(CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(item),
      );

      if (!enabled) {
        return withoutCampaignKeys;
      }

      return [...withoutCampaignKeys, ...CAMPAIGN_ACTION_PERMISSIONS];
    });
    if (enabled) {
      setCampaignsExpanded(true);
    }
  };

  const setMetaCampaignModuleEnabled = (enabled: boolean) => {
    setPermissions((current) => {
      const withoutMetaKeys = stripLegacyCampaignFlags(current).filter(
        (item) =>
          item !== "meta_campaigns_view" &&
          !(META_CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(
            item,
          ),
      );

      if (!enabled) {
        return withoutMetaKeys;
      }

      return [...withoutMetaKeys, ...META_CAMPAIGN_ACTION_PERMISSIONS];
    });
    if (enabled) {
      setMetaCampaignsExpanded(true);
    }
  };

  const toggleCampaignAction = (action: CampaignActionPermission) => {
    setPermissions((current) => {
      const base = stripLegacyCampaignFlags(current);
      const selected = new Set(getSelectedCampaignActions(base));

      if (selected.has(action)) {
        selected.delete(action);
      } else {
        selected.add(action);
      }

      const withoutCampaignKeys = base.filter(
        (item) =>
          item !== "campaigns_view" &&
          !(CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(item),
      );

      return [
        ...withoutCampaignKeys,
        ...CAMPAIGN_ACTION_PERMISSIONS.filter((key) => selected.has(key)),
      ];
    });
  };

  const toggleMetaCampaignAction = (action: MetaCampaignActionPermission) => {
    setPermissions((current) => {
      const base = stripLegacyCampaignFlags(current);
      const selected = new Set(getSelectedMetaCampaignActions(base));

      if (selected.has(action)) {
        selected.delete(action);
      } else {
        selected.add(action);
      }

      const withoutMetaKeys = base.filter(
        (item) =>
          item !== "meta_campaigns_view" &&
          !(META_CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(
            item,
          ),
      );

      return [
        ...withoutMetaKeys,
        ...META_CAMPAIGN_ACTION_PERMISSIONS.filter((key) => selected.has(key)),
      ];
    });
  };

  const setGoogleCampaignModuleEnabled = (enabled: boolean) => {
    setPermissions((current) => {
      const withoutGoogleKeys = stripLegacyCampaignFlags(current).filter(
        (item) =>
          item !== "google_campaigns_view" &&
          !(GOOGLE_CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(
            item,
          ),
      );

      if (!enabled) {
        return withoutGoogleKeys;
      }

      return [...withoutGoogleKeys, ...GOOGLE_CAMPAIGN_ACTION_PERMISSIONS];
    });
    if (enabled) {
      setGoogleCampaignsExpanded(true);
    }
  };

  const toggleGoogleCampaignAction = (
    action: GoogleCampaignActionPermission,
  ) => {
    setPermissions((current) => {
      const base = stripLegacyCampaignFlags(current);
      const selected = new Set(getSelectedGoogleCampaignActions(base));

      if (selected.has(action)) {
        selected.delete(action);
      } else {
        selected.add(action);
      }

      const withoutGoogleKeys = base.filter(
        (item) =>
          item !== "google_campaigns_view" &&
          !(GOOGLE_CAMPAIGN_ACTION_PERMISSIONS as readonly string[]).includes(
            item,
          ),
      );

      return [
        ...withoutGoogleKeys,
        ...GOOGLE_CAMPAIGN_ACTION_PERMISSIONS.filter((key) =>
          selected.has(key),
        ),
      ];
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
                Team invite
              </div>
              <h2
                id="invite-member-title"
                className="mt-1.5 text-lg font-extrabold tracking-tight text-[#07111f] sm:mt-2 sm:text-xl"
              >
                Add a new member
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
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

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            {showCampaignModule ? (
              <PermissionModuleCard
                icon={Megaphone}
                accent={CAMPAIGNS_MODULE_ACCENT}
                label="Campaigns"
                description="View and manage marketing campaigns."
                enabled={campaignsModuleEnabled}
                disabled={inviteMutation.isPending}
                expandable
                expanded={campaignsExpanded}
                onToggleExpand={() =>
                  setCampaignsExpanded((current) => !current)
                }
                onToggleEnabled={() =>
                  setCampaignModuleEnabled(!campaignsModuleEnabled)
                }
              >
                <ModuleActionPicker
                  options={CAMPAIGN_ACTION_OPTIONS}
                  selected={selectedCampaignActions}
                  disabled={inviteMutation.isPending}
                  onToggle={toggleCampaignAction}
                  accent="blue"
                />
              </PermissionModuleCard>
            ) : null}

            {showMetaCampaignModule ? (
              <PermissionModuleCard
                icon={MetaLogo}
                brandIcon
                accent={META_CAMPAIGNS_MODULE_ACCENT}
                label="Meta Campaigns"
                description="View and manage Meta Ads campaigns."
                enabled={metaCampaignsModuleEnabled}
                disabled={inviteMutation.isPending}
                expandable
                expanded={metaCampaignsExpanded}
                onToggleExpand={() =>
                  setMetaCampaignsExpanded((current) => !current)
                }
                onToggleEnabled={() =>
                  setMetaCampaignModuleEnabled(!metaCampaignsModuleEnabled)
                }
              >
                <ModuleActionPicker
                  options={META_CAMPAIGN_ACTION_OPTIONS}
                  selected={selectedMetaCampaignActions}
                  disabled={inviteMutation.isPending}
                  onToggle={toggleMetaCampaignAction}
                  accent="meta"
                />
              </PermissionModuleCard>
            ) : null}

            {showGoogleCampaignModule ? (
              <PermissionModuleCard
                icon={GoogleAdsLogo}
                brandIcon
                accent={GOOGLE_CAMPAIGNS_MODULE_ACCENT}
                label="Google Campaigns"
                description="View and manage Google Ads campaigns."
                enabled={googleCampaignsModuleEnabled}
                disabled={inviteMutation.isPending}
                expandable
                expanded={googleCampaignsExpanded}
                onToggleExpand={() =>
                  setGoogleCampaignsExpanded((current) => !current)
                }
                onToggleEnabled={() =>
                  setGoogleCampaignModuleEnabled(!googleCampaignsModuleEnabled)
                }
              >
                <ModuleActionPicker
                  options={GOOGLE_CAMPAIGN_ACTION_OPTIONS}
                  selected={selectedGoogleCampaignActions}
                  disabled={inviteMutation.isPending}
                  onToggle={toggleGoogleCampaignAction}
                  accent="google"
                />
              </PermissionModuleCard>
            ) : null}

            {modulePermissionOptions.map((option) => {
              const enabled = permissions.includes(option.value);
              return (
                <PermissionModuleCard
                  key={option.value}
                  icon={option.icon}
                  accent={option.accent}
                  label={option.label}
                  description={option.description}
                  enabled={enabled}
                  disabled={inviteMutation.isPending}
                  onToggleEnabled={() => togglePermission(option.value)}
                />
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
            className="relative flex max-h-[min(92vh,100dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] sm:max-h-[92vh] sm:rounded-[1.5rem]"
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
