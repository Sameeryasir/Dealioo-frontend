"use client";

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Megaphone, ShoppingBag } from "lucide-react";
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
  hasAnyAutomationPermission,
} from "@/app/lib/member-permissions";

type PermissionIcon = LucideIcon | ComponentType<{ className?: string }>;

type PermissionRow = {
  key: BusinessMemberPermission;
  label: string;
};

type PermissionGroup = {
  rows: PermissionRow[];
};

type PermissionSection = {
  title: string;
  icon: PermissionIcon;
  iconWrap: string;
  iconColor: string;
  brandIcon?: boolean;
  groups: PermissionGroup[];
  visibleFor: (role: BusinessMemberRole) => boolean;
};

const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    title: "Campaigns",
    icon: Megaphone,
    iconWrap: "bg-[#e8f2ff]",
    iconColor: "text-[#1877f2]",
    visibleFor: (role) =>
      roleSupportsCampaignModule(role) ||
      roleSupportsAutomationModule(role) ||
      roleSupportsFunnelModule(role),
    groups: [
      {
        rows: [
          { key: "campaigns_create", label: "Create campaigns" },
          { key: "campaigns_edit", label: "Edit campaigns" },
          { key: "campaigns_delete", label: "Delete campaigns" },
          { key: "campaigns_guests", label: "Campaign guests" },
          { key: "campaigns_orders", label: "Campaign orders" },
          { key: "automations", label: "Automation" },
          { key: "funnels_edit", label: "Funnel" },
        ],
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
    groups: [
      {
        rows: [
          { key: "meta_campaigns_create", label: "Create Meta campaigns" },
          { key: "meta_campaigns_delete", label: "Delete Meta campaigns" },
        ],
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
    groups: [
      {
        rows: [
          { key: "google_campaigns_create", label: "Create Google campaigns" },
          { key: "google_campaigns_delete", label: "Delete Google campaigns" },
        ],
      },
    ],
  },
  {
    title: "Operations",
    icon: ShoppingBag,
    iconWrap: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    visibleFor: () => true,
    groups: [
      {
        rows: [
          { key: "orders", label: "View orders" },
          { key: "activity", label: "View activity" },
          { key: "history", label: "View history" },
          { key: "chats", label: "Access guest chats" },
          { key: "scanning", label: "Scan & redeem passes" },
        ],
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
  if (key === "automations") {
    return hasAnyAutomationPermission(permissions);
  }
  if (key === "campaigns_edit") {
    return (
      permissions.includes("campaigns_edit") ||
      permissions.includes("campaigns_update")
    );
  }
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
      ["orders", "activity", "history", "chats", "scanning"].includes(row.key),
    );
  }
  return rows;
}

export function InvitePermissionSections({
  role,
  permissions,
  disabled,
  onToggle,
  showSectionIcons = true,
  allOn = false,
  grantedOnly = false,
  showToggles = true,
}: {
  role: BusinessMemberRole;
  permissions: readonly BusinessMemberPermission[];
  disabled?: boolean;
  onToggle?: (permission: BusinessMemberPermission) => void;
  showSectionIcons?: boolean;
  allOn?: boolean;
  grantedOnly?: boolean;
  showToggles?: boolean;
}) {
  const sections = PERMISSION_SECTIONS.map((section) => ({
    ...section,
    groups: section.groups
      .map((group) => ({
        ...group,
        rows: filterRowsForRole(role, group.rows).filter((row) => {
          if (!grantedOnly) return true;
          return allOn || isPermissionOn(permissions, row.key);
        }),
      }))
      .filter((group) => group.rows.length > 0),
  })).filter(
    (section) => section.visibleFor(role) && section.groups.length > 0,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <div className="border-b border-[#eef2f7] px-4 py-2.5">
        <p className="m-0 text-[0.7rem] font-semibold tracking-[0.08em] text-slate-400 uppercase">
          Sections
        </p>
      </div>

      {sections.map((section) => {
        const SectionIcon = section.icon;

        return (
          <div
            key={section.title}
            className="border-b border-[#eef2f7] last:border-b-0"
          >
            <div className="flex items-center gap-2.5 px-4 py-3">
              {showSectionIcons ? (
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full ${section.iconWrap} ${section.iconColor}`}
                >
                  {section.brandIcon ? (
                    <SectionIcon className="size-3.5" />
                  ) : (
                    <SectionIcon
                      className="size-3.5"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  )}
                </span>
              ) : null}
              <p className="m-0 text-sm font-bold text-[#0f172a]">
                {section.title}
              </p>
            </div>

            {section.groups.map((group, groupIndex) => (
              <div key={`${section.title}-${groupIndex}`}>
                {group.rows.map((row) => {
                  const checked =
                    allOn || isPermissionOn(permissions, row.key);
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 border-t border-[#f1f5f9] px-4 py-3"
                    >
                      <p className="m-0 text-sm font-medium text-[#334155]">
                        {row.label}
                      </p>
                      {showToggles ? (
                        <RoleToggle
                          checked={checked}
                          disabled={disabled}
                          label={row.label}
                          onChange={() => onToggle?.(row.key)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
