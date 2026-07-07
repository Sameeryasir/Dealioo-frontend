import { HomeRoute } from "@/app/components/landing/HomeRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealioo",
  description:
    "Create branded deal funnels, collect payments, issue QR passes, track redemptions and automate repeat visits from one dashboard.",
};

export default function Home() {
  return <HomeRoute />;
}
