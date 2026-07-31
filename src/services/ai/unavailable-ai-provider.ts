import { ApiError } from "../../lib/api-errors.ts";
import type {
  AiProvider,
  ErrorClassification,
  ErrorClassificationInput,
  ExtractionInput,
  ExtractionResult,
  PracticeGenerationInput,
  PracticeGenerationResult,
  TutorInput,
  TutorResult,
} from "./types.ts";

function unavailable(): never {
  throw new ApiError(
    "AI_NOT_CONFIGURED",
    503,
    "The AI provider is not configured for this environment.",
  );
}

export class UnavailableAiProvider implements AiProvider {
  async tutor(_input: TutorInput): Promise<TutorResult> {
    void _input;
    return unavailable();
  }

  async extractCourseData(
    _input: ExtractionInput,
  ): Promise<ExtractionResult> {
    void _input;
    return unavailable();
  }

  async generatePractice(
    _input: PracticeGenerationInput,
  ): Promise<PracticeGenerationResult> {
    void _input;
    return unavailable();
  }

  async classifyError(
    _input: ErrorClassificationInput,
  ): Promise<ErrorClassification> {
    void _input;
    return unavailable();
  }
}
