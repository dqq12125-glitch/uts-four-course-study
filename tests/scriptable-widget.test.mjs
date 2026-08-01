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
  assert.match(app, /<IOSTimetableWidget/);
  assert.match(app, /selectedChoiceForGroup\("math-tutorial"\)/);
  assert.match(css, /\.ios-widget-preview/);
  assert.match(css, /\.ios-widget-actions/);
});
