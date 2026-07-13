"use client";

import { useState } from "react";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { initialsFromUser, userAvatarUrl } from "@/app/lib/user-initials";

type UserAccountAvatarProps = {
  user: VerifyOtpUser | null;
  className?: string;
  /** Larger initials styling for the profile hero when no photo is set. */
  heroFallback?: boolean;
};

export default function UserAccountAvatar({
  user,
  className = "",
  heroFallback = false,
}: UserAccountAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = userAvatarUrl(user);
  const initials = initialsFromUser(user);

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={`size-full rounded-full object-cover ${className}`.trim()}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex size-full items-center justify-center rounded-full bg-white font-extrabold leading-none tracking-tight text-[#0f5ed7] ${
        heroFallback
          ? "text-lg sm:text-xl"
          : "text-[0.7rem]"
      } ${className}`.trim()}
      aria-hidden
    >
      {initials}
    </span>
  );
}
