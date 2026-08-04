import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the public DeepStudy marketing page without a database", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>DeepStudy[\s\S]*今天学什么/i);
  assert.match(html, /Turn your semester into today/);
  assert.match(html, /免费开始/);
  assert.match(html, /not affiliated with, sponsored by or endorsed by UTS/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("preserves the private bilingual personal workspace with a server-only AI key", async () => {
  const [
    page,
    css,
    layout,
    tutorRoute,
    tutorProvider,
    learningTools,
    deepLessons,
    semesterData,
    wrangler,
  ] = await Promise.all([
    readFile(
      new URL("../app/personal/four-course-app.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../src/services/ai/personal-tutor-provider.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/learning-tools.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/deep-lessons.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/semester-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  ]);

  assert.match(page, /苏格拉底深度导师/);
  assert.match(page, /Socratic Deep Tutor/);
  assert.match(page, /tutorPrompts/);
  assert.match(page, /submitTutorAnswer/);
  assert.match(page, /tutorCorrectStreak|tutorStreak/);
  assert.match(css, /\.tutor-card/);
  assert.match(css, /repeat\(5,\s*1fr\)/);
  assert.match(layout, /DeepStudy/);
  assert.match(page, /DeepSeek AI 导师/);
  assert.match(page, /48510/);
  assert.match(page, /Introduction to Electrical and Electronic Engineering/);
  assert.match(page, /Deep Learning Mode/);
  assert.match(page, /practiceBank\.length/);
  assert.doesNotMatch(page, /48230|Introduction to Engineering Projects/);
  assert.match(tutorProvider, /deepseek-v4-pro/);
  assert.match(tutorRoute, /formal definition/);
  assert.doesNotMatch(tutorRoute, /sk-[A-Za-z0-9]/);
  assert.doesNotMatch(page, /four-course-deepseek-key/);
  assert.doesNotMatch(page, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(page, /fetch\(\"\/api\/tutor\"/);
  assert.match(tutorRoute, /PERSONAL_WORKSPACE_NOT_FOUND/);
  assert.match(tutorRoute, /(?:getRuntimeEnvironment\(\)|environment)\.DEEPSEEK_API_KEY/);
  assert.match(wrangler, /"name": "uts-deep-study"/);
  assert.doesNotMatch(wrangler, /compatibility_flags/);
  assert.match(page, /PREP → CLASS → REVIEW → RETRIEVAL/);
  assert.match(page, /MathPhysicsTools/);
  assert.match(page, /AnswerWorkspace/);
  assert.match(page, /mathDifficultyQuestionBank/);
  assert.match(page, /eeeDifficultyQuestionBank/);
  assert.match(page, /cDifficultyQuestionBank/);
  assert.match(page, /physicsDifficultyQuestionBank/);
  assert.match(page, /教师题型难度（原创）/);
  assert.match(css, /\.difficulty-badge/);
  assert.match(learningTools, /学习计算器/);
  assert.match(learningTools, /QuestionVisualPanel/);
  assert.match(learningTools, /showCalculator\s*=\s*false/);
  assert.match(css, /\.learning-flow/);
  assert.match(page, /完整章节/);
  assert.match(page, /selectedCourseTopic/);
  assert.ok((deepLessons.match(/^\s+"(?:math|eee|c|physics)-\d+":/gm) ?? []).length >= 33);
  assert.match(deepLessons, /投影系数为 6\/4=1\.5/);
  assert.match(css, /\.worked-example/);
  assert.doesNotMatch(layout, /\b290\b/);
  assert.match(css, /Hallmark · macrostructure: Workbench/);
  assert.match(page, /four-course-timetable-selections-v1/);
  assert.match(page, /timetableChoiceGroups/);
  assert.match(page, /does not change UTS Allocate\+/);
  assert.match(css, /\.timetable-choice-option\.selected/);
  assert.doesNotMatch(semesterData, /math-tut1-18/);
  assert.match(semesterData, /math-tut1-14[\s\S]*status: "waitlist"/);
  assert.match(semesterData, /math-tut1-09[\s\S]*status: "allocated"/);
  assert.match(semesterData, /机房课 Cmp1 03[\s\S]*start: "10:00"[\s\S]*end: "12:00"/);
});
