import { rebalancePlan } from "../domain/planning/plan-rebalancer.ts";
import type { LearningLoopRepository } from "../repositories/learning-loop-repository.ts";

export class PlanRebalanceService {
  private readonly repository: LearningLoopRepository;

  constructor(repository: LearningLoopRepository) {
    this.repository = repository;
  }

  async rebalance(
    userId: string,
    input: {
      startDate: string;
      dailyCapacityMinutes: number;
      confirmCritical: boolean;
    },
    now = new Date(),
  ) {
    const tasks = await this.repository.listRebalanceTasks(userId);
    const result = rebalancePlan({
      tasks,
      startDate: input.startDate,
      dailyCapacityMinutes: input.dailyCapacityMinutes,
      confirmCritical: input.confirmCritical,
    });
    const updated = await this.repository.applyRebalanceChanges(
      userId,
      result.changes.map((change) => ({
        taskId: change.taskId,
        scheduledFor: change.to,
      })),
      now.toISOString(),
    );
    return { ...result, updated };
  }
}
