import { redirect } from "next/navigation";

export default function SetupTwoFactorAliasPage() {
  redirect("/auth/2fa");
}
