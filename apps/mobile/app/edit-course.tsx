import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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

export default function EditCourseScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { api } = useSession();
  const { t } = useCopy();
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [colourKey, setColourKey] = useState("ocean");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void api
        .course(courseId)
        .then(({ course }) => {
          if (!active) return;
          setCourseCode(course.courseCode ?? "");
          setCourseName(course.courseName);
          setInstructorName(course.instructorName ?? "");
          setColourKey(course.colourKey);
          setError("");
        })
        .catch((caught: unknown) => {
          if (active) {
            setError(
              caught instanceof Error
                ? caught.message
                : t("无法加载课程。", "Could not load the course."),
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [api, courseId, t]),
  );

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.updateCourse(courseId, {
        courseCode: courseCode.trim() || null,
        courseName: courseName.trim(),
        colourKey,
        instructorName: instructorName.trim() || null,
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法更新课程。", "Could not update the course."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label={t("正在读取课程…", "Loading course…")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Open course"
        title={t("编辑课程", "Edit course")}
        lead={t(
          "课程名称是必填项；代码、教师和颜色标签可以修改。",
          "Course name is required. Code, instructor, and colour key can be changed.",
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
        <Field
          label={t("颜色标签", "Colour key")}
          value={colourKey}
          maxLength={24}
          onChangeText={setColourKey}
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
        disabled={saving || !courseName.trim()}
        label={
          saving ? t("正在保存…", "Saving…") : t("保存课程", "Save course")
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
