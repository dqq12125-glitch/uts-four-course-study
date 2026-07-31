# Timetable Import

DeepStudy imports student-owned timetable data without storing Canvas, Moodle,
or institution passwords.

## Supported input

- ICS calendar files;
- timetable screenshots in JPEG, PNG, or WebP;
- selectable-text PDF files;
- plain-text or Markdown files;
- timetable text pasted directly into the web or native app;
- manual class-session entry as a fallback.

All extracted items remain proposals until the student explicitly selects and
confirms them.

## ICS behaviour

The local parser supports:

- folded ICS lines and escaped values;
- UTC, floating local time, and valid `TZID` values;
- all-day assessment/deadline events;
- `DTEND` and ISO-8601 `DURATION`;
- weekly recurrence rules, `INTERVAL`, `BYDAY`, and `UNTIL`;
- one event that meets on multiple weekdays;
- start/end date ranges;
- locations and safe HTTP(S) map URLs;
- cancelled-event exclusion;
- stable `UID`-based re-imports.

Re-importing an event with the same ICS `UID` updates the existing owned class
session or assessment. Events without a stable UID use a natural duplicate
check based on the owned course, title, weekday, and time or due date.

## Pasted-text examples

```text
Monday 09:00–11:00 Lecture | Building 11, Room 201
Wednesday 14:00–16:00 Lab | CB10.02.330
周四 09:00–11:00 讲座 | 教室 CB11.04.100
周五 14:00–16:00 实验课 | 隔周
```

English weekday names/abbreviations, Chinese weekday names, 12/24-hour time
ranges, weekly classes, and explicit fortnightly/biweekly labels are
recognised locally.

## Screenshot and PDF extraction

Text PDF files receive local text extraction first. Images and scanned PDFs
need a configured extraction-capable AI provider for reliable OCR and
structure recognition. Provider output is schema-validated and merged with
local extraction; it cannot change permissions or bypass confirmation.

## Safety and ownership

- storage is private and user namespaced;
- the selected course must belong to the current user;
- confirmation and re-import queries always include `user_id`;
- the source file never creates data before confirmation;
- duplicate checks cannot see or modify another user's records;
- deleting a source file does not silently delete previously confirmed
  timetable entries.

## Limits

- maximum file size: 10 MB;
- maximum proposed timetable entries per resource: 40;
- maximum inspected ICS events: 500;
- maximum pasted text: 200,000 characters.

Large multi-course calendars should be split and imported into the correct
course separately.
