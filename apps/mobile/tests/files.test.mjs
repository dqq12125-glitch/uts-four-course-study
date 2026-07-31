import assert from "node:assert/strict";
import test from "node:test";
import { supportedMimeType } from "../src/lib/files.ts";

test("mobile uploads infer only server-supported MIME types", () => {
  assert.equal(supportedMimeType("schedule.ics", null), "text/calendar");
  assert.equal(
    supportedMimeType("lecture.PDF", "application/octet-stream"),
    "application/pdf",
  );
  assert.equal(supportedMimeType("photo.jpg", "image/jpeg"), "image/jpeg");
  assert.equal(supportedMimeType("screenshot.webp", null), "image/webp");
  assert.equal(supportedMimeType("timetable.md", null), "text/plain");
  assert.equal(supportedMimeType("archive.zip", null), null);
});
