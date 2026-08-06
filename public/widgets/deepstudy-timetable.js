// DeepStudy 课表 · Scriptable iOS Home Screen widget
// Verified against UTS Allocate+ on 6 August 2026: 9 allocated, 0 pending.
// No API key is required. The timetable is stored locally in this script.

const APP_URL = "https://uts-deep-study.dqq12125-study.workers.dev";
const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 14;

const palette = {
  backgroundTop: new Color("#202024"),
  backgroundBottom: new Color("#171719"),
  primary: new Color("#F5F5F7"),
  secondary: new Color("#929299"),
  track: new Color("#3A3A3E"),
  orange: new Color("#FF9F0A"),
  green: new Color("#30D158"),
};

const courses = {
  math: { code: "33130", name: "数学 1", color: new Color("#5B8CFF") },
  eee: { code: "48510", name: "电气与电子", color: new Color("#FF735C") },
  c: { code: "48430", name: "C 编程", color: new Color("#39C98B") },
  physics: { code: "68037", name: "物理", color: new Color("#59B7F1") },
};

// Verified against the Canvas agenda on 2 August 2026. Only dated submission
// deadlines are included here; in-class tests remain in the study plan.
const assessments = [
  { id: "math-s1", course: "math", title: "Skills Test 1 · 在线", due: "2026-08-02T23:59:00+10:00", weight: "10%", url: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-q1", course: "c", title: "Quiz 01 · 两部分", due: "2026-08-16T23:59:00+10:00", weight: "Quiz 组内", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-q2", course: "c", title: "Quiz 02 · 两部分", due: "2026-08-23T23:59:00+10:00", weight: "Quiz 组内", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-q3", course: "c", title: "Quiz 03 · 两部分", due: "2026-08-30T23:59:00+10:00", weight: "Quiz 组内", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-q4", course: "c", title: "Quiz 04 · 两部分", due: "2026-09-06T23:59:00+10:00", weight: "Quiz 组内", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-q5", course: "c", title: "Quiz 05 · 两部分", due: "2026-09-13T23:59:00+10:00", weight: "Quiz 组内", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-a2", course: "c", title: "Assessment 2 · 编程作业", due: "2026-09-20T23:59:00+10:00", weight: "20%", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-check", course: "c", title: "小组项目 · Checkpoint 1", due: "2026-10-04T23:59:00+11:00", weight: "里程碑", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "math-s6", course: "math", title: "Skills Test 6 · 在线", due: "2026-10-30T23:59:00+11:00", weight: "10%", url: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-group", course: "c", title: "Assessment 3 · 小组项目", due: "2026-11-01T23:59:00+11:00", weight: "30%", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-sparkplus", course: "c", title: "Assessment 3 · SparkPlus", due: "2026-11-08T23:59:00+11:00", weight: "小组互评", url: "https://canvas.uts.edu.au/courses/41072/assignments" },
];

const timetable = [
  { id: "physics-prc", course: "physics", activity: "实践课 Prc1", day: 1, start: "17:00", end: "20:00", room: "CB04.03.551", startsWeek: 1 },
  { id: "eee-tut", course: "eee", activity: "辅导课 Tut1 02", day: 2, start: "08:30", end: "10:30", room: "CB10.02.470", startsWeek: 1 },
  { id: "physics-lec", course: "physics", activity: "讲座 Lec1", day: 2, start: "17:00", end: "18:00", room: "CB06.03.028", startsWeek: 1 },
  {
    id: "math-tut",
    course: "math",
    activity: "辅导课 Tut1 09",
    day: 2,
    start: "13:00",
    end: "15:00",
    room: "CB10.03.460",
    startsWeek: 2,
  },
  { id: "c-online", course: "c", activity: "在线课 Olr1", day: 3, start: "15:00", end: "17:00", room: "ONLINE060", startsWeek: 1 },
  { id: "math-workshop", course: "math", activity: "工作坊 Wrk1", day: 3, start: "17:00", end: "19:00", room: "ONLINE058", startsWeek: 1 },
  { id: "c-lab", course: "c", activity: "机房课 Cmp1 03", day: 5, start: "10:00", end: "12:00", room: "CB11.B1.100", startsWeek: 2 },
  { id: "eee-lab", course: "eee", activity: "实验课 Lab1 01", day: 5, start: "15:00", end: "18:00", room: "CB11.11.402", startsWeek: 1 },
  { id: "eee-recorded", course: "eee", activity: "预录讲座 Rec1", day: 0, start: "06:00", end: "07:00", room: "Canvas 预录", startsWeek: 1 },
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function teachingWeek(date) {
  const day = startOfDay(date);
  const semesterStart = new Date(2026, 6, 27);
  const breakStart = new Date(2026, 8, 21);
  const weekNineStart = new Date(2026, 8, 28);
  const semesterEnd = new Date(2026, 9, 25, 23, 59, 59);

  if (day < semesterStart || day > semesterEnd) return null;
  if (day >= breakStart && day < weekNineStart) return null;
  if (day < breakStart) return Math.floor((day.getTime() - semesterStart.getTime()) / (7 * DAY_MS)) + 1;
  return Math.floor((day.getTime() - weekNineStart.getTime()) / (7 * DAY_MS)) + 9;
}

function eventOnDate(item, date) {
  const startParts = item.start.split(":").map(Number);
  const endParts = item.end.split(":").map(Number);
  return {
    item: item,
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), startParts[0], startParts[1]),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endParts[0], endParts[1]),
  };
}

function collectEvents(now, daysAhead) {
  const events = [];
  const today = startOfDay(now);
  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = new Date(today.getTime() + offset * DAY_MS);
    const week = teachingWeek(date);
    if (!week) continue;
    for (const item of timetable) {
      if (item.day !== date.getDay() || week < item.startsWeek) continue;
      const event = eventOnDate(item, date);
      if (event.end.getTime() >= now.getTime()) events.push(event);
    }
  }
  return events.sort(function (a, b) { return a.start.getTime() - b.start.getTime(); });
}

function calendarDayDistance(date, now) {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function collectDueAssessments(now, daysAhead) {
  return assessments
    .map(function (item) { return { item: item, due: new Date(item.due) }; })
    .filter(function (entry) {
      const days = calendarDayDistance(entry.due, now);
      return entry.due.getTime() >= now.getTime() && days >= 0 && days <= daysAhead;
    })
    .sort(function (a, b) { return a.due.getTime() - b.due.getTime(); });
}

function currentWeekEvents(now) {
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const monday = startOfDay(new Date(now.getTime() - (weekday - 1) * DAY_MS));
  const events = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(monday.getTime() + offset * DAY_MS);
    const week = teachingWeek(date);
    if (!week) continue;
    for (const item of timetable) {
      if (item.day === date.getDay() && week >= item.startsWeek) events.push(eventOnDate(item, date));
    }
  }
  return events;
}

function relation(date, now) {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function formatTime(date) {
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function addDot(parent, color, size) {
  const dot = parent.addStack();
  dot.size = new Size(size, size);
  dot.backgroundColor = color;
  dot.cornerRadius = size / 2;
  return dot;
}

function addProgress(parent, value, width, height, fillColor) {
  const track = parent.addStack();
  track.layoutHorizontally();
  track.size = new Size(width, height);
  track.backgroundColor = palette.track;
  track.cornerRadius = height / 2;

  const fill = track.addStack();
  fill.size = new Size(Math.max(height, width * Math.max(0, Math.min(1, value))), height);
  fill.backgroundColor = fillColor;
  fill.cornerRadius = height / 2;
  track.addSpacer();
  return track;
}

function addHeader(widget, now) {
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  addDot(header, palette.orange, 7);
  header.addSpacer(8);
  const title = header.addText("课表");
  title.font = Font.semiboldSystemFont(16);
  title.textColor = palette.primary;
  header.addSpacer();
  const status = header.addText("已更新 · " + formatTime(now));
  status.font = Font.mediumSystemFont(9);
  status.textColor = palette.secondary;
}

function weekdayName(date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function addTodaySummary(widget, now, nextEvent, compact) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.backgroundColor = new Color("#2A2A2E");
  row.cornerRadius = 10;
  row.setPadding(compact ? 8 : 9, compact ? 9 : 11, compact ? 8 : 9, compact ? 9 : 11);

  const today = row.addStack();
  today.layoutVertically();
  const todayLabel = today.addText("今天");
  todayLabel.font = Font.mediumSystemFont(compact ? 7 : 8);
  todayLabel.textColor = palette.secondary;
  today.addSpacer(2);
  const todayValue = today.addText(weekdayName(now));
  todayValue.font = Font.semiboldSystemFont(compact ? 10 : 11);
  todayValue.textColor = palette.primary;

  row.addSpacer();

  const next = row.addStack();
  next.layoutVertically();
  const nextLabel = next.addText("下一节");
  nextLabel.font = Font.mediumSystemFont(compact ? 7 : 8);
  nextLabel.textColor = palette.secondary;
  nextLabel.rightAlignText();
  next.addSpacer(2);
  const nextValue = next.addText(nextEvent ? relation(nextEvent.start, now) + " " + formatTime(nextEvent.start) : "暂无固定课程");
  nextValue.font = Font.semiboldSystemFont(compact ? 9 : 10);
  nextValue.textColor = palette.primary;
  nextValue.lineLimit = 1;
  nextValue.rightAlignText();
}

function addSectionHeading(widget) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const title = row.addText("接下来");
  title.font = Font.semiboldSystemFont(13);
  title.textColor = palette.primary;
  row.addSpacer();
  const meta = row.addText("未来 7 天");
  meta.font = Font.mediumSystemFont(9);
  meta.textColor = palette.secondary;
}

function dueRelation(due, now) {
  const days = calendarDayDistance(due, now);
  if (days === 0) return "今天截止";
  if (days === 1) return "明天截止";
  return days + " 天后";
}

function addDueHeading(widget, count) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const title = row.addText("即将截止");
  title.font = Font.semiboldSystemFont(11);
  title.textColor = palette.primary;
  row.addSpacer();
  const meta = row.addText("14 天内 · " + count + " 项");
  meta.font = Font.mediumSystemFont(8);
  meta.textColor = palette.secondary;
}

function addDueRow(widget, entry, now, compact) {
  const meta = courses[entry.item.course];
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.backgroundColor = new Color("#352A22");
  row.cornerRadius = 10;
  row.setPadding(compact ? 8 : 9, compact ? 9 : 11, compact ? 8 : 9, compact ? 9 : 11);
  row.url = entry.item.url;

  addDot(row, palette.orange, 7);
  row.addSpacer(8);
  const copy = row.addStack();
  copy.layoutVertically();
  const title = copy.addText(meta.code + " · " + entry.item.title);
  title.font = Font.semiboldSystemFont(compact ? 9 : 10);
  title.textColor = palette.primary;
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.75;
  copy.addSpacer(2);
  const detail = copy.addText("Assessment · " + entry.item.weight);
  detail.font = Font.systemFont(compact ? 7 : 8);
  detail.textColor = palette.secondary;

  // A flexible spacer makes the highlighted deadline card use the full native
  // widget width while keeping its deadline and Canvas action right-aligned.
  row.addSpacer();
  const when = row.addStack();
  when.layoutVertically();
  const relationText = when.addText(dueRelation(entry.due, now));
  relationText.font = Font.mediumSystemFont(compact ? 7 : 8);
  relationText.textColor = palette.orange;
  relationText.rightAlignText();
  when.addSpacer(2);
  const time = when.addText(formatTime(entry.due));
  time.font = Font.semiboldMonospacedSystemFont(compact ? 9 : 10);
  time.textColor = palette.primary;
  time.rightAlignText();
  when.addSpacer(4);
  const openButton = when.addStack();
  openButton.backgroundColor = palette.orange;
  openButton.cornerRadius = 5;
  openButton.setPadding(3, 5, 3, 5);
  const openLabel = openButton.addText("Canvas ↗");
  openLabel.font = Font.semiboldSystemFont(compact ? 6 : 7);
  openLabel.textColor = new Color("#1C1408");
}

function addEventRow(widget, event, now, compact) {
  const meta = courses[event.item.course];
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  addDot(row, meta.color, 7);
  row.addSpacer(9);

  const copy = row.addStack();
  copy.layoutVertically();
  const title = copy.addText(meta.code + " · " + meta.name);
  title.font = Font.mediumSystemFont(compact ? 11 : 12);
  title.textColor = palette.primary;
  title.lineLimit = 1;
  copy.addSpacer(2);
  const detail = copy.addText(event.item.activity + " · " + event.item.room);
  detail.font = Font.systemFont(compact ? 8 : 9);
  detail.textColor = palette.secondary;
  detail.lineLimit = 1;
  detail.minimumScaleFactor = 0.75;

  row.addSpacer(8);
  const when = row.addStack();
  when.layoutVertically();
  const day = when.addText(relation(event.start, now));
  day.font = Font.mediumSystemFont(8);
  day.textColor = palette.secondary;
  day.rightAlignText();
  when.addSpacer(2);
  const time = when.addText(formatTime(event.start));
  time.font = Font.semiboldMonospacedSystemFont(compact ? 10 : 11);
  time.textColor = palette.primary;
  time.rightAlignText();
}

function addEmptyState(widget) {
  const state = widget.addStack();
  state.layoutVertically();
  state.backgroundColor = new Color("#2A2A2E");
  state.cornerRadius = 12;
  state.setPadding(12, 12, 12, 12);
  const title = state.addText("未来 7 天没有固定课程");
  title.font = Font.semiboldSystemFont(12);
  title.textColor = palette.primary;
  state.addSpacer(4);
  const detail = state.addText("休息周或学期外 · 点击打开学习计划");
  detail.font = Font.systemFont(9);
  detail.textColor = palette.secondary;
}

function addFooter(widget, now, futureCount, shownCount, width) {
  const weekEvents = currentWeekEvents(now);
  const completed = weekEvents.filter(function (event) { return event.end.getTime() < now.getTime(); }).length;
  const completion = weekEvents.length ? completed / weekEvents.length : 0;

  const completionMeta = widget.addStack();
  completionMeta.layoutHorizontally();
  const completionLabel = completionMeta.addText("本周课程");
  completionLabel.font = Font.systemFont(8);
  completionLabel.textColor = palette.secondary;
  completionMeta.addSpacer();
  const completionValue = completionMeta.addText("已完成 " + completed + "/" + weekEvents.length);
  completionValue.font = Font.mediumSystemFont(8);
  completionValue.textColor = palette.secondary;
  widget.addSpacer(4);
  addProgress(widget, completion, width, 4, palette.green);
  widget.addSpacer();

  const footer = widget.addStack();
  footer.layoutHorizontally();
  const left = footer.addText(futureCount > shownCount ? "另有 " + (futureCount - shownCount) + " 节课" : "点击打开个人版");
  left.font = Font.systemFont(8);
  left.textColor = palette.secondary;
  footer.addSpacer();
  const updated = footer.addText(formatTime(now) + " 更新");
  updated.font = Font.systemFont(8);
  updated.textColor = palette.secondary;
}

function buildWidget() {
  const now = new Date();
  const family = config.widgetFamily || "large";
  const isSmall = family === "small";
  const isMedium = family === "medium";
  const isLarge = !isSmall && !isMedium;
  const events = collectEvents(now, 7);
  const dueSoon = collectDueAssessments(now, DUE_SOON_DAYS);
  const hasDueSoon = dueSoon.length > 0;
  // A deadline card occupies roughly the height of two timetable rows. Keep the
  // large family to three rows in that state so the completion/footer area
  // remains visible on every iPhone large-widget size.
  const maxRows = isSmall ? (hasDueSoon ? 0 : 1) : isMedium ? (hasDueSoon ? 1 : 2) : (hasDueSoon ? 3 : 5);
  const shown = events.slice(0, maxRows);
  const footerWidth = isSmall ? 120 : isMedium ? 285 : 300;

  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [palette.backgroundTop, palette.backgroundBottom];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(isSmall ? 14 : 17, isSmall ? 14 : 18, isSmall ? 12 : 14, isSmall ? 14 : 18);
  widget.url = APP_URL;
  widget.refreshAfterDate = new Date(now.getTime() + 30 * 60 * 1000);

  addHeader(widget, now);
  if (isLarge || isSmall) {
    widget.addSpacer(isSmall ? 8 : 12);
    addTodaySummary(widget, now, events[0], isSmall);
  }

  if (hasDueSoon) {
    widget.addSpacer(isSmall ? 8 : 10);
    if (!isSmall) {
      addDueHeading(widget, dueSoon.length);
      widget.addSpacer(6);
    }
    addDueRow(widget, dueSoon[0], now, isSmall || isMedium);
  }

  if (shown.length > 0) {
    widget.addSpacer(isSmall ? 8 : 10);
    if (!isSmall) {
      addSectionHeading(widget);
      widget.addSpacer(isMedium ? 6 : 8);
    }
  }

  if (shown.length === 0 && !hasDueSoon) {
    addEmptyState(widget);
  } else {
    shown.forEach(function (event, index) {
      addEventRow(widget, event, now, isSmall || isMedium);
      if (index < shown.length - 1) widget.addSpacer(isLarge ? 10 : 7);
    });
  }

  if (isLarge) {
    widget.addSpacer(10);
    addFooter(widget, now, events.length, shown.length, footerWidth);
  }
  return widget;
}

const widget = buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentLarge();
}
Script.complete();
