import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSession } from "@/src/auth/session-context";
import type {
  FocusSession,
  TodayResponse,
} from "@/src/api/types";
import {
  focusSecondsRemaining,
  formatClock,
} from "@/src/lib/dates";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Stat,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

function ChoiceRow({
  values,
  selected,
  onSelect,
  suffix = "",
}: {
  values: number[];
  selected: number;
  onSelect(value: number): void;
  suffix?: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.choices}>
      {values.map((value) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected === value }}
          key={value}
          onPress={() => onSelect(value)}
          style={[
            styles.choice,
            {
              backgroundColor:
                selected === value ? theme.accent : theme.surfaceMuted,
              borderColor:
                selected === value ? theme.accent : theme.line,
            },
          ]}
        >
          <Text
            style={{
              color: selected === value ? theme.inverted : theme.ink,
              fontWeight: "800",
            }}
          >
            {value}
            {suffix}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function TodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [remaining, setRemaining] = useState(0);
  const [difficulty, setDifficulty] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [needsMorePractice, setNeedsMorePractice] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.today();
      setData(result);
      setRemaining(
        result.activeFocusSession
          ? focusSecondsRemaining(result.activeFocusSession)
          : 0,
      );
      if (result.currentTask) {
        setPlannedMinutes(
          [15, 25, 45].includes(result.currentTask.estimatedMinutes)
            ? result.currentTask.estimatedMinutes
            : 25,
        );
      }
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "暂时无法加载今日计划。",
              "Today's plan could not be loaded.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const session = data?.activeFocusSession;
    if (!session) return;
    const timer = setInterval(
      () => setRemaining(focusSecondsRemaining(session)),
      1_000,
    );
    return () => clearInterval(timer);
  }, [data?.activeFocusSession]);

  async function startFocus() {
    if (!data?.currentTask) return;
    setActionLoading(true);
    setError("");
    try {
      const result = await api.startFocusSession({
        taskId: data.currentTask.id,
        plannedMinutes,
      });
      if (result.session) {
        setRemaining(focusSecondsRemaining(result.session));
        setData((current) =>
          current
            ? { ...current, activeFocusSession: result.session }
            : current,
        );
      }
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法开始专注。", "Focus could not be started."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function completeFocus(session: FocusSession) {
    setActionLoading(true);
    setError("");
    try {
      await api.completeFocusSession(session.id, {
        completionStatus: "completed",
        difficulty,
        needsMorePractice,
        confidenceAfter: confidence,
      });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "无法保存专注记录。",
              "The focus record could not be saved.",
            ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function startRetest() {
    const task = data?.currentTask;
    if (!task?.courseId) return;
    setActionLoading(true);
    try {
      const result = await api.startPracticeSession({
        courseId: task.courseId,
        studyTaskId: task.id,
        confidenceBefore: 3,
      });
      router.push({
        pathname: "/practice-session/[sessionId]",
        params: { sessionId: result.session.sessionId },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法开始复测。", "The retest could not be started."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在整理今天的下一步…",
            "Preparing today's next step…",
          )}
        />
      </Screen>
    );
  }

  const task = data?.currentTask;
  const activeFocus = data?.activeFocusSession;
  return (
    <Screen>
      <PageHeading
        eyebrow={data?.dateKey ?? "Today"}
        title={`${data?.user.displayName ? `${data.user.displayName}, ` : ""}${t(
          "今天只先做下一步",
          "Start with just the next step",
        )}`}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("暂时无法同步", "Unable to sync")}
          body={error}
        />
      ) : null}
      {data ? (
        <View style={styles.stats}>
          <Stat
            label={t("计划时间", "Planned time")}
            value={t(
              `${data.plannedMinutes} 分钟`,
              `${data.plannedMinutes} min`,
            )}
          />
          <Stat
            label={t("今日课程", "Classes today")}
            value={data.classSessions.length}
          />
          <Stat
            label={t("到期复测", "Due retests")}
            value={data.dueReviewCount}
          />
          <Stat
            label={t("连续学习", "Study streak")}
            value={t(
              `${data.studyStreak} 天`,
              `${data.studyStreak} day${data.studyStreak === 1 ? "" : "s"}`,
            )}
          />
        </View>
      ) : null}
      {data && data.dueReviewCount > 0 ? (
        <InlineNotice
          tone="warning"
          title={t(
            `${data.dueReviewCount} 个知识点需要复测`,
            `${data.dueReviewCount} topic${
              data.dueReviewCount === 1 ? "" : "s"
            } ${data.dueReviewCount === 1 ? "needs" : "need"} a retest`,
          )}
          body={t(
            "延迟复测比立即重复更能说明是否真正掌握。",
            "A delayed retest is stronger evidence than immediate repetition.",
          )}
        />
      ) : null}

      {task ? (
        <Surface
          accessibilityLabel={t(
            `当前任务：${task.title}`,
            `Current task: ${task.title}`,
          )}
          style={{ borderTopColor: theme.accent, borderTopWidth: 4 }}
        >
          <View style={styles.taskTopline}>
            <Text style={[styles.priority, { color: theme.accent }]}>
              {task.priority.toUpperCase()}
            </Text>
            <Text style={[styles.course, { color: theme.muted }]}>
              {[task.courseCode, task.courseName].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <Text style={[styles.taskTitle, { color: theme.ink }]}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[styles.body, { color: theme.muted }]}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.fact}>
            <Text style={[styles.factLabel, { color: theme.muted }]}>
              {t("为什么现在做", "Why now")}
            </Text>
            <Text style={[styles.factValue, { color: theme.ink }]}>
              {task.reason}
            </Text>
          </View>
          <View style={styles.fact}>
            <Text style={[styles.factLabel, { color: theme.muted }]}>
              {t("完成标准", "Completion criteria")}
            </Text>
            <Text style={[styles.factValue, { color: theme.ink }]}>
              {task.completionCriteria}
            </Text>
          </View>

          {task.taskType === "retest" ? (
            <ActionButton
              disabled={actionLoading}
              label={
                actionLoading
                  ? t("正在开始…", "Starting…")
                  : t("开始到期复测", "Start due retest")
              }
              onPress={() => void startRetest()}
            />
          ) : activeFocus ? (
            <View style={styles.focus}>
              <Text style={[styles.focusLabel, { color: theme.muted }]}>
                FOCUS BLOCK
              </Text>
              <Text style={[styles.clock, { color: theme.ink }]}>
                {formatClock(remaining)}
              </Text>
              <Text style={[styles.sectionLabel, { color: theme.ink }]}>
                {t("完成后的难度", "Difficulty after completion")}
              </Text>
              <ChoiceRow
                selected={difficulty}
                values={[1, 2, 3, 4, 5]}
                onSelect={setDifficulty}
              />
              <Text style={[styles.sectionLabel, { color: theme.ink }]}>
                {t("当前信心", "Current confidence")}
              </Text>
              <ChoiceRow
                selected={confidence}
                values={[1, 2, 3, 4, 5]}
                onSelect={setConfidence}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: needsMorePractice }}
                onPress={() => setNeedsMorePractice((value) => !value)}
                style={styles.check}
              >
                <View
                  style={[
                    styles.checkBox,
                    {
                      backgroundColor: needsMorePractice
                        ? theme.accent
                        : "transparent",
                      borderColor: theme.accent,
                    },
                  ]}
                />
                <Text style={[styles.body, { color: theme.ink }]}>
                  {t(
                    "这个知识点还需要更多练习",
                    "This topic needs more practice",
                  )}
                </Text>
              </Pressable>
              <ActionButton
                disabled={actionLoading}
                label={
                  actionLoading
                    ? t("正在保存…", "Saving…")
                    : t("完成并记录", "Complete and record")
                }
                onPress={() => void completeFocus(activeFocus)}
              />
            </View>
          ) : (
            <View style={styles.focus}>
              <Text style={[styles.sectionLabel, { color: theme.ink }]}>
                {t("选择专注时长", "Choose focus duration")}
              </Text>
              <ChoiceRow
                selected={plannedMinutes}
                suffix="m"
                values={[15, 25, 45]}
                onSelect={setPlannedMinutes}
              />
              <ActionButton
                disabled={actionLoading}
                label={
                  actionLoading
                    ? t("正在开始…", "Starting…")
                    : t("开始专注", "Start focus")
                }
                onPress={() => void startFocus()}
              />
            </View>
          )}
        </Surface>
      ) : (
        <EmptyState
          title={t("今天已经清空", "Today is clear")}
          body={t(
            "添加新的 Assessment 后，DeepStudy 会继续生成下一步。",
            "Add a new assessment and DeepStudy will prepare the next step.",
          )}
        />
      )}

      {data?.queue.length ? (
        <Surface>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t("下一步队列", "Next-up queue")}
          </Text>
          {data.queue.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.queueRow,
                index > 0 ? { borderTopColor: theme.line } : undefined,
              ]}
            >
              <View style={styles.queueText}>
                <Text style={[styles.queueTitle, { color: theme.ink }]}>
                  {item.title}
                </Text>
                <Text style={[styles.queueMeta, { color: theme.muted }]}>
                  {item.courseName} ·{" "}
                  {t(
                    `${item.estimatedMinutes} 分钟`,
                    `${item.estimatedMinutes} min`,
                  )}
                </Text>
              </View>
              <View
                style={[styles.dot, { backgroundColor: theme.accent }]}
              />
            </View>
          ))}
        </Surface>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  taskTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  priority: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  course: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  fact: {
    gap: 4,
  },
  factLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  factValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  focus: {
    gap: 12,
    paddingTop: 4,
  },
  focusLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  clock: {
    textAlign: "center",
    fontSize: 48,
    lineHeight: 56,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  choices: {
    flexDirection: "row",
    gap: 8,
  },
  choice: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
  },
  check: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },
  queueRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  queueText: {
    flex: 1,
    gap: 3,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  queueMeta: {
    fontSize: 13,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
