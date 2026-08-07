"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/app/app/sign-out-button";
import type { SupportedLanguage } from "@/src/lib/i18n";

type IconName =
  | "today"
  | "courses"
  | "practice"
  | "tools"
  | "progress"
  | "plan"
  | "resources"
  | "tutor"
  | "notifications"
  | "settings"
  | "personal";

function NavigationIcon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "today") {
    return <svg {...common}><path d="M5 3v3M19 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="m9 14 2 2 4-5" /></svg>;
  }
  if (name === "courses") {
    return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h7" /></svg>;
  }
  if (name === "practice") {
    return <svg {...common}><path d="M4 5h16v14H4zM8 9h8M8 13h5" /><path d="m16 16 1.5 1.5L21 14" /></svg>;
  }
  if (name === "tools") {
    return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z" /></svg>;
  }
  if (name === "progress") {
    return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
  }
  if (name === "plan") {
    return <svg {...common}><path d="M7 3v3M17 3v3M4 8h16v12H4z" /><path d="m8 14 2 2 5-5" /></svg>;
  }
  if (name === "resources") {
    return <svg {...common}><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6" /></svg>;
  }
  if (name === "tutor") {
    return <svg {...common}><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 9h8M8 13h5" /></svg>;
  }
  if (name === "notifications") {
    return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>;
  }
  if (name === "personal") {
    return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
}

export function ProductNavigation({
  language,
  displayName,
  email,
  personalOwner,
}: {
  language: SupportedLanguage;
  displayName: string;
  email: string;
  personalOwner: boolean;
}) {
  const pathname = usePathname();
  const isChinese = language === "zh-CN";
  const primary = [
    { href: "/app/today", icon: "today" as const, label: isChinese ? "今天" : "Today" },
    { href: "/app/courses", icon: "courses" as const, label: isChinese ? "课程" : "Courses" },
    { href: "/app/practice", icon: "practice" as const, label: isChinese ? "练习" : "Practice" },
    { href: "/app/more", icon: "tools" as const, label: isChinese ? "工具" : "Tools" },
    { href: "/app/mastery", icon: "progress" as const, label: isChinese ? "进度" : "Progress" },
  ];
  const secondary = [
    { href: "/app/plan", icon: "plan" as const, label: isChinese ? "学习计划" : "Study plan" },
    { href: "/app/resources", icon: "resources" as const, label: isChinese ? "课程资料" : "Resources" },
    { href: "/app/tutor", icon: "tutor" as const, label: isChinese ? "AI 导师" : "AI tutor" },
    { href: "/app/notifications", icon: "notifications" as const, label: isChinese ? "提醒" : "Reminders" },
  ];

  function active(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navLink = (item: { href: string; icon: IconName; label: string }) => (
    <Link
      href={item.href}
      key={item.href}
      className={active(item.href) ? "is-active" : undefined}
      aria-current={active(item.href) ? "page" : undefined}
    >
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <>
      <aside className="product-sidebar">
        <Link className="product-wordmark" href="/app/today">
          DeepStudy<span aria-hidden="true">/</span>
        </Link>
        <nav className="product-primary-nav" aria-label={isChinese ? "主要导航" : "Primary navigation"}>
          {primary.map(navLink)}
        </nav>
        <div className="product-nav-divider" />
        <nav className="product-secondary-nav" aria-label={isChinese ? "学习工具" : "Learning tools"}>
          {secondary.map(navLink)}
          {personalOwner
            ? navLink({ href: "/personal", icon: "personal", label: isChinese ? "个人四课" : "Personal courses" })
            : null}
        </nav>
        <div className="product-account">
          <Link href="/app/settings/profile" className={active("/app/settings") ? "is-active" : undefined}>
            <NavigationIcon name="settings" />
            <span>
              <strong>{displayName}</strong>
              <small title={email}>{email}</small>
            </span>
          </Link>
          <SignOutButton language={language} />
        </div>
      </aside>

      <nav className="product-mobile-nav" aria-label={isChinese ? "主要导航" : "Primary navigation"}>
        {primary.map(navLink)}
      </nav>
    </>
  );
}

