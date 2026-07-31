export interface CapacityTask {
  estimatedMinutes: number;
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
}

export function fitDailyCapacity<T extends CapacityTask>(
  tasks: T[],
  capacityMinutes: number,
  maximumTasks = 3,
): { scheduled: T[]; overload: boolean } {
  const sorted = [...tasks].sort(
    (left, right) => right.priorityScore - left.priorityScore,
  );
  const scheduled: T[] = [];
  let used = 0;
  let overload = false;

  for (const task of sorted) {
    if (scheduled.length >= maximumTasks) break;
    const fits = used + task.estimatedMinutes <= capacityMinutes;
    if (fits || (task.priority === "critical" && scheduled.length === 0)) {
      scheduled.push(task);
      used += task.estimatedMinutes;
      if (!fits) overload = true;
    }
  }

  if (scheduled.length === 0 && sorted[0]) {
    scheduled.push(sorted[0]);
    overload = sorted[0].estimatedMinutes > capacityMinutes;
  }
  return { scheduled, overload };
}
