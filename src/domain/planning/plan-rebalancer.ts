export interface RebalanceTask {
  id: string;
  scheduledFor: string;
  dueAt: string | null;
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  estimatedMinutes: number;
  status: "queued" | "active" | "overdue";
}

export interface RebalanceChange {
  taskId: string;
  from: string;
  to: string;
  overload: boolean;
}

export interface CriticalRebalanceWarning {
  taskId: string;
  scheduledFor: string;
  proposedFor: string;
}

export interface RebalanceResult {
  changes: RebalanceChange[];
  criticalWarnings: CriticalRebalanceWarning[];
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compareTasks(left: RebalanceTask, right: RebalanceTask): number {
  if (left.priority === "critical" && right.priority !== "critical") return -1;
  if (right.priority === "critical" && left.priority !== "critical") return 1;
  if (left.dueAt && right.dueAt) {
    const dueDifference = Date.parse(left.dueAt) - Date.parse(right.dueAt);
    if (dueDifference !== 0) return dueDifference;
  } else if (left.dueAt) {
    return -1;
  } else if (right.dueAt) {
    return 1;
  }
  return right.priorityScore - left.priorityScore;
}

export function rebalancePlan(input: {
  tasks: RebalanceTask[];
  startDate: string;
  dailyCapacityMinutes: number;
  confirmCritical?: boolean;
  horizonDays?: number;
}): RebalanceResult {
  const horizonDays = input.horizonDays ?? 14;
  const capacity = Math.max(15, input.dailyCapacityMinutes);
  const usage = new Map<string, number>();
  const candidates: RebalanceTask[] = [];

  for (const task of input.tasks) {
    const isOverdue =
      task.status === "overdue" || task.scheduledFor < input.startDate;
    if (isOverdue) {
      candidates.push(task);
      continue;
    }
    usage.set(
      task.scheduledFor,
      (usage.get(task.scheduledFor) ?? 0) + task.estimatedMinutes,
    );
  }

  const changes: RebalanceChange[] = [];
  const criticalWarnings: CriticalRebalanceWarning[] = [];

  for (const task of candidates.sort(compareTasks)) {
    let proposedFor = input.startDate;
    let overload = false;

    for (let offset = 0; offset < horizonDays; offset += 1) {
      const candidateDate = addDays(input.startDate, offset);
      const used = usage.get(candidateDate) ?? 0;
      if (used + task.estimatedMinutes <= capacity) {
        proposedFor = candidateDate;
        break;
      }
      if (offset === horizonDays - 1) {
        proposedFor = candidateDate;
        overload = true;
      }
    }

    if (task.priority === "critical" && !input.confirmCritical) {
      criticalWarnings.push({
        taskId: task.id,
        scheduledFor: task.scheduledFor,
        proposedFor,
      });
      continue;
    }

    usage.set(
      proposedFor,
      (usage.get(proposedFor) ?? 0) + task.estimatedMinutes,
    );
    if (task.scheduledFor !== proposedFor || task.status === "overdue") {
      changes.push({
        taskId: task.id,
        from: task.scheduledFor,
        to: proposedFor,
        overload,
      });
    }
  }

  return { changes, criticalWarnings };
}
