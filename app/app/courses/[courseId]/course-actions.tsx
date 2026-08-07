"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface CourseActionsProps {
  course: {
    id: string;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    instructorName: string | null;
  };
  language: "zh-CN" | "en";
}

export function CourseActions({ course, language }: CourseActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode: form.get("courseCode") || null,
        courseName: form.get("courseName"),
        colourKey: form.get("colourKey"),
        instructorName: form.get("instructorName") || null,
      }),
    });
    if (!response.ok) {
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      setError(
        result.error?.message ??
          t("无法更新课程。", "The course could not be updated."),
      );
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function archive() {
    if (
      !window.confirm(
        t(
          "归档这门课程？相关内容将从普通界面隐藏。",
          "Archive this course? Its content will be hidden from normal views.",
        ),
      )
    )
      return;
    const response = await fetch(`/api/courses/${course.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(t("无法归档课程。", "The course could not be archived."));
      return;
    }
    router.push("/app/courses");
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        <div className="saas-task-actions">
          <button
            type="button"
            className="saas-text-button"
            onClick={() => setEditing(true)}
          >
            {t("编辑课程", "Edit course")}
          </button>
          <button
            type="button"
            className="saas-text-button is-danger"
            onClick={archive}
          >
            {t("归档课程", "Archive course")}
          </button>
        </div>
        {error ? (
          <p className="saas-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="saas-form saas-card" onSubmit={save}>
      <div className="saas-form-grid">
        <div className="saas-field">
          <label htmlFor="edit-course-code">
            {t("课程代码（可选）", "Course code (optional)")}
          </label>
          <input
            id="edit-course-code"
            name="courseCode"
            defaultValue={course.courseCode ?? ""}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="edit-course-name">
            {t("课程名称", "Course name")}
          </label>
          <input
            id="edit-course-name"
            name="courseName"
            defaultValue={course.courseName}
            required
          />
        </div>
        <div className="saas-field">
          <label htmlFor="edit-course-instructor">
            {t("教师", "Instructor")}
          </label>
          <input
            id="edit-course-instructor"
            name="instructorName"
            defaultValue={course.instructorName ?? ""}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="edit-course-colour">
            {t("颜色", "Colour")}
          </label>
          <select
            id="edit-course-colour"
            name="colourKey"
            defaultValue={course.colourKey}
          >
            <option value="ocean">{t("海蓝", "Ocean")}</option>
            <option value="forest">{t("森林", "Forest")}</option>
            <option value="amber">{t("琥珀", "Amber")}</option>
            <option value="violet">{t("紫罗兰", "Violet")}</option>
            <option value="rose">{t("玫瑰", "Rose")}</option>
            <option value="slate">{t("岩灰", "Slate")}</option>
          </select>
        </div>
      </div>
      <div className="saas-task-actions">
        <button className="saas-button saas-button-primary" type="submit">
          {t("保存", "Save")}
        </button>
        <button
          className="saas-button saas-button-secondary"
          type="button"
          onClick={() => setEditing(false)}
        >
          {t("取消", "Cancel")}
        </button>
      </div>
    </form>
  );
}
