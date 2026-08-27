"use client";

import { OwnerProfileForm } from "@/app/components/profile/OwnerProfileForm";

export default function ProfilePage() {
  return (
    <section className="org-dashboard-section profile-page-section" aria-label="Your profile">
      <div className="brand-landing-section">
        <div className="org-dashboard-workspace profile-page-workspace">
          <OwnerProfileForm layout="page" />
        </div>
      </div>
    </section>
  );
}
