"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const BusinessChatsPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessChatsPanel").then(
      (mod) => mod.BusinessChatsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading chats">
        <Skeleton className="mb-4 h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessChatsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section
      className="rd-premium rd-premium--fill"
      aria-label="Guest Chats"
    >
      <BusinessChatsPanel businessId={businessId} />
    </section>
  );
}
