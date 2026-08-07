"use client";

import { useEffect } from "react";

export function AnalyticsEvent({
  eventName,
  properties,
}: {
  eventName: "onboarding_started" | "paywall_viewed";
  properties?: Record<string, string | number | boolean | null>;
}) {
  const serialized = JSON.stringify(properties ?? {});
  useEffect(() => {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        properties: JSON.parse(serialized) as Record<string, unknown>,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [eventName, serialized]);
  return null;
}
