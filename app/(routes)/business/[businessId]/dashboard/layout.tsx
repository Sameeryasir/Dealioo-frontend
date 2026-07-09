import { BusinessDashboardShell } from "@/app/components/BusinessDashboardShell";
import { OnboardingCompleteGuard } from "@/app/components/OnboardingCompleteGuard";

export default function BusinessDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OnboardingCompleteGuard>
      <BusinessDashboardShell>{children}</BusinessDashboardShell>
    </OnboardingCompleteGuard>
  );
}
