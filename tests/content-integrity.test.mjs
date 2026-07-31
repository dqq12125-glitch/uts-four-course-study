import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function questionBlock(source, id) {
  const start = source.indexOf(`id: "${id}"`);
  assert.notEqual(start, -1, `Missing question ${id}`);
  const next = source.indexOf('\n  {\n    id: "', start + 8);
  return source.slice(start, next === -1 ? source.length : next);
}

test("known mathematical answers agree with their explanations", async () => {
  const source = await readFile(new URL("../app/advanced-questions.ts", import.meta.url), "utf8");

  const magnitude = questionBlock(source, "math-0-1");
  assert.match(magnitude, /answer:\s*1\b/);
  assert.match(magnitude, /√\(3²\+4²\).*√25=5/s);
  assert.match(magnitude, /components carry a physical unit.*magnitude carries that same unit/s);

  const displacement = questionBlock(source, "math-4-9");
  assert.match(displacement, /answer:\s*1\b/);
  assert.match(displacement, /10 m（选 B）/);
  assert.match(displacement, /correct answer is 10 m \(B\)/i);
});

test("weekly plans map explicitly to real knowledge-point ids", async () => {
  const [semester, questions, lessons] = await Promise.all([
    readFile(new URL("../app/semester-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/topic-questions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/deep-lessons.ts", import.meta.url), "utf8"),
  ]);

  assert.match(semester, /type WeeklyCoursePlan[\s\S]*topicId:\s*string/);
  assert.match(semester, /weeklyTopicIds/);
  assert.match(semester, /"physics-6"[\s\S]*"physics-7"[\s\S]*"physics-8"[\s\S]*"physics-9"/);

  for (const id of ["physics-6", "physics-7", "physics-8", "physics-9"]) {
    assert.match(questions, new RegExp(`topicId: "${id}"`));
    assert.match(lessons, new RegExp(`"${id}": lesson\\(`));
  }
});

test("generated combination questions vary answer position", async () => {
  const source = await readFile(new URL("../app/topic-questions.ts", import.meta.url), "utf8");
  assert.match(source, /const patterns: Check\[\]\[\]/);
  assert.match(source, /const patternIndex = seed % patterns\.length/);
  assert.doesNotMatch(source, /makeCombination\(spec,\s*8,\s*1\)/);
});

test("AI tutor follows the one-gap Socratic response contract", async () => {
  const source = await readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8");
  assert.match(source, /prior idea or prediction/);
  assert.match(source, /one cognitive step per message/);
  assert.match(source, /你已经抓住了 \/ What you got right/);
  assert.match(source, /现在只差这一点 \/ One gap/);
  assert.match(source, /下一步问题 \/ One next question/);
  assert.match(source, /hintLevel/);
  assert.match(source, /viewed solution does not prove mastery/i);
});
