"use client";

export const SIGNUP_ILLUSTRATION = {
  src: "/auth/signup-removebg-preview.png?v=1",
  alt: "3D illustration — secure signup with account form and padlock",
  width: 612,
  height: 408,
} as const;

export type SignupBrandIllustrationProps = {
    layout?: "brand-panel" | "mobile-header";
};

export function SignupBrandIllustration({
  layout = "brand-panel",
}: SignupBrandIllustrationProps) {
  if (layout === "mobile-header") {
    return (
      <div className="auth-signup-brand-illustration-anim auth-signup-mobile-header-anim">
        <img
          src={SIGNUP_ILLUSTRATION.src}
          alt=""
          width={SIGNUP_ILLUSTRATION.width}
          height={SIGNUP_ILLUSTRATION.height}
          className="auth-signup-mobile-header-image"
          loading="eager"
          decoding="async"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="auth-signup-brand-illustration-stage">
      <div className="auth-signup-brand-illustration-anim">
        <img
          src={SIGNUP_ILLUSTRATION.src}
          alt={SIGNUP_ILLUSTRATION.alt}
          width={SIGNUP_ILLUSTRATION.width}
          height={SIGNUP_ILLUSTRATION.height}
          className="auth-signup-brand-illustration-image"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
