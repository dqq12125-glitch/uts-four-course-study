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

const usage = {
  modelKey: "mock-deterministic-v1",
  tokenInput: 24,
  tokenOutput: 36,
  estimatedCostMinorUsd: 0,
};

function textExtraction(input: ExtractionInput): ExtractionResult {
  const text = input.text ?? "";
  const topics = [...text.matchAll(/(?:topic|主题)\s*[:：]\s*([^\n,;]+)/gi)]
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 20);
  const courseMatch =
    /(?:course|subject|课程)\s*(?:name)?\s*[:：]\s*([^\n]+)/i.exec(text);
  const codeMatch =
    /(?:course|subject|课程)\s*(?:code|代码)\s*[:：]\s*([A-Z0-9 -]{2,32})/i.exec(
      text,
    );
  return {
    ...usage,
    institutionName: null,
    courseCode: codeMatch?.[1]?.trim() ?? null,
    courseName: courseMatch?.[1]?.trim().slice(0, 160) ?? null,
    assessments: [],
    classSessions: [],
    topics,
    warnings: [],
  };
}

export class MockAiProvider implements AiProvider {
  async tutor(input: TutorInput): Promise<TutorResult> {
    const integrity =
      input.safetyMode === "integrity_guidance"
        ? input.language === "zh-CN"
          ? "这看起来可能属于需要独立提交的评估；我会帮你理解方法，但不会给可直接提交的答案。"
          : "This may be independently assessed work; I can teach the method but will not provide a submission-ready answer."
        : "";
    const reply =
      input.language === "zh-CN"
        ? `你已经抓住了\n${integrity || "你已经明确了当前卡点。"}\n\n现在只差这一点\n先写出你认为最相关的定义或第一步，不需要完成整题。\n\n下一步问题\n你目前已经尝试到哪一步？`
        : `What you have\n${integrity || "You have identified the point where you are stuck."}\n\nOne gap\nWrite the most relevant definition or first step; do not solve the whole problem yet.\n\nYour next attempt\nWhat have you tried so far?`;
    return { ...usage, reply };
  }

  async extractCourseData(
    input: ExtractionInput,
  ): Promise<ExtractionResult> {
    return textExtraction(input);
  }

  async generatePractice(
    input: PracticeGenerationInput,
  ): Promise<PracticeGenerationResult> {
    const prompt =
      input.language === "zh-CN"
        ? `关于“${input.topicTitle}”，哪一项最符合核心定义？`
        : `Which option best matches the core definition of “${input.topicTitle}”?`;
    return {
      ...usage,
      questions: [
        {
          prompt,
          options:
            input.language === "zh-CN"
              ? ["符合定义的例子", "相反概念", "无关事实", "常见误解"]
              : [
                  "An example satisfying the definition",
                  "The opposite concept",
                  "An unrelated fact",
                  "A common misconception",
                ],
          correctChoiceIndex: 0,
          hint1:
            input.language === "zh-CN"
              ? "先回忆定义中的必要条件。"
              : "Recall the necessary condition in the definition.",
          hint2: null,
          hint3: null,
          explanation:
            input.language === "zh-CN"
              ? "正确选项满足定义中的必要条件。"
              : "The correct option satisfies the definition's necessary condition.",
        },
      ],
    };
  }

  async classifyError(
    input: ErrorClassificationInput,
  ): Promise<ErrorClassification> {
    return {
      ...usage,
      errorType: "unknown",
      explanation:
        input.language === "zh-CN"
          ? "需要更多作答步骤才能可靠分类。"
          : "More working is needed for a reliable classification.",
    };
  }
}
