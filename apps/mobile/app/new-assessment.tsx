import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  Field,
  InlineNotice,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";

export default function NewAssessmentScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.createAssessment(courseId, {
        title: title.trim(),
        assessmentType: "assignment",
        dueAt: dueDate ? new Date(`${dueDate}T23:59:00`).toISOString() : null,
        weightPercent: weight ? Number(weight) : null,
        estimatedMinutes: minutes ? Number(minutes) : null,
        notes: null,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法添加 Assessment。", "Could not add the assessment."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Deadline"
        title={t("添加 Assessment", "Add assessment")}
      />
      <Surface>
        <Field label={t("名称", "Title")} value={title} onChangeText={setTitle} />
        <Field
          label={t(
            "截止日期（YYYY-MM-DD，可选）",
            "Due date (YYYY-MM-DD, optional)",
          )}
          autoCapitalize="none"
          value={dueDate}
          onChangeText={setDueDate}
        />
        <Field
          label={t("权重百分比（可选）", "Weight percent (optional)")}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Field
          label={t("预计分钟", "Estimated minutes")}
          keyboardType="number-pad"
          value={minutes}
          onChangeText={setMinutes}
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
        disabled={saving || !title.trim()}
        label={
          saving
            ? t("正在保存…", "Saving…")
            : t("保存 Assessment", "Save assessment")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
