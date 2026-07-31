export type AiLanguage = "zh-CN" | "en";

export interface AiUsage {
  modelKey: string;
  tokenInput: number;
  tokenOutput: number;
  estimatedCostMinorUsd: number;
}

export interface TutorInput {
  language: AiLanguage;
  courseName: string;
  courseCode: string | null;
  topicTitle: string | null;
  currentTask: string | null;
  userMessage: string;
  studentAttempt: string | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  untrustedResourceContext: string | null;
  safetyMode: "hint_first" | "integrity_guidance";
}

export interface TutorResult extends AiUsage {
  reply: string;
}

export interface ExtractionInput {
  language: AiLanguage;
  resourceType: string;
  text: string | null;
  imageDataUrl: string | null;
}

export interface ExtractedAssessment {
  title: string;
  assessmentType:
    | "quiz"
    | "assignment"
    | "skills_test"
    | "exam"
    | "lab"
    | "project"
    | "presentation"
    | "other";
  dueLocal: string | null;
  weightPercent: number | null;
  estimatedMinutes: number | null;
  notes: string | null;
  sourceUid?: string | null;
}

export interface ExtractedClassSession {
  sessionType:
    | "lecture"
    | "tutorial"
    | "workshop"
    | "lab"
    | "practical"
    | "other";
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  mapUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recurrenceRule?: string | null;
  sourceUid?: string | null;
}

export interface ExtractionResult extends AiUsage {
  institutionName: string | null;
  courseCode: string | null;
  courseName: string | null;
  assessments: ExtractedAssessment[];
  classSessions: ExtractedClassSession[];
  topics: string[];
  warnings?: string[];
}

export interface PracticeGenerationInput {
  language: AiLanguage;
  courseName: string;
  topicTitle: string;
  difficulty: number;
  untrustedResourceContext: string | null;
}

export interface GeneratedPracticeQuestion {
  prompt: string;
  options: string[];
  correctChoiceIndex: number;
  hint1: string;
  hint2: string | null;
  hint3: string | null;
  explanation: string;
}

export interface PracticeGenerationResult extends AiUsage {
  questions: GeneratedPracticeQuestion[];
}

export interface ErrorClassificationInput {
  language: AiLanguage;
  prompt: string;
  expectedAnswer: string;
  userAnswer: string;
}

export interface ErrorClassification extends AiUsage {
  errorType:
    | "concept"
    | "formula"
    | "algebra"
    | "units"
    | "sign"
    | "interpretation"
    | "syntax"
    | "logic"
    | "careless"
    | "unknown";
  explanation: string;
}

export interface AiProvider {
  tutor(input: TutorInput): Promise<TutorResult>;
  extractCourseData(input: ExtractionInput): Promise<ExtractionResult>;
  generatePractice(
    input: PracticeGenerationInput,
  ): Promise<PracticeGenerationResult>;
  classifyError(
    input: ErrorClassificationInput,
  ): Promise<ErrorClassification>;
}
