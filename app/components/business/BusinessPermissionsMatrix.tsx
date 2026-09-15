"use client";

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Filter,
  Megaphone,
  MessageSquare,
  Pencil,
  Plus,
  ScanLine,
  ShoppingBag,
  Trash2,
  Workflow,
} from "lucide-react";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import type {
  BusinessMemberPermission,
  BusinessMemberRole,
} from "@/app/services/member/types";
import {
  roleSupportsAutomationModule,
  roleSupportsCampaignModule,
  roleSupportsFunnelModule,
  roleSupportsGoogleCampaignModule,
  roleSupportsMetaCampaignModule,
  hasAnyCampaignPermission,
} from "@/app/lib/member-permissions";

type PermissionIcon = LucideIcon | ComponentType<{ className?: string }>;

type PermissionRow = {
  key: BusinessMemberPermission;
  label: string;
  icon: PermissionIcon;
  iconWrap: string;
  iconColor: string;
  brandIcon?: boolean;
};

type PermissionSection = {
  title: string;
  icon: PermissionIcon;
  iconWrap: string;
  iconColor: string;
  brandIcon?: boolean;
  rows: PermissionRow[];
  visibleFor: (role: BusinessMemberRole) => boolean;
};

const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    title: "Campaigns",
    icon: Megaphone,
    iconWrap: "bg-[#e8f2ff]",
    iconColor: "text-[#1877f2]",
    visibleFor: (role) => roleSupportsCampaignModule(role),
    rows: [
      {
        key: "campaigns_create",
        label: "Create campaigns",
        icon: Plus,
        iconWrap: "bg-[#e8f2ff]",
        iconColor: "text-[#1877f2]",
      },
      {
        key: "campaigns_edit",
        label: "Edit campaigns",
        icon: Pencil,
        iconWrap: "bg-[#eef2ff]",
        iconColor: "text-[#4f46e5]",
      },
      {
        key: "campaigns_delete",
        label: "Delete campaigns",
        icon: Trash2,
        iconWrap: "bg-[#fee2e2]",
        iconColor: "text-[#dc2626]",
      },
    ],
  },
  {
    title: "Funnels",
    icon: Filter,
    iconWrap: "bg-[#ecfdf5]",
    iconColor: "text-[#059669]",
    visibleFor: (role) => roleSupportsFunnelModule(role),
    rows: [
      {
        key: "funnels_edit",
        label: "Update funnel pages",
        icon: Filter,
        iconWrap: "bg-[#ecfdf5]",
        iconColor: "text-[#059669]",
      },
    ],
  },
  {
    title: "Meta Ads",
    icon: MetaLogo,
    brandIcon: true,
    iconWrap: "bg-[#e7f3ff]",
    iconColor: "text-[#0081FB]",
    visibleFor: (role) => roleSupportsMetaCampaignModule(role),
    rows: [
      {
        key: "meta_campaigns_create",
        label: "Create Meta campaigns",
        icon: MetaLogo,
        brandIcon: true,
        iconWrap: "bg-[#e7f3ff]",
        iconColor: "text-[#0081FB]",
      },
      {
        key: "meta_campaigns_delete",
        label: "Delete Meta campaigns",
        icon: MetaLogo,
        brandIcon: true,
        iconWrap: "bg-[#fee2e2]",
        iconColor: "text-[#dc2626]",
      },
    ],
  },
  {
    title: "Google Ads",
    icon: GoogleAdsLogo,
    brandIcon: true,
    iconWrap: "bg-[#fff8e1]",
    iconColor: "text-[#d97706]",
    visibleFor: (role) => roleSupportsGoogleCampaignModule(role),
    rows: [
      {
        key: "google_campaigns_create",
        label: "Create Google campaigns",
        icon: GoogleAdsLogo,
        brandIcon: true,
        iconWrap: "bg-[#fff8e1]",
        iconColor: "text-[#d97706]",
      },
      {
        key: "google_campaigns_delete",
        label: "Delete Google campaigns",
        icon: GoogleAdsLogo,
        brandIcon: true,
        iconWrap: "bg-[#fee2e2]",
        iconColor: "text-[#dc2626]",
      },
    ],
  },
  {
    title: "Automations",
    icon: Workflow,
    iconWrap: "bg-[#ede9fe]",
    iconColor: "text-[#7c3aed]",
    visibleFor: (role) => roleSupportsAutomationModule(role),
    rows: [
      {
        key: "automations_create",
        label: "Create automations",
        icon: Plus,
        iconWrap: "bg-[#ede9fe]",
        iconColor: "text-[#7c3aed]",
      },
      {
        key: "automations_edit",
        label: "Update automations",
        icon: Pencil,
        iconWrap: "bg-[#ede9fe]",
        iconColor: "text-[#7c3aed]",
      },
      {
        key: "automations_delete",
        label: "Delete automations",
        icon: Trash2,
        iconWrap: "bg-[#fee2e2]",
        iconColor: "text-[#dc2626]",
      },
    ],
  },
  {
    title: "Operations",
    icon: ShoppingBag,
    iconWrap: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    visibleFor: () => true,
    rows: [
      {
        key: "orders",
        label: "View orders",
        icon: ShoppingBag,
        iconWrap: "bg-[#ffedd5]",
        iconColor: "text-[#ea580c]",
      },
      {
        key: "activity",
        label: "View activity",
        icon: BarChart3,
        iconWrap: "bg-[#dbeafe]",
        iconColor: "text-[#2563eb]",
      },
      {
        key: "chats",
        label: "Access guest chats",
        icon: MessageSquare,
        iconWrap: "bg-[#ccfbf1]",
        iconColor: "text-[#0d9488]",
      },
      {
        key: "scanning",
        label: "Scan & redeem passes",
        icon: ScanLine,
        iconWrap: "bg-[#fce7f3]",
        iconColor: "text-[#db2777]",
      },
    ],
  },
];

function RoleToggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#1877f2]" : "bg-[#e5e7eb]"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-[1.35rem]" : "translate-x-0.5"
        }`}
        aria-hidden
      />
    </button>
  );
}

function isPermissionOn(
  permissions: readonly BusinessMemberPermission[],
  key: BusinessMemberPermission,
): boolean {
  return permissions.includes(key);
}

function filterRowsForRole(
  role: BusinessMemberRole,
  rows: PermissionRow[],
): PermissionRow[] {
  if (role === "Scanner") {
    return rows.filter(
      (row) => row.key === "scanning" || row.key === "orders",
    );
  }
  if (role === "Staff") {
    return rows.filter((row) =>
      ["orders", "activity", "chats", "scanning"].includes(row.key),
    );
  }
  return rows;
}

function PermissionIconBadge({
  icon: Icon,
  brandIcon,
  iconWrap,
  iconColor,
  size = "row",
}: {
  icon: PermissionIcon;
  brandIcon?: boolean;
  iconWrap: string;
  iconColor: string;
  size?: "section" | "row";
}) {
  const wrapSize = size === "section" ? "size-7 rounded-full" : "size-8 rounded-xl";
  const iconSize = size === "section" ? "size-3.5" : "size-4";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${wrapSize} ${iconWrap} ${iconColor}`}
    >
      {brandIcon ? (
        <Icon className={iconSize} />
      ) : (
        <Icon className={iconSize} strokeWidth={2.25} aria-hidden />
      )}
    </span>
  );
}

export function InvitePermissionSections({
  role,
  permissions,
  disabled,
  onToggle,
}: {
  role: BusinessMemberRole;
  permissions: readonly BusinessMemberPermission[];
  disabled?: boolean;
  onToggle: (permission: BusinessMemberPermission) => void;
}) {
  const campaignAccessGranted = hasAnyCampaignPermission(permissions);
  const sections = PERMISSION_SECTIONS.map((section) => ({
    ...section,
    rows: filterRowsForRole(role, section.rows),
  })).filter(
    (section) => section.visibleFor(role) && section.rows.length > 0,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <div className="border-b border-[#eef2f7] px-4 py-2.5">
        <p className="m-0 text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
          Sections
        </p>
      </div>

      {sections.map((section) => {
        const isAutomations = section.title === "Automations";
        const sectionLocked = isAutomations && !campaignAccessGranted;

        return (
          <div
            key={section.title}
            className="border-b border-[#eef2f7] last:border-b-0"
          >
            <div className="flex items-center gap-2.5 px-4 py-3">
              <PermissionIconBadge
                icon={section.icon}
                brandIcon={section.brandIcon}
                iconWrap={section.iconWrap}
                iconColor={section.iconColor}
                size="section"
              />
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-[#0f172a]">
                  {section.title}
                </p>
                {sectionLocked ? (
                  <p className="m-0 mt-0.5 text-xs font-medium text-slate-500">
                    Grant a Campaigns permission first to enable automations.
                  </p>
                ) : null}
              </div>
            </div>
            {section.rows.map((row) => {
              const checked =
                !sectionLocked && isPermissionOn(permissions, row.key);
              const rowDisabled = Boolean(disabled || sectionLocked);
              return (
                <div
                  key={row.key}
                  className={`flex items-center justify-between gap-3 border-t border-[#f1f5f9] px-4 py-3 ${
                    sectionLocked ? "opacity-55" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PermissionIconBadge
                      icon={row.icon}
                      brandIcon={row.brandIcon}
                      iconWrap={row.iconWrap}
                      iconColor={row.iconColor}
                    />
                    <p className="m-0 text-sm font-medium text-[#334155]">
                      {row.label}
                    </p>
                  </div>
                  <RoleToggle
                    checked={checked}
                    disabled={rowDisabled}
                    label={row.label}
                    onChange={() => onToggle(row.key)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
