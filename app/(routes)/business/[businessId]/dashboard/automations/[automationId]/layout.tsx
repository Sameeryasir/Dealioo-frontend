export default function AutomationBuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="automation-builder-route h-full min-h-0 overflow-hidden">{children}</div>;
}
