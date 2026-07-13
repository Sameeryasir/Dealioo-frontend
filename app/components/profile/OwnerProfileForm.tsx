"use client";

import { OwnerSubscriptionSection } from "@/app/components/profile/OwnerSubscriptionSection";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { userAvatarUrl } from "@/app/lib/user-initials";
import { useMyBusinessesQuery } from "@/app/hooks/use-my-businesses-query";
import { mergeSetupUser, setSetupUser } from "@/app/lib/setup-user";
import {
  getMyProfile,
  getProfileUpdateErrorMessage,
  updateMyProfile,
} from "@/app/services/user/profile";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type OwnerProfileFormProps = {
  variant?: "light" | "dark";
  layout?: "page" | "compact";
  onSaved?: (user: VerifyOtpUser) => void;
};

const inputLight =
  "brand-input h-11 w-full bg-white py-2 text-brand-navy";
const inputDark =
  "h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/30";

function formatProfileDate(value: string | null | undefined): string {
  if (!value?.trim()) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function signInMethodLabel(provider: string | undefined): string {
  if (provider?.toUpperCase() === "GOOGLE") return "Google";
  return "Email & password";
}

function displayValue(value: string | null | undefined, fallback = "Not set"): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function ProfileDetailBoardCell({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  mono?: boolean;
}) {
  return (
    <div className="profile-details-board-cell">
      <span className="profile-details-board-icon">
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="profile-details-board-label">{label}</p>
        <p
          className={`profile-details-board-value ${
            mono ? "profile-details-board-value--mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function BannerStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  tone: "blue" | "teal" | "pink";
}) {
  return (
    <div className={`org-dashboard-stat org-dashboard-stat--${tone}`}>
      <span className="org-dashboard-stat-icon">
        <Icon className="org-dashboard-stat-icon-svg" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="org-dashboard-stat-body">
        <span className="org-dashboard-stat-value">{value}</span>
        <span className="org-dashboard-stat-label">{label}</span>
      </span>
    </div>
  );
}

const editButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d8e3f2] bg-white px-5 text-sm font-semibold text-brand-navy shadow-sm transition-all hover:border-[#c5d4ea] hover:bg-[#f8faff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const editButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 transition-all hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const cancelButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#d8e3f2] bg-white px-5 text-sm font-semibold text-brand-muted transition-all hover:border-[#c5d4ea] hover:bg-[#f8faff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const cancelButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

function ProfileContactSection({
  presentation,
  variant,
  isEditing,
  saving,
  name,
  email,
  phone,
  errorMessage,
  successMessage,
  labelClass,
  inputClass,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onSubmit,
  onStartEdit,
  onCancelEdit,
}: {
  presentation: "page" | "compact";
  variant: "light" | "dark";
  isEditing: boolean;
  saving: boolean;
  name: string;
  email: string;
  phone: string;
  errorMessage: string | null;
  successMessage: string | null;
  labelClass: string;
  inputClass: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isDark = variant === "dark";
  const isPage = presentation === "page";
  const fieldIdPrefix = isPage ? "profile" : "profile-settings";
  const title = isEditing ? "Edit contact details" : "Contact details";
  const subtitle = isEditing
    ? "Update the information used for your account and notifications."
    : "Your current contact information on Dealioo.";

  const footerBorderClass = isDark
    ? "border-t border-zinc-800 pt-4"
    : "border-t border-[#e8edf5] pt-4";

  const viewValueClass = isDark
    ? "text-sm font-medium text-white"
    : "text-sm font-semibold text-brand-navy";

  const viewLabelClass = isDark
    ? "text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-500"
    : "profile-contact-view-label";

  const errorAlertClass = isDark
    ? "flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
    : "flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800";

  const successTextClass = isDark ? "text-emerald-400" : "text-emerald-600";

  const body = isEditing ? (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className={`grid grid-cols-1 ${isPage ? "gap-4" : "gap-5"}`}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldIdPrefix}-name`} className={labelClass}>
            Full name
          </label>
          <input
            id={`${fieldIdPrefix}-name`}
            type="text"
            autoComplete="name"
            disabled={saving}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldIdPrefix}-email`} className={labelClass}>
            Email
          </label>
          <input
            id={`${fieldIdPrefix}-email`}
            type="email"
            autoComplete="email"
            disabled={saving}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldIdPrefix}-phone`} className={labelClass}>
            Phone
          </label>
          <input
            id={`${fieldIdPrefix}-phone`}
            type="tel"
            autoComplete="tel"
            disabled={saving}
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            className={inputClass}
            placeholder="Add your phone number"
          />
        </div>
      </div>

      {errorMessage ? (
        <div role="alert" className={errorAlertClass}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className={`flex flex-wrap items-center justify-end gap-3 ${footerBorderClass}`}>
        <button
          type="button"
          disabled={saving}
          onClick={onCancelEdit}
          className={isDark ? cancelButtonDark : cancelButtonLight}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={isDark ? saveButtonDark : saveButtonLight}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  ) : (
    <div className="flex flex-col gap-5">
      <div className={`profile-contact-view ${isDark ? "profile-contact-view--dark" : ""}`}>
        <div className="profile-contact-view-row">
          <span className={viewLabelClass}>Full name</span>
          <span className={viewValueClass}>{displayValue(name)}</span>
        </div>
        <div className="profile-contact-view-row">
          <span className={viewLabelClass}>Email</span>
          <span className={viewValueClass}>{displayValue(email)}</span>
        </div>
        <div className="profile-contact-view-row">
          <span className={viewLabelClass}>Phone</span>
          <span className={viewValueClass}>{displayValue(phone, "Not set")}</span>
        </div>
      </div>

      {successMessage ? (
        <p className={`text-sm font-medium ${successTextClass}`} role="status">
          {successMessage}
        </p>
      ) : null}

      <div className={`flex justify-end ${footerBorderClass}`}>
        <button
          type="button"
          onClick={onStartEdit}
          className={isDark ? editButtonDark : editButtonLight}
        >
          <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
          Edit
        </button>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="profile-edit-card lg:sticky lg:top-6">
        <div className="profile-edit-card-head">
          <span className="profile-edit-card-icon">
            <UserRound className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="profile-section-heading">{title}</h3>
            <p className="profile-section-copy">{subtitle}</p>
          </div>
        </div>
        <div className="profile-edit-card-body">{body}</div>
      </div>
    );
  }

  return (
    <div
      className={
        isDark
          ? "rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6"
          : "rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm sm:p-6"
      }
    >
      <h3
        className={
          isDark
            ? "text-base font-semibold text-white"
            : "text-base font-semibold text-brand-navy"
        }
      >
        {title}
      </h3>
      <p
        className={
          isDark ? "mt-1 text-sm text-zinc-500" : "mt-1 text-sm text-brand-muted"
        }
      >
        {subtitle}
      </p>
      <div className="mt-5">{body}</div>
    </div>
  );
}

const saveButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const saveButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-sky-600 px-6 text-sm font-semibold text-white shadow-md shadow-sky-900/30 transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

function ProfileDetailCard({
  label,
  value,
  icon: Icon,
  mono,
  variant,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  mono?: boolean;
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3.5"
          : "rounded-xl border border-[#e8edf5] bg-[#f8faff] px-4 py-3.5"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            isDark
              ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400"
              : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-primary shadow-sm ring-1 ring-[#e8edf5]"
          }
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              isDark
                ? "text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500"
                : "text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted"
            }
          >
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-medium ${
              mono ? "font-mono text-[0.8rem]" : ""
            } ${isDark ? "text-white" : "text-brand-navy"}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  tone,
  variant,
}: {
  label: string;
  tone: "success" | "neutral" | "warning";
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const tones = {
    success: isDark
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200",
    neutral: isDark
      ? "bg-zinc-800 text-zinc-300 ring-zinc-700"
      : "bg-zinc-100 text-zinc-700 ring-zinc-200",
    warning: isDark
      ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
      : "bg-amber-50 text-amber-800 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function OwnerProfileForm({
  variant = "light",
  layout = "page",
  onSaved,
}: OwnerProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<VerifyOtpUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingContact, setIsEditingContact] = useState(false);

  const { meta: businessesMeta, isPending: businessesLoading } =
    useMyBusinessesQuery({ page: 1, limit: 1 });

  const inputClass = variant === "dark" ? inputDark : inputLight;
  const labelClass =
    variant === "dark"
      ? "text-sm font-medium text-zinc-300"
      : "text-sm font-medium text-zinc-700";
  const isDark = variant === "dark";
  const isPageLayout = layout === "page" && !isDark;

  const memberSinceShort = useMemo(() => {
    const date = new Date(profile?.createdAt ?? "");
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }, [profile?.createdAt]);

  const lastLoginShort = useMemo(() => {
    if (!profile?.lastLoginAt) return "Never";
    const date = new Date(profile.lastLoginAt);
    if (Number.isNaN(date.getTime())) return "Never";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, [profile?.lastLoginAt]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const nextProfile = await getMyProfile();
      setProfile(nextProfile);
      setName(nextProfile.name);
      setEmail(nextProfile.email);
      setPhone(nextProfile.phone ?? "");
      mergeSetupUser(nextProfile);
    } catch (error) {
      setErrorMessage(getProfileUpdateErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const businessCountValue = useMemo(() => {
    if (businessesLoading) return "…";
    return String(businessesMeta.total);
  }, [businessesLoading, businessesMeta.total]);

  const businessCountLabel = useMemo(() => {
    if (businessesLoading) return "Loading…";
    const total = businessesMeta.total;
    return total === 1 ? "1 business" : `${total} businesses`;
  }, [businessesLoading, businessesMeta.total]);

  const handleStartEdit = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditingContact(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
    }
    setErrorMessage(null);
    setIsEditingContact(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({ name, email, phone });
      setSetupUser(updated);
      setProfile(updated);
      setName(updated.name);
      setEmail(updated.email);
      setPhone(updated.phone ?? "");
      setSuccessMessage("Profile updated.");
      setIsEditingContact(false);
      onSaved?.(updated);
    } catch (error) {
      setErrorMessage(getProfileUpdateErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800"
      >
        Could not load your profile. Refresh the page and try again.
      </div>
    );
  }

  const contactSectionProps = {
    variant,
    isEditing: isEditingContact,
    saving,
    name,
    email,
    phone,
    errorMessage,
    successMessage,
    labelClass,
    inputClass,
    onNameChange: setName,
    onEmailChange: setEmail,
    onPhoneChange: setPhone,
    onSubmit: handleSubmit,
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,
  };

  const pageEditForm = (
    <ProfileContactSection presentation="page" {...contactSectionProps} />
  );

  const pageAccountDetails = (
    <div>
      <h3 className="profile-section-heading">Account details</h3>
      <p className="profile-section-copy">
        Identity, access, and activity for your Dealioo account.
      </p>

      <div className="profile-details-board mt-4">
        <ProfileDetailBoardCell
          icon={Shield}
          label="Role"
          value={profile.role.name}
        />
        <ProfileDetailBoardCell
          icon={BadgeCheck}
          label="Sign-in method"
          value={signInMethodLabel(profile.provider)}
        />
        <ProfileDetailBoardCell
          icon={Building2}
          label="Businesses owned"
          value={businessCountLabel}
        />
        <ProfileDetailBoardCell
          icon={CalendarDays}
          label="Member since"
          value={formatProfileDate(profile.createdAt)}
        />
        <ProfileDetailBoardCell
          icon={Clock3}
          label="Last login"
          value={formatProfileDate(profile.lastLoginAt)}
        />
        <ProfileDetailBoardCell
          icon={Clock3}
          label="Last updated"
          value={formatProfileDate(profile.updatedAt)}
        />
      </div>
    </div>
  );

  const editForm = (
    <ProfileContactSection presentation="compact" {...contactSectionProps} />
  );

  const accountDetails = (
    <div>
      <h3
        className={
          isDark
            ? "text-base font-semibold text-white"
            : "text-base font-semibold text-brand-navy"
        }
      >
        Account details
      </h3>
      <p
        className={
          isDark ? "mt-1 text-sm text-zinc-500" : "mt-1 text-sm text-brand-muted"
        }
      >
        {isPageLayout
          ? "Identity, access, and activity for your Dealioo account."
          : "Your full account information on Dealioo."}
      </p>

      <dl
        className={`mt-4 grid grid-cols-1 gap-3 ${
          isPageLayout ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        <ProfileDetailCard
          variant={variant}
          icon={Shield}
          label="Role"
          value={profile.role.name}
        />
        <ProfileDetailCard
          variant={variant}
          icon={BadgeCheck}
          label="Sign-in method"
          value={signInMethodLabel(profile.provider)}
        />
        <ProfileDetailCard
          variant={variant}
          icon={Building2}
          label="Businesses owned"
          value={businessCountLabel}
        />
        <ProfileDetailCard
          variant={variant}
          icon={CalendarDays}
          label="Member since"
          value={formatProfileDate(profile.createdAt)}
        />
        <ProfileDetailCard
          variant={variant}
          icon={Clock3}
          label="Last login"
          value={formatProfileDate(profile.lastLoginAt)}
        />
        <ProfileDetailCard
          variant={variant}
          icon={Clock3}
          label="Last updated"
          value={formatProfileDate(profile.updatedAt)}
        />
        {!isPageLayout ? (
          <>
            <ProfileDetailCard
              variant={variant}
              icon={Mail}
              label="Current email"
              value={profile.email}
            />
            <ProfileDetailCard
              variant={variant}
              icon={Phone}
              label="Current phone"
              value={displayValue(profile.phone)}
            />
          </>
        ) : null}
      </dl>
    </div>
  );

  const hasProfilePhoto = Boolean(userAvatarUrl(profile));

  return (
    <div className={`flex flex-col ${isPageLayout ? "gap-0" : "gap-8"}`}>
      {isPageLayout ? (
        <>
          <div className="org-dashboard-stats-banner">
            <div className="org-dashboard-stats-inner">
              <div className="org-dashboard-stats-layout org-dashboard-stats-layout--profile">
                <div className="org-dashboard-stats-main">
                  <div className="org-dashboard-stats-copy">
                    <div className="profile-hero-identity">
                      <div className="profile-hero-avatar-wrap">
                        <div className="profile-hero-avatar-stack">
                          <span className="profile-hero-avatar-orbit" aria-hidden />
                          <span
                            className={`profile-hero-avatar-frame${
                              hasProfilePhoto ? "" : " profile-hero-avatar-frame--no-photo"
                            }`}
                          >
                            <UserAccountAvatar
                              user={profile}
                              className="size-full rounded-full object-cover"
                              heroFallback={!hasProfilePhoto}
                            />
                          </span>
                        </div>
                      </div>

                      <div className="profile-hero-identity-copy">
                        <p className="org-dashboard-stats-pill">
                          <span className="org-dashboard-stats-pill-dot" aria-hidden />
                          <span>{profile.role.name}</span>
                        </p>
                        <h2 className="org-dashboard-stats-title">
                          <span className="org-dashboard-stats-greeting">Your profile, </span>
                          <span className="org-dashboard-stats-name">
                            {profile.name.split(" ")[0]}
                          </span>
                        </h2>
                        <p className="org-dashboard-stats-intro">{profile.email}</p>
                      </div>
                    </div>

                    <ul
                      className="org-dashboard-stats-features"
                      aria-label="Account status"
                    >
                      <li>
                        <span className="org-dashboard-stats-feature org-dashboard-stats-feature--blue">
                          <Shield
                            className="org-dashboard-stats-feature-icon"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          {profile.role.name}
                        </span>
                      </li>
                      <li>
                        <span
                          className={`org-dashboard-stats-feature org-dashboard-stats-feature--${
                            profile.isActive ? "green" : "pink"
                          }`}
                        >
                          <BadgeCheck
                            className="org-dashboard-stats-feature-icon"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          {profile.isActive ? "Active account" : "Inactive"}
                        </span>
                      </li>
                      <li>
                        <span
                          className={`org-dashboard-stats-feature org-dashboard-stats-feature--${
                            profile.emailVerified ? "green" : "pink"
                          }`}
                        >
                          <Mail
                            className="org-dashboard-stats-feature-icon"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          {profile.emailVerified ? "Email verified" : "Email not verified"}
                        </span>
                      </li>
                    </ul>

                    <div
                      className="org-dashboard-stats-grid"
                      aria-label="Account highlights"
                    >
                      <BannerStatCard
                        tone="blue"
                        icon={Building2}
                        label="Businesses"
                        value={businessCountValue}
                      />
                      <BannerStatCard
                        tone="teal"
                        icon={CalendarDays}
                        label="Member since"
                        value={memberSinceShort}
                      />
                      <BannerStatCard
                        tone="pink"
                        icon={Clock3}
                        label="Last login"
                        value={lastLoginShort}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="org-dashboard-panel profile-page-panel">
            <div className="org-dashboard-panel-toolbar">
              <div className="org-dashboard-panel-heading">
                <div className="org-dashboard-panel-title-row">
                  <h2 className="org-dashboard-panel-title">Account overview</h2>
                </div>
                <p className="mt-1 text-sm text-brand-muted">
                  Review your account information and keep your contact details up to date.
                </p>
              </div>
            </div>

            <div className="org-dashboard-panel-body">
              <div className="profile-page-grid">
                {pageAccountDetails}
                {pageEditForm}
              </div>
              <OwnerSubscriptionSection variant={variant} layout="page" />
            </div>
          </div>
        </>
      ) : (
        <div
          className={
            isDark
              ? "overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-5 sm:p-6"
              : "overflow-hidden rounded-2xl border border-[#dfe8f5] bg-gradient-to-br from-white via-[#f8faff] to-[#eef4ff] p-5 shadow-sm sm:p-6"
          }
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={
                  isDark
                    ? "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 text-lg font-semibold text-white ring-2 ring-zinc-700"
                    : "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-lg font-semibold text-brand-navy shadow-md ring-2 ring-white"
                }
              >
                <UserAccountAvatar user={profile} className="size-full" />
              </span>
              <div className="min-w-0">
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-wider text-sky-300/90"
                      : "text-xs font-semibold uppercase tracking-wider text-brand-primary"
                  }
                >
                  Account {profile.role.name}
                </p>
                <h2
                  className={
                    isDark
                      ? "mt-1 truncate text-2xl font-semibold tracking-tight text-white"
                      : "mt-1 truncate text-2xl font-semibold tracking-tight text-brand-navy"
                  }
                >
                  {profile.name}
                </h2>
                <p
                  className={
                    isDark
                      ? "mt-1 truncate text-sm text-zinc-400"
                      : "mt-1 truncate text-sm text-brand-muted"
                  }
                >
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={profile.role.name}
                tone="neutral"
                variant={variant}
              />
              <StatusPill
                label={profile.isActive ? "Active account" : "Inactive"}
                tone={profile.isActive ? "success" : "warning"}
                variant={variant}
              />
              <StatusPill
                label={
                  profile.emailVerified ? "Email verified" : "Email not verified"
                }
                tone={profile.emailVerified ? "success" : "warning"}
                variant={variant}
              />
              {profile.phone.trim() ? (
                <StatusPill
                  label={
                    profile.phoneVerified
                      ? "Phone verified"
                      : "Phone not verified"
                  }
                  tone={profile.phoneVerified ? "success" : "warning"}
                  variant={variant}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {!isPageLayout ? (
        <>
          {accountDetails}
          {editForm}
        </>
      ) : null}
    </div>
  );
}
