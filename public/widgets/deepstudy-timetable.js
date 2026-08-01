// DeepStudy 课表 · Scriptable iOS Home Screen widget
// Widget Parameter: 18 (official), 11 (waitlist preview), or 13 (waitlist preview)
// No API key is required. The timetable is stored locally in this script.

const APP_URL = "https://uts-deep-study.dqq12125-study.workers.dev";
const DAY_MS = 24 * 60 * 60 * 1000;
const parameter = String(args.widgetParameter || "18").trim();
const mathSlot = parameter.indexOf("11") >= 0 ? "11" : parameter.indexOf("13") >= 0 ? "13" : "18";

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

const timetable = [
  { id: "physics-prc", course: "physics", activity: "实践课 Prc1", day: 1, start: "17:00", end: "20:00", room: "CB04.03.551", startsWeek: 1 },
  { id: "eee-tut", course: "eee", activity: "辅导课 Tut1 02", day: 2, start: "08:30", end: "10:30", room: "CB10.02.470", startsWeek: 1 },
  { id: "physics-lec", course: "physics", activity: "讲座 Lec1", day: 2, start: "17:00", end: "18:00", room: "CB06.03.028", startsWeek: 1 },
  {
    id: "math-tut",
    course: "math",
    activity: mathSlot === "11" ? "辅导课 Tut1 14" : mathSlot === "13" ? "辅导课 Tut1 09" : "辅导课 Tut1 18",
    day: 2,
    start: mathSlot === "11" ? "11:00" : mathSlot === "13" ? "13:00" : "18:00",
    end: mathSlot === "11" ? "13:00" : mathSlot === "13" ? "15:00" : "20:00",
    room: "CB10.03.460",
    startsWeek: 2,
  },
  { id: "c-online", course: "c", activity: "在线课 Olr1", day: 3, start: "15:00", end: "17:00", room: "ONLINE060", startsWeek: 1 },
  { id: "math-workshop", course: "math", activity: "工作坊 Wrk1", day: 3, start: "17:00", end: "19:00", room: "ONLINE058", startsWeek: 1 },
  { id: "c-lab", course: "c", activity: "机房课 Cmp1", day: 5, start: "08:00", end: "10:00", room: "CB11.B1.100", startsWeek: 2 },
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

function weekElapsed(now) {
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const elapsed = day - 1 + (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  return Math.max(0, Math.min(1, elapsed / 7));
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
  const title = header.addText("本周课表");
  title.font = Font.semiboldSystemFont(16);
  title.textColor = palette.primary;
  header.addSpacer();
  const status = header.addText("离线 · " + formatTime(now));
  status.font = Font.mediumSystemFont(9);
  status.textColor = palette.secondary;
}

function addWeekProgress(widget, now, width) {
  const percent = weekElapsed(now);
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const label = row.addText("7 天");
  label.font = Font.mediumSystemFont(11);
  label.textColor = palette.secondary;
  row.addSpacer(12);
  addProgress(row, percent, width, 5, palette.orange);
  row.addSpacer(12);
  const value = row.addText(Math.round(percent * 100) + "%");
  value.font = Font.semiboldSystemFont(14);
  value.textColor = palette.orange;
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
  const maxRows = isSmall ? 2 : isMedium ? 3 : 5;
  const shown = events.slice(0, maxRows);
  const progressWidth = isSmall ? 46 : isMedium ? 160 : 190;
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
  widget.addSpacer(isSmall ? 10 : 14);
  addWeekProgress(widget, now, progressWidth);
  widget.addSpacer(isSmall ? 10 : 15);
  addSectionHeading(widget);
  widget.addSpacer(isSmall ? 8 : 10);

  if (shown.length === 0) {
    addEmptyState(widget);
  } else {
    shown.forEach(function (event, index) {
      addEventRow(widget, event, now, isSmall || isMedium);
      if (index < shown.length - 1) widget.addSpacer(isLarge ? 10 : 7);
    });
  }

  widget.addSpacer(isLarge ? 12 : 8);
  addFooter(widget, now, events.length, shown.length, footerWidth);
  return widget;
}

const widget = buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentLarge();
}
Script.complete();
