import { RestaurantDashboardShell } from "@/app/components/RestaurantDashboardShell";
import { OnboardingCompleteGuard } from "@/app/components/OnboardingCompleteGuard";

export default function RestaurantDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OnboardingCompleteGuard>
      <RestaurantDashboardShell>{children}</RestaurantDashboardShell>
    </OnboardingCompleteGuard>
  );
}
