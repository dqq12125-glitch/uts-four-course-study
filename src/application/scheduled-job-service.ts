import type { NotificationRepository } from "../repositories/notification-repository.ts";
import type { NotificationService } from "./notification-service.ts";
import type { ResourceService } from "./resource-service.ts";
import { createId } from "../lib/ids.ts";

export class ScheduledJobService {
  private readonly repository: NotificationRepository;
  private readonly notifications: NotificationService;
  private readonly resources: ResourceService;

  constructor(
    repository: NotificationRepository,
    notifications: NotificationService,
    resources: ResourceService,
  ) {
    this.repository = repository;
    this.notifications = notifications;
    this.resources = resources;
  }

  async run(scheduledTime: number): Promise<{
    duplicate: boolean;
    processedCount: number;
    failedCount: number;
  }> {
    const scheduledAt = new Date(scheduledTime);
    scheduledAt.setUTCMinutes(0, 0, 0);
    const now = new Date();
    const jobId = createId("job");
    const started = await this.repository.beginJob({
      id: jobId,
      jobName: "hourly_learning_notifications",
      scheduledAt: scheduledAt.toISOString(),
      startedAt: now.toISOString(),
    });
    if (!started) {
      return { duplicate: true, processedCount: 0, failedCount: 0 };
    }
    try {
      const generated = await this.notifications.generate(scheduledAt);
      const delivery = await this.notifications.deliverPending(now);
      const deleted = await this.resources.cleanupDeleted(now);
      const processedCount = generated + delivery.sent + deleted;
      await this.repository.completeJob({
        id: jobId,
        status: delivery.failed > 0 ? "failed" : "completed",
        processedCount,
        failedCount: delivery.failed,
        errorSummary:
          delivery.failed > 0 ? "EMAIL_DELIVERY_FAILED" : null,
        completedAt: new Date().toISOString(),
      });
      return {
        duplicate: false,
        processedCount,
        failedCount: delivery.failed,
      };
    } catch (error) {
      await this.repository.completeJob({
        id: jobId,
        status: "failed",
        processedCount: 0,
        failedCount: 1,
        errorSummary:
          error instanceof Error ? error.name : "SCHEDULED_JOB_FAILED",
        completedAt: new Date().toISOString(),
      });
      throw error;
    }
  }
}
