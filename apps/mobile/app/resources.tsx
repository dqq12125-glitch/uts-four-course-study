import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { Course, LearningResource } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import { supportedMimeType } from "@/src/lib/files";
import {
  ActionButton,
  EmptyState,
  Field,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

const RESOURCE_TYPES = [
  "lecture_notes",
  "subject_information",
  "assessment_information",
  "personal_notes",
  "timetable",
  "other",
] as const;

export default function ResourcesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useCopy();
  const params = useLocalSearchParams<{
    courseId?: string;
    resourceType?: string;
  }>();
  const { api } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [courseId, setCourseId] = useState(params.courseId ?? "");
  const [resourceType, setResourceType] =
    useState<(typeof RESOURCE_TYPES)[number]>(
      params.resourceType === "timetable" ? "timetable" : "lecture_notes",
    );
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [courseResult, resourceResult] = await Promise.all([
        api.courses(),
        api.resources(),
      ]);
      setCourses(courseResult.courses);
      setResources(resourceResult.resources);
      setCourseId((current) => current || courseResult.courses[0]?.id || "");
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载私人资料。", "Could not load private resources."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function uploadSelectedFile(input: {
    uri: string;
    fileName: string;
    mimeType: string;
    fileSize?: number | null;
  }) {
    if (!courseId) return;
    if ((input.fileSize ?? 0) > 10 * 1024 * 1024) {
      setError(t("文件不能超过 10 MB。", "Files must be 10 MB or smaller."));
      return;
    }
    const mimeType = supportedMimeType(input.fileName, input.mimeType);
    if (!mimeType) {
      setError(
        t(
          "只支持 PDF、JPG、PNG、WebP、TXT 和 ICS 文件。",
          "Only PDF, JPG, PNG, WebP, TXT, and ICS files are supported.",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const uploaded = await api.uploadResource({
        courseId,
        resourceType,
        uri: input.uri,
        fileName: input.fileName,
        mimeType,
      });
      await load();
      if (uploaded.resource.processingStatus === "awaiting_confirmation") {
        router.push({
          pathname: "/resource/[resourceId]",
          params: { resourceId: uploaded.resource.id },
        });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法上传文件。", "Could not upload the file."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function pickAndUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/plain",
        "text/calendar",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    await uploadSelectedFile({
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType ?? "",
      fileSize: asset.size,
    });
  }

  async function pickTimetableScreenshot() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        t(
          "需要照片权限才能选择课表截图。",
          "Photo permission is needed to select a timetable screenshot.",
        ),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    const mimeType = asset.mimeType ?? "image/jpeg";
    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    await uploadSelectedFile({
      uri: asset.uri,
      fileName:
        asset.fileName ?? `timetable-screenshot-${Date.now()}.${extension}`,
      mimeType,
      fileSize: asset.fileSize,
    });
  }

  async function uploadPastedText() {
    if (!courseId || !pastedText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await api.uploadTextResource({
        courseId,
        resourceType,
        text: pastedText,
        fileName:
          resourceType === "timetable"
            ? "pasted-timetable.txt"
            : "pasted-course-information.txt",
      });
      setPastedText("");
      await load();
      router.push({
        pathname: "/resource/[resourceId]",
        params: { resourceId: uploaded.resource.id },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "无法处理粘贴的文字。",
              "Could not process the pasted text.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(resource: LearningResource) {
    setBusy(true);
    try {
      await api.deleteResource(resource.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法删除资料。", "Could not delete the resource."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function retry(resource: LearningResource) {
    setBusy(true);
    try {
      await api.processResource(resource.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法重新处理资料。", "Could not process the resource again."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在读取私人资料列表…",
            "Loading your private resources…",
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Private by default"
        title={t("学习资料", "Study resources")}
        lead={t(
          "PDF、图片、文本和 ICS 最多 10 MB。提取结果只有经你确认后才会写入课程。",
          "Upload PDFs, images, text, or ICS files up to 10 MB. Extracted data is only added after you confirm it.",
        )}
      />
      <InlineNotice
        title={t(
          "不会自动共享或训练公共模型",
          "Never shared automatically or used to train public models",
        )}
        body={t(
          "存储路径使用不可预测的用户命名空间；访问始终通过当前账户授权。",
          "Storage uses an unpredictable user namespace, and access always requires your account authorization.",
        )}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("操作未完成", "Action not completed")}
          body={error}
        />
      ) : null}
      {courses.length ? (
        <Surface>
          <Text style={[styles.label, { color: theme.ink }]}>
            {t("课程", "Course")}
          </Text>
          <View style={styles.chips}>
            {courses.map((course) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: course.id === courseId }}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      course.id === courseId ? theme.accent : theme.line,
                  },
                ]}
                key={course.id}
                onPress={() => setCourseId(course.id)}
              >
                <Text style={{ color: theme.ink }}>
                  {course.courseCode || course.courseName}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { color: theme.ink }]}>
            {t("资料类型", "Resource type")}
          </Text>
          <View style={styles.chips}>
            {RESOURCE_TYPES.map((value) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: value === resourceType }}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      value === resourceType ? theme.accent : theme.line,
                  },
                ]}
                key={value}
                onPress={() => setResourceType(value)}
              >
                <Text style={{ color: theme.ink }}>
                  {value.replaceAll("_", " ")}
                </Text>
              </Pressable>
            ))}
          </View>
          <ActionButton
            disabled={busy}
            label={
              busy
                ? t("正在上传…", "Uploading…")
                : t(
                    "从“文件”选择 ICS、PDF 或图片",
                    "Choose ICS, PDF, or image from Files",
                  )
            }
            onPress={() => void pickAndUpload()}
          />
          {resourceType === "timetable" ? (
            <ActionButton
              variant="secondary"
              disabled={busy}
              label={t(
                "从“照片”选择课表截图",
                "Choose timetable screenshot from Photos",
              )}
              onPress={() => void pickTimetableScreenshot()}
            />
          ) : null}
          <Field
            label={
              resourceType === "timetable"
                ? t("或粘贴课表文字", "Or paste timetable text")
                : t("或粘贴课程资料文字", "Or paste course information")
            }
            multiline
            numberOfLines={7}
            maxLength={200_000}
            textAlignVertical="top"
            placeholder={t(
              "例如：Monday 09:00–11:00 Lecture | Building 11, Room 201\n周三 14:00–16:00 实验课 | CB10.02.330",
              "Example: Monday 09:00–11:00 Lecture | Building 11, Room 201\nWednesday 14:00–16:00 Lab | CB10.02.330",
            )}
            value={pastedText}
            onChangeText={setPastedText}
          />
          <ActionButton
            variant="secondary"
            disabled={busy || !pastedText.trim()}
            label={t("解析粘贴内容", "Parse pasted text")}
            onPress={() => void uploadPastedText()}
          />
        </Surface>
      ) : null}

      {resources.length ? (
        resources.map((resource) => (
          <Surface key={resource.id}>
            <Text style={[styles.title, { color: theme.ink }]}>
              {resource.fileName}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {resource.courseName} · {resource.resourceType.replaceAll("_", " ")}
              {" · "}
              {resource.processingStatus}
            </Text>
            <View style={styles.actions}>
              {resource.processingStatus === "awaiting_confirmation" ? (
                <ActionButton
                  label={t("检查并确认导入", "Review and confirm import")}
                  onPress={() =>
                    router.push({
                      pathname: "/resource/[resourceId]",
                      params: { resourceId: resource.id },
                    })
                  }
                />
              ) : null}
              {resource.processingStatus === "failed" ? (
                <ActionButton
                  variant="secondary"
                  disabled={busy}
                  label={t("重新处理", "Process again")}
                  onPress={() => void retry(resource)}
                />
              ) : null}
              <ActionButton
                variant="danger"
                disabled={busy}
                label={t("删除资料", "Delete resource")}
                onPress={() =>
                  Alert.alert(
                    t("删除私人资料？", "Delete private resource?"),
                    t(
                      "资料会立即从界面消失，并进入后台物理删除流程。",
                      "It will disappear immediately and enter the background deletion process.",
                    ),
                    [
                      { text: t("取消", "Cancel"), style: "cancel" },
                      {
                        text: t("删除", "Delete"),
                        style: "destructive",
                        onPress: () => void remove(resource),
                      },
                    ],
                  )
                }
              />
            </View>
          </Surface>
        ))
      ) : (
        <EmptyState
          title={t("还没有私人资料", "No private resources yet")}
          body={t(
            "上传功能需要有效的学期通行证。",
            "Resource uploads require an active semester pass.",
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 13,
  },
  title: { fontSize: 17, fontWeight: "800" },
  meta: { fontSize: 13, lineHeight: 19 },
  actions: { gap: 8 },
});
