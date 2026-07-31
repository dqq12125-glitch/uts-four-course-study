import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { PlanResponse, PlanTask } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export default function PlanScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t, locale } = useCopy();
  const [startDate, setStartDate] = useState(() => localDateKey());
  const endDate = useMemo(() => addDays(startDate, 6), [startDate]);
  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.plan(startDate, addDays(startDate, 6)));
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载计划。", "The plan could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, startDate, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function move(task: PlanTask, scheduledFor: string) {
    setBusyTask(task.id);
    try {
      await api.rescheduleTask(task.id, scheduledFor);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法移动任务。", "The task could not be moved."),
      );
    } finally {
      setBusyTask(null);
    }
  }

  async function complete(task: PlanTask) {
    setBusyTask(task.id);
    try {
      await api.updateTaskStatus(task.id, "completed");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法完成任务。", "The task could not be completed."),
      );
    } finally {
      setBusyTask(null);
    }
  }

  async function reorder(
    scheduledFor: string,
    dayTasks: PlanTask[],
    task: PlanTask,
    direction: -1 | 1,
  ) {
    const openTasks = dayTasks.filter(
      (candidate) => candidate.status !== "completed",
    );
    const index = openTasks.findIndex((candidate) => candidate.id === task.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= openTasks.length) return;
    const reordered = [...openTasks];
    const currentTask = reordered[index];
    const targetTask = reordered[target];
    if (!currentTask || !targetTask) return;
    reordered[index] = targetTask;
    reordered[target] = currentTask;
    setBusyTask(task.id);
    try {
      await api.reorderTasks(
        scheduledFor,
        reordered.map((candidate) => candidate.id),
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "无法调整任务顺序。",
              "The task order could not be changed.",
            ),
      );
    } finally {
      setBusyTask(null);
    }
  }

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在安排这一周…", "Preparing this week…")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow={`${startDate} → ${endDate}`}
        title={t("一周学习计划", "Weekly study plan")}
        lead={t(
          "容量以内优先；Critical 任务不会被静默顺延。",
          "Capacity comes first; critical tasks are never moved silently.",
        )}
      />
      <View style={styles.weekActions}>
        <ActionButton
          variant="secondary"
          label={t("上一周", "Previous week")}
          onPress={() => setStartDate((value) => addDays(value, -7))}
        />
        <ActionButton
          variant="secondary"
          label={t("回到今天", "Today")}
          onPress={() => setStartDate(localDateKey())}
        />
        <ActionButton
          variant="secondary"
          label={t("下一周", "Next week")}
          onPress={() => setStartDate((value) => addDays(value, 7))}
        />
      </View>
      <ActionButton
        label={t("添加自定义任务", "Add custom task")}
        onPress={() => router.push("/new-task")}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("计划未同步", "Plan not synced")}
          body={error}
        />
      ) : null}
      {data?.days.length ? (
        data.days.map((day) => (
          <Surface key={day.date}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: theme.ink }]}>
                {new Intl.DateTimeFormat(locale, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${day.date}T12:00:00Z`))}
              </Text>
              <Text style={[styles.dayMinutes, { color: theme.muted }]}>
                {t(
                  `${day.plannedMinutes} 分钟`,
                  `${day.plannedMinutes} min`,
                )}
              </Text>
            </View>
            {day.tasks.map((task) => (
              <View
                key={task.id}
                style={[styles.task, { borderTopColor: theme.line }]}
              >
                <View style={styles.taskCopy}>
                  <Text style={[styles.taskTitle, { color: theme.ink }]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.taskMeta, { color: theme.muted }]}>
                    {task.courseName || t("通用任务", "General task")} ·{" "}
                    {t(
                      `${task.estimatedMinutes} 分钟`,
                      `${task.estimatedMinutes} min`,
                    )}
                    {" · "}
                    {task.priority}
                  </Text>
                  <Text style={[styles.criteria, { color: theme.muted }]}>
                    {task.completionCriteria}
                  </Text>
                </View>
                {task.status !== "completed" ? (
                  <View style={styles.taskActions}>
                    <ActionButton
                      variant="secondary"
                      disabled={
                        busyTask === task.id ||
                        day.tasks
                          .filter(
                            (candidate) =>
                              candidate.status !== "completed",
                          )
                          .findIndex(
                            (candidate) => candidate.id === task.id,
                          ) === 0
                      }
                      label={t("提前一项", "Move earlier")}
                      onPress={() =>
                        void reorder(day.date, day.tasks, task, -1)
                      }
                    />
                    <ActionButton
                      variant="secondary"
                      disabled={
                        busyTask === task.id ||
                        day.tasks
                          .filter(
                            (candidate) =>
                              candidate.status !== "completed",
                          )
                          .findIndex(
                            (candidate) => candidate.id === task.id,
                          ) ===
                          day.tasks.filter(
                            (candidate) =>
                              candidate.status !== "completed",
                          ).length -
                            1
                      }
                      label={t("推后一项", "Move later")}
                      onPress={() =>
                        void reorder(day.date, day.tasks, task, 1)
                      }
                    />
                    <ActionButton
                      variant="secondary"
                      disabled={busyTask === task.id}
                      label={t("移到明天", "Move to tomorrow")}
                      onPress={() => void move(task, addDays(task.scheduledFor, 1))}
                    />
                    <ActionButton
                      disabled={busyTask === task.id}
                      label={t("标记完成", "Mark complete")}
                      onPress={() => void complete(task)}
                    />
                  </View>
                ) : (
                  <Text style={[styles.done, { color: theme.success }]}>
                    {t("已完成", "Completed")}
                  </Text>
                )}
              </View>
            ))}
          </Surface>
        ))
      ) : (
        <EmptyState
          title={t("这一周还没有任务", "No tasks this week")}
          body={t(
            "添加一项有明确完成标准的任务，或在 Web 端运行自动重新排程。",
            "Add a task with clear completion criteria, or run automatic rebalancing on the web.",
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  dayMinutes: {
    fontSize: 13,
    fontWeight: "700",
  },
  task: {
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  taskCopy: {
    gap: 5,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  taskMeta: {
    fontSize: 13,
  },
  criteria: {
    fontSize: 14,
    lineHeight: 20,
  },
  taskActions: {
    gap: 8,
  },
  done: {
    fontSize: 13,
    fontWeight: "800",
  },
});
