import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActionButton,
  Field,
  InlineNotice,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";

function localDateKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NewTaskScreen() {
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const today = useMemo(() => localDateKey(), []);
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [minutes, setMinutes] = useState("25");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.createStudyTask({
        courseId: null,
        topicId: null,
        assessmentId: null,
        title: title.trim(),
        description: null,
        completionCriteria: criteria.trim(),
        taskType: "custom",
        priority: "medium",
        estimatedMinutes: Number(minutes),
        scheduledFor: date,
        dueAt: null,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法创建任务。", "Could not create the task."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Verifiable next step"
        title={t("添加自定义学习任务", "Add a custom study task")}
        lead={t(
          "写清楚完成标准，避免只写“复习一下”。",
          "Write a verifiable completion standard instead of a vague note such as “review.”",
        )}
      />
      <Surface>
        <Field
          label={t("任务标题", "Task title")}
          value={title}
          maxLength={180}
          onChangeText={setTitle}
        />
        <Field
          label={t("完成标准", "Completion criteria")}
          multiline
          value={criteria}
          maxLength={1500}
          onChangeText={setCriteria}
        />
        <Field
          label={t("预计分钟", "Estimated minutes")}
          keyboardType="number-pad"
          value={minutes}
          onChangeText={setMinutes}
        />
        <Field
          label={t("安排日期（YYYY-MM-DD）", "Scheduled date (YYYY-MM-DD)")}
          autoCapitalize="none"
          value={date}
          onChangeText={setDate}
        />
      </Surface>
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("无法保存", "Could not save")}
          body={error}
        />
      ) : null}
      <ActionButton
        disabled={
          saving ||
          !title.trim() ||
          !criteria.trim() ||
          Number(minutes) < 5
        }
        label={
          saving ? t("正在保存…", "Saving…") : t("保存任务", "Save task")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
