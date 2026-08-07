import assert from "node:assert/strict";
import test from "node:test";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { ResourceRepository } from "../src/repositories/resource-repository.ts";
import { parseIcs } from "../src/services/resources/ics-parser.ts";
import { extractTimetableText } from "../src/services/resources/timetable-text-parser.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

const NOW = "2026-08-01T00:00:00.000Z";

async function academicFixture() {
  const db = createMigratedDatabase();
  const userId = "timetable_user";
  seedVerifiedUser(db, {
    id: userId,
    email: "timetable@example.com",
  });
  const learning = new LearningRepository(db);
  const onboarding = await new OnboardingService(learning).complete(
    userId,
    {
      displayName: "Timetable Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Open University",
        name: "Spring 2026",
        startDate: "2026-07-20",
        endDate: "2026-11-30",
      },
      course: {
        templateId: null,
        courseCode: "OPEN101",
        courseName: "Open Timetable Studies",
        colourKey: "ocean",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    },
    new Date(NOW),
  );
  return {
    db,
    userId,
    courseId: onboarding.courseId,
    repository: new ResourceRepository(db),
  };
}

async function claimResource(context, resourceId) {
  assert.equal(
    await context.repository.create({
      id: resourceId,
      extractionId: `extraction_${resourceId}`,
      userId: context.userId,
      courseId: context.courseId,
      fileName: `${resourceId}.ics`,
      storageKey: `users/${context.userId}/${resourceId}/${resourceId}.ics`,
      mimeType: "text/calendar",
      fileSize: 100,
      resourceType: "timetable",
      retentionUntil: "2027-08-01T00:00:00.000Z",
      now: NOW,
    }),
    true,
  );
  assert.equal(
    await context.repository.markProcessing(
      context.userId,
      resourceId,
      NOW,
    ),
    true,
  );
  await context.repository.completeExtraction({
    userId: context.userId,
    resourceId,
    extractedText: null,
    proposedDataJson: "{}",
    now: NOW,
  });
  assert.equal(
    await context.repository.claimConfirmation(
      context.userId,
      resourceId,
      NOW,
    ),
    true,
  );
}

test("ICS timetable parsing keeps timezone, recurrence range, multi-day rules, and deadlines", () => {
  const parsed = parseIcs(
    `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:class-open-101
SUMMARY:OPEN101 Lecture
DTSTART;TZID=Australia/Sydney:20260803T090000
DTEND;TZID=Australia/Sydney:20260803T110000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261130T125959Z
LOCATION:Building 11, Room 201
URL:https://maps.example.edu/room-201
END:VEVENT
BEGIN:VEVENT
UID:assessment-open-101
SUMMARY:Assignment 1 due
DTSTART;VALUE=DATE:20260820
DESCRIPTION:Submit through the institution portal.
END:VEVENT
BEGIN:VEVENT
UID:cancelled-class
SUMMARY:Cancelled tutorial
STATUS:CANCELLED
DTSTART;TZID=Australia/Sydney:20260804T120000
DTEND;TZID=Australia/Sydney:20260804T130000
END:VEVENT
BEGIN:VEVENT
UID:overnight-class
SUMMARY:Overnight practical
DTSTART;TZID=Australia/Sydney:20260807T230000
DTEND;TZID=Australia/Sydney:20260808T010000
END:VEVENT
END:VCALENDAR`,
    "Australia/Sydney",
  );

  assert.equal(parsed.classSessions.length, 2);
  assert.deepEqual(
    parsed.classSessions.map((session) => session.dayOfWeek),
    [1, 3],
  );
  assert.equal(parsed.classSessions[0].startTime, "09:00");
  assert.equal(parsed.classSessions[0].endTime, "11:00");
  assert.equal(parsed.classSessions[0].startDate, "2026-08-03");
  assert.equal(parsed.classSessions[0].endDate, "2026-11-30");
  assert.equal(
    parsed.classSessions[0].recurrenceRule,
    "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261130T125959Z",
  );
  assert.match(parsed.classSessions[0].sourceUid, /class-open-101#MO/);
  assert.equal(parsed.assessments.length, 1);
  assert.equal(parsed.assessments[0].dueLocal, "2026-08-20T23:59");
  assert.equal(parsed.assessments[0].sourceUid, "assessment-open-101");
  assert.match(parsed.warnings.join(" "), /crosses midnight/i);
});

test("pasted English and Chinese timetable text becomes weekly or fortnightly proposals", () => {
  const parsed = extractTimetableText(
    `Monday 09:00–11:00 Lecture | Building 11, Room 201
周三 14:00-16:00 实验课 | 教室 CB10.02.330 | 隔周
Friday 10am to 12pm Tutorial | Online`,
  );
  assert.equal(parsed.classSessions.length, 3);
  assert.deepEqual(
    parsed.classSessions.map((session) => session.dayOfWeek),
    [1, 3, 5],
  );
  assert.equal(
    parsed.classSessions[1].recurrenceRule,
    "RRULE:FREQ=WEEKLY;INTERVAL=2",
  );
  assert.equal(parsed.classSessions[2].startTime, "10:00");
  assert.equal(parsed.classSessions[2].endTime, "12:00");
  assert.equal(parsed.classSessions[2].location, "Online");
});

test("confirmed timetable imports update stable ICS events and skip natural duplicates", async () => {
  const context = await academicFixture();
  await claimResource(context, "resource_first");
  const first = await context.repository.applyConfirmation({
    userId: context.userId,
    resourceId: "resource_first",
    courseId: context.courseId,
    assessments: [],
    classSessions: [
      {
        id: "class_first",
        sessionType: "lecture",
        title: "OPEN101 Lecture",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "11:00",
        location: "Room 1",
        mapUrl: null,
        startDate: "2026-08-03",
        endDate: "2026-11-30",
        recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=MO",
        sourceUid: "calendar-event-open101",
      },
    ],
    topics: [],
    now: NOW,
  });
  assert.equal(first.classSessionCount, 1);

  await claimResource(context, "resource_updated");
  const updated = await context.repository.applyConfirmation({
    userId: context.userId,
    resourceId: "resource_updated",
    courseId: context.courseId,
    assessments: [],
    classSessions: [
      {
        id: "class_updated",
        sessionType: "lecture",
        title: "OPEN101 Lecture",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "12:00",
        location: "Room 2",
        mapUrl: null,
        startDate: "2026-08-03",
        endDate: "2026-11-30",
        recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=MO",
        sourceUid: "calendar-event-open101",
      },
    ],
    topics: [],
    now: "2026-08-02T00:00:00.000Z",
  });
  assert.equal(updated.classSessionCount, 1);
  assert.deepEqual(
    context.db.database
      .prepare(
        `SELECT start_time AS startTime, end_time AS endTime, location
         FROM class_sessions WHERE user_id = ? AND course_id = ?`,
      )
      .all(context.userId, context.courseId)
      .map((row) => ({ ...row })),
    [{ startTime: "10:00", endTime: "12:00", location: "Room 2" }],
  );

  await claimResource(context, "resource_duplicate");
  const duplicate = await context.repository.applyConfirmation({
    userId: context.userId,
    resourceId: "resource_duplicate",
    courseId: context.courseId,
    assessments: [],
    classSessions: [
      {
        id: "class_duplicate",
        sessionType: "lecture",
        title: "OPEN101 Lecture",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "12:00",
        location: "Room 2",
        sourceUid: null,
      },
    ],
    topics: [],
    now: "2026-08-03T00:00:00.000Z",
  });
  assert.equal(duplicate.classSessionCount, 0);
  assert.equal(duplicate.skippedDuplicateCount, 1);
  assert.equal(
    context.db.database
      .prepare(
        `SELECT count(*) AS count FROM class_sessions
         WHERE user_id = ? AND course_id = ?`,
      )
      .get(context.userId, context.courseId).count,
    1,
  );

  const secondUserId = "timetable_other_user";
  seedVerifiedUser(context.db, {
    id: secondUserId,
    email: "timetable-other@example.com",
  });
  const secondOnboarding = await new OnboardingService(
    new LearningRepository(context.db),
  ).complete(
    secondUserId,
    {
      displayName: "Other Timetable Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Another University",
        name: "Spring 2026",
        startDate: "2026-07-20",
        endDate: "2026-11-30",
      },
      course: {
        templateId: null,
        courseCode: "OTHER101",
        courseName: "Another Course",
        colourKey: "forest",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    },
    new Date(NOW),
  );
  const secondContext = {
    db: context.db,
    userId: secondUserId,
    courseId: secondOnboarding.courseId,
    repository: new ResourceRepository(context.db),
  };
  await claimResource(secondContext, "resource_other_user");
  const isolated = await secondContext.repository.applyConfirmation({
    userId: secondUserId,
    resourceId: "resource_other_user",
    courseId: secondOnboarding.courseId,
    assessments: [],
    classSessions: [
      {
        id: "class_other_user",
        sessionType: "lecture",
        title: "Another lecture",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "12:00",
        location: "Other room",
        sourceUid: "calendar-event-open101",
      },
    ],
    topics: [],
    now: "2026-08-03T01:00:00.000Z",
  });
  assert.equal(isolated.classSessionCount, 1);
  assert.equal(
    context.db.database
      .prepare(
        `SELECT count(*) AS count FROM class_sessions WHERE user_id = ?`,
      )
      .get(secondUserId).count,
    1,
  );
  context.db.close();
});
