import { OnboardingCompleteGuard } from "@/app/components/OnboardingCompleteGuard";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function BusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <OnboardingCompleteGuard>{children}</OnboardingCompleteGuard>
    </ProtectedRoute>
  );
}
