import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { Assessment } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  Field,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";

export default function EditAssessmentScreen() {
  const router = useRouter();
  const { courseId, assessmentId } = useLocalSearchParams<{
    courseId: string;
    assessmentId: string;
  }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("assignment");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void api
        .course(courseId)
        .then(({ assessments }) => {
          if (!active) return;
          const found = assessments.find((item) => item.id === assessmentId);
          if (!found) {
            throw new Error(
              t(
                "Assessment 不存在或不属于当前账户。",
                "The assessment does not exist or does not belong to this account.",
              ),
            );
          }
          setAssessment(found);
          setTitle(found.title);
          setAssessmentType(found.assessmentType);
          setDueDate(found.dueAt?.slice(0, 10) ?? "");
          setWeight(
            found.weightPercent === null ? "" : String(found.weightPercent),
          );
          setMinutes(
            found.estimatedMinutes === null
              ? ""
              : String(found.estimatedMinutes),
          );
          setNotes(found.notes ?? "");
          setError("");
        })
        .catch((caught: unknown) => {
          if (active) {
            setError(
              caught instanceof Error
                ? caught.message
                : t(
                    "无法加载 Assessment。",
                    "Could not load the assessment.",
                  ),
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [api, assessmentId, courseId, t]),
  );

  async function save() {
    if (!assessment) return;
    setSaving(true);
    setError("");
    try {
      await api.updateAssessment(assessment.id, {
        title: title.trim(),
        assessmentType: assessmentType.trim(),
        dueAt: dueDate
          ? new Date(`${dueDate}T23:59:00`).toISOString()
          : null,
        weightPercent: weight ? Number(weight) : null,
        estimatedMinutes: minutes ? Number(minutes) : null,
        notes: notes.trim() || null,
        status: assessment.status,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法更新 Assessment。", "Could not update the assessment."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在读取 Assessment…", "Loading assessment…")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Deadline"
        title={t("编辑 Assessment", "Edit assessment")}
      />
      <Surface>
        <Field label={t("名称", "Title")} value={title} onChangeText={setTitle} />
        <Field
          label={t("类型", "Type")}
          value={assessmentType}
          onChangeText={setAssessmentType}
        />
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
          label={t("预计分钟（可选）", "Estimated minutes (optional)")}
          keyboardType="number-pad"
          value={minutes}
          onChangeText={setMinutes}
        />
        <Field
          label={t("备注（可选）", "Notes (optional)")}
          multiline
          value={notes}
          onChangeText={setNotes}
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
        disabled={saving || !assessment || !title.trim()}
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
