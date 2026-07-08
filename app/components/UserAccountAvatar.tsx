"use client";

import { useState } from "react";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import { initialsFromUser, userAvatarUrl } from "@/app/lib/user-initials";

type UserAccountAvatarProps = {
  user: VerifyOtpUser | null;
  className?: string;
};

export default function UserAccountAvatar({
  user,
  className = "",
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

  return <span className={className}>{initials}</span>;
}
