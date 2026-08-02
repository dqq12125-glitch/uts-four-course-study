import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("advanced coordinate board supports exact mathematical construction", async () => {
  const [{ evaluateMathExpression }, board, workspace] = await Promise.all([
    import(new URL("../app/math-expression.ts", import.meta.url)),
    readFile(new URL("../app/coordinate-board.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/answer-workspace.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(evaluateMathExpression("x^2 + 2*x + 1", { x: 3 }), 16);
  assert.ok(Math.abs(evaluateMathExpression("sin(pi/2) + x", { x: 2 }) - 3) < 1e-10);
  assert.match(board, /"pan" \| "point" \| "freehand" \| "line" \| "vector" \| "eraser"/);
  assert.match(board, /functionPoints/);
  assert.match(board, /coordinateObjects/);
  assert.match(board, /Grid snap on/);
  assert.match(board, /Add exact point/);
  assert.match(workspace, /<CoordinateBoard/);
});

test("every answered question, including instructor difficulty, has AI teaching handoff", async () => {
  const [page, route] = await Promise.all([
    readFile(new URL("../app/personal/four-course-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /handoffToAiExplanation\(currentQuestion, answeredCurrent\)/);
  assert.match(page, /教师难度题 · AI 分步讲解/);
  assert.match(page, /visualContext: buildTutorVisualContext\(question, lang\)/);
  assert.match(page, /hintLevel: 5/);
  assert.match(route, /VISUAL OR TABLE CONTEXT/);
  assert.match(route, /定义与适用条件/);
  assert.match(route, /正确答案与错误选项/);
  assert.match(route, /explicitly state the correct option or result/);
});
