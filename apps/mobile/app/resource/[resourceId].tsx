import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { LearningResource, ResourceProposal } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

type ProposalKey = "assessments" | "classSessions" | "topics";

function itemLabel(item: unknown, fallback: string): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return fallback;
  }
  const record = item as Record<string, unknown>;
  return String(
    record.title ??
      record.summary ??
      record.name ??
      record.startTime ??
      fallback,
  );
}

function itemDetails(
  item: unknown,
  key: ProposalKey,
  dayNames: string[],
): string {
  if (typeof item === "string") return "";
  if (!item || typeof item !== "object" || Array.isArray(item)) return "";
  const record = item as Record<string, unknown>;
  if (key === "assessments") {
    return [
      record.assessmentType,
      record.dueLocal,
      record.notes,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (key === "classSessions") {
    const day =
      typeof record.dayOfWeek === "number"
        ? dayNames[record.dayOfWeek]
        : null;
    const dates = record.startDate
      ? `${record.startDate}${
          record.endDate && record.endDate !== record.startDate
            ? ` → ${record.endDate}`
            : ""
        }`
      : null;
    return [
      day,
      record.startTime && record.endTime
        ? `${record.startTime}–${record.endTime}`
        : null,
      record.location,
      dates,
      typeof record.recurrenceRule === "string"
        ? record.recurrenceRule.replace(/^RRULE:/, "").replaceAll(";", " · ")
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

export default function ResourceConfirmationScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const { api } = useSession();
  const { t, language } = useCopy();
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [selected, setSelected] = useState<Record<ProposalKey, number[]>>({
    assessments: [],
    classSessions: [],
    topics: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setResource((await api.resource(resourceId)).resource);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载提取结果。", "Could not load extracted suggestions."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, resourceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function toggle(key: ProposalKey, index: number) {
    setSelected((current) => ({
      ...current,
      [key]: current[key].includes(index)
        ? current[key].filter((value) => value !== index)
        : [...current[key], index],
    }));
  }

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      const result = await api.confirmResource(resourceId, {
        assessmentIndexes: selected.assessments,
        classSessionIndexes: selected.classSessions,
        topicIndexes: selected.topics,
      });
      Alert.alert(
        t("导入完成", "Import complete"),
        t(
          `已应用 ${result.classSessionCount} 个课表项目、${result.assessmentCount} 个截止日期和 ${result.topicCount} 个知识点；跳过 ${result.skippedDuplicateCount} 个重复项目。`,
          `Applied ${result.classSessionCount} timetable item(s), ${result.assessmentCount} deadline(s), and ${result.topicCount} topic(s); skipped ${result.skippedDuplicateCount} duplicate(s).`,
        ),
        [
          {
            text: t("完成", "Done"),
            onPress: () => router.replace("/resources"),
          },
        ],
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法确认导入。", "Could not confirm the import."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在读取提取建议…",
            "Loading extracted suggestions…",
          )}
        />
      </Screen>
    );
  }
  const proposal = resource?.proposal as ResourceProposal | null | undefined;
  const dayNames =
    language === "zh-CN"
      ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Screen>
      <PageHeading
        eyebrow="Explicit confirmation"
        title={t(
          "确认要写入课程的数据",
          "Confirm data to add to your course",
        )}
        lead={t(
          "默认不选择任何项目。请逐项核对日期、时间和标题。",
          "Nothing is selected by default. Check every date, time, and title before importing.",
        )}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("无法确认", "Could not confirm")}
          body={error}
        />
      ) : null}
      {proposal?.warnings?.length ? (
        <InlineNotice
          tone="warning"
          title={t("请检查这些项目", "Check these details")}
          body={proposal.warnings.map((warning) => `• ${warning}`).join("\n")}
        />
      ) : null}
      {(["assessments", "classSessions", "topics"] as const).map((key) => {
        const items = (proposal?.[key] ?? []) as unknown[];
        if (!items.length) return null;
        return (
          <Surface key={key}>
            <Text style={[styles.title, { color: theme.ink }]}>
              {key === "assessments"
                ? t("截止日期", "Assessments")
                : key === "classSessions"
                  ? t("课表", "Class schedule")
                  : t("知识点", "Topics")}
            </Text>
            {items.map((item, index) => {
              const checked = selected[key].includes(index);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  key={`${key}-${index}`}
                  onPress={() => toggle(key, index)}
                  style={styles.row}
                >
                  <View
                    style={[
                      styles.check,
                      {
                        borderColor: theme.accent,
                        backgroundColor: checked
                          ? theme.accent
                          : "transparent",
                      },
                    ]}
                  />
                  <View style={styles.copy}>
                    <Text style={[styles.itemTitle, { color: theme.ink }]}>
                      {itemLabel(
                        item,
                        t("待确认项目", "Item awaiting confirmation"),
                      )}
                    </Text>
                    {itemDetails(item, key, dayNames) ? (
                      <Text style={[styles.detail, { color: theme.muted }]}>
                        {itemDetails(item, key, dayNames)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>
        );
      })}
      <ActionButton
        disabled={saving}
        label={
          saving
            ? t("正在写入…", "Importing…")
            : t(
                `确认导入 ${
                  selected.assessments.length +
                  selected.classSessions.length +
                  selected.topics.length
                } 项`,
                `Import ${
                  selected.assessments.length +
                  selected.classSessions.length +
                  selected.topics.length
                } selected items`,
              )
        }
        onPress={() => void confirm()}
      />
      <ActionButton
        variant="secondary"
        label={t("暂不导入", "Not now")}
        onPress={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: "800" },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  check: { width: 22, height: 22, borderWidth: 2, borderRadius: 6 },
  copy: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontWeight: "800" },
  detail: { fontSize: 13, lineHeight: 18 },
});
