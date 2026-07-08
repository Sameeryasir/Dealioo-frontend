"use client";

export const DASHBOARD_HERO_ILLUSTRATION = {
  src: "/dashboard/welcome-back-dashboard-hero-removebg-preview-removebg-preview.png?v=1",
  alt: "3D welcome back — your Dealioo workspace overview",
  width: 800,
  height: 600,
} as const;

export function OrgDashboardHeroIllustration() {
  return (
    <div className="org-dashboard-stats-illustration-stage" aria-hidden>
      <div className="auth-signup-brand-illustration-anim org-dashboard-stats-illustration-anim">
        <img
          src={DASHBOARD_HERO_ILLUSTRATION.src}
          alt={DASHBOARD_HERO_ILLUSTRATION.alt}
          width={DASHBOARD_HERO_ILLUSTRATION.width}
          height={DASHBOARD_HERO_ILLUSTRATION.height}
          className="org-dashboard-stats-illustration-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
