"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface QueueTask {
  id: string;
  title: string;
  courseName: string | null;
  estimatedMinutes: number;
  priority: string;
}

function tomorrow(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function TodayQueue({
  initialTasks,
  dateKey,
  language,
}: {
  initialTasks: QueueTask[];
  dateKey: string;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks.slice(0, 3));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function persistOrder(next: QueueTask[]) {
    setTasks(next);
    setBusy(true);
    const response = await fetch("/api/plan/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledFor: dateKey,
        taskIds: next.map((task) => task.id),
      }),
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setTasks(tasks);
      setError(
        body.error?.message ??
          t("无法保存队列顺序。", "The queue order could not be saved."),
      );
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function act(
    task: QueueTask,
    action: "complete" | "tomorrow",
  ) {
    setBusy(true);
    const response = await fetch(
      action === "complete"
        ? `/api/study-tasks/${task.id}/status`
        : `/api/study-tasks/${task.id}/schedule`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "complete"
            ? { status: "completed" }
            : { scheduledFor: tomorrow(dateKey) },
        ),
      },
    );
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法更新任务。", "The task could not be updated."),
      );
    } else {
      setTasks((current) => current.filter((item) => item.id !== task.id));
      router.refresh();
    }
    setBusy(false);
  }

  if (!tasks.length) {
    return (
      <p className="saas-muted">
        {t(
          "当前任务完成后，今天就可以收尾。",
          "Finish the current task and you can close out today.",
        )}
      </p>
    );
  }

  return (
    <>
      {error ? (
        <p className="saas-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <ol className="saas-list saas-today-queue">
        {tasks.map((task, index) => (
          <li
            draggable
            key={task.id}
            onDragStart={() => setDraggedId(task.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggedId || draggedId === task.id) return;
              const from = tasks.findIndex((item) => item.id === draggedId);
              const to = tasks.findIndex((item) => item.id === task.id);
              const next = [...tasks];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              setDraggedId(null);
              void persistOrder(next);
            }}
          >
            <div>
              <strong>{task.title}</strong>
              <span>
                {task.courseName} ·{" "}
                {t(
                  `${task.estimatedMinutes} 分钟`,
                  `${task.estimatedMinutes} min`,
                )}
              </span>
            </div>
            <div className="saas-queue-actions">
              <span className={`saas-dot is-${task.priority}`} />
              <button
                aria-label={t(
                  `向前移动 ${task.title}`,
                  `Move ${task.title} earlier`,
                )}
                disabled={busy || index === 0}
                type="button"
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                aria-label={t(
                  `向后移动 ${task.title}`,
                  `Move ${task.title} later`,
                )}
                disabled={busy || index === tasks.length - 1}
                type="button"
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                disabled={busy}
                type="button"
                onClick={() => void act(task, "tomorrow")}
              >
                {t("明天", "Tomorrow")}
              </button>
              <button
                disabled={busy}
                type="button"
                onClick={() => void act(task, "complete")}
              >
                {t("完成", "Complete")}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
