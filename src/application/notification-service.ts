import type { EntitlementService } from "./entitlement-service.ts";
import type { FeatureFlagService } from "./feature-flag-service.ts";
import type {
  NotificationRepository,
  NotificationUser,
} from "../repositories/notification-repository.ts";
import type { EmailSender } from "../services/email/email-sender.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import {
  localDateKey,
  localDayOfWeek,
  zonedDateTimeToUtc,
} from "../lib/timezone.ts";
import { createUnsubscribeToken } from "../services/email/unsubscribe-token.ts";

function localHour(date: Date, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
}

function addDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function boolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

export class NotificationService {
  private readonly repository: NotificationRepository;
  private readonly email: EmailSender;
  private readonly flags: FeatureFlagService;
  private readonly entitlements: EntitlementService;
  private readonly appBaseUrl: string;
  private readonly unsubscribeSecret: string | null;

  constructor(
    repository: NotificationRepository,
    email: EmailSender,
    flags: FeatureFlagService,
    entitlements: EntitlementService,
    appBaseUrl: string,
    unsubscribeSecret?: string,
  ) {
    this.repository = repository;
    this.email = email;
    this.flags = flags;
    this.entitlements = entitlements;
    this.appBaseUrl = appBaseUrl;
    this.unsubscribeSecret = unsubscribeSecret?.trim() || null;
  }

  async generate(now = new Date()): Promise<number> {
    const users = await this.repository.activeUsers();
    let created = 0;
    for (const user of users) {
      created += await this.generateForUser(user, now);
    }
    return created;
  }

  private async generateForUser(
    user: NotificationUser,
    now: Date,
  ): Promise<number> {
    const hour = localHour(now, user.timezone);
    const today = localDateKey(now, user.timezone);
    const isChinese = user.preferredLanguage === "zh-CN";
    const sendEmail = boolean(user.reminderEnabled);
    let created = 0;
    const create = async (input: {
      type: string;
      title: string;
      body: string;
      actionUrl: string;
      dedupeKey: string;
    }) => {
      const id = createId("notification");
      if (
        await this.repository.createNotification({
          id,
          inAppDeliveryId: createId("delivery"),
          emailDeliveryId: sendEmail ? createId("delivery") : null,
          userId: user.id,
          notificationType: input.type,
          title: input.title,
          body: input.body,
          actionUrl: input.actionUrl,
          dedupeKey: input.dedupeKey,
          scheduledFor: now.toISOString(),
          sendEmail,
          now: now.toISOString(),
        })
      ) {
        created += 1;
      }
    };

    const preferredHour = Number(
      user.preferredStudyStartTime?.slice(0, 2) ?? "07",
    );
    if (hour === preferredHour && boolean(user.dailyPlan)) {
      const taskCount = await this.repository.dailyTaskCount(user.id, today);
      if (taskCount > 0) {
        await create({
          type: "daily_plan",
          title: isChinese
            ? "今天的下一步已经准备好"
            : "Today's next step is ready",
          body: isChinese
            ? `今天有 ${taskCount} 项学习任务，先完成最重要的一项。`
            : `You have ${taskCount} study task${taskCount === 1 ? "" : "s"} today. Start with the most important one.`,
          actionUrl: "/app/today",
          dedupeKey: `daily_plan:${today}`,
        });
      }
    }

    if (hour === 8) {
      if (boolean(user.deadlineApproaching)) {
        const deadlineCount = await this.repository.deadlineCount(
          user.id,
          now.toISOString(),
          new Date(now.getTime() + 48 * 3_600_000).toISOString(),
        );
        if (deadlineCount > 0) {
          await create({
            type: "deadline_approaching",
            title: isChinese
              ? "有截止日期正在接近"
              : "A deadline is approaching",
            body: isChinese
              ? `未来 48 小时有 ${deadlineCount} 项截止。`
              : `${deadlineCount} deadline${deadlineCount === 1 ? "" : "s"} fall within 48 hours.`,
            actionUrl: "/app/courses",
            dedupeKey: `deadline:${today}`,
          });
        }
      }
      if (boolean(user.reviewDue)) {
        const due = await this.repository.dueReviewCount(
          user.id,
          now.toISOString(),
        );
        if (due > 0) {
          await create({
            type: "review_due",
            title: isChinese ? "复测已到期" : "A retest is due",
            body: isChinese
              ? `有 ${due} 个知识点需要复测。`
              : `${due} topic${due === 1 ? "" : "s"} need a retest.`,
            actionUrl: "/app/today",
            dedupeKey: `review_due:${today}`,
          });
        }
      }
    }

    if (hour === 18 && boolean(user.tomorrowClasses)) {
      const tomorrow = addDate(today, 1);
      const tomorrowInstant = zonedDateTimeToUtc(
        `${tomorrow}T12:00`,
        user.timezone,
      );
      const classCount = await this.repository.tomorrowClassCount(
        user.id,
        localDayOfWeek(tomorrowInstant, user.timezone),
        tomorrow,
      );
      if (classCount > 0) {
        await create({
          type: "tomorrow_classes",
          title: isChinese ? "明日课程提醒" : "Tomorrow's classes",
          body: isChinese
            ? `明天有 ${classCount} 节课程。`
            : `You have ${classCount} class${classCount === 1 ? "" : "es"} tomorrow.`,
          actionUrl: "/app/today",
          dedupeKey: `tomorrow_classes:${tomorrow}`,
        });
      }
    }

    if (
      hour === 18 &&
      localDayOfWeek(now, user.timezone) === 0 &&
      boolean(user.weeklyReport) &&
      (await this.flags.enabled("weekly_report_enabled"))
    ) {
      const entitlement = await this.entitlements.snapshot(
        user.id,
        user.role,
        now,
      );
      if (entitlement.canAccessWeeklyReport) {
        const from = new Date(now.getTime() - 7 * 86_400_000);
        const completed = await this.repository.weeklyCompletedCount(
          user.id,
          from.toISOString(),
          now.toISOString(),
        );
        await create({
          type: "weekly_report",
          title: isChinese ? "本周学习报告" : "Your weekly study report",
          body: isChinese
            ? `本周完成 ${completed} 项学习任务。`
            : `You completed ${completed} study task${completed === 1 ? "" : "s"} this week.`,
          actionUrl: "/app/reports/weekly",
          dedupeKey: `weekly_report:${today}`,
        });
      }
    }
    return created;
  }

  async deliverPending(now = new Date()): Promise<{
    sent: number;
    failed: number;
  }> {
    const deliveries = await this.repository.pendingEmailDeliveries(
      now.toISOString(),
    );
    let sent = 0;
    let failed = 0;
    for (const delivery of deliveries) {
      if (
        !(await this.repository.claimDelivery(
          delivery.id,
          now.toISOString(),
        ))
      ) {
        continue;
      }
      try {
        const unsubscribeUrl = this.unsubscribeSecret
          ? new URL(
              `/api/notifications/unsubscribe?token=${encodeURIComponent(
                await createUnsubscribeToken({
                  userId: delivery.userId,
                  secret: this.unsubscribeSecret,
                  now,
                }),
              )}`,
              this.appBaseUrl,
            ).toString()
          : new URL(
              "/app/settings/privacy",
              this.appBaseUrl,
            ).toString();
        const result = await this.email.sendNotification({
          to: delivery.email,
          subject: delivery.title,
          body: delivery.body,
          actionUrl: new URL(
            delivery.actionUrl ?? "/app/today",
            this.appBaseUrl,
          ).toString(),
          settingsUrl: new URL(
            "/app/settings/privacy",
            this.appBaseUrl,
          ).toString(),
          unsubscribeUrl,
          language: delivery.preferredLanguage,
        });
        await this.repository.completeDelivery({
          deliveryId: delivery.id,
          providerMessageId: result.providerMessageId ?? null,
          now: now.toISOString(),
        });
        sent += 1;
      } catch (error) {
        await this.repository.failDelivery({
          deliveryId: delivery.id,
          errorCode:
            error instanceof ApiError
              ? error.code
              : "EMAIL_DELIVERY_FAILED",
          nextAttemptAt: new Date(
            now.getTime() + (delivery.attempts + 1) * 3_600_000,
          ).toISOString(),
          now: now.toISOString(),
        });
        failed += 1;
      }
    }
    return { sent, failed };
  }

  async list(userId: string) {
    return this.repository.list(userId);
  }

  async markRead(
    userId: string,
    notificationId: string,
    now = new Date(),
  ): Promise<void> {
    if (
      !(await this.repository.markRead(
        userId,
        notificationId,
        now.toISOString(),
      ))
    ) {
      throw new ApiError(
        "NOTIFICATION_NOT_FOUND",
        404,
        "The notification was not found.",
      );
    }
  }
}
