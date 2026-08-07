import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { Topic } from "@/src/api/types";
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

export default function EditTopicScreen() {
  const router = useRouter();
  const { courseId, topicId } = useLocalSearchParams<{
    courseId: string;
    topicId: string;
  }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [week, setWeek] = useState("");
  const [sequence, setSequence] = useState("0");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void api
        .topics(courseId)
        .then(({ topics }) => {
          if (!active) return;
          const found = topics.find((item) => item.id === topicId);
          if (!found) {
            throw new Error(
              t(
                "知识点不存在或不属于当前账户。",
                "The topic does not exist or does not belong to this account.",
              ),
            );
          }
          setTopic(found);
          setTitle(found.title);
          setDescription(found.description ?? "");
          setWeek(found.weekNumber === null ? "" : String(found.weekNumber));
          setSequence(String(found.sequenceNumber));
          setError("");
        })
        .catch((caught: unknown) => {
          if (active) {
            setError(
              caught instanceof Error
                ? caught.message
                : t("无法加载知识点。", "Could not load the topic."),
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [api, courseId, topicId, t]),
  );

  async function save() {
    if (!topic) return;
    setSaving(true);
    setError("");
    try {
      await api.updateTopic(topic.id, {
        title: title.trim(),
        description: description.trim() || null,
        weekNumber: week ? Number(week) : null,
        sequenceNumber: Number(sequence),
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法更新知识点。", "Could not update the topic."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label={t("正在读取知识点…", "Loading topic…")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading eyebrow="Topic" title={t("编辑知识点", "Edit topic")} />
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
        <Field
          label={t("显示顺序", "Display order")}
          keyboardType="number-pad"
          value={sequence}
          onChangeText={setSequence}
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
        disabled={saving || !topic || !title.trim()}
        label={
          saving ? t("正在保存…", "Saving…") : t("保存知识点", "Save topic")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
