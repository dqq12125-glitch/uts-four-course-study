import { z } from "zod";

export const entityIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

export type EntityId = z.infer<typeof entityIdSchema>;
export type UserId = EntityId;
export type CourseId = EntityId;
export type ResourceId = EntityId;
export type ConceptId = EntityId;
export type LearningSessionId = EntityId;
