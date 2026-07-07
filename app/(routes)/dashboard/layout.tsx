import Navbar from "@/app/components/Navbar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-dvh min-h-0 w-full flex-col brand-page-soft">
        <Navbar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
