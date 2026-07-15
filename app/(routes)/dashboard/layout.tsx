import Navbar from "@/app/components/Navbar";
import { OnboardingCompleteGuard } from "@/app/components/OnboardingCompleteGuard";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <OnboardingCompleteGuard>
        <div className="landing-page org-dashboard-page landing-page-shell flex min-h-dvh min-h-0 w-full flex-col">
          <Navbar />
          <div className="landing-page-content flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </OnboardingCompleteGuard>
    </ProtectedRoute>
  );
}
