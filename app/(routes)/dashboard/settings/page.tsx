import { redirect } from "next/navigation";
import { orgSettingsHref } from "@/app/lib/business-settings-routes";

export default function OrgSettingsIndexPage() {
  redirect(orgSettingsHref("account"));
}
