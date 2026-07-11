import { redirect } from "next/navigation";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";

type BusinessSettingsIndexPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function BusinessSettingsIndexPage({
  params,
}: BusinessSettingsIndexPageProps) {
  const { businessId } = await params;
  redirect(businessSettingsHref(businessId, "general"));
}
