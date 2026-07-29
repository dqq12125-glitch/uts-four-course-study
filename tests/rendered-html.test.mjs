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

test("server-renders the four-course learning app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>四课随身学 · Four-Course Study<\/title>/i);
  assert.match(html, /UTS Spring 2026/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("includes the bilingual Socratic mastery workflow and server-side AI tutor", async () => {
  const [page, css, layout, tutorRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /苏格拉底深度导师/);
  assert.match(page, /Socratic Deep Tutor/);
  assert.match(page, /tutorPrompts/);
  assert.match(page, /submitTutorAnswer/);
  assert.match(page, /tutorCorrectStreak|tutorStreak/);
  assert.match(css, /\.tutor-card/);
  assert.match(css, /repeat\(5,\s*1fr\)/);
  assert.match(layout, /四课随身学/);
  assert.match(page, /DeepSeek AI 导师/);
  assert.match(page, /48510/);
  assert.match(page, /Introduction to Electrical and Electronic Engineering/);
  assert.match(page, /Deep Learning Mode · 290/);
  assert.doesNotMatch(page, /48230|Introduction to Engineering Projects/);
  assert.match(tutorRoute, /deepseek-v4-pro/);
  assert.match(tutorRoute, /formal definition/);
  assert.doesNotMatch(tutorRoute, /sk-[A-Za-z0-9]/);
});
