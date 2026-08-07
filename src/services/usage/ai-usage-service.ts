import type { EntitlementSnapshot } from "../../domain/commerce/entitlements.ts";
import { ApiError } from "../../lib/api-errors.ts";
import {
  localDateKey,
  zonedDateTimeToUtc,
} from "../../lib/timezone.ts";
import type { AiRepository } from "../../repositories/ai-repository.ts";

function addLocalDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export class AiUsageService {
  private readonly repository: AiRepository;

  constructor(repository: AiRepository) {
    this.repository = repository;
  }

  async allowance(input: {
    userId: string;
    timezone: string;
    entitlement: EntitlementSnapshot;
    now: Date;
  }): Promise<{
    usedToday: number;
    remainingToday: number;
    monthCostMinorUsd: number;
  }> {
    const localToday = localDateKey(input.now, input.timezone);
    const dayStart = zonedDateTimeToUtc(
      `${localToday}T00:00`,
      input.timezone,
    );
    const nextDay = zonedDateTimeToUtc(
      `${addLocalDays(localToday, 1)}T00:00`,
      input.timezone,
    );
    const monthStartKey = `${localToday.slice(0, 7)}-01`;
    const monthStart = zonedDateTimeToUtc(
      `${monthStartKey}T00:00`,
      input.timezone,
    );
    const nextMonthDate = new Date(`${monthStartKey}T12:00:00.000Z`);
    nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
    const nextMonthKey = nextMonthDate.toISOString().slice(0, 10);
    const nextMonth = zonedDateTimeToUtc(
      `${nextMonthKey}T00:00`,
      input.timezone,
    );
    const [today, month] = await Promise.all([
      this.repository.usageBetween(
        input.userId,
        "tutor",
        dayStart.toISOString(),
        nextDay.toISOString(),
      ),
      this.repository.usageBetween(
        input.userId,
        "tutor",
        monthStart.toISOString(),
        nextMonth.toISOString(),
      ),
    ]);
    return {
      usedToday: today.calls,
      remainingToday: Math.max(
        0,
        input.entitlement.dailyAiMessageLimit - today.calls,
      ),
      monthCostMinorUsd: month.costMinorUsd,
    };
  }

  assertAvailable(
    entitlement: EntitlementSnapshot,
    allowance: {
      usedToday: number;
      monthCostMinorUsd: number;
    },
  ): void {
    if (
      !entitlement.canUseAiTutor ||
      allowance.usedToday >= entitlement.dailyAiMessageLimit
    ) {
      throw new ApiError(
        "AI_DAILY_LIMIT_REACHED",
        429,
        "You have reached today's AI tutor allowance.",
      );
    }
    if (
      allowance.monthCostMinorUsd >=
      entitlement.monthlyAiCostLimitMinorUsd
    ) {
      throw new ApiError(
        "AI_MONTHLY_COST_LIMIT_REACHED",
        429,
        "This account has reached its monthly AI allowance.",
      );
    }
  }

  async generatedPracticeThisWeek(input: {
    userId: string;
    timezone: string;
    now: Date;
  }): Promise<number> {
    const localToday = localDateKey(input.now, input.timezone);
    const noon = new Date(`${localToday}T12:00:00.000Z`);
    const day = noon.getUTCDay();
    const daysSinceMonday = (day + 6) % 7;
    noon.setUTCDate(noon.getUTCDate() - daysSinceMonday);
    const weekStartKey = noon.toISOString().slice(0, 10);
    const nextWeekKey = addLocalDays(weekStartKey, 7);
    const result = await this.repository.usageBetween(
      input.userId,
      "practice_generation",
      zonedDateTimeToUtc(
        `${weekStartKey}T00:00`,
        input.timezone,
      ).toISOString(),
      zonedDateTimeToUtc(
        `${nextWeekKey}T00:00`,
        input.timezone,
      ).toISOString(),
    );
    return result.calls;
  }
}
