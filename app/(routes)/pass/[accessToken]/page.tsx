"use client";

import { use } from "react";
import { GuestPassView } from "@/app/components/pass/GuestPassView";

export default function GuestPassByAccessTokenPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken: raw } = use(params);
  const accessToken = decodeURIComponent(raw ?? "").trim();

  return <GuestPassView accessToken={accessToken} />;
}
