"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PlanTask {
  id: string;
  courseId: string | null;
  courseCode: string | null;
  courseName: string | null;
  colourKey: string | null;
  title: string;
  completionCriteria: string;
  taskType: string;
  priority: string;
  estimatedMinutes: number;
  scheduledFor: string;
  dueAt: string | null;
  status: string;
}

interface CourseOption {
  id: string;
  courseCode: string | null;
  courseName: string;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function datesBetween(start: string, end: string): string[] {
  const output: string[] = [];
  for (
    let value = start;
    value <= end && output.length < 32;
    value = addDays(value, 1)
  ) {
    output.push(value);
  }
  return output;
}

export function PlanBoard({
  initialTasks,
  initialStartDate,
  initialEndDate,
  dailyCapacity,
  courses,
  language,
}: {
  initialTasks: PlanTask[];
  initialStartDate: string;
  initialEndDate: string;
  dailyCapacity: number;
  courses: CourseOption[];
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [courseId, setCourseId] = useState("");
  const [view, setView] = useState<"day" | "week">("week");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "saving">("idle");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [completionCriteria, setCompletionCriteria] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("25");
  const [priority, setPriority] = useState("medium");
  const [newTaskCourseId, setNewTaskCourseId] = useState(
    courses[0]?.id ?? "",
  );
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  const visibleEnd = view === "day" ? startDate : endDate;
  const dates = useMemo(
    () => datesBetween(startDate, visibleEnd),
    [startDate, visibleEnd],
  );

  async function load(nextStart = startDate, nextEnd = endDate) {
    setState("loading");
    setError("");
    const query = new URLSearchParams({
      start: nextStart,
      end: view === "day" ? nextStart : nextEnd,
    });
    if (courseId) query.set("courseId", courseId);
    const response = await fetch(`/api/plan?${query.toString()}`, {
      cache: "no-store",
    });
    const body = (await response.json()) as {
      tasks?: PlanTask[];
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法加载学习计划。", "The study plan could not be loaded."),
      );
    } else {
      setTasks(body.tasks ?? []);
    }
    setState("idle");
  }

  async function moveTask(taskId: string, scheduledFor: string) {
    setState("saving");
    setError("");
    const response = await fetch(`/api/study-tasks/${taskId}/schedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor }),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法移动任务。", "The task could not be moved."),
      );
    } else {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, scheduledFor } : task,
        ),
      );
      router.refresh();
    }
    setDraggedTaskId(null);
    setState("idle");
  }

  async function updateStatus(taskId: string, status: "completed" | "skipped") {
    setState("saving");
    const response = await fetch(`/api/study-tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法更新任务。", "The task could not be updated."),
      );
    } else {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status } : task,
        ),
      );
      router.refresh();
    }
    setState("idle");
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setError("");
    const response = await fetch("/api/study-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: newTaskCourseId || null,
        topicId: null,
        assessmentId: null,
        title: taskTitle,
        description: null,
        completionCriteria,
        taskType: "custom",
        priority,
        estimatedMinutes: Number(estimatedMinutes),
        scheduledFor: startDate,
        dueAt: null,
      }),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法创建任务。", "The task could not be created."),
      );
    } else {
      setTaskTitle("");
      setCompletionCriteria("");
      setShowCreate(false);
      await load();
      router.refresh();
    }
    setState("idle");
  }

  return (
    <>
      <section className="saas-card saas-plan-toolbar">
        <div
          className="saas-segmented"
          role="group"
          aria-label={t("计划视图", "Plan view")}
        >
          <button
            type="button"
            aria-pressed={view === "day"}
            onClick={() => {
              setView("day");
              setEndDate(startDate);
            }}
          >
            {t("日视图", "Day")}
          </button>
          <button
            type="button"
            aria-pressed={view === "week"}
            onClick={() => {
              setView("week");
              setEndDate(addDays(startDate, 6));
            }}
          >
            {t("周视图", "Week")}
          </button>
        </div>
        <label>
          {t("开始日期", "Start date")}
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              const value = event.target.value;
              setStartDate(value);
              setEndDate(view === "week" ? addDays(value, 6) : value);
            }}
          />
        </label>
        <label>
          {t("课程", "Course")}
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">{t("全部课程", "All courses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {[course.courseCode, course.courseName]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </select>
        </label>
        <button
          className="saas-button saas-button-secondary"
          type="button"
          disabled={state !== "idle"}
          onClick={() => void load()}
        >
          {state === "loading"
            ? t("加载中…", "Loading…")
            : t("应用筛选", "Apply filters")}
        </button>
        <button
          className="saas-button saas-button-primary"
          type="button"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate
            ? t("收起", "Close")
            : t("添加自定义任务", "Add custom task")}
        </button>
      </section>

      {error ? (
        <p className="saas-form-error" role="alert">
          {error}
        </p>
      ) : null}

      {showCreate ? (
        <form className="saas-card saas-form-grid" onSubmit={createTask}>
          <div className="saas-field saas-field-wide">
            <label htmlFor="new-task-title">
              {t("任务标题", "Task title")}
            </label>
            <input
              id="new-task-title"
              required
              maxLength={180}
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
          </div>
          <div className="saas-field saas-field-wide">
            <label htmlFor="new-task-criteria">
              {t("怎样才算完成", "What counts as complete")}
            </label>
            <textarea
              id="new-task-criteria"
              required
              maxLength={1500}
              value={completionCriteria}
              onChange={(event) => setCompletionCriteria(event.target.value)}
              placeholder={t(
                "例如：不看笔记写出定义，完成两道题并解释错误。",
                "For example: write the definition from memory, complete two questions, and explain any error.",
              )}
            />
          </div>
          <div className="saas-field">
            <label htmlFor="new-task-course">
              {t("课程", "Course")}
            </label>
            <select
              id="new-task-course"
              value={newTaskCourseId}
              onChange={(event) => setNewTaskCourseId(event.target.value)}
            >
              <option value="">
                {t("不关联课程", "No linked course")}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </div>
          <div className="saas-field">
            <label htmlFor="new-task-minutes">
              {t("预计分钟", "Estimated minutes")}
            </label>
            <input
              id="new-task-minutes"
              type="number"
              min={5}
              max={720}
              required
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
            />
          </div>
          <div className="saas-field">
            <label htmlFor="new-task-priority">
              {t("优先级", "Priority")}
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button
            className="saas-button saas-button-primary"
            disabled={state !== "idle"}
            type="submit"
          >
            {t("保存任务", "Save task")}
          </button>
        </form>
      ) : null}

      <section className="saas-plan-board" aria-busy={state !== "idle"}>
        {dates.map((date) => {
          const dayTasks = tasks.filter(
            (task) => task.scheduledFor === date && task.status !== "skipped",
          );
          const planned = dayTasks
            .filter((task) => task.status !== "completed")
            .reduce((sum, task) => sum + task.estimatedMinutes, 0);
          const overload = planned > dailyCapacity;
          const criticalOverload =
            overload &&
            dayTasks.some(
              (task) =>
                task.priority === "critical" && task.status !== "completed",
            );
          return (
            <article
              className={`saas-plan-day${overload ? " is-overload" : ""}`}
              key={date}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedTaskId) void moveTask(draggedTaskId, date);
              }}
            >
              <header>
                <div>
                  <time dateTime={date}>
                    {new Intl.DateTimeFormat(
                      language === "zh-CN" ? "zh-CN" : "en-AU",
                      {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                      },
                    ).format(new Date(`${date}T12:00:00Z`))}
                  </time>
                  <span>
                    {planned}/{dailyCapacity} {t("分钟", "min")}
                  </span>
                </div>
                {criticalOverload ? (
                  <strong>
                    {t(
                      "Critical 超负荷，请主动调整",
                      "Critical overload — review it now",
                    )}
                  </strong>
                ) : overload ? (
                  <strong>{t("超过每日容量", "Over daily capacity")}</strong>
                ) : null}
              </header>
              <ol>
                {dayTasks.map((task) => (
                  <li
                    draggable={task.status !== "completed"}
                    key={task.id}
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                    className={
                      task.status === "completed" ? "is-completed" : ""
                    }
                  >
                    <div className="saas-plan-task-copy">
                      <span className={`saas-priority is-${task.priority}`}>
                        {task.priority}
                      </span>
                      <strong>{task.title}</strong>
                      <small>
                        {task.courseName || t("通用任务", "General task")} ·{" "}
                        {task.estimatedMinutes} {t("分钟", "min")}
                      </small>
                      <p>{task.completionCriteria}</p>
                    </div>
                    {task.status !== "completed" ? (
                      <div className="saas-plan-task-actions">
                        <label>
                          {t("移动到", "Move to")}
                          <input
                            aria-label={t(
                              `移动 ${task.title} 到日期`,
                              `Move ${task.title} to date`,
                            )}
                            type="date"
                            value={task.scheduledFor}
                            onChange={(event) =>
                              void moveTask(task.id, event.target.value)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(task.id, "completed")
                          }
                        >
                          {t("完成", "Complete")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(task.id, "skipped")}
                        >
                          {t("跳过", "Skip")}
                        </button>
                      </div>
                    ) : (
                      <span className="saas-plan-done">
                        {t("已完成", "Completed")}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              {dayTasks.length === 0 ? (
                <p className="saas-muted">
                  {t(
                    "没有安排任务。可把其他日期的任务拖到这里。",
                    "No tasks scheduled. Drag another day's task here.",
                  )}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>
    </>
  );
}
