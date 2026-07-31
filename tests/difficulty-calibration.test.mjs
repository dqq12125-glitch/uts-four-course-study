import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function evaluateTypeScript(relativePath, runtimeModules = {}) {
  const filename = path.join(projectRoot, relativePath);
  const output = ts.transpileModule(read(relativePath), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const moduleRecord = { exports: {} };
  const sandbox = {
    module: moduleRecord,
    exports: moduleRecord.exports,
    require(specifier) {
      if (Object.hasOwn(runtimeModules, specifier)) return runtimeModules[specifier];
      throw new Error(`Unexpected runtime import ${specifier} while evaluating ${relativePath}`);
    },
  };
  vm.runInNewContext(output, sandbox, { filename });
  return moduleRecord.exports;
}

const advanced = evaluateTypeScript("app/advanced-questions.ts");
const topicModule = evaluateTypeScript("app/topic-questions.ts", {
  "./advanced-questions": advanced,
});
const bankModules = [
  ["app/math-difficulty-bank.ts", "mathDifficultyQuestionBank"],
  ["app/eee-difficulty-bank.ts", "eeeDifficultyQuestionBank"],
  ["app/c-difficulty-bank.ts", "cDifficultyQuestionBank"],
  ["app/physics-difficulty-bank.ts", "physicsDifficultyQuestionBank"],
];
const instructorQuestions = bankModules.flatMap(([file, exportName]) => {
  const bank = evaluateTypeScript(file)[exportName];
  assert.ok(Array.isArray(bank), `${file} must export ${exportName}`);
  return bank;
});
const retainedRegular = topicModule.topicQuestionBank.filter((question) => {
  const suffix = Number(question.id.match(/-(\d+)$/)?.[1]);
  return suffix >= 3 && suffix <= 9;
});
const topicIds = [...new Set(topicModule.topicQuestionBank.map((question) => question.topicId))];
const rank = new Map([
  ["foundation", 0],
  ["application", 1],
  ["complex", 2],
  ["challenge", 3],
  ["instructor", 4],
]);
const finalBank = topicIds.flatMap((topicId) =>
  [
    ...retainedRegular.filter((question) => question.topicId === topicId),
    ...instructorQuestions.filter((question) => question.topicId === topicId),
  ].sort((a, b) => rank.get(a.difficulty) - rank.get(b.difficulty)),
);

test("the final bank is exactly 33 topics × 10 difficulty-calibrated questions", () => {
  assert.equal(topicIds.length, 33);
  assert.equal(retainedRegular.length, 231, "seven retained regular questions per topic");
  assert.equal(instructorQuestions.length, 99, "three instructor-style questions per topic");
  assert.equal(finalBank.length, 330);
  assert.equal(new Set(finalBank.map((question) => question.id)).size, 330, "question IDs must be unique");

  for (const topicId of topicIds) {
    const questions = finalBank.filter((question) => question.topicId === topicId);
    assert.equal(questions.length, 10, `${topicId} must contain exactly ten questions`);
    assert.equal(
      questions.filter((question) => question.difficulty === "instructor").length,
      3,
      `${topicId} must contain three original instructor-style questions`,
    );
    assert.deepEqual(
      questions.map((question) => question.difficulty),
      [...questions.map((question) => question.difficulty)].sort(
        (a, b) => rank.get(a) - rank.get(b),
      ),
      `${topicId} must progress from foundation to instructor style`,
    );
  }
});

test("difficulty fields are complete and complex work is the majority", () => {
  const supported = new Set(rank.keys());
  for (const question of finalBank) {
    assert.ok(supported.has(question.difficulty), `${question.id} needs a supported difficulty`);
    assert.ok(
      Number.isFinite(question.estimatedMinutes) && question.estimatedMinutes > 0,
      `${question.id} needs an estimated completion time`,
    );
    assert.notEqual(question.kind, "truefalse", `${question.id} must not be true/false`);
  }

  for (const topicId of topicIds) {
    const questions = finalBank.filter((question) => question.topicId === topicId);
    assert.equal(questions.filter((question) => question.difficulty === "foundation").length, 1);
    assert.equal(questions.filter((question) => question.difficulty === "application").length, 2);
    assert.equal(
      questions.filter(
        (question) => question.difficulty === "complex" || question.difficulty === "challenge",
      ).length,
      4,
    );
    assert.equal(questions.filter((question) => question.difficulty === "instructor").length, 3);
    assert.equal(
      questions.filter(
        (question) =>
          question.difficulty === "complex" ||
          question.difficulty === "challenge" ||
          question.difficulty === "instructor",
      ).length,
      7,
      `${topicId} must devote seven of ten questions to complex or higher-order work`,
    );
  }
});

test("every instructor-style question teaches a multi-step method and has a rubric", () => {
  for (const question of instructorQuestions) {
    assert.equal(question.difficulty, "instructor");
    assert.notEqual(question.kind, "truefalse");
    assert.ok(question.answerTools?.length > 0, `${question.id} needs a matching answer tool`);
    assert.ok(question.rubric?.zh?.length >= 4, `${question.id} needs at least four Chinese rubric points`);
    assert.ok(question.rubric?.en?.length >= 4, `${question.id} needs at least four English rubric points`);
    assert.ok(
      (question.explanation.zh.match(/第\s*\d+\s*步/g) ?? []).length >= 4,
      `${question.id} needs at least four Chinese teaching steps`,
    );
    assert.ok(
      (question.explanation.en.match(/Step\s*\d+/gi) ?? []).length >= 4,
      `${question.id} needs at least four English teaching steps`,
    );
  }

  for (const courseId of ["math", "eee", "c", "physics"]) {
    const answerPatterns = new Set(
      instructorQuestions
        .filter((question) => question.courseId === courseId)
        .map((question) => JSON.stringify(question.answer)),
    );
    assert.ok(answerPatterns.size >= 3, `${courseId} answer positions must be varied`);
  }
});

test("marking checklists stay concise instead of repeating the lesson", () => {
  for (const question of finalBank) {
    assert.ok(question.rubric, `${question.id} needs a marking checklist`);
    for (const language of ["zh", "en"]) {
      const criteria = question.rubric[language];
      assert.ok(criteria.length >= 3 && criteria.length <= 6, `${question.id} needs a scannable ${language} checklist`);
      for (const criterion of criteria) {
        assert.ok(
          criterion.length <= 120,
          `${question.id} has an overlong ${language} marking criterion (${criterion.length} characters)`,
        );
      }
    }
  }

  const page = read("app/personal/four-course-app.tsx");
  assert.doesNotMatch(page, /查看老师式评分点|View instructor-style marking points/);
  assert.match(page, /查看得分检查表/);
  assert.match(page, /View marking checklist/);
});

test("a wrong submission explicitly shows both the learner answer and the correct answer", () => {
  const page = read("app/personal/four-course-app.tsx");
  const topicSource = read("app/topic-questions.ts");

  assert.match(page, /answer-correction/);
  assert.match(page, /你的答案/);
  assert.match(page, /Your answer/);
  assert.match(page, /正确答案/);
  assert.match(page, /Correct answer/);
  assert.match(topicSource, /本题正确答案｜/);
  assert.match(topicSource, /Correct answer \|/);
});

test("a correct answer requires an explicit mastery decision", () => {
  const page = read("app/personal/four-course-app.tsx");

  assert.match(page, /masteryDecisionPending/);
  assert.match(page, /只是猜对 \/ 仍未掌握/);
  assert.match(page, /I can explain it — mastered/);
  assert.match(page, /chooseQuizQueue/);
  assert.match(page, /\["learning", copy\.queueLearning/);
  assert.match(page, /\["mastered", copy\.queueMastered/);
  assert.doesNotMatch(
    page,
    /recordQuestionAttempt\(items, question\.id, \{ correct, masteryStatus: "mastered" \}\)/,
  );
});

test("the UI merges only the calibrated banks and labels them honestly", () => {
  const page = read("app/personal/four-course-app.tsx");
  const topicSource = read("app/topic-questions.ts");

  for (const exportName of bankModules.map(([, exportName]) => exportName)) {
    assert.match(page, new RegExp(`\\b${exportName}\\b`));
  }
  assert.match(page, /suffix >= 3 && suffix <= 9/);
  assert.doesNotMatch(page, /instructorVectorQuestionBank/);
  assert.doesNotMatch(page, /Canvas 教师难度|Canvas instructor level/);
  assert.match(page, /教师题型难度（原创）/);
  assert.match(page, /Instructor-style difficulty \(original\)/);
  assert.match(page, /question-time-badge/);

  for (const difficulty of rank.keys()) {
    assert.match(topicSource, new RegExp(`"${difficulty}"`));
  }
});
