import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the iOS timetable widget is a real Scriptable widget with the current timetable", async () => {
  const source = await readFile(new URL("public/widgets/deepstudy-timetable.js", root), "utf8");

  assert.match(source, /new ListWidget\(\)/);
  assert.match(source, /Script\.setWidget\(widget\)/);
  assert.match(source, /config\.widgetFamily/);
  assert.match(source, /args\.widgetParameter/);
  assert.match(source, /mathSlot === "11"/);
  assert.match(source, /mathSlot === "13"/);
  assert.match(source, /CB04\.03\.551/);
  assert.match(source, /CB10\.02\.470/);
  assert.match(source, /ONLINE060/);
  assert.match(source, /CB11\.11\.402/);
  assert.match(source, /2026, 8, 21/);
  assert.match(source, /uts-deep-study\.dqq12125-study\.workers\.dev/);
  assert.match(source, /addTodaySummary/);
  assert.match(source, /下一节/);
  assert.match(source, /本周课程/);
  assert.match(source, /collectDueAssessments/);
  assert.match(source, /Skills Test 1/);
  assert.match(source, /2026-08-02T23:59:00\+10:00/);
  assert.match(source, /即将截止/);
  assert.match(source, /DUE_SOON_DAYS = 14/);
  assert.match(source, /Canvas ↗/);
  assert.match(source, /row\.url = entry\.item\.url/);
  assert.match(source, /hasDueSoon \? 3 : 5/);
  assert.doesNotMatch(source, /addWeekProgress|weekElapsed|"7 天"/);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{12,}/);
});

test("the personal app includes a visible iPhone widget preview and installation flow", async () => {
  const component = await readFile(new URL("app/personal/ios-timetable-widget.tsx", root), "utf8");
  const app = await readFile(new URL("app/personal/four-course-app.tsx", root), "utf8");
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(component, /data-testid="ios-timetable-widget-preview"/);
  assert.match(component, /widgets\/deepstudy-timetable\.js/);
  assert.match(component, /open\.scriptable\.app\/add/);
  assert.match(component, /id1405459188/);
  assert.match(component, /Widget Parameter/);
  assert.match(component, /ios-widget-today-row/);
  assert.match(component, /secondWidgetStep/);
  assert.match(component, /ios-widget-due-row/);
  assert.match(component, /ios-widget-canvas-button/);
  assert.match(component, /assessmentsDueSoon/);
  assert.match(component, /item\.submissionDue/);
  assert.match(app, /assessments=\{assessments\}/);
  assert.match(app, /dueDay\.getTime\(\) - today\.getTime\(\)/);
  assert.doesNotMatch(component, /weekElapsed|ios-widget-progress-row/);
  assert.match(app, /<IOSTimetableWidget/);
  assert.match(app, /selectedChoiceForGroup\("math-tutorial"\)/);
  assert.match(css, /\.ios-widget-preview/);
  assert.match(css, /\.ios-widget-actions/);
});
