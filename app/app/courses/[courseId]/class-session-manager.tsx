"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClassSession {
  id: string;
  sessionType: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  mapUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  recurrenceRule: string | null;
}

const DAYS = [
  ["周日", "Sunday"],
  ["周一", "Monday"],
  ["周二", "Tuesday"],
  ["周三", "Wednesday"],
  ["周四", "Thursday"],
  ["周五", "Friday"],
  ["周六", "Saturday"],
] as const;

function ClassFields({
  session,
  language,
}: {
  session?: ClassSession;
  language: "zh-CN" | "en";
}) {
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;
  return (
    <div className="saas-form-grid">
      <div className="saas-field">
        <label htmlFor={`class-type-${session?.id ?? "new"}`}>
          {t("类型", "Type")}
        </label>
        <select
          id={`class-type-${session?.id ?? "new"}`}
          name="sessionType"
          defaultValue={session?.sessionType ?? "lecture"}
        >
          {["lecture", "tutorial", "workshop", "lab", "practical", "other"].map(
            (value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="saas-field">
        <label htmlFor={`class-title-${session?.id ?? "new"}`}>
          {t("名称", "Title")}
        </label>
        <input
          id={`class-title-${session?.id ?? "new"}`}
          name="title"
          defaultValue={session?.title ?? ""}
          required
          maxLength={120}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-day-${session?.id ?? "new"}`}>
          {t("星期", "Day")}
        </label>
        <select
          id={`class-day-${session?.id ?? "new"}`}
          name="dayOfWeek"
          defaultValue={session?.dayOfWeek ?? 1}
        >
          {DAYS.map(([zh, en], index) => (
            <option key={zh} value={index}>
              {t(zh, en)}
            </option>
          ))}
        </select>
      </div>
      <div className="saas-field">
        <label htmlFor={`class-start-${session?.id ?? "new"}`}>
          {t("开始", "Starts")}
        </label>
        <input
          id={`class-start-${session?.id ?? "new"}`}
          type="time"
          name="startTime"
          defaultValue={session?.startTime ?? "09:00"}
          required
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-end-${session?.id ?? "new"}`}>
          {t("结束", "Ends")}
        </label>
        <input
          id={`class-end-${session?.id ?? "new"}`}
          type="time"
          name="endTime"
          defaultValue={session?.endTime ?? "10:00"}
          required
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-location-${session?.id ?? "new"}`}>
          {t("地点", "Location")}
        </label>
        <input
          id={`class-location-${session?.id ?? "new"}`}
          name="location"
          defaultValue={session?.location ?? ""}
          maxLength={160}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-map-${session?.id ?? "new"}`}>
          {t("地图链接", "Map link")}
        </label>
        <input
          id={`class-map-${session?.id ?? "new"}`}
          type="url"
          name="mapUrl"
          defaultValue={session?.mapUrl ?? ""}
          maxLength={500}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-from-${session?.id ?? "new"}`}>
          {t("生效日期", "Start date")}
        </label>
        <input
          id={`class-from-${session?.id ?? "new"}`}
          type="date"
          name="startDate"
          defaultValue={session?.startDate ?? ""}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`class-to-${session?.id ?? "new"}`}>
          {t("结束日期", "End date")}
        </label>
        <input
          id={`class-to-${session?.id ?? "new"}`}
          type="date"
          name="endDate"
          defaultValue={session?.endDate ?? ""}
        />
      </div>
    </div>
  );
}

function payload(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    sessionType: String(data.get("sessionType")),
    title: String(data.get("title")),
    dayOfWeek: Number(data.get("dayOfWeek")),
    startTime: String(data.get("startTime")),
    endTime: String(data.get("endTime")),
    location: String(data.get("location") || "") || null,
    mapUrl: String(data.get("mapUrl") || "") || null,
    startDate: String(data.get("startDate") || "") || null,
    endDate: String(data.get("endDate") || "") || null,
    recurrenceRule: "FREQ=WEEKLY",
  };
}

export function ClassSessionManager({
  courseId,
  sessions,
  language,
}: {
  courseId: string;
  sessions: ClassSession[];
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function save(
    event: React.FormEvent<HTMLFormElement>,
    sessionId?: string,
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch(
      sessionId
        ? `/api/class-sessions/${sessionId}`
        : `/api/courses/${courseId}/class-sessions`,
      {
        method: sessionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(event.currentTarget)),
      },
    );
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法保存课表。", "The timetable item could not be saved."),
      );
    } else {
      event.currentTarget.reset();
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(sessionId: string) {
    if (
      !window.confirm(
        t("删除这条课程安排？", "Delete this class session?"),
      )
    )
      return;
    setBusy(true);
    const response = await fetch(`/api/class-sessions/${sessionId}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法删除课表。", "The timetable item could not be deleted."),
      );
    }
    else router.refresh();
    setBusy(false);
  }

  return (
    <section className="saas-card">
      <div className="saas-section-heading">
        <div>
          <p className="saas-eyebrow">Timetable</p>
          <h2>{t("上课安排", "Class timetable")}</h2>
        </div>
      </div>
      {error ? (
        <p className="saas-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {sessions.length ? (
        <div className="saas-management-list">
          {sessions.map((session) => (
            <details key={session.id}>
              <summary>
                <strong>
                  {language === "zh-CN"
                    ? DAYS[session.dayOfWeek]?.[0]
                    : DAYS[session.dayOfWeek]?.[1]}{" "}
                  {session.startTime}–{session.endTime}
                </strong>
                <span>
                  {session.title}
                  {session.location ? ` · ${session.location}` : ""}
                </span>
              </summary>
              <form onSubmit={(event) => void save(event, session.id)}>
                <ClassFields session={session} language={language} />
                <div className="saas-inline-actions">
                  <button
                    className="saas-button saas-button-primary"
                    disabled={busy}
                    type="submit"
                  >
                    {t("保存修改", "Save changes")}
                  </button>
                  <button
                    className="saas-button saas-button-danger"
                    disabled={busy}
                    type="button"
                    onClick={() => void remove(session.id)}
                  >
                    {t("删除", "Delete")}
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      ) : (
        <p className="saas-muted">
          {t("还没有固定上课安排。", "No recurring class sessions yet.")}
        </p>
      )}
      <details>
        <summary className="saas-button saas-button-secondary">
          {t("添加课程安排", "Add class session")}
        </summary>
        <form onSubmit={(event) => void save(event)}>
          <ClassFields language={language} />
          <button
            className="saas-button saas-button-primary"
            disabled={busy}
            type="submit"
          >
            {t("保存课程安排", "Save class session")}
          </button>
        </form>
      </details>
    </section>
  );
}
