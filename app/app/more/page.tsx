import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isPersonalOwner } from "@/src/application/personal-access";
import { currentUserFromCookies } from "@/src/application/session";
import { copy } from "@/src/lib/i18n";

export const metadata: Metadata = { title: "更多" };

export default async function MorePage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const links = [
    {
      href: "/app/tutor",
      title: t("AI 导师", "AI tutor"),
      body: t(
        "Hint-first 辅导、相似原创题与学术诚信保护。",
        "Hint-first guidance, original similar questions, and academic-integrity safeguards.",
      ),
    },
    {
      href: "/app/mastery",
      title: t("掌握度与复测", "Mastery and retests"),
      body: t(
        "查看薄弱点、到期复测和近期进步。",
        "See weak topics, due retests, and recent progress.",
      ),
    },
    {
      href: "/app/resources",
      title: t("私人学习资料", "Private study resources"),
      body: t(
        "上传、确认导入、下载或删除你的私人资料。",
        "Upload, confirm imports, download, or delete your private files.",
      ),
    },
    {
      href: "/app/reports/weekly",
      title: t("周学习报告", "Weekly study report"),
      body: t(
        "汇总任务、专注、练习和复测证据。",
        "Review task, focus, practice, and retest evidence.",
      ),
    },
    {
      href: "/app/notifications",
      title: t("站内提醒", "In-app reminders"),
      body: t(
        "查看今日计划、截止日期和复测提醒。",
        "Review plan, deadline, and retest reminders.",
      ),
    },
    {
      href: "/app/settings/profile",
      title: t("账户与设置", "Account and settings"),
      body: t(
        "语言、时区、隐私、账单、导出与删除账户。",
        "Language, timezone, privacy, billing, export, and deletion.",
      ),
    },
    ...(isPersonalOwner(user.email)
      ? [
          {
            href: "/personal",
            title: t("个人四课应用", "Personal four-course app"),
            body: t(
              "打开仅限你的原始四课学习空间和本地学习进度。",
              "Open your owner-only original four-course workspace and local progress.",
            ),
          },
        ]
      : []),
  ];
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">DeepStudy</p>
        <h1>{t("更多工具与账户设置", "More tools and account settings")}</h1>
      </section>
      <nav
        className="saas-more-grid"
        aria-label={t("更多功能", "More features")}
      >
        {links.map((item) => (
          <Link className="saas-card" href={item.href} key={item.href}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <span>{t("打开 →", "Open →")}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
