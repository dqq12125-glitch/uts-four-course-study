import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSession } from "@/src/auth/session-context";
import { defaultSemesterDates } from "@/src/lib/dates";
import {
  ActionButton,
  Field,
  InlineNotice,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { mobileCopy } from "@/src/i18n";

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { api, user, refreshSession } = useSession();
  const defaults = useMemo(() => defaultSemesterDates(), []);
  const detectedTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney";
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [institutionName, setInstitutionName] = useState(
    "University of Technology Sydney",
  );
  const [semesterName, setSemesterName] = useState("Spring 2026");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("60");
  const [language, setLanguage] = useState<"zh-CN" | "en">(
    user?.preferredLanguage ?? "zh-CN",
  );
  const [hasClass, setHasClass] = useState(false);
  const [classTitle, setClassTitle] = useState("Lecture");
  const [classDay, setClassDay] = useState("1");
  const [classStart, setClassStart] = useState("09:00");
  const [classEnd, setClassEnd] = useState("10:00");
  const [classLocation, setClassLocation] = useState("");
  const [hasAssessment, setHasAssessment] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentDueDate, setAssessmentDueDate] = useState("");
  const [assessmentWeight, setAssessmentWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) => mobileCopy(language, zh, en);

  async function complete() {
    setSaving(true);
    setError("");
    try {
      await api.completeOnboarding({
        displayName: displayName.trim() || null,
        language,
        timezone: timezone.trim(),
        dailyStudyMinutes: Number(dailyMinutes),
        semester: {
          institutionId: null,
          institutionName: institutionName.trim(),
          name: semesterName.trim(),
          startDate,
          endDate,
        },
        course: {
          templateId: null,
          courseCode: courseCode.trim() || null,
          courseName: courseName.trim(),
          colourKey: "forest",
          instructorName: null,
        },
        classSessions: hasClass
          ? [
              {
                sessionType: "lecture",
                title: classTitle.trim(),
                dayOfWeek: Number(classDay),
                startTime: classStart,
                endTime: classEnd,
                location: classLocation.trim() || null,
                mapUrl: null,
              },
            ]
          : [],
        assessments: hasAssessment
          ? [
              {
                title: assessmentTitle.trim(),
                assessmentType: "assignment",
                dueAt: assessmentDueDate
                  ? new Date(`${assessmentDueDate}T23:59:00`).toISOString()
                  : null,
                weightPercent: assessmentWeight
                  ? Number(assessmentWeight)
                  : null,
                estimatedMinutes: 60,
                notes: null,
              },
            ]
          : [],
      });
      await refreshSession();
      router.replace("/(tabs)/today");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "暂时无法创建你的学期。",
              "Your semester could not be created.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  const valid = Boolean(
    institutionName.trim() &&
    semesterName.trim() &&
    courseName.trim() &&
    timezone.trim() &&
    Number(dailyMinutes) >= 15 &&
    startDate <= endDate,
  );

  return (
    <Screen>
      <PageHeading
        eyebrow="5-minute setup"
        title={t(
          "先建立你的第一个可执行学期",
          "Create your first executable semester",
        )}
        lead={t(
          "课程可以来自任何大学、任何专业；四门 UTS 课程只是可选模板。",
          "Courses can come from any institution or discipline; the four UTS courses are optional templates.",
        )}
      />
      <Surface>
        <Field
          label={t("你的名字（可选）", "Your name (optional)")}
          placeholder={t("如何称呼你", "What should we call you?")}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Field
          autoCapitalize="none"
          label={t("时区", "Timezone")}
          value={timezone}
          onChangeText={setTimezone}
        />
        <Text style={[styles.label, { color: theme.ink }]}>
          {t("界面与解释语言", "Interface and explanation language")}
        </Text>
        <View style={styles.languageRow}>
          {(["zh-CN", "en"] as const).map((value) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: language === value }}
              key={value}
              onPress={() => setLanguage(value)}
              style={[
                styles.languageButton,
                {
                  borderColor:
                    language === value ? theme.accent : theme.line,
                },
              ]}
            >
              <Text style={{ color: theme.ink }}>
                {value === "zh-CN" ? "中文" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Surface>
      <Surface>
        <Field
          label={t("学校", "Institution")}
          value={institutionName}
          onChangeText={setInstitutionName}
        />
        <Field
          label={t("学期名称", "Semester name")}
          value={semesterName}
          onChangeText={setSemesterName}
        />
        <Field
          autoCapitalize="none"
          label={t("开始日期（YYYY-MM-DD）", "Start date (YYYY-MM-DD)")}
          value={startDate}
          onChangeText={setStartDate}
        />
        <Field
          autoCapitalize="none"
          label={t("结束日期（YYYY-MM-DD）", "End date (YYYY-MM-DD)")}
          value={endDate}
          onChangeText={setEndDate}
        />
      </Surface>
      <Surface>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>
            {t("现在添加一条课表", "Add a class session now")}
          </Text>
          <Switch value={hasClass} onValueChange={setHasClass} />
        </View>
        {hasClass ? (
          <>
            <Field
              label={t("课程安排名称", "Class session title")}
              value={classTitle}
              onChangeText={setClassTitle}
            />
            <Field
              label={t(
                "星期（0 周日–6 周六）",
                "Day (0 Sunday–6 Saturday)",
              )}
              keyboardType="number-pad"
              value={classDay}
              onChangeText={setClassDay}
            />
            <Field
              label={t("开始时间（HH:mm）", "Start time (HH:mm)")}
              value={classStart}
              onChangeText={setClassStart}
            />
            <Field
              label={t("结束时间（HH:mm）", "End time (HH:mm)")}
              value={classEnd}
              onChangeText={setClassEnd}
            />
            <Field
              label={t("教室（可选）", "Location (optional)")}
              value={classLocation}
              onChangeText={setClassLocation}
            />
          </>
        ) : null}
      </Surface>
      <Surface>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>
            {t("现在添加一个截止日期", "Add a deadline now")}
          </Text>
          <Switch value={hasAssessment} onValueChange={setHasAssessment} />
        </View>
        {hasAssessment ? (
          <>
            <Field
              label={t("Assessment 名称", "Assessment title")}
              value={assessmentTitle}
              onChangeText={setAssessmentTitle}
            />
            <Field
              label={t(
                "截止日期（YYYY-MM-DD，可选）",
                "Due date (YYYY-MM-DD, optional)",
              )}
              value={assessmentDueDate}
              onChangeText={setAssessmentDueDate}
            />
            <Field
              label={t("权重百分比（可选）", "Weight percent (optional)")}
              keyboardType="decimal-pad"
              value={assessmentWeight}
              onChangeText={setAssessmentWeight}
            />
          </>
        ) : null}
      </Surface>
      <Surface>
        <Field
          autoCapitalize="characters"
          label={t("课程代码（可选）", "Course code (optional)")}
          placeholder={t("例如 BIO101", "For example: BIO101")}
          value={courseCode}
          onChangeText={setCourseCode}
        />
        <Field
          label={t("课程名称", "Course name")}
          placeholder={t("例如 Marine Biology", "For example: Marine Biology")}
          value={courseName}
          onChangeText={setCourseName}
        />
        <Field
          keyboardType="number-pad"
          label={t("每日学习分钟数", "Daily study minutes")}
          value={dailyMinutes}
          onChangeText={setDailyMinutes}
        />
      </Surface>
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("无法完成设置", "Setup could not be completed")}
          body={error}
        />
      ) : null}
      <ActionButton
        disabled={saving || !valid}
        label={
          saving
            ? t("正在生成第一份计划…", "Generating your first plan…")
            : t("生成我的今日计划", "Generate my plan for today")
        }
        onPress={() => void complete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700" },
  languageRow: { flexDirection: "row", gap: 8 },
  languageButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  toggleRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: "800" },
});
