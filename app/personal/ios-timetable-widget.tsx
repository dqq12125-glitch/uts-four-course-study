"use client";

import { useMemo, useState } from "react";
import type { Assessment, TimetableItem } from "@/app/semester-data";

type Lang = "zh" | "en";

type WidgetEvent = {
  item: TimetableItem;
  start: Date;
  end: Date;
};

type Props = {
  lang: Lang;
  now: Date;
  timetable: TimetableItem[];
  assessments: Assessment[];
  selectedMathChoiceId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 14;
const SCRIPT_URL = "/widgets/deepstudy-timetable.js";

const courseMeta: Record<
  TimetableItem["courseId"],
  { code: string; zh: string; en: string; color: string }
> = {
  math: { code: "33130", zh: "数学 1", en: "Mathematics 1", color: "#5b8cff" },
  eee: { code: "48510", zh: "电气与电子", en: "EEE", color: "#ff735c" },
  c: { code: "48430", zh: "C 编程", en: "C Programming", color: "#39c98b" },
  physics: { code: "68037", zh: "物理", en: "Physics", color: "#59b7f1" },
};

const copy = {
  zh: {
    eyebrow: "IOS HOME SCREEN",
    title: "把课表放到 iPhone 主屏幕",
    intro: "抬手就看下一节课、课室和马上截止的 assessment。小组件离线可用，点击会打开你的个人学习版。",
    widgetTitle: "课表",
    offline: "已更新",
    today: "今天",
    nextClass: "下一节",
    noNextClass: "暂无固定课程",
    weekClasses: "本周课程",
    completed: (done: number, total: number) => `已完成 ${done}/${total}`,
    dueSoon: "即将截止",
    dueWindow: (count: number) => `14 天内 · ${count} 项`,
    assessment: "Assessment",
    dueToday: "今天截止",
    dueTomorrow: "明天截止",
    dueInDays: (days: number) => `${days} 天后`,
    upcoming: "接下来",
    recent: "未来 7 天",
    noClass: "未来 7 天没有固定课程",
    noClassMeta: "休息周或学期外",
    more: (count: number) => `另有 ${count} 节课`,
    updated: "更新",
    tapOpen: "点击打开个人版",
    setupTitle: "在 iPhone 上安装",
    setupIntro: "脚本只需安装一次；需要几个组件，就在主屏幕重复添加几次。",
    installScriptable: "没有 Scriptable？先免费安装",
    copyScript: "1. 复制课表脚本",
    copied: "脚本已复制",
    copyFailed: "复制失败，请下载 .js 文件",
    openScriptable: "2. 打开 Scriptable 新建脚本",
    download: "下载 .js 备用",
    homeStep: "3. 长按主屏幕 → ＋ → Scriptable → 大号 → 选择“DeepStudy课表”",
    secondWidgetStep: "显示两个组件：重复第 3 步再添加一次。两个都选“DeepStudy课表”；可以一个大号、一个小号。",
    pasteStep: "在 Scriptable 点右上角 ＋，粘贴后命名为“DeepStudy课表”，先点运行预览一次。",
    parameter: "Widget Parameter",
    parameterHelp: (value: string) => `你当前的数学课表对应参数：${value}。添加小组件后，长按它 → 编辑小组件 → Parameter 填 ${value}。`,
    official: "正式课表",
    waitlist: "候补预览",
  },
  en: {
    eyebrow: "IOS HOME SCREEN",
    title: "Put your timetable on the iPhone Home Screen",
    intro: "See the next class, room and imminent assessment deadline at a glance. The widget works offline and opens your personal study app when tapped.",
    widgetTitle: "Timetable",
    offline: "Updated",
    today: "Today",
    nextClass: "Next class",
    noNextClass: "No scheduled class",
    weekClasses: "This week's classes",
    completed: (done: number, total: number) => `${done}/${total} completed`,
    dueSoon: "Due soon",
    dueWindow: (count: number) => `${count} within 14 days`,
    assessment: "Assessment",
    dueToday: "Due today",
    dueTomorrow: "Due tomorrow",
    dueInDays: (days: number) => `Due in ${days} days`,
    upcoming: "Up next",
    recent: "Next 7 days",
    noClass: "No scheduled classes in the next 7 days",
    noClassMeta: "Semester break or outside teaching weeks",
    more: (count: number) => `${count} more classes`,
    updated: "updated",
    tapOpen: "Tap to open your personal app",
    setupTitle: "Install on iPhone",
    setupIntro: "Install the script once, then add as many Home Screen widgets as you need.",
    installScriptable: "Need Scriptable? Install it free",
    copyScript: "1. Copy timetable script",
    copied: "Script copied",
    copyFailed: "Copy failed — download the .js file instead",
    openScriptable: "2. Open Scriptable and add a script",
    download: "Download .js backup",
    homeStep: "3. Long-press Home Screen → ＋ → Scriptable → Large → choose “DeepStudy Timetable”",
    secondWidgetStep: "To show two widgets, repeat step 3. Choose the same “DeepStudy Timetable” script for both; one can be Large and the other Small.",
    pasteStep: "Tap ＋ in Scriptable, paste the code, name it “DeepStudy Timetable”, then run one preview.",
    parameter: "Widget Parameter",
    parameterHelp: (value: string) => `Your current Mathematics option uses parameter ${value}. After adding the widget, long-press it → Edit Widget → enter ${value} in Parameter.`,
    official: "Official timetable",
    waitlist: "Waitlist preview",
  },
} as const;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function teachingWeek(date: Date) {
  const day = startOfLocalDay(date);
  const semesterStart = new Date(2026, 6, 27);
  const breakStart = new Date(2026, 8, 21);
  const weekNineStart = new Date(2026, 8, 28);
  const semesterEnd = new Date(2026, 9, 25, 23, 59, 59);

  if (day < semesterStart || day > semesterEnd) return null;
  if (day >= breakStart && day < weekNineStart) return null;
  if (day < breakStart) return Math.floor((day.getTime() - semesterStart.getTime()) / (7 * DAY_MS)) + 1;
  return Math.floor((day.getTime() - weekNineStart.getTime()) / (7 * DAY_MS)) + 9;
}

function eventOnDate(item: TimetableItem, date: Date): WidgetEvent {
  const [startHour, startMinute] = item.start.split(":").map(Number);
  const [endHour, endMinute] = item.end.split(":").map(Number);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);
  return { item, start, end };
}

function eventsForNextSevenDays(timetable: TimetableItem[], now: Date) {
  const events: WidgetEvent[] = [];
  const today = startOfLocalDay(now);

  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(today.getTime() + offset * DAY_MS);
    const week = teachingWeek(date);
    if (!week) continue;

    for (const item of timetable) {
      if (item.day !== date.getDay() || (item.startsWeek && week < item.startsWeek)) continue;
      const event = eventOnDate(item, date);
      if (event.end.getTime() >= now.getTime()) events.push(event);
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function relationLabel(date: Date, now: Date, lang: Lang) {
  const diff = Math.round(
    (startOfLocalDay(date).getTime() - startOfLocalDay(now).getTime()) / DAY_MS,
  );
  if (diff === 0) return lang === "zh" ? "今天" : "Today";
  if (diff === 1) return lang === "zh" ? "明天" : "Tomorrow";
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-AU", {
    weekday: "short",
  }).format(date);
}

function timeLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function displayLocation(item: TimetableItem, lang: Lang) {
  if (item.location.startsWith("PRERECORDED")) {
    return lang === "zh" ? "Canvas 预录" : "Canvas recording";
  }
  return item.location;
}

function widgetParameter(choiceId?: string) {
  if (choiceId === "math-tut1-14") return "11";
  return "13";
}

function weekdayLabel(date: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-AU", {
    weekday: "long",
  }).format(date);
}

function eventsForCurrentWeek(timetable: TimetableItem[], now: Date) {
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const monday = startOfLocalDay(new Date(now.getTime() - (weekday - 1) * DAY_MS));
  const events: WidgetEvent[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(monday.getTime() + offset * DAY_MS);
    const week = teachingWeek(date);
    if (!week) continue;

    for (const item of timetable) {
      if (item.day === date.getDay() && (!item.startsWeek || week >= item.startsWeek)) {
        events.push(eventOnDate(item, date));
      }
    }
  }

  return events;
}

function calendarDayDistance(date: Date, now: Date) {
  return Math.round(
    (startOfLocalDay(date).getTime() - startOfLocalDay(now).getTime()) / DAY_MS,
  );
}

function assessmentsDueSoon(assessments: Assessment[], now: Date) {
  return assessments
    .filter((item): item is Assessment & { date: string } => Boolean(item.date && item.submissionDue))
    .map((item) => ({ item, due: new Date(item.date) }))
    .filter(({ due }) => {
      const days = calendarDayDistance(due, now);
      return due.getTime() >= now.getTime() && days >= 0 && days <= DUE_SOON_DAYS;
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

function dueLabel(due: Date, now: Date, lang: Lang) {
  const days = calendarDayDistance(due, now);
  if (days === 0) return copy[lang].dueToday;
  if (days === 1) return copy[lang].dueTomorrow;
  return copy[lang].dueInDays(days);
}

export function IOSTimetableWidget({ lang, now, timetable, assessments, selectedMathChoiceId }: Props) {
  const t = copy[lang];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const upcoming = useMemo(
    () => eventsForNextSevenDays(timetable, now),
    [now, timetable],
  );
  const dueSoon = useMemo(
    () => assessmentsDueSoon(assessments, now),
    [assessments, now],
  );
  const shown = upcoming.slice(0, dueSoon.length > 0 ? 3 : 4);
  const currentWeek = useMemo(
    () => eventsForCurrentWeek(timetable, now),
    [now, timetable],
  );
  const completedCount = currentWeek.filter((event) => event.end.getTime() < now.getTime()).length;
  const completionPercent = currentWeek.length
    ? Math.round((completedCount / currentWeek.length) * 100)
    : 0;
  const parameter = widgetParameter(selectedMathChoiceId);
  const mathIsWaitlisted = parameter === "11";

  async function copyWidgetScript() {
    try {
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) throw new Error("Unable to download widget script");
      const source = await response.text();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(source);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = source;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section className="ios-widget-section" aria-labelledby="ios-widget-title">
      <div className="ios-widget-intro">
        <p className="eyebrow">{t.eyebrow}</p>
        <h3 id="ios-widget-title">{t.title}</h3>
        <p>{t.intro}</p>
      </div>

      <div className="ios-widget-preview" data-testid="ios-timetable-widget-preview">
        <div className="ios-widget-topline">
          <span className="ios-widget-brand-dot" aria-hidden="true" />
          <strong>{t.widgetTitle}</strong>
          <small>
            {t.offline} · {timeLabel(now)}
          </small>
        </div>

        <div className="ios-widget-today-row">
          <span>
            <small>{t.today}</small>
            <strong>{weekdayLabel(now, lang)}</strong>
          </span>
          <span>
            <small>{t.nextClass}</small>
            <strong>
              {upcoming[0]
                ? `${relationLabel(upcoming[0].start, now, lang)} ${timeLabel(upcoming[0].start)}`
                : t.noNextClass}
            </strong>
          </span>
        </div>

        {dueSoon.length > 0 && (
          <div className="ios-widget-due-block">
            <div className="ios-widget-due-head">
              <strong>{t.dueSoon}</strong>
              <small>{t.dueWindow(dueSoon.length)}</small>
            </div>
            <a
              className="ios-widget-due-row"
              href={dueSoon[0].item.canvas}
              target="_blank"
              rel="noreferrer"
            >
              <span className="ios-widget-due-dot" aria-hidden="true" />
              <span className="ios-widget-event-copy">
                <strong>
                  {courseMeta[dueSoon[0].item.courseId].code} · {dueSoon[0].item.title[lang]}
                </strong>
                <small>{t.assessment} · {dueSoon[0].item.weight}</small>
              </span>
              <span className="ios-widget-event-time due">
                <small>{dueLabel(dueSoon[0].due, now, lang)}</small>
                <b>{timeLabel(dueSoon[0].due)}</b>
                <span className="ios-widget-canvas-button">Canvas ↗</span>
              </span>
            </a>
          </div>
        )}

        <div className="ios-widget-section-head">
          <strong>{t.upcoming}</strong>
          <small>{t.recent}</small>
        </div>

        <div className="ios-widget-event-list">
          {shown.length > 0 ? (
            shown.map((event) => {
              const meta = courseMeta[event.item.courseId];
              return (
                <div className="ios-widget-event" key={`${event.item.courseId}-${event.start.toISOString()}`}>
                  <span
                    className="ios-widget-course-dot"
                    aria-hidden="true"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="ios-widget-event-copy">
                    <strong>{meta.code} · {lang === "zh" ? meta.zh : meta.en}</strong>
                    <small>{event.item.activity[lang]} · {displayLocation(event.item, lang)}</small>
                  </span>
                  <span className="ios-widget-event-time">
                    <small>{relationLabel(event.start, now, lang)}</small>
                    <b>{timeLabel(event.start)}</b>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="ios-widget-empty">
              <strong>{t.noClass}</strong>
              <small>{t.noClassMeta}</small>
            </div>
          )}
        </div>

        <div className="ios-widget-footer">
          <div className="ios-widget-completion-meta">
            <small>{t.weekClasses}</small>
            <small>{t.completed(completedCount, currentWeek.length)}</small>
          </div>
          <div className="ios-widget-completion-track">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
          <div>
            <small>
              {upcoming.length > shown.length ? t.more(upcoming.length - shown.length) : t.tapOpen}
            </small>
            <small>{timeLabel(now)} {t.updated}</small>
          </div>
        </div>
      </div>

      <details className="ios-widget-install" open>
        <summary>
          <span>
            <strong>{t.setupTitle}</strong>
            <small>{t.setupIntro}</small>
          </span>
          <span className="ios-widget-size-pill">LARGE</span>
        </summary>

        <div className="ios-widget-install-body">
          <a
            className="ios-widget-app-link"
            href="https://apps.apple.com/app/scriptable/id1405459188"
            target="_blank"
            rel="noreferrer"
          >
            {t.installScriptable} <span aria-hidden="true">→</span>
          </a>

          <div className="ios-widget-actions">
            <button type="button" onClick={copyWidgetScript}>
              {copyState === "copied" ? t.copied : t.copyScript}
            </button>
            <a href="https://open.scriptable.app/add" target="_blank" rel="noreferrer">
              {t.openScriptable}
            </a>
            <a className="secondary" href={SCRIPT_URL} download="DeepStudy课表.js">
              {t.download}
            </a>
          </div>

          {copyState === "failed" && <p className="ios-widget-copy-error" role="status">{t.copyFailed}</p>}

          <ol className="ios-widget-steps">
            <li>{t.pasteStep}</li>
            <li>{t.homeStep}</li>
            <li>{t.secondWidgetStep}</li>
          </ol>

          <div className={`ios-widget-parameter ${mathIsWaitlisted ? "waitlist" : "official"}`}>
            <span>
              <small>{t.parameter}</small>
              <strong>{parameter}</strong>
            </span>
            <p>{t.parameterHelp(parameter)}</p>
            <b>{mathIsWaitlisted ? t.waitlist : t.official}</b>
          </div>
        </div>
      </details>
    </section>
  );
}
