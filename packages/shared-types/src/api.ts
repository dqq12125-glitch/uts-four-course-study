import { z } from "zod";
import { courseSchema, languageSchema } from "./course.ts";
import { entityIdSchema } from "./ids.ts";
import { sourceReferenceSchema } from "./source-reference.ts";

export const sessionUserSchema = z.object({
  id: entityIdSchema,
  email: z.email(),
  displayName: z.string().max(240).nullable(),
  preferredLanguage: languageSchema,
  timezone: z.string().trim().min(1).max(100),
  onboardingCompleted: z.boolean(),
});

export const sessionResponseSchema = z.object({
  user: sessionUserSchema.nullable(),
});

export const mobileExchangeResponseSchema = z.object({
  sessionToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  user: sessionUserSchema,
});

export const coursesResponseSchema = z.object({
  courses: z.array(courseSchema),
});

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(2_000),
    requestId: z.string().max(200).nullish(),
  }),
});

export const sourcedAiResponseSchema = z.object({
  answer: z.string(),
  sourceReferences: z.array(sourceReferenceSchema),
  confidence: z.number().min(0).max(1),
  limitations: z.array(z.string()),
  nextSuggestedAction: z.string().nullable(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type MobileExchangeResponse = z.infer<
  typeof mobileExchangeResponseSchema
>;
export type CoursesResponse = z.infer<typeof coursesResponseSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
export type SourcedAiResponse = z.infer<typeof sourcedAiResponseSchema>;
