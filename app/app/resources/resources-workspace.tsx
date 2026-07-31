"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

const DAY_LABELS = {
  "zh-CN": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
} as const;

interface CourseOption {
  id: string;
  courseName: string;
  courseCode: string | null;
}

interface ResourceSummary {
  id: string;
  courseId: string | null;
  courseName: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  resourceType: string;
  processingStatus: string;
  failureCode: string | null;
  createdAt: string;
}

interface Proposal {
  assessments: Array<{
    title: string;
    assessmentType: string;
    dueLocal: string | null;
  }>;
  classSessions: Array<{
    title: string;
    sessionType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    mapUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    recurrenceRule?: string | null;
  }>;
  topics: string[];
  warnings?: string[];
}

export function ResourcesWorkspace({
  canUpload,
  courses,
  initialResources,
  language,
  initialCourseId,
  initialResourceType,
}: {
  canUpload: boolean;
  courses: CourseOption[];
  initialResources: ResourceSummary[];
  language: "zh-CN" | "en";
  initialCourseId?: string;
  initialResourceType?: "timetable";
}) {
  const [resources, setResources] = useState(initialResources);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selectedAssessments, setSelectedAssessments] = useState<number[]>(
    [],
  );
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState(
    courses.some((course) => course.id === initialCourseId)
      ? initialCourseId ?? ""
      : courses[0]?.id ?? "",
  );
  const [resourceType, setResourceType] = useState(
    initialResourceType ?? "lecture_notes",
  );
  const [pastedText, setPastedText] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  function updateSummary(resource: ResourceSummary) {
    setResources((current) => [
      resource,
      ...current.filter((item) => item.id !== resource.id),
    ]);
  }

  async function loadResource(resourceId: string) {
    setSelectedId(resourceId);
    setMessage("");
    const response = await fetch(`/api/resources/${resourceId}`);
    const body = (await response.json().catch(() => null)) as
      | {
          resource?: ResourceSummary & { proposal?: Proposal };
          error?: { message?: string };
        }
      | null;
    if (!response.ok || !body?.resource) {
      setMessage(
        body?.error?.message ??
          t("无法读取资料。", "The resource could not be loaded."),
      );
      return;
    }
    updateSummary(body.resource);
    setProposal(body.resource.proposal ?? null);
    setSelectedAssessments([]);
    setSelectedClasses([]);
    setSelectedTopics([]);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/resources", {
      method: "POST",
      body: form,
    });
    const body = (await response.json().catch(() => null)) as
      | {
          resource?: ResourceSummary & { proposal?: Proposal };
          error?: { message?: string };
        }
      | null;
    if (!response.ok || !body?.resource) {
      setMessage(
        body?.error?.message ??
          t("上传失败。", "The upload failed."),
      );
      setBusy(false);
      return;
    }
    updateSummary(body.resource);
    setSelectedId(body.resource.id);
    setProposal(body.resource.proposal ?? null);
    setMessage(
      body.resource.processingStatus === "awaiting_confirmation"
        ? t(
            "提取完成。请逐项选择并确认导入。",
            "Extraction is ready. Review and select each item before importing.",
          )
        : t(
            `文件已保存，但解析状态为 ${body.resource.processingStatus}。`,
            `The file is saved with processing status: ${body.resource.processingStatus}.`,
          ),
    );
    event.currentTarget.reset();
    setBusy(false);
  }

  async function uploadPastedText() {
    if (!uploadCourseId || !pastedText.trim()) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: uploadCourseId,
        resourceType,
        text: pastedText,
        fileName:
          resourceType === "timetable"
            ? "pasted-timetable.txt"
            : "pasted-course-information.txt",
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | {
          resource?: ResourceSummary & { proposal?: Proposal };
          error?: { message?: string };
        }
      | null;
    if (!response.ok || !body?.resource) {
      setMessage(
        body?.error?.message ??
          t("无法处理粘贴内容。", "The pasted text could not be processed."),
      );
      setBusy(false);
      return;
    }
    updateSummary(body.resource);
    setSelectedId(body.resource.id);
    setProposal(body.resource.proposal ?? null);
    setSelectedAssessments([]);
    setSelectedClasses([]);
    setSelectedTopics([]);
    setPastedText("");
    setMessage(
      t(
        "文字已解析。请核对并选择要写入课程的项目。",
        "The text was parsed. Review and choose the items to add.",
      ),
    );
    setBusy(false);
  }

  function toggle(
    value: number,
    current: number[],
    set: (next: number[]) => void,
  ) {
    set(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function confirmImport() {
    if (!selectedId) return;
    setBusy(true);
    setMessage("");
    const response = await fetch(
      `/api/resources/${selectedId}/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentIndexes: selectedAssessments,
          classSessionIndexes: selectedClasses,
          topicIndexes: selectedTopics,
        }),
      },
    );
    const body = (await response.json().catch(() => null)) as
      | {
          assessmentCount?: number;
          classSessionCount?: number;
          topicCount?: number;
          skippedDuplicateCount?: number;
          error?: { message?: string };
        }
      | null;
    if (!response.ok) {
      setMessage(
        body?.error?.message ??
          t("无法确认导入。", "The import could not be confirmed."),
      );
      setBusy(false);
      return;
    }
    setMessage(
      t(
        `已应用 ${body?.assessmentCount ?? 0} 个截止日期、${body?.classSessionCount ?? 0} 个课表项目和 ${body?.topicCount ?? 0} 个知识点；跳过 ${body?.skippedDuplicateCount ?? 0} 个重复项目。`,
        `Applied ${body?.assessmentCount ?? 0} deadline(s), ${body?.classSessionCount ?? 0} timetable item(s), and ${body?.topicCount ?? 0} topic(s); skipped ${body?.skippedDuplicateCount ?? 0} duplicate(s).`,
      ),
    );
    setProposal(null);
    setResources((current) =>
      current.map((resource) =>
        resource.id === selectedId
          ? { ...resource, processingStatus: "ready" }
          : resource,
      ),
    );
    setBusy(false);
  }

  async function retry(resourceId: string) {
    setBusy(true);
    const response = await fetch(`/api/resources/${resourceId}/process`, {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | {
          resource?: ResourceSummary & { proposal?: Proposal };
          error?: { message?: string };
        }
      | null;
    if (response.ok && body?.resource) {
      updateSummary(body.resource);
      setSelectedId(resourceId);
      setProposal(body.resource.proposal ?? null);
      setMessage(t("已完成重试。", "Processing was retried."));
    } else {
      setMessage(
        body?.error?.message ??
          t("重试失败。", "Processing could not be retried."),
      );
    }
    setBusy(false);
  }

  async function remove(resourceId: string) {
    if (
      !window.confirm(
        t(
          "删除这个私人文件及其提取文本？",
          "Delete this private file and its extracted text?",
        ),
      )
    )
      return;
    setBusy(true);
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as
      | { physicallyDeleted?: boolean; error?: { message?: string } }
      | null;
    if (response.ok) {
      setResources((current) =>
        current.filter((resource) => resource.id !== resourceId),
      );
      if (selectedId === resourceId) {
        setSelectedId(null);
        setProposal(null);
      }
      setMessage(
        body?.physicallyDeleted
          ? t(
              "文件和提取内容已删除。",
              "The file and extracted content were deleted.",
            )
          : t(
              "文件已从界面移除，后台将重试物理删除。",
              "The file is hidden; physical deletion will be retried.",
            ),
      );
    } else {
      setMessage(
        body?.error?.message ??
          t("删除失败。", "The file could not be deleted."),
      );
    }
    setBusy(false);
  }

  return (
    <div className="saas-resource-layout">
      <section className="saas-card">
        <h2>{t("上传私人资料", "Upload a private resource")}</h2>
        {!canUpload ? (
          <div className="saas-paywall-note">
            <p>
              {t(
                "私人文件上传属于学期通行证功能。",
                "Private file uploads require a Semester Pass.",
              )}
            </p>
            <Link
              className="saas-button saas-button-primary"
              href="/app/settings/billing"
            >
              {t("查看方案", "View plans")}
            </Link>
          </div>
        ) : courses.length ? (
          <form className="saas-form" onSubmit={upload}>
            <div className="saas-field">
              <label htmlFor="resource-course">
                {t("课程", "Course")}
              </label>
              <select
                id="resource-course"
                name="courseId"
                required
                value={uploadCourseId}
                onChange={(event) => setUploadCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {[course.courseCode, course.courseName]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="saas-field">
              <label htmlFor="resource-type">
                {t("资料类型", "Resource type")}
              </label>
              <select
                id="resource-type"
                name="resourceType"
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
              >
                <option value="lecture_notes">Lecture notes</option>
                <option value="subject_information">
                  Subject Information
                </option>
                <option value="assessment_information">
                  Assessment Information
                </option>
                <option value="timetable">Timetable / ICS</option>
                <option value="personal_notes">Personal notes</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="saas-field">
              <label htmlFor="resource-file">
                {t("文件（最大 10 MB）", "File (maximum 10 MB)")}
              </label>
              <input
                id="resource-file"
                name="file"
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.md,.ics,application/pdf,image/jpeg,image/png,image/webp,text/plain,text/calendar"
              />
            </div>
            <button
              className="saas-button saas-button-primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? t("处理中…", "Processing…")
                : t(
                    "上传并提取候选数据",
                    "Upload and extract proposed data",
                  )}
            </button>
            <div className="saas-field">
              <label htmlFor="resource-pasted-text">
                {resourceType === "timetable"
                  ? t(
                      "或粘贴课表文字",
                      "Or paste timetable text",
                    )
                  : t(
                      "或粘贴课程资料文字",
                      "Or paste course information",
                    )}
              </label>
              <textarea
                id="resource-pasted-text"
                rows={7}
                maxLength={200_000}
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                placeholder={t(
                  "例如：Monday 09:00–11:00 Lecture | Building 11, Room 201\n周三 14:00–16:00 实验课 | CB10.02.330",
                  "Example: Monday 09:00–11:00 Lecture | Building 11, Room 201\nWednesday 14:00–16:00 Lab | CB10.02.330",
                )}
              />
            </div>
            <button
              className="saas-button saas-button-secondary"
              type="button"
              disabled={busy || !pastedText.trim()}
              onClick={() => void uploadPastedText()}
            >
              {busy
                ? t("处理中…", "Processing…")
                : t(
                    "解析粘贴内容",
                    "Parse pasted text",
                  )}
            </button>
          </form>
        ) : (
          <p>
            <Link href="/app/courses">
              {t("先添加一门课程", "Add a course first")}
            </Link>
            。
          </p>
        )}
      </section>

      <section className="saas-card">
        <h2>{t("我的资料", "My resources")}</h2>
        <div className="saas-resource-list">
          {resources.length ? (
            resources.map((resource) => (
              <article
                className={
                  selectedId === resource.id ? "is-selected" : ""
                }
                key={resource.id}
              >
                <button
                  type="button"
                  onClick={() => loadResource(resource.id)}
                >
                  <strong>{resource.fileName}</strong>
                  <span>
                    {resource.courseName} ·{" "}
                    {(resource.fileSize / 1024).toFixed(1)} KB
                  </span>
                  <span>{resource.processingStatus}</span>
                </button>
                <div>
                  <a href={`/api/resources/${resource.id}/download`}>
                    {t("下载", "Download")}
                  </a>
                  {resource.processingStatus === "failed" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => retry(resource.id)}
                    >
                      {t("重试", "Retry")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(resource.id)}
                  >
                    {t("删除", "Delete")}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="saas-muted">
              {t("还没有上传资料。", "No resources uploaded yet.")}
            </p>
          )}
        </div>
      </section>

      {proposal ? (
        <section className="saas-card saas-resource-confirm">
          <div>
            <p className="saas-eyebrow">Confirmation required</p>
            <h2>{t("选择要导入的项目", "Choose items to import")}</h2>
            <p className="saas-muted">
              {t(
                "默认不选中任何内容。请核对日期、时间和标题。",
                "Nothing is selected by default. Check every date, time, and title.",
              )}
            </p>
          </div>
          {proposal.warnings?.length ? (
            <div className="saas-paywall-note" role="status">
              <strong>{t("需要检查", "Check these details")}</strong>
              <ul>
                {proposal.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <fieldset className="saas-checkbox-list">
            <legend>
              {t("Assessment / 截止日期", "Assessments / deadlines")}
            </legend>
            {proposal.assessments.length ? (
              proposal.assessments.map((assessment, index) => (
                <label key={`${assessment.title}-${index}`}>
                  <input
                    type="checkbox"
                    checked={selectedAssessments.includes(index)}
                    onChange={() =>
                      toggle(
                        index,
                        selectedAssessments,
                        setSelectedAssessments,
                      )
                    }
                  />
                  <span>
                    {assessment.title} ·{" "}
                    {assessment.dueLocal ?? t("无日期", "No date")}
                  </span>
                </label>
              ))
            ) : (
              <p className="saas-muted">
                {t("未识别到截止日期。", "No deadlines were detected.")}
              </p>
            )}
          </fieldset>
          <fieldset className="saas-checkbox-list">
            <legend>{t("课表", "Timetable")}</legend>
            {proposal.classSessions.length ? (
              proposal.classSessions.map((session, index) => (
                <label key={`${session.title}-${index}`}>
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(index)}
                    onChange={() =>
                      toggle(index, selectedClasses, setSelectedClasses)
                    }
                  />
                  <span>
                    {session.title} ·{" "}
                    {DAY_LABELS[language][session.dayOfWeek] ??
                      session.dayOfWeek}{" "}
                    {session.startTime}–{session.endTime}
                    {session.location ? ` · ${session.location}` : ""}
                    {session.startDate
                      ? ` · ${session.startDate}${
                          session.endDate &&
                          session.endDate !== session.startDate
                            ? ` → ${session.endDate}`
                            : ""
                        }`
                      : ""}
                    {session.recurrenceRule
                      ? ` · ${session.recurrenceRule
                          .replace(/^RRULE:/, "")
                          .replaceAll(";", " · ")}`
                      : ""}
                  </span>
                </label>
              ))
            ) : (
              <p className="saas-muted">
                {t(
                  "未识别到课表项目。",
                  "No timetable items were detected.",
                )}
              </p>
            )}
          </fieldset>
          <fieldset className="saas-checkbox-list">
            <legend>{t("知识点", "Topics")}</legend>
            {proposal.topics.length ? (
              proposal.topics.map((topic, index) => (
                <label key={`${topic}-${index}`}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(index)}
                    onChange={() =>
                      toggle(index, selectedTopics, setSelectedTopics)
                    }
                  />
                  <span>{topic}</span>
                </label>
              ))
            ) : (
              <p className="saas-muted">
                {t("未识别到知识点。", "No topics were detected.")}
              </p>
            )}
          </fieldset>
          <button
            className="saas-button saas-button-primary"
            type="button"
            disabled={busy}
            onClick={confirmImport}
          >
            {t("确认导入所选项目", "Import selected items")}
          </button>
        </section>
      ) : null}

      {message ? (
        <p className="saas-status-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
