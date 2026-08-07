import { z } from "zod";
import { entityIdSchema } from "./ids.ts";

export const languageSchema = z.enum(["zh-CN", "en"]);
export type Language = z.infer<typeof languageSchema>;

export const courseSourceTypeSchema = z.enum([
  "template",
  "manual",
  "imported",
]);

export const courseSchema = z.object({
  id: entityIdSchema,
  userSemesterId: entityIdSchema,
  courseTemplateId: entityIdSchema.nullable(),
  courseCode: z.string().max(64).nullable(),
  courseName: z.string().trim().min(1).max(240),
  colourKey: z.string().trim().min(1).max(64),
  instructorName: z.string().max(240).nullable(),
  sourceType: courseSourceTypeSchema,
  assessmentCount: z.number().int().nonnegative().optional(),
});

export type CourseSourceType = z.infer<typeof courseSourceTypeSchema>;
export type Course = z.infer<typeof courseSchema>;
