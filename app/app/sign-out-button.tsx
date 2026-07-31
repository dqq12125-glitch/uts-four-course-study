"use client";

export function SignOutButton({
  language,
}: {
  language: "zh-CN" | "en";
}) {
  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.assign("/auth/sign-in");
  }

  return (
    <button className="saas-text-button" type="button" onClick={signOut}>
      {language === "zh-CN" ? "退出" : "Sign out"}
    </button>
  );
}
