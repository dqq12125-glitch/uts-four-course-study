import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the personal workspace has main modules with explicit child destinations", async () => {
  const menu = await readFile(
    new URL("app/personal/personal-module-menu.tsx", root),
    "utf8",
  );

  assert.match(menu, /PersonalModuleMenu/);
  assert.match(menu, /ModuleContextBar/);
  assert.match(menu, /id: "overview"/);
  assert.match(menu, /id: "planning"/);
  assert.match(menu, /id: "courses"/);
  assert.match(menu, /id: "mastery"/);
  for (const destination of [
    "today",
    "plan-weekly",
    "plan-timetable",
    "plan-assessments",
    "plan-widget",
    "course-math",
    "course-eee",
    "course-c",
    "course-physics",
    "tutor",
    "quiz",
  ]) {
    assert.match(menu, new RegExp(`id: "${destination}"`));
  }
  assert.match(menu, /aria-haspopup="dialog"/);
  assert.match(menu, /aria-current=/);
});

test("each planning child renders independently instead of one long mixed page", async () => {
  const app = await readFile(
    new URL("app/personal/four-course-app.tsx", root),
    "utf8",
  );
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(app, /planModule === "weekly"/);
  assert.match(app, /planModule === "timetable"/);
  assert.match(app, /planModule === "assessments"/);
  assert.match(app, /planModule === "widget"/);
  assert.match(app, /<PersonalModuleMenu/);
  assert.match(app, /<ModuleContextBar/);
  assert.match(app, /mainModuleForDestination/);
  assert.doesNotMatch(app, /className="course-tabs"/);
  assert.match(css, /\.module-context-bar/);
  assert.match(css, /\.module-menu-dialog/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});
