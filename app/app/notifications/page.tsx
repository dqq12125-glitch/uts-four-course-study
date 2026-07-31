import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getNotificationService } from "@/src/application/runtime";
import { NotificationReadButton } from "./read-button";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "提醒" };

export default async function NotificationsPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const notifications = await getNotificationService().list(user.id);
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">In-app reminders</p>
        <h1>{t("提醒", "Reminders")}</h1>
        <p className="saas-lead">
          {t(
            "截止日期、复测和课表提醒均按你的时区生成，并通过去重键避免重复发送。",
            "Deadline, retest, and timetable reminders use your timezone and deduplication keys.",
          )}
        </p>
      </section>
      <section className="saas-card">
        {notifications.length ? (
          <div className="saas-notification-list">
            {notifications.map((notification) => (
              <article
                className={notification.readAt ? "is-read" : ""}
                key={notification.id}
              >
                <div>
                  <span>{notification.notificationType}</span>
                  <h2>{notification.title}</h2>
                  <p>{notification.body}</p>
                  <time dateTime={notification.scheduledFor}>
                    {new Intl.DateTimeFormat(
                      locale(user.preferredLanguage),
                      {
                        timeZone: user.timezone,
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    ).format(new Date(notification.scheduledFor))}
                  </time>
                </div>
                <div className="saas-inline-actions">
                  {notification.actionUrl ? (
                    <Link
                      className="saas-button saas-button-secondary"
                      href={notification.actionUrl}
                    >
                      {t("打开", "Open")}
                    </Link>
                  ) : null}
                  {!notification.readAt ? (
                    <NotificationReadButton
                      id={notification.id}
                      language={user.preferredLanguage}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="saas-muted">
            {t("目前没有提醒。", "No reminders right now.")}
          </p>
        )}
      </section>
    </div>
  );
}
