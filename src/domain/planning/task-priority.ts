export interface PriorityInput {
  now: Date;
  dueAt: Date | null;
  weightPercent: number | null;
  estimatedMinutes: number;
  masteryScore?: number | null;
  classWithinHours?: number | null;
  userPriority?: number;
}

export interface PriorityBreakdown {
  deadlineUrgency: number;
  assessmentWeight: number;
  masteryRisk: number;
  classTimingBoost: number;
  overduePenalty: number;
  userPriority: number;
  estimatedEffortPenalty: number;
  total: number;
}

export function calculateTaskPriority(
  input: PriorityInput,
): PriorityBreakdown {
  const hoursUntilDue = input.dueAt
    ? (input.dueAt.getTime() - input.now.getTime()) / 3_600_000
    : null;

  // Deadlines rise smoothly over the final two weeks. Overdue work receives
  // a separate, visible boost so it is never silently buried.
  const deadlineUrgency =
    hoursUntilDue === null || hoursUntilDue < 0
      ? 0
      : Math.round(Math.max(0, 48 - hoursUntilDue / 7));

  // Weight contributes, but is capped so a distant high-weight assessment
  // cannot permanently crowd out urgent foundational work.
  const assessmentWeight = Math.round(
    Math.min(20, Math.max(0, input.weightPercent ?? 0) / 5),
  );

  // Low observed mastery increases priority. Absence of mastery evidence is
  // neutral rather than pretending that the student is weak.
  const masteryRisk =
    input.masteryScore === null || input.masteryScore === undefined
      ? 0
      : Math.round(Math.max(0, 100 - input.masteryScore) / 5);

  // Nearby classes make preview/review more useful, with a maximum 12-point
  // boost inside the next 24 hours.
  const classTimingBoost =
    input.classWithinHours === null ||
    input.classWithinHours === undefined ||
    input.classWithinHours < 0 ||
    input.classWithinHours > 24
      ? 0
      : Math.round(12 - input.classWithinHours / 2);

  const overduePenalty =
    hoursUntilDue !== null && hoursUntilDue < 0 ? 60 : 0;
  const userPriority = Math.min(20, Math.max(0, input.userPriority ?? 0));

  // Long tasks carry a small scheduling cost. The cap prevents large tasks
  // from disappearing; capacity handling decides whether they need splitting.
  const estimatedEffortPenalty = Math.min(
    12,
    Math.floor(Math.max(0, input.estimatedMinutes - 15) / 30),
  );

  return {
    deadlineUrgency,
    assessmentWeight,
    masteryRisk,
    classTimingBoost,
    overduePenalty,
    userPriority,
    estimatedEffortPenalty,
    total:
      deadlineUrgency +
      assessmentWeight +
      masteryRisk +
      classTimingBoost +
      overduePenalty +
      userPriority -
      estimatedEffortPenalty,
  };
}

export function priorityLabel(
  score: number,
): "low" | "medium" | "high" | "critical" {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}
