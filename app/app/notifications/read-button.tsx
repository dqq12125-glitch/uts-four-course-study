"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationReadButton({
  id,
  language,
}: {
  id: string;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function markRead() {
    setBusy(true);
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
    });
    if (response.ok) router.refresh();
    else setBusy(false);
  }
  return (
    <button
      className="saas-text-button"
      type="button"
      disabled={busy}
      onClick={markRead}
    >
      {busy
        ? language === "zh-CN"
          ? "保存中…"
          : "Saving…"
        : language === "zh-CN"
          ? "标记已读"
          : "Mark as read"}
    </button>
  );
}
