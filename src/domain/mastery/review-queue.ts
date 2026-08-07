export type MasteryBand =
  | "not_started"
  | "building"
  | "basic"
  | "stable"
  | "review_due";

export interface MasteryBandInput {
  masteryScore: number;
  lastAttemptAt: string | null;
  nextReviewAt: string | null;
}

export function isReviewDue(
  nextReviewAt: string | null,
  now = new Date(),
): boolean {
  return Boolean(
    nextReviewAt && Date.parse(nextReviewAt) <= now.getTime(),
  );
}

export function masteryBand(
  input: MasteryBandInput,
  now = new Date(),
): MasteryBand {
  if (!input.lastAttemptAt) return "not_started";
  if (isReviewDue(input.nextReviewAt, now)) return "review_due";
  if (input.masteryScore < 35) return "building";
  if (input.masteryScore < 70) return "basic";
  return "stable";
}

export function reviewQueueStatus(
  records: Array<MasteryBandInput & { id: string }>,
  now = new Date(),
): { due: string[]; upcoming: string[] } {
  const due: string[] = [];
  const upcoming: string[] = [];

  for (const record of records) {
    if (!record.nextReviewAt) continue;
    if (isReviewDue(record.nextReviewAt, now)) due.push(record.id);
    else upcoming.push(record.id);
  }

  return { due, upcoming };
}
