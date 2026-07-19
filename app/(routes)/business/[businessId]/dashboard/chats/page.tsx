"use client";

import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { BusinessChatsPanel } from "@/app/components/business/BusinessChatsPanel";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

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
