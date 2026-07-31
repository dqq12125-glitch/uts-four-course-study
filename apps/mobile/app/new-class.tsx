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

export default function NewClassScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [title, setTitle] = useState("Lecture");
  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.createClassSession(courseId, {
        sessionType: "lecture",
        title: title.trim(),
        dayOfWeek: Number(day),
        startTime: start,
        endTime: end,
        location: location.trim() || null,
        mapUrl: null,
        startDate: null,
        endDate: null,
        recurrenceRule: "FREQ=WEEKLY",
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法添加课程安排。", "Could not add the class session."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Weekly timetable"
        title={t("添加课程安排", "Add class session")}
        lead={t(
          "星期使用 0（周日）到 6（周六）。",
          "Use 0 for Sunday through 6 for Saturday.",
        )}
      />
      <Surface>
        <Field label={t("名称", "Title")} value={title} onChangeText={setTitle} />
        <Field
          label={t("星期（0–6）", "Day of week (0–6)")}
          keyboardType="number-pad"
          value={day}
          onChangeText={setDay}
        />
        <Field
          label={t("开始时间（HH:mm）", "Start time (HH:mm)")}
          value={start}
          onChangeText={setStart}
        />
        <Field
          label={t("结束时间（HH:mm）", "End time (HH:mm)")}
          value={end}
          onChangeText={setEnd}
        />
        <Field
          label={t("地点（可选）", "Location (optional)")}
          value={location}
          onChangeText={setLocation}
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
            : t("保存课程安排", "Save class session")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
