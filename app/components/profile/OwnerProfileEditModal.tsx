"use client";

import {
  BookMeetingPhoneInput,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { OwnerProfilePasswordPanel } from "@/app/components/profile/OwnerProfilePasswordPanel";
import UserAccountAvatar from "@/app/components/UserAccountAvatar";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import {
  AlertCircle,
  Camera,
  Loader2,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

type OwnerProfileEditModalProps = {
  open: boolean;
  profile: VerifyOtpUser;
  name: string;
  email: string;
  phone: string;
  saving: boolean;
  avatarUploading: boolean;
  errorMessage: string | null;
  avatarError: string | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  onAvatarPick: () => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-semibold text-[#07111f]";

function isGoogleProvider(provider: string | undefined): boolean {
  return provider?.toUpperCase() === "GOOGLE";
}

export function OwnerProfileEditModal({
  open,
  profile,
  name,
  email,
  phone,
  saving,
  avatarUploading,
  errorMessage,
  avatarError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onSubmit,
  onCancel,
  onAvatarPick,
  onAvatarChange,
  avatarInputRef,
}: OwnerProfileEditModalProps) {
  const titleId = useId();
  const avatarInputId = useId();
  const googleOnly = isGoogleProvider(profile.provider);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const busy = saving || avatarUploading || passwordBusy;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close edit profile"
        className="absolute inset-0 cursor-default bg-[#07111f]/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(92vh,840px)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(14,24,43,0.22)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2f7] bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="m-0 text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              Edit Profile
            </h2>
            <p className="m-0 mt-1 text-sm text-slate-500">
              Update your personal information and contact details.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] text-slate-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 disabled:opacity-60"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-[#dbeafe]">
                  <UserAccountAvatar
                    user={profile}
                    className="size-full rounded-full object-cover"
                  />
                </span>
                <button
                  type="button"
                  onClick={onAvatarPick}
                  disabled={busy}
                  aria-label="Update profile photo"
                  className="absolute -bottom-0.5 -right-0.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#1877f2] text-white shadow-md transition hover:bg-[#166fe0] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {avatarUploading ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Camera className="size-3.5" strokeWidth={2.25} aria-hidden />
                  )}
                </button>
                <input
                  id={avatarInputId}
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={onAvatarChange}
                />
              </div>
              {avatarError ? (
                <p className="m-0 text-center text-xs font-medium text-red-600" role="alert">
                  {avatarError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-profile-modal-name" className={labelClass}>
                Full name
              </label>
              <input
                id="edit-profile-modal-name"
                type="text"
                autoComplete="name"
                disabled={busy}
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-profile-modal-email" className={labelClass}>
                Email
              </label>
              <input
                id="edit-profile-modal-email"
                type="email"
                autoComplete="email"
                disabled={busy}
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-profile-modal-phone" className={labelClass}>
                Phone
              </label>
              <div className="rounded-xl border border-[#e2e8f0] bg-white px-2 py-1 transition focus-within:border-[#1877f2] focus-within:ring-2 focus-within:ring-[#1877f2]/15">
                <BookMeetingPhoneInput
                  value={phone}
                  onChange={onPhoneChange}
                  variant="boxed"
                  wrapClassName="!gap-1 [&_input]:!text-sm [&_input]:!font-medium"
                />
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <OwnerProfilePasswordPanel
              key={`pwd-${profile.email}`}
              email={profile.email}
              googleOnly={googleOnly}
              parentBusy={saving || avatarUploading}
              onBusyChange={setPasswordBusy}
            />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 sm:px-6">
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>
    </div>,
    document.body,
  );
}
