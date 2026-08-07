import { useState } from "react";
import { useRouter } from "expo-router";
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

export default function NewCourseScreen() {
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await api.createCourse({
        templateId: null,
        courseCode: courseCode.trim() || null,
        courseName: courseName.trim(),
        colourKey: "ocean",
        instructorName: instructorName.trim() || null,
      });
      router.replace({
        pathname: "/course/[courseId]",
        params: { courseId: result.courseId },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法创建课程。", "Could not create the course."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Open course"
        title={t("添加任意课程", "Add any course")}
        lead={t(
          "课程名称是唯一必填项；学校模板和课程代码都可以为空。",
          "Only the course name is required. Institution templates and course codes are optional.",
        )}
      />
      <Surface>
        <Field
          autoCapitalize="characters"
          label={t("课程代码（可选）", "Course code (optional)")}
          value={courseCode}
          maxLength={32}
          onChangeText={setCourseCode}
        />
        <Field
          label={t("课程名称", "Course name")}
          value={courseName}
          maxLength={160}
          onChangeText={setCourseName}
        />
        <Field
          label={t("教师（可选）", "Instructor (optional)")}
          value={instructorName}
          maxLength={120}
          onChangeText={setInstructorName}
        />
      </Surface>
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("无法添加课程", "Could not add course")}
          body={error}
        />
      ) : null}
      <ActionButton
        disabled={saving || !courseName.trim()}
        label={
          saving
            ? t("正在保存…", "Saving…")
            : t(
                "保存并生成第一项任务",
                "Save and generate the first task",
              )
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
