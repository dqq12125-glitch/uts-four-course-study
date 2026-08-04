import { z } from "zod";

export const learningModeSchema = z.enum([
  "memory_retrieval",
  "concept_understanding",
  "quantitative_problem_solving",
  "procedural_practice",
  "programming_computation",
  "reading_argumentation",
  "language_communication",
  "design_project",
  "case_reasoning",
  "simulation_experiment",
]);

export const aiRoleSchema = z.enum([
  "tutor",
  "examiner",
  "coach",
  "reviewer",
  "tool_agent",
]);

export const learningSessionStatusSchema = z.enum([
  "created",
  "diagnostic",
  "instruction",
  "guided_practice",
  "independent_practice",
  "assessment",
  "reflection",
  "completed",
]);

export const conceptMasteryStatusSchema = z.enum([
  "not_started",
  "introduced",
  "needs_guidance",
  "independent",
  "transfer_ready",
]);

export type LearningMode = z.infer<typeof learningModeSchema>;
export type AIRole = z.infer<typeof aiRoleSchema>;
export type LearningSessionStatus = z.infer<
  typeof learningSessionStatusSchema
>;
export type ConceptMasteryStatus = z.infer<
  typeof conceptMasteryStatusSchema
>;
