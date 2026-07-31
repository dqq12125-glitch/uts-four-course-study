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

export default function NewTopicScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [week, setWeek] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.createTopic(courseId, {
        title: title.trim(),
        description: description.trim() || null,
        weekNumber: week ? Number(week) : null,
        sequenceNumber: 0,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法添加知识点。", "Could not add the topic."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeading eyebrow="Topic" title={t("添加知识点", "Add topic")} />
      <Surface>
        <Field label={t("名称", "Title")} value={title} onChangeText={setTitle} />
        <Field
          label={t("说明（可选）", "Description (optional)")}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Field
          label={t("周次（可选）", "Week number (optional)")}
          keyboardType="number-pad"
          value={week}
          onChangeText={setWeek}
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
          saving ? t("正在保存…", "Saving…") : t("保存知识点", "Save topic")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
