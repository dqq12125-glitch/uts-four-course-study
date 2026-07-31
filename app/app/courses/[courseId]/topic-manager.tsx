"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  weekNumber: number | null;
  sequenceNumber: number;
  masteryScore: number | null;
  nextReviewAt: string | null;
  attemptCount: number;
}

function masteryLabel(
  topic: Topic,
  language: "zh-CN" | "en",
): string {
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;
  if (topic.attemptCount === 0 || topic.masteryScore === null) {
    return t("未开始", "Not started");
  }
  if (
    topic.nextReviewAt &&
    Date.parse(topic.nextReviewAt) <= Date.now()
  ) {
    return t("需要复测", "Retest due");
  }
  if (topic.masteryScore < 40) return t("正在建立", "Building");
  if (topic.masteryScore < 70) return t("基本掌握", "Basic mastery");
  return t("稳定掌握", "Stable mastery");
}

export function TopicManager({
  courseId,
  topics,
  language,
}: {
  courseId: string;
  topics: Topic[];
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function save(
    event: React.FormEvent<HTMLFormElement>,
    topicId?: string,
  ) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(
      topicId ? `/api/topics/${topicId}` : `/api/courses/${courseId}/topics`,
      {
        method: topicId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(data.get("title")),
          description: String(data.get("description") || "") || null,
          weekNumber: data.get("weekNumber")
            ? Number(data.get("weekNumber"))
            : null,
          sequenceNumber: Number(data.get("sequenceNumber") || 0),
        }),
      },
    );
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法保存知识点。", "The topic could not be saved."),
      );
    } else {
      event.currentTarget.reset();
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(topicId: string) {
    if (
      !window.confirm(
        t(
          "删除这个尚无学习证据的知识点？",
          "Delete this topic with no learning evidence?",
        ),
      )
    )
      return;
    setBusy(true);
    const response = await fetch(`/api/topics/${topicId}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        body.error?.message ??
          t("无法删除知识点。", "The topic could not be deleted."),
      );
    }
    else router.refresh();
    setBusy(false);
  }

  return (
    <section className="saas-card">
      <div className="saas-section-heading">
        <div>
          <p className="saas-eyebrow">Topics</p>
          <h2>{t("知识点与掌握状态", "Topics and mastery state")}</h2>
        </div>
      </div>
      {error ? (
        <p className="saas-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {topics.length ? (
        <div className="saas-management-list">
          {topics.map((topic) => (
            <details key={topic.id}>
              <summary>
                <strong>{topic.title}</strong>
                <span>
                  {masteryLabel(topic, language)} ·{" "}
                  {t(
                    `${topic.attemptCount} 次练习`,
                    `${topic.attemptCount} practice attempt${
                      topic.attemptCount === 1 ? "" : "s"
                    }`,
                  )}
                </span>
              </summary>
              <form onSubmit={(event) => void save(event, topic.id)}>
                <div className="saas-form-grid">
                  <div className="saas-field">
                    <label htmlFor={`topic-title-${topic.id}`}>
                      {t("名称", "Title")}
                    </label>
                    <input
                      id={`topic-title-${topic.id}`}
                      name="title"
                      defaultValue={topic.title}
                      required
                      maxLength={160}
                    />
                  </div>
                  <div className="saas-field">
                    <label htmlFor={`topic-week-${topic.id}`}>
                      {t("周次", "Week")}
                    </label>
                    <input
                      id={`topic-week-${topic.id}`}
                      name="weekNumber"
                      type="number"
                      min={1}
                      max={80}
                      defaultValue={topic.weekNumber ?? ""}
                    />
                  </div>
                  <input
                    name="sequenceNumber"
                    type="hidden"
                    value={topic.sequenceNumber}
                  />
                  <div className="saas-field saas-field-wide">
                    <label htmlFor={`topic-description-${topic.id}`}>
                      {t("说明", "Description")}
                    </label>
                    <textarea
                      id={`topic-description-${topic.id}`}
                      name="description"
                      maxLength={2000}
                      defaultValue={topic.description ?? ""}
                    />
                  </div>
                </div>
                <div className="saas-inline-actions">
                  <button
                    className="saas-button saas-button-primary"
                    disabled={busy}
                    type="submit"
                  >
                    {t("保存修改", "Save changes")}
                  </button>
                  <button
                    className="saas-button saas-button-danger"
                    disabled={busy || topic.attemptCount > 0}
                    type="button"
                    onClick={() => void remove(topic.id)}
                  >
                    {t("删除", "Delete")}
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      ) : (
        <p className="saas-muted">
          {t(
            "还没有知识点；练习时也可自动创建私人知识点。",
            "No topics yet; practice can also create a private topic.",
          )}
        </p>
      )}
      <details>
        <summary className="saas-button saas-button-secondary">
          {t("添加知识点", "Add topic")}
        </summary>
        <form onSubmit={(event) => void save(event)}>
          <div className="saas-form-grid">
            <div className="saas-field">
              <label htmlFor="new-topic-title">{t("名称", "Title")}</label>
              <input id="new-topic-title" name="title" required maxLength={160} />
            </div>
            <div className="saas-field">
              <label htmlFor="new-topic-week">
                {t("周次（可选）", "Week (optional)")}
              </label>
              <input
                id="new-topic-week"
                name="weekNumber"
                type="number"
                min={1}
                max={80}
              />
            </div>
            <input name="sequenceNumber" type="hidden" value={topics.length} />
            <div className="saas-field saas-field-wide">
              <label htmlFor="new-topic-description">
                {t("说明", "Description")}
              </label>
              <textarea
                id="new-topic-description"
                name="description"
                maxLength={2000}
              />
            </div>
          </div>
          <button
            className="saas-button saas-button-primary"
            disabled={busy}
            type="submit"
          >
            {t("保存知识点", "Save topic")}
          </button>
        </form>
      </details>
    </section>
  );
}
