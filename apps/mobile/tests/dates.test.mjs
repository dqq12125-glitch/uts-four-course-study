import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultSemesterDates,
  focusSecondsRemaining,
  formatClock,
} from "../src/lib/dates.ts";

test("focus timer is derived from absolute time after app backgrounding", () => {
  const startedAt = "2026-07-30T00:00:00.000Z";
  assert.equal(
    focusSecondsRemaining(
      { startedAt, plannedMinutes: 25 },
      Date.parse("2026-07-30T00:10:15.000Z"),
    ),
    885,
  );
  assert.equal(
    focusSecondsRemaining(
      { startedAt, plannedMinutes: 25 },
      Date.parse("2026-07-30T00:30:00.000Z"),
    ),
    0,
  );
  assert.equal(formatClock(885), "14:45");
});

test("default open-course semester spans eighteen weeks", () => {
  assert.deepEqual(
    defaultSemesterDates(new Date("2026-07-30T10:00:00.000Z")),
    {
      startDate: "2026-07-30",
      endDate: "2026-12-03",
    },
  );
});
