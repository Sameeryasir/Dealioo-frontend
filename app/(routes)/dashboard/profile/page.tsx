"use client";

import { OwnerProfileForm } from "@/app/components/profile/OwnerProfileForm";

export default function ProfilePage() {
  return (
    <section
      className="org-dashboard-section profile-page-section bg-[#f1f5f9]"
      aria-label="Your profile"
    >
      <OwnerProfileForm layout="page" />
    </section>
  );
}
