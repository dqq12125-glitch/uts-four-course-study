import { z } from "zod";
import { entityIdSchema } from "./ids.ts";

export const sourceReferenceSchema = z
  .object({
    resourceId: entityIdSchema,
    courseId: entityIdSchema,
    page: z.number().int().positive().optional(),
    slide: z.number().int().positive().optional(),
    section: z.string().trim().min(1).max(500).optional(),
    timestampStart: z.number().nonnegative().optional(),
    timestampEnd: z.number().nonnegative().optional(),
    sourceUrl: z.url().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.page === undefined &&
      value.slide === undefined &&
      value.section === undefined &&
      value.timestampStart === undefined &&
      value.timestampEnd === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["section"],
        message: "A source reference must include a page, slide, section, or timestamp.",
      });
    }
    if (value.page !== undefined && value.slide !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["slide"],
        message: "A source reference cannot point to both a page and a slide.",
      });
    }
    if (
      (value.timestampStart === undefined) !==
      (value.timestampEnd === undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["timestampEnd"],
        message: "Timestamp references require both start and end values.",
      });
    }
    if (
      value.timestampStart !== undefined &&
      value.timestampEnd !== undefined &&
      value.timestampEnd < value.timestampStart
    ) {
      context.addIssue({
        code: "custom",
        path: ["timestampEnd"],
        message: "timestampEnd must be greater than or equal to timestampStart",
      });
    }
  });

export type SourceReference = z.infer<typeof sourceReferenceSchema>;
