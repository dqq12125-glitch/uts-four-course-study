import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("difficulty-calibrated banks are live, complete, and not answer-position predictable", async () => {
  const [math, eee, c, physics, page] = await Promise.all([
    import(new URL("../app/math-difficulty-bank.ts", import.meta.url)),
    import(new URL("../app/eee-difficulty-bank.ts", import.meta.url)),
    import(new URL("../app/c-difficulty-bank.ts", import.meta.url)),
    import(new URL("../app/physics-difficulty-bank.ts", import.meta.url)),
    readFile(
      new URL("../app/personal/four-course-app.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  const bank = [
    ...math.mathDifficultyQuestionBank,
    ...eee.eeeDifficultyQuestionBank,
    ...c.cDifficultyQuestionBank,
    ...physics.physicsDifficultyQuestionBank,
  ];
  assert.equal(bank.length, 99);
  assert.equal(new Set(bank.map((question) => question.id)).size, bank.length);
  const scalarPositions = new Set();
  const topicCounts = new Map();
  for (const question of bank) {
    assert.equal(question.difficulty, "instructor", question.id);
    assert.ok(question.estimatedMinutes >= 5, question.id);
    assert.notEqual(question.kind, "truefalse", question.id);
    assert.ok(question.rubric.zh.length >= 4, question.id);
    assert.equal(question.rubric.zh.length, question.rubric.en.length, question.id);
    assert.ok(Array.isArray(question.answerTools), `${question.id}: explicit tools`);
    assert.ok(question.answerTools.length > 0, `${question.id}: useful tools`);
    assert.match(question.explanation.zh, /第 [1-5] 步/);
    assert.match(question.explanation.en, /Step [1-5] \|/);
    assert.match(question.explanation.zh, /迁移|自测/);
    assert.match(question.explanation.en, /Transfer/i);
    topicCounts.set(question.topicId, (topicCounts.get(question.topicId) ?? 0) + 1);
    const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
    assert.ok(
      answers.every(
        (index) =>
          Number.isInteger(index) && index >= 0 && index < question.options.length,
      ),
      question.id,
    );
    if (!Array.isArray(question.answer)) scalarPositions.add(question.answer);
    if (question.learningVisual) {
      assert.ok(question.learningVisual.alt.zh.trim(), question.id);
      assert.ok(question.learningVisual.alt.en.trim(), question.id);
    }
  }
  assert.equal(topicCounts.size, 33);
  for (const [topicId, count] of topicCounts) {
    assert.equal(count, 3, `${topicId}: calibrated count`);
  }
  assert.ok(scalarPositions.size >= 3);
  assert.ok(
    bank.some(
      (question) =>
        Array.isArray(question.answer) && !question.answer.includes(0),
    ),
  );
  assert.match(page, /mathDifficultyQuestionBank/);
  assert.match(page, /eeeDifficultyQuestionBank/);
  assert.match(page, /cDifficultyQuestionBank/);
  assert.match(page, /physicsDifficultyQuestionBank/);
  assert.doesNotMatch(page, /Canvas instructor level|Canvas 教师难度/);
  assert.match(page, /教师题型难度（原创）/);
  assert.match(page, /visual=\{tutorQuestion\.learningVisual\}/);
  assert.match(page, /visual=\{currentQuestion\.learningVisual\}/);
  assert.match(page, /toolKind=\{tutorQuestion\.answerTools\}/);
  assert.match(page, /toolKind=\{currentQuestion\.answerTools\}/);
  const persistentTutorOptions = page.indexOf('data-testid="tutor-options"');
  const tutorThinkStage = page.indexOf('{tutorStage === "think"');
  assert.ok(persistentTutorOptions > 0, "the tutor must render its answer choices");
  assert.ok(
    persistentTutorOptions < tutorThinkStage,
    "answer choices must be visible before the reasoning stage begins",
  );
  assert.match(page, /tutorOptionsThink/);
  assert.match(page, /tutorOptionsFeedback/);
});

test("answer evidence is meaningful and stays question-scoped", async () => {
  const { evidenceIsMeaningful, upsertAnswerEvidence } = await import(
    new URL("../app/answer-evidence.ts", import.meta.url)
  );
  const base = {
    version: 1,
    courseId: "math",
    topicId: "math-0",
    questionText: "q",
    toolKinds: ["scientific-calculator"],
    explanation: "",
    recordedAt: "2026-07-29T00:00:00Z",
  };
  const empty = {
    ...base,
    questionId: "q1",
    calculator: { expression: "", result: "" },
  };
  assert.equal(evidenceIsMeaningful(empty), false);
  const q1 = {
    ...empty,
    explanation: "I used Pythagoras.",
    calculator: { expression: "sqrt(3^2+4^2)", result: "5" },
  };
  assert.equal(evidenceIsMeaningful(q1), true);
  const q2 = {
    ...q1,
    questionId: "q2",
    explanation: "A separate derivation.",
  };
  const store = upsertAnswerEvidence(upsertAnswerEvidence({}, q1), q2);
  assert.equal(store.q1.questionId, "q1");
  assert.equal(store.q2.questionId, "q2");
  assert.notStrictEqual(store.q1, store.q2);
});

test("mastery requires independent reasoning after any H5 solution", async () => {
  const { countsTowardTutorMastery } = await import(
    new URL("../app/tutor-mastery.ts", import.meta.url)
  );
  const independentTransfer = {
    correct: true,
    reasoning:
      "I used the dot-product definition and checked both vectors are non-zero.",
    hasAnswerEvidence: true,
    requiresAnswerEvidence: true,
    highestHintLevel: 0,
    viewedFullSolution: false,
    isFreshTransfer: true,
  };
  assert.equal(
    countsTowardTutorMastery({ ...independentTransfer, reasoning: "" }),
    false,
  );
  assert.equal(
    countsTowardTutorMastery({
      ...independentTransfer,
      highestHintLevel: 5,
      viewedFullSolution: true,
    }),
    false,
  );
  assert.equal(
    countsTowardTutorMastery({
      ...independentTransfer,
      isFreshTransfer: false,
      viewedFullSolution: true,
    }),
    false,
  );
  assert.equal(countsTowardTutorMastery(independentTransfer), true);
});

async function captureTutorRequest(overrides = {}) {
  const [{ buildPersonalTutorProviderRequest }, routeSource] =
    await Promise.all([
      import(
        new URL(
          "../src/services/ai/personal-tutor-provider.ts",
          import.meta.url,
        )
      ),
      readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
    ]);
  assert.match(routeSource, /ALLOWED_TOOLS\.has\(tool\)/);
  assert.match(routeSource, /\.slice\(0,\s*6\)/);
  assert.match(routeSource, /cleanAnswerEvidence\(body\.answerEvidence\)/);

  const hintLevel =
    typeof overrides.hintLevel === "number"
      ? Math.max(0, Math.min(5, Math.floor(overrides.hintLevel)))
      : 0;
  const evidence = overrides.answerEvidence ?? {};
  const allowedTools = new Set([
    "scientific-calculator",
    "coordinate-board",
    "diagram-board",
    "circuit-sketch",
    "unit-conversion",
    "code-draft",
  ]);
  const safeEvidence = {
    toolKinds: Array.isArray(evidence.toolKinds)
      ? evidence.toolKinds.filter((tool) => allowedTools.has(tool)).slice(0, 6)
      : [],
    explanation:
      typeof evidence.explanation === "string"
        ? evidence.explanation.slice(0, 1200)
        : "",
    calculator:
      evidence.calculator && typeof evidence.calculator === "object"
        ? {
            expression: String(evidence.calculator.expression ?? "").slice(
              0,
              500,
            ),
            result: String(evidence.calculator.result ?? "").slice(0, 200),
          }
        : null,
  };
  return buildPersonalTutorProviderRequest({
    system: `Requested hint level is H${hintLevel}`,
    context: `STUDENT ANSWER EVIDENCE: ${JSON.stringify(safeEvidence)}`,
    history: [],
    userMessage: "help",
  });
}

test("tutor sends V4 thinking mode and bounded answer evidence", async () => {
  const body = await captureTutorRequest({
    hintLevel: 99,
    answerEvidence: {
      version: 1,
      questionId: "q1",
      questionText: "q",
      courseId: "math",
      toolKinds: ["scientific-calculator", "not-a-real-tool"],
      explanation: "I used Pythagoras.",
      calculator: { expression: "sqrt(3^2+4^2)", result: "5" },
      recordedAt: "x",
    },
  });
  assert.equal(body.model, "deepseek-v4-pro");
  assert.deepEqual(body.thinking, { type: "enabled" });
  assert.equal(body.reasoning_effort, "high");
  assert.equal(body.stream, false);
  assert.match(body.messages[0].content, /Requested hint level is H5/);
  assert.match(body.messages[1].content, /STUDENT ANSWER EVIDENCE/);
  assert.match(body.messages[1].content, /I used Pythagoras/);
  assert.match(body.messages[1].content, /sqrt\(3\^2\+4\^2\)/);
  assert.doesNotMatch(body.messages[1].content, /not-a-real-tool/);
});
