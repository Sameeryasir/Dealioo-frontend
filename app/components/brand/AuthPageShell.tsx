import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

/** Auth/onboarding page, clean centered layout, no top bar. */
export default function AuthPageShell({ children, wide = false }: AuthPageShellProps) {
  return (
    <div className="brand-auth-page flex min-h-screen flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-12">
        <div className="brand-auth-glow-primary" aria-hidden />
        <div className="brand-auth-glow-convert" aria-hidden />
        <main
          className={`relative z-10 flex w-full flex-col items-center ${wide ? "max-w-5xl" : "max-w-lg"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft">
      <p className="text-sm text-brand-muted">Loading…</p>
    </div>
  );
}
