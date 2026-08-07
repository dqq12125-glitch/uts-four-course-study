import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { ClassSession } from "@/src/api/types";
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

export default function EditClassScreen() {
  const router = useRouter();
  const { courseId, classSessionId } = useLocalSearchParams<{
    courseId: string;
    classSessionId: string;
  }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [session, setSession] = useState<ClassSession | null>(null);
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("lecture");
  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void api
        .classSessions(courseId)
        .then(({ classSessions }) => {
          if (!active) return;
          const found = classSessions.find(
            (item) => item.id === classSessionId,
          );
          if (!found) {
            throw new Error(
              t(
                "课程安排不存在或不属于当前账户。",
                "The class session does not exist or does not belong to this account.",
              ),
            );
          }
          setSession(found);
          setTitle(found.title);
          setSessionType(found.sessionType);
          setDay(String(found.dayOfWeek));
          setStart(found.startTime);
          setEnd(found.endTime);
          setLocation(found.location ?? "");
          setMapUrl(found.mapUrl ?? "");
          setError("");
        })
        .catch((caught: unknown) => {
          if (active) {
            setError(
              caught instanceof Error
                ? caught.message
                : t(
                    "无法加载课程安排。",
                    "Could not load the class session.",
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
    }, [api, classSessionId, courseId, t]),
  );

  async function save() {
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      await api.updateClassSession(session.id, {
        sessionType,
        title: title.trim(),
        dayOfWeek: Number(day),
        startTime: start,
        endTime: end,
        location: location.trim() || null,
        mapUrl: mapUrl.trim() || null,
        startDate: session.startDate,
        endDate: session.endDate,
        recurrenceRule: session.recurrenceRule,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法更新课程安排。", "Could not update the class session."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在读取课程安排…", "Loading class session…")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Weekly timetable"
        title={t("编辑课程安排", "Edit class session")}
        lead={t(
          "星期使用 0（周日）到 6（周六）。",
          "Use 0 for Sunday through 6 for Saturday.",
        )}
      />
      <Surface>
        <Field label={t("名称", "Title")} value={title} onChangeText={setTitle} />
        <Field
          label={t("类型", "Type")}
          value={sessionType}
          onChangeText={setSessionType}
        />
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
        <Field
          label={t("地图链接（可选）", "Map URL (optional)")}
          autoCapitalize="none"
          keyboardType="url"
          value={mapUrl}
          onChangeText={setMapUrl}
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
        disabled={saving || !session || !title.trim()}
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
