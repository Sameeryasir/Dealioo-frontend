import { BusinessDashboardShell } from "@/app/components/BusinessDashboardShell";

export default function BusinessDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BusinessDashboardShell>{children}</BusinessDashboardShell>;
}
