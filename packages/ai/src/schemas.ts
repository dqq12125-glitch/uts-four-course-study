import { z } from "zod";

export const jsonObjectSchema = z.record(z.string(), z.unknown());

export const legacyExtractionOutputSchema = z.object({
  institutionName: z.string().nullable(),
  courseCode: z.string().max(32).nullable(),
  courseName: z.string().nullable(),
  assessments: z.array(
    z.object({
      title: z.string().min(1).max(160),
      assessmentType: z.enum([
        "quiz",
        "assignment",
        "skills_test",
        "exam",
        "lab",
        "project",
        "presentation",
        "other",
      ]),
      dueLocal: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .nullable(),
      weightPercent: z.number().min(0).max(100).nullable(),
      estimatedMinutes: z.number().min(5).max(10_080).nullable(),
      notes: z.string().max(2_000).nullable(),
      sourceUid: z.string().nullable().optional(),
    }),
  ),
  classSessions: z.array(
    z.object({
      sessionType: z.enum([
        "lecture",
        "tutorial",
        "workshop",
        "lab",
        "practical",
        "other",
      ]),
      title: z.string().min(1).max(120),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      location: z.string().max(160).nullable(),
      mapUrl: z.url().nullable().optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
      recurrenceRule: z.string().max(500).nullable().optional(),
      sourceUid: z.string().nullable().optional(),
    }),
  ),
  topics: z.array(z.string().min(1).max(160)).max(80),
  warnings: z.array(z.string()).optional(),
});

export const legacyPracticeOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1).max(2_000),
        options: z.array(z.string().min(1).max(500)).min(2).max(5),
        correctChoiceIndex: z.number().int().min(0).max(4),
        hint1: z.string().min(1).max(1_000),
        hint2: z.string().max(1_000).nullable(),
        hint3: z.string().max(1_000).nullable(),
        explanation: z.string().min(1).max(3_000),
      }),
    )
    .min(1)
    .max(3),
});

export const legacyErrorClassificationOutputSchema = z.object({
  errorType: z.enum([
    "concept",
    "formula",
    "algebra",
    "units",
    "sign",
    "interpretation",
    "syntax",
    "logic",
    "careless",
    "unknown",
  ]),
  explanation: z.string().min(1).max(1_000),
});

const providerChatResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({ content: z.string().min(1) }),
    }),
  ),
});

const providerEmbeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      embedding: z.array(z.number()),
    }),
  ),
});

export type ProviderChatResponse = z.infer<
  typeof providerChatResponseSchema
>;

export function parseProviderChatResponse(value: unknown): string {
  const parsed = providerChatResponseSchema.parse(value);
  const content = parsed.choices[0]?.message.content.trim();
  if (!content) throw new StructuredOutputError("Provider returned no text.");
  return content;
}

export function parseProviderEmbeddingResponse(
  value: unknown,
  expectedCount: number,
): number[][] {
  const parsed = providerEmbeddingResponseSchema.parse(value);
  const ordered = [...parsed.data].sort((left, right) => left.index - right.index);
  if (ordered.length !== expectedCount) {
    throw new StructuredOutputError("Provider returned an unexpected embedding count.");
  }
  return ordered.map((item) => item.embedding);
}

export class StructuredOutputError extends Error {
  constructor(message = "AI structured output failed schema validation.") {
    super(message);
    this.name = "StructuredOutputError";
  }
}

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

export function parseStructuredResponse<T>(
  value: string,
  schema: z.ZodType<T>,
): T {
  try {
    const decoded: unknown = JSON.parse(stripCodeFence(value));
    const parsed = schema.safeParse(decoded);
    if (parsed.success) return parsed.data;
  } catch {
    // The stable error below deliberately excludes provider content.
  }
  throw new StructuredOutputError();
}

export function validateStructuredValue<T>(
  value: unknown,
  schema: z.ZodType<T>,
): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new StructuredOutputError();
}
