import type { z } from "zod";

export type ModelCapability = "low" | "medium" | "high";

export interface StructuredRequest<T> {
  schema: z.ZodType<T>;
  schemaName: string;
  system: string;
  prompt: string;
  capability: ModelCapability;
  maxOutputTokens?: number;
  cacheKey?: string;
}

export interface TextRequest {
  system: string;
  prompt: string;
  capability: ModelCapability;
  maxOutputTokens?: number;
  cacheKey?: string;
}

export interface AudioInput {
  bytes: Uint8Array;
  mimeType: string;
  language?: string;
}

export interface TranscriptSegment {
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface Transcript {
  text: string;
  language?: string;
  segments: TranscriptSegment[];
}

export interface AIProvider {
  generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
  generateText(request: TextRequest): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
  transcribe?(audio: AudioInput): Promise<Transcript>;
}
