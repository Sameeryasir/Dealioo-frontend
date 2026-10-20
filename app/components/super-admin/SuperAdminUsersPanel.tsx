"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import {
  formatAbsoluteDate,
  initialsFromName,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getSetupUser } from "@/app/lib/setup-user";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { createAdminUser } from "@/app/services/admin/create-admin-user";
import { getAdminRoles } from "@/app/services/admin/get-admin-roles";
import {
  getAdminUsers,
  type AdminUsersSort,
  type AdminUsersTab,
} from "@/app/services/admin/get-admin-users";
import type {
  PlatformAdminUser,
  PlatformAdminUserBusiness,
} from "@/app/services/admin/get-platform-overview";
import { updateAdminUser } from "@/app/services/admin/update-admin-user";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowUpDown,
  Briefcase,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Filter,
  Loader2,
  Lock,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type UserDraft = {
  name: string;
  email: string;
  phone: string;
  roleName: string;
};

type CreateDraft = UserDraft & {
  password: string;
  confirmElevateToSuperAdmin: boolean;
};

function isStrongAdminPassword(password: string): boolean {
  return (
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const TAB_OPTIONS: Array<{ id: AdminUsersTab; label: string }> = [
  { id: "all", label: "All Users" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "admins", label: "Admins" },
  { id: "managers", label: "Managers" },
  { id: "viewers", label: "Viewers" },
];

function toDraft(user: PlatformAdminUser): UserDraft {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    roleName: user.roleName || "Admin",
  };
}

function formatPctLabel(value: number, suffix: string): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}% ${suffix}`;
}

function BusinessListLogo({
  business,
}: {
  business: PlatformAdminUserBusiness;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = business.logoUrl?.trim()
    ? resolveUploadImageUrl(business.logoUrl.trim())
    : null;
  const initials = initialsFromName(business.name || "?");

  if (logoUrl && !imageFailed) {
    return (
      <span className={styles.usersDirDetailBusinessLogo} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote business logos */}
        <img
          src={logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`${styles.usersDirDetailBusinessLogo} ${styles.usersDirDetailBusinessLogoPlaceholder}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: PlatformAdminUser;
  size?: "sm" | "lg";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user.avatar?.trim()
    ? resolveUploadImageUrl(user.avatar.trim())
    : null;
  const initials = initialsFromName(user.name || user.email || "?");
  const className =
    size === "lg" ? styles.userAvatarLg : styles.userAvatar;

  if (avatarUrl && !imageFailed) {
    return (
      <span className={className} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote/user avatars */}
        <img
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden>
      {initials}
    </span>
  );
}

function UserRowMenu({
  user,
  open,
  busy,
  onOpenChange,
  onManage,
  onToggleActive,
}: {
  user: PlatformAdminUser;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onManage: () => void;
  onToggleActive: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const actorId = getSetupUser()?.id ?? null;
  const isSelf = actorId != null && actorId === user.id;

  const positionMenu = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 184;
    const estimatedHeight = 96;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight + gap;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    setMenuStyle({
      left,
      top: openUpward
        ? Math.max(8, rect.top - estimatedHeight - gap)
        : rect.bottom + gap,
      width: menuWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;

    const onReposition = () => {
      positionMenu();
    };

    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className={styles.userMenuWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.userMenuBtn}
        aria-label={`Actions for ${user.name || user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          if (!open) positionMenu();
          onOpenChange(!open);
        }}
      >
        <MoreVertical className="size-4" strokeWidth={2.25} aria-hidden />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              className={`${styles.userMenuDropdown} ${styles.userMenuDropdownFixed}`}
              role="menu"
              style={menuStyle}
            >
              <button
                type="button"
                role="menuitem"
                className={styles.userMenuItem}
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                  onManage();
                }}
              >
                <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
                Manage user
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${styles.userMenuItem} ${
                  user.isActive ? styles.userMenuItemDanger : ""
                }`}
                disabled={busy || isSelf}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                  onToggleActive();
                }}
              >
                <Power className="size-3.5" strokeWidth={2.25} aria-hidden />
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function UserDetailsModal({
  user,
  onClose,
  onManage,
}: {
  user: PlatformAdminUser;
  onClose: () => void;
  onManage: () => void;
}) {
  const businesses = user.businesses ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const contactAndActivityRows: Array<{
    label: string;
    value: string;
    icon: typeof Mail;
    tone: "blue" | "green" | "purple";
  }> = [
    { label: "Email", value: user.email || "—", icon: Mail, tone: "blue" },
    {
      label: "Phone",
      value: user.phone?.trim() || "Not set",
      icon: Phone,
      tone: "blue",
    },
    {
      label: "Joined on",
      value: formatAbsoluteDate(user.createdAt),
      icon: CalendarDays,
      tone: "green",
    },
    {
      label: "Last active",
      value: user.lastLoginAt
        ? formatAbsoluteDate(user.lastLoginAt)
        : "Never",
      icon: Clock3,
      tone: "purple",
    },
  ];

  const summaryStats: Array<{
    label: string;
    value: string;
    icon: typeof Box;
    tone: "blue" | "green" | "purple";
  }> = [
    {
      label: "Provider",
      value: (user.provider || "—").toUpperCase(),
      icon: Box,
      tone: "blue",
    },
    {
      label: "Email verified",
      value: user.emailVerified ? "Verified" : "Not verified",
      icon: ShieldCheck,
      tone: "green",
    },
    {
      label: "Businesses",
      value: String(businesses.length),
      icon: Users,
      tone: "purple",
    },
  ];

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={styles.usersDirDetailSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-user-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.usersDirDetailClose}
          onClick={onClose}
          aria-label="Close user details"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className={styles.usersDirDetailBody}>
          <div className={styles.usersDirDetailIdentity}>
            <div className={styles.usersDirDetailAvatarRing}>
              <UserAvatar user={user} size="lg" />
            </div>
            <div className={styles.usersDirDetailIdentityText}>
              <p className={styles.usersDirDetailEyebrow}>User profile</p>
              <h3
                id="sa-user-details-title"
                className={styles.usersDirDetailName}
              >
                {user.name || "User details"}
              </h3>
              <p className={styles.usersDirDetailEmail}>{user.email}</p>
              <div className={styles.usersDirDetailChips}>
                <span
                  className={`${styles.usersDirDetailChip} ${
                    user.isActive
                      ? styles.usersDirDetailChipActive
                      : styles.usersDirDetailChipMuted
                  }`}
                >
                  <span className={styles.usersDirStatusDot} aria-hidden />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span className={styles.usersDirDetailChipRole}>
                  <Shield className="size-3" strokeWidth={2.5} aria-hidden />
                  {user.roleName || "No role"}
                </span>
                <span className={styles.usersDirDetailChipPlan}>
                  <Briefcase className="size-3" strokeWidth={2.5} aria-hidden />
                  {user.planName || "No plan"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.usersDirDetailStats}>
            {summaryStats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className={styles.usersDirDetailStat}>
                <span
                  className={`${styles.usersDirDetailStatIcon} ${
                    tone === "green"
                      ? styles.usersDirDetailToneGreen
                      : tone === "purple"
                        ? styles.usersDirDetailTonePurple
                        : styles.usersDirDetailToneBlue
                  }`}
                  aria-hidden
                >
                  <Icon className="size-3.5" strokeWidth={2.25} />
                </span>
                <div className={styles.usersDirDetailStatCopy}>
                  <span className={styles.usersDirDetailStatLabel}>{label}</span>
                  <span className={styles.usersDirDetailStatValue}>{value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>
              Contact & activity
            </h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {contactAndActivityRows.map(
                ({ label, value, icon: Icon, tone }) => (
                  <div key={label} className={styles.usersDirDetailInfoRow}>
                    <span
                      className={`${styles.usersDirDetailInfoIcon} ${
                        tone === "green"
                          ? styles.usersDirDetailToneGreen
                          : tone === "purple"
                            ? styles.usersDirDetailTonePurple
                            : styles.usersDirDetailToneBlue
                      }`}
                      aria-hidden
                    >
                      <Icon className="size-3.5" strokeWidth={2.25} />
                    </span>
                    <div className={styles.usersDirDetailInfoCopy}>
                      <span className={styles.usersDirDetailInfoLabel}>
                        {label}
                      </span>
                      <span className={styles.usersDirDetailInfoValue}>
                        {value}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>
              Business access
            </h4>
            {businesses.length > 0 ? (
              <ol className={styles.usersDirDetailBusinessList}>
                {businesses.map((business, index) => (
                  <li key={`${business.id}-${business.role}`}>
                    <span className={styles.usersDirDetailBusinessIndex}>
                      {index + 1}.
                    </span>
                    <BusinessListLogo business={business} />
                    <span className={styles.usersDirDetailBusinessName}>
                      {business.name}
                    </span>
                    <span className={styles.usersDirDetailBusinessRolePill}>
                      <Crown className="size-3" strokeWidth={2.5} aria-hidden />
                      {business.role}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.usersDirBusinessEmpty}>
                Not linked to any business yet.
              </p>
            )}
          </div>
        </div>

        <div className={styles.usersDirDetailFooter}>
          <button
            type="button"
            className={styles.userControlSecondary}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.userControlPrimary}
            onClick={() => {
              onClose();
              onManage();
            }}
          >
            <UserCog className="size-3.5" strokeWidth={2.25} aria-hidden />
            Manage user
          </button>
        </div>
      </section>
    </div>
  );
}

function UserManageModal({
  user,
  saving,
  onClose,
  onSave,
}: {
  user: PlatformAdminUser;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: UserDraft) => void;
}) {
  const [draft, setDraft] = useState<UserDraft>(() => toDraft(user));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        className={styles.userControl}
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${user.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.userControlHead}>
          <div className={styles.userCell}>
            <UserAvatar user={user} />
            <div className={styles.userCellText}>
              <h3 className={styles.userControlTitle}>Manage user</h3>
              <p className={styles.userControlSub}>
                Update profile details for this account.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.userControlClose}
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>

        <div className={styles.userControlGrid}>
          <div className={styles.userControlField}>
            <label htmlFor={`sa-user-name-${user.id}`}>
              <User className="size-3.5" strokeWidth={2.25} aria-hidden />
              Name
            </label>
            <input
              id={`sa-user-name-${user.id}`}
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              disabled={saving}
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor={`sa-user-email-${user.id}`}>
              <Mail className="size-3.5" strokeWidth={2.25} aria-hidden />
              Email
            </label>
            <input
              id={`sa-user-email-${user.id}`}
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              disabled={saving}
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor={`sa-user-phone-${user.id}`}>
              <Phone className="size-3.5" strokeWidth={2.25} aria-hidden />
              Phone
            </label>
            <input
              id={`sa-user-phone-${user.id}`}
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              disabled={saving}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className={styles.userControlActions}>
          <button
            type="button"
            className={styles.userControlSecondary}
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.userControlPrimary}
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}

function AddUserModal({
  roles,
  saving,
  onClose,
  onSave,
}: {
  roles: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: CreateDraft) => void;
}) {
  const [draft, setDraft] = useState<CreateDraft>({
    name: "",
    email: "",
    phone: "",
    password: "",
    roleName: roles[0] || "Admin",
    confirmElevateToSuperAdmin: false,
  });
  const roleOptions =
    roles.length > 0 ? roles : ["Admin", "Member", "Super Admin"];
  const elevatingToSuperAdmin =
    draft.roleName.trim().toLowerCase() === "super admin";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        className={styles.userControl}
        role="dialog"
        aria-modal="true"
        aria-label="Add user"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.userControlHead}>
          <div>
            <h3 className={styles.userControlTitle}>Add user</h3>
            <p className={styles.userControlSub}>
              Create a Dealioo account and assign a platform role.
            </p>
          </div>
          <button
            type="button"
            className={styles.userControlClose}
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>

        <div className={styles.userControlGrid}>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-user-name">Name</label>
            <input
              id="sa-add-user-name"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              disabled={saving}
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-user-email">Email</label>
            <input
              id="sa-add-user-email"
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              disabled={saving}
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-user-phone">Phone</label>
            <input
              id="sa-add-user-phone"
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              disabled={saving}
              placeholder="Optional"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-user-password">Password</label>
            <input
              id="sa-add-user-password"
              type="password"
              value={draft.password}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              disabled={saving}
              placeholder="8+ chars, 1 uppercase, 1 number"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-user-role">Role</label>
            <select
              id="sa-add-user-role"
              value={draft.roleName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  roleName: event.target.value,
                  confirmElevateToSuperAdmin: false,
                }))
              }
              disabled={saving}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {elevatingToSuperAdmin ? (
            <div
              className={styles.userControlField}
              style={{ gridColumn: "1 / -1" }}
            >
              <label htmlFor="sa-add-user-confirm-sa">
                <input
                  id="sa-add-user-confirm-sa"
                  type="checkbox"
                  checked={draft.confirmElevateToSuperAdmin}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      confirmElevateToSuperAdmin: event.target.checked,
                    }))
                  }
                  disabled={saving}
                />
                I confirm creating another Super Admin account
              </label>
            </div>
          ) : null}
        </div>

        <div className={styles.userControlActions}>
          <button
            type="button"
            className={styles.userControlSecondary}
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.userControlPrimary}
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function SuperAdminUsersPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [tab, setTab] = useState<AdminUsersTab>("all");
  const [sort, setSort] = useState<AdminUsersSort>("newest");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [manageUserId, setManageUserId] = useState<number | null>(null);
  const [detailsUserId, setDetailsUserId] = useState<number | null>(null);
  const [statusUserId, setStatusUserId] = useState<number | null>(null);
  const [menuUserId, setMenuUserId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filterHintOpen, setFilterHintOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const usersQuery = useQuery({
    queryKey: adminQueryKeys.users(
      page,
      debouncedSearch,
      pageSize,
      tab,
      sort,
    ),
    queryFn: () =>
      getAdminUsers({
        page,
        limit: pageSize,
        search: debouncedSearch,
        tab,
        sort,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const rolesQuery = useQuery({
    queryKey: adminQueryKeys.roles(),
    queryFn: getAdminRoles,
    enabled: hasAuthSession(),
    staleTime: 5 * 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: number;
      input: Parameters<typeof updateAdminUser>[1];
    }) => updateAdminUser(userId, input),
    onSuccess: async () => {
      toast.success("User updated.");
      setManageUserId(null);
      setStatusUserId(null);
      setMenuUserId(null);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.usersRoot(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update user."));
    },
  });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      toast.success("User created.");
      setAddOpen(false);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.usersRoot(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create user."));
    },
  });

  const items = usersQuery.data?.items ?? [];
  const meta = usersQuery.data?.meta;
  const summary = usersQuery.data?.summary;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const loading = usersQuery.isLoading || usersQuery.isFetching;
  const errorMessage = usersQuery.error
    ? getApiErrorMessage(usersQuery.error, "Could not load users.")
    : null;
  const manageUser = items.find((user) => user.id === manageUserId) ?? null;
  const detailsUser = items.find((user) => user.id === detailsUserId) ?? null;
  const statusUser = items.find((user) => user.id === statusUserId) ?? null;
  const roleNames = (rolesQuery.data ?? []).map((role) => role.name);
  const nextActive = statusUser ? !statusUser.isActive : false;
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);
  const showingStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingEnd = Math.min(page * pageSize, total);
  const allSelected =
    items.length > 0 && items.every((user) => selectedIds.includes(user.id));

  const stats = [
    {
      label: "Total Users",
      value: summary?.total ?? 0,
      hint: formatPctLabel(summary?.totalChangePct ?? 0, "vs previous 30 days"),
      hintMuted: (summary?.totalChangePct ?? 0) === 0,
      icon: Users,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "New Users",
      value: summary?.newUsers ?? 0,
      hint: formatPctLabel(
        summary?.newUsersChangePct ?? 0,
        "vs previous 30 days",
      ),
      hintMuted: (summary?.newUsersChangePct ?? 0) === 0,
      icon: UserPlus,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Active Users",
      value: summary?.active ?? 0,
      hint: formatPctLabel(summary?.activeSharePct ?? 0, "of total users"),
      hintMuted: (summary?.activeSharePct ?? 0) === 0,
      icon: Shield,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Inactive Users",
      value: summary?.inactive ?? 0,
      hint: formatPctLabel(summary?.inactiveSharePct ?? 0, "of total users"),
      hintMuted: true,
      icon: Lock,
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
  ];

  return (
    <section className={`${styles.page} ${styles.usersDir}`} aria-label="Users">
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Users</h1>
            <p className={styles.subtitle}>
              Everyone with a Dealioo account. Use a row to view, edit or manage
              access.
            </p>
          </div>

          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users by name, email, role or plan..."
                className={styles.usersDirSearchInput}
                aria-label="Search users"
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className={styles.usersDirFilterBtn}
                aria-expanded={filterHintOpen}
                onClick={() => setFilterHintOpen((open) => !open)}
              >
                <Filter className="size-4" strokeWidth={2.25} aria-hidden />
                Filter
              </button>
              {filterHintOpen ? (
                <div className={styles.userMenuDropdown} role="menu">
                  <p className="m-0 px-2.5 py-2 text-[0.75rem] font-medium leading-snug text-slate-500">
                    Use the tabs below to filter by status or role. Search also
                    matches name, email, and role.
                  </p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.usersDirAddBtn}
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add User
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void usersQuery.refetch()}
            />
          </div>
        ) : null}

        <div className={styles.usersDirStats}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className={styles.usersDirStatCard}>
                <div>
                  <p className={styles.usersDirStatLabel}>{stat.label}</p>
                  <p className={styles.usersDirStatValue}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p
                    className={`${styles.usersDirStatHint} ${
                      stat.hintMuted ? styles.usersDirStatHintMuted : ""
                    }`}
                  >
                    {stat.hint}
                  </p>
                </div>
                <span
                  className={styles.usersDirStatIcon}
                  style={{ background: stat.iconBg, color: stat.iconColor }}
                  aria-hidden
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </span>
              </article>
            );
          })}
        </div>

        <div className={styles.usersDirToolbar}>
          <div className={styles.usersDirTabs} role="tablist" aria-label="User filters">
            {TAB_OPTIONS.map((option) => {
              const count = summary?.tabs[option.id] ?? 0;
              const active = tab === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.usersDirTab} ${
                    active ? styles.usersDirTabActive : ""
                  }`}
                  onClick={() => {
                    setTab(option.id);
                    setPage(1);
                    setSelectedIds([]);
                  }}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>

          <label className={styles.usersDirSort}>
            <ArrowUpDown className="size-3.5 opacity-70" aria-hidden />
            <select
              value={sort}
              aria-label="Sort users"
              onChange={(event) => {
                setSort(event.target.value as AdminUsersSort);
                setPage(1);
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </label>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && items.length === 0 ? (
              <div className={styles.loadingBox}>
                <Loader2
                  className="size-6 animate-spin"
                  style={{ color: "#1877f2" }}
                />
              </div>
            ) : items.length === 0 ? (
              <p className={styles.empty}>No users found.</p>
            ) : (
              <table className={styles.usersDirTable}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className={styles.usersDirCheck}
                        checked={allSelected}
                        aria-label="Select all users on this page"
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedIds(items.map((user) => user.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined On</th>
                    <th>Last Active</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => {
                    const checked = selectedIds.includes(user.id);
                    return (
                      <tr
                        key={user.id}
                        className={styles.usersDirRowClickable}
                        onClick={() => setDetailsUserId(user.id)}
                      >
                        <td
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className={styles.usersDirCheck}
                            checked={checked}
                            aria-label={`Select ${user.name || user.email}`}
                            onChange={(event) => {
                              setSelectedIds((current) =>
                                event.target.checked
                                  ? [...current, user.id]
                                  : current.filter((id) => id !== user.id),
                              );
                            }}
                          />
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <UserAvatar user={user} />
                            <div className={styles.userCellText}>
                              <div className={styles.bizName}>
                                {user.name || "—"}
                              </div>
                              <div className={styles.bizMeta}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.usersDirRolePill}>
                            <Shield className="size-3" strokeWidth={2.5} aria-hidden />
                            {user.roleName || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.usersDirPlanPill}>
                            <Briefcase
                              className="size-3"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                            {user.planName || "No plan"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.usersDirStatusPill} ${
                              user.isActive
                                ? ""
                                : styles.usersDirStatusPillInactive
                            }`}
                          >
                            <span className={styles.usersDirStatusDot} aria-hidden />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {formatAbsoluteDate(user.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.usersDirLastActive}>
                            {user.lastLoginAt ? (
                              <span
                                className={styles.usersDirLastActiveDot}
                                aria-hidden
                              />
                            ) : null}
                            <span className={styles.usersDirDateMain}>
                              {user.lastLoginAt
                                ? formatAbsoluteDate(user.lastLoginAt)
                                : "Never"}
                            </span>
                          </div>
                        </td>
                        <td
                          className={styles.userMenuCell}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <UserRowMenu
                            user={user}
                            open={menuUserId === user.id}
                            busy={updateMutation.isPending}
                            onOpenChange={(open) =>
                              setMenuUserId(open ? user.id : null)
                            }
                            onManage={() => setManageUserId(user.id)}
                            onToggleActive={() => setStatusUserId(user.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.usersDirFooter}>
            <p className={styles.usersDirFooterMeta}>
              Showing {showingStart}-{showingEnd} of {total} users
            </p>
            <div className={styles.usersDirPager}>
              <button
                type="button"
                className={styles.usersDirPageBtn}
                disabled={loading || page <= 1}
                aria-label="Previous page"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.usersDirPageBtn} ${
                    pageNumber === page ? styles.usersDirPageBtnActive : ""
                  }`}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className={styles.usersDirPageBtn}
                disabled={loading || page >= totalPages}
                aria-label="Next page"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
              <select
                className={styles.usersDirPageSize}
                value={pageSize}
                aria-label="Rows per page"
                onChange={(event) => {
                  setPageSize(
                    Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                  );
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {detailsUser ? (
        <UserDetailsModal
          key={`details-${detailsUser.id}`}
          user={detailsUser}
          onClose={() => setDetailsUserId(null)}
          onManage={() => setManageUserId(detailsUser.id)}
        />
      ) : null}

      {manageUser ? (
        <UserManageModal
          key={manageUser.id}
          user={manageUser}
          saving={updateMutation.isPending}
          onClose={() => setManageUserId(null)}
          onSave={(draft) => {
            updateMutation.mutate({
              userId: manageUser.id,
              input: {
                name: draft.name.trim(),
                email: draft.email.trim(),
                phone: draft.phone.trim(),
              },
            });
          }}
        />
      ) : null}

      {addOpen ? (
        <AddUserModal
          roles={roleNames}
          saving={createMutation.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(draft) => {
            if (!draft.name.trim() || !draft.email.trim() || !draft.password) {
              toast.error("Name, email, and password are required.");
              return;
            }
            if (!isStrongAdminPassword(draft.password)) {
              toast.error(
                "Password must be at least 8 characters and include an uppercase letter and a number.",
              );
              return;
            }
            if (
              draft.roleName.trim().toLowerCase() === "super admin" &&
              !draft.confirmElevateToSuperAdmin
            ) {
              toast.error(
                "Confirm Super Admin assignment before creating this user.",
              );
              return;
            }
            createMutation.mutate({
              name: draft.name.trim(),
              email: draft.email.trim(),
              phone: draft.phone.trim() || undefined,
              password: draft.password,
              roleName: draft.roleName,
              confirmElevateToSuperAdmin:
                draft.roleName.trim().toLowerCase() === "super admin"
                  ? true
                  : undefined,
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(statusUser)}
        title={
          statusUser?.isActive ? "Deactivate this user?" : "Activate this user?"
        }
        description={
          statusUser
            ? statusUser.isActive
              ? `${statusUser.name || statusUser.email} will lose access until you activate them again.`
              : `${statusUser.name || statusUser.email} will be able to sign in again.`
            : ""
        }
        tone={statusUser?.isActive ? "danger" : "primary"}
        confirmLabel={statusUser?.isActive ? "Deactivate" : "Activate"}
        loadingLabel={statusUser?.isActive ? "Deactivating…" : "Activating…"}
        isLoading={updateMutation.isPending}
        onCancel={() => setStatusUserId(null)}
        onConfirm={() => {
          if (!statusUser) return;
          updateMutation.mutate({
            userId: statusUser.id,
            input: { isActive: nextActive },
          });
        }}
      />
    </section>
  );
}
