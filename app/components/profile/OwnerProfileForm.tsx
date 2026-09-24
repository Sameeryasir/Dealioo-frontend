"use client";

import { OwnerSubscriptionSection } from "@/app/components/profile/OwnerSubscriptionSection";
import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import { useMyBusinessesQuery } from "@/app/hooks/use-my-businesses-query";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import { mergeSetupUser, setSetupUser } from "@/app/lib/setup-user";
import {
  getMyProfile,
  getProfileUpdateErrorMessage,
  updateMyAvatar,
  updateMyProfile,
} from "@/app/services/user/profile";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { Skeleton } from "@/app/components/skeleton";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Clock3,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type OwnerProfileFormProps = {
  variant?: "light" | "dark";
  layout?: "page" | "compact";
  onSaved?: (user: VerifyOtpUser) => void;
};

const inputLight =
  "h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60";
const inputDark =
  "h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/30";

const cardClass =
  "flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]";

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

function displayValue(
  value: string | null | undefined,
  fallback = "Not set",
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function ProfileDetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#eef2f7] px-4 py-3 last:border-b-0 sm:px-5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[#1877f2]">
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <p className="w-[7.5rem] shrink-0 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#07111f]">
        {value}
      </p>
    </div>
  );
}

function ProfileContactViewRow({
  label,
  value,
  icon: Icon,
  isDark,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  isDark: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5 ${
        isDark ? "border-zinc-800" : "border-[#eef2f7]"
      }`}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
          isDark
            ? "bg-zinc-800 text-sky-300"
            : "bg-[#eef5ff] text-[#1877f2]"
        }`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <span
          className={`text-[0.68rem] font-semibold uppercase tracking-[0.08em] ${
            isDark ? "text-zinc-500" : "text-slate-400"
          }`}
        >
          {label}
        </span>
        <span
          className={`mt-1 block break-words text-sm font-semibold ${
            isDark ? "text-white" : "text-[#07111f]"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "green" | "amber";
}) {
  const tones = {
    blue: "bg-[#eef5ff] text-[#0f5ed7] ring-[#dbeafe]",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading profile">
      <div className={`${cardClass} p-5 sm:p-6`}>
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-full bg-slate-100" />
            <Skeleton className="h-7 w-48 max-w-full rounded-lg bg-slate-100" />
            <Skeleton className="h-4 w-40 max-w-full rounded-md bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl bg-slate-100" />
        <Skeleton className="h-72 w-full rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

const editButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const editButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 transition-all hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const cancelButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const cancelButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-semibold text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const saveButtonLight =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const saveButtonDark =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-sky-600 px-6 text-sm font-semibold text-white shadow-md shadow-sky-900/30 transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

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
  const showForm = isEditing;
  const fieldIdPrefix = isPage ? "profile" : "profile-settings";
  const title = showForm ? "Edit profile" : "Contact details";
  const subtitle = showForm
    ? "Update your photo, name, email, or phone, then save."
    : "Your current contact information on Dealioo.";

  const footerBorderClass = isDark
    ? "border-t border-zinc-800 pt-4"
    : "border-t border-[#eef2f7] pt-4";

  const errorAlertClass = isDark
    ? "flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
    : "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800";

  const successTextClass = isDark ? "text-emerald-400" : "text-emerald-600";

  const body = showForm ? (
    <form className="flex flex-1 flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4">
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
          <div
            className={
              isDark
                ? "rounded-xl border border-zinc-700 bg-zinc-900 px-2 py-1 focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/30"
                : "rounded-xl border border-[#e2e8f0] bg-white px-2 py-1 transition focus-within:border-[#1877f2] focus-within:ring-2 focus-within:ring-[#1877f2]/15"
            }
          >
            <BookMeetingPhoneInput
              value={phone}
              onChange={onPhoneChange}
              variant="boxed"
              wrapClassName="!gap-1 [&_input]:!text-sm [&_input]:!font-medium"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div role="alert" className={errorAlertClass}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <p className={`text-sm font-medium ${successTextClass}`} role="status">
          {successMessage}
        </p>
      ) : null}

      <div
        className={`flex flex-wrap items-center justify-end gap-2 ${footerBorderClass}`}
      >
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
      <div
        className={
          isDark
            ? "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
            : "overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc]"
        }
      >
        <ProfileContactViewRow
          isDark={isDark}
          icon={UserRound}
          label="Full name"
          value={displayValue(name)}
        />
        <ProfileContactViewRow
          isDark={isDark}
          icon={Mail}
          label="Email"
          value={displayValue(email)}
        />
        <ProfileContactViewRow
          isDark={isDark}
          icon={Phone}
          label="Phone"
          value={displayValue(phone, "Not set")}
        />
      </div>

      {successMessage ? (
        <p className={`text-sm font-medium ${successTextClass}`} role="status">
          {successMessage}
        </p>
      ) : null}

      {!isPage ? (
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
      ) : null}
    </div>
  );

  if (isPage) {
    return (
      <div id="profile-edit-panel" className={cardClass}>
        <div className="flex items-start gap-3 border-b border-[#eef2f7] px-5 py-4 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)]">
            <UserRound className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="m-0 text-base font-extrabold tracking-tight text-[#07111f]">
              {title}
            </h3>
            <p className="m-0 mt-0.5 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">{body}</div>
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
            : "text-base font-semibold text-[#07111f]"
        }
      >
        {title}
      </h3>
      <p
        className={
          isDark ? "mt-1 text-sm text-zinc-500" : "mt-1 text-sm text-slate-500"
        }
      >
        {subtitle}
      </p>
      <div className="mt-5">{body}</div>
    </div>
  );
}

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
          : "rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3.5"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            isDark
              ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400"
              : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[#1877f2]"
          }
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              isDark
                ? "text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500"
                : "text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400"
            }
          >
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-medium ${
              mono ? "font-mono text-[0.8rem]" : ""
            } ${isDark ? "text-white" : "text-[#07111f]"}`}
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
      : "bg-[#eef5ff] text-[#0f5ed7] ring-[#dbeafe]",
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarInputId = useId();

  const { meta: businessesMeta, isPending: businessesLoading } =
    useMyBusinessesQuery({ page: 1 });

  const inputClass = variant === "dark" ? inputDark : inputLight;
  const labelClass =
    variant === "dark"
      ? "text-sm font-medium text-zinc-300"
      : "text-sm font-semibold text-[#07111f]";
  const isDark = variant === "dark";
  const isPageLayout = layout === "page" && !isDark;

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

  const businessCountLabel = useMemo(() => {
    if (businessesLoading) return "Loading…";
    const total = businessesMeta.total;
    return total === 1 ? "1 business" : `${total} businesses`;
  }, [businessesLoading, businessesMeta.total]);

  const handleStartEdit = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAvatarError(null);
    setIsEditingContact(true);
  };

  const handleAvatarPick = () => {
    if (avatarUploading || !isEditingContact) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (PNG, JPEG, or WebP).");
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const updated = await updateMyAvatar(file);
      setSetupUser(updated);
      setProfile(updated);
      setSuccessMessage("Profile photo updated.");
      onSaved?.(updated);
    } catch (error) {
      setAvatarError(getProfileUpdateErrorMessage(error));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setAvatarError(null);
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
    if (phone.trim() && !isValidPhoneNumber(phone.trim())) {
      setErrorMessage("Enter a valid phone number.");
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
    return isPageLayout ? (
      <ProfilePageSkeleton />
    ) : (
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
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
    <div className={cardClass}>
      <div className="flex items-start gap-3 border-b border-[#eef2f7] px-5 py-4 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)]">
          <Shield className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="m-0 text-base font-extrabold tracking-tight text-[#07111f]">
            Account details
          </h3>
          <p className="m-0 mt-0.5 text-sm text-slate-500">
            Identity, access, and activity for your Dealioo account.
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col divide-y divide-[#eef2f7]">
        <ProfileDetailRow
          icon={Shield}
          label="Role"
          value={profile.role.name}
        />
        <ProfileDetailRow
          icon={BadgeCheck}
          label="Sign-in method"
          value={signInMethodLabel(profile.provider)}
        />
        <ProfileDetailRow
          icon={Building2}
          label="Businesses owned"
          value={businessCountLabel}
        />
        <ProfileDetailRow
          icon={CalendarDays}
          label="Member since"
          value={formatProfileDate(profile.createdAt)}
        />
        <ProfileDetailRow
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
            : "text-base font-semibold text-[#07111f]"
        }
      >
        Account details
      </h3>
      <p
        className={
          isDark ? "mt-1 text-sm text-zinc-500" : "mt-1 text-sm text-slate-500"
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

  return (
    <div className={`flex flex-col ${isPageLayout ? "gap-5" : "gap-8"}`}>
      {isPageLayout ? (
        <>
          <div className={cardClass}>
            <div className="border-b border-[#eef2f7] bg-white px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative shrink-0">
                    <span
                      className={`flex size-16 items-center justify-center overflow-hidden rounded-full bg-white ring-4 shadow-[0_10px_28px_rgba(24,119,242,0.18)] sm:size-[4.5rem] ${
                        isEditingContact
                          ? "ring-[#1877f2]/40"
                          : "ring-[#dbeafe]"
                      }`}
                    >
                      <UserAccountAvatar
                        user={profile}
                        className="size-full rounded-full object-cover"
                      />
                    </span>
                    {isEditingContact ? (
                      <button
                        type="button"
                        onClick={handleAvatarPick}
                        disabled={avatarUploading}
                        aria-label="Update profile photo"
                        className="absolute -bottom-0.5 -right-0.5 inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#1877f2] text-white shadow-md transition hover:bg-[#166fe0] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {avatarUploading ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Camera className="size-3.5" strokeWidth={2.25} aria-hidden />
                        )}
                      </button>
                    ) : null}
                    <input
                      id={avatarInputId}
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => {
                        void handleAvatarChange(event);
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                      {profile.role.name}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <h2 className="m-0 truncate text-[1.45rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.65rem]">
                        {profile.name}
                      </h2>
                      <button
                        type="button"
                        onClick={
                          isEditingContact ? handleCancelEdit : handleStartEdit
                        }
                        aria-label={
                          isEditingContact ? "Cancel editing" : "Edit profile"
                        }
                        title={
                          isEditingContact ? "Cancel editing" : "Edit profile"
                        }
                        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition ${
                          isEditingContact
                            ? "border-[#1877f2] bg-[#1877f2] text-white"
                            : "border-[#dbeafe] bg-[#eef5ff] text-[#1877f2] hover:bg-[#1877f2] hover:text-white"
                        }`}
                      >
                        <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                    <p className="m-0 mt-1.5 flex items-center gap-1.5 truncate text-sm font-medium text-slate-500">
                      <Mail
                        className="size-3.5 shrink-0 text-[#1877f2]"
                        aria-hidden
                      />
                      <span className="truncate">{profile.email}</span>
                    </p>
                    {isEditingContact ? (
                      <p className="m-0 mt-2 text-xs font-medium text-[#1877f2]">
                        Editing — update your photo and contact details below.
                      </p>
                    ) : null}
                    {avatarError ? (
                      <p className="m-0 mt-2 text-xs font-medium text-red-600" role="alert">
                        {avatarError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusChip
                    label={profile.isActive ? "Active account" : "Inactive"}
                    tone={profile.isActive ? "green" : "amber"}
                  />
                  <StatusChip
                    label={
                      profile.emailVerified
                        ? "Email verified"
                        : "Email not verified"
                    }
                    tone={profile.emailVerified ? "green" : "amber"}
                  />
                  <StatusChip
                    label={signInMethodLabel(profile.provider)}
                    tone="blue"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 text-[0.78rem] font-medium text-slate-500 sm:px-6">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-[#1877f2]" aria-hidden />
                {signInMethodLabel(profile.provider)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5 text-[#1877f2]" aria-hidden />
                {businessCountLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-[#1877f2]" aria-hidden />
                Joined {formatProfileDate(profile.createdAt)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
            {pageAccountDetails}
            {pageEditForm}
          </div>

          {isAdminOrSuperAdminUser() ? (
            <OwnerSubscriptionSection variant={variant} layout="page" />
          ) : null}
        </>
      ) : (
        <div
          className={
            isDark
              ? "overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6"
              : "overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm sm:p-6"
          }
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={
                  isDark
                    ? "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 text-lg font-semibold text-white ring-2 ring-zinc-700"
                    : "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-lg font-semibold text-[#07111f] shadow-md ring-2 ring-[#dbeafe]"
                }
              >
                <UserAccountAvatar user={profile} className="size-full" />
              </span>
              <div className="min-w-0">
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-wider text-sky-300/90"
                      : "text-xs font-semibold uppercase tracking-wider text-[#1877f2]"
                  }
                >
                  Account {profile.role.name}
                </p>
                <h2
                  className={
                    isDark
                      ? "mt-1 truncate text-2xl font-semibold tracking-tight text-white"
                      : "mt-1 truncate text-2xl font-semibold tracking-tight text-[#07111f]"
                  }
                >
                  {profile.name}
                </h2>
                <p
                  className={
                    isDark
                      ? "mt-1 truncate text-sm text-zinc-400"
                      : "mt-1 truncate text-sm text-slate-500"
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
