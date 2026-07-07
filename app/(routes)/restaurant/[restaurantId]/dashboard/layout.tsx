import { RestaurantDashboardShell } from "@/app/components/RestaurantDashboardShell";

export default function RestaurantDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RestaurantDashboardShell>{children}</RestaurantDashboardShell>;
}
