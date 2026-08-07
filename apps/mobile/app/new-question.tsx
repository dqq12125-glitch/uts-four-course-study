import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function NewQuestionScreen() {
  const params = useLocalSearchParams<{
    courseId?: string | string[];
  }>();
  const router = useRouter();
  const { api, user } = useSession();
  const { t } = useCopy();
  const courseId =
    typeof params.courseId === "string"
      ? params.courseId
      : params.courseId?.[0] ?? "";
  const [topicTitle, setTopicTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState("1");
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );
  }

  async function create() {
    setSaving(true);
    setError("");
    try {
      await api.createPrivateQuestion({
        courseId,
        topicTitle,
        difficulty: 2,
        prompt,
        options,
        correctChoiceIndex: Number(correctIndex) - 1,
        hint1: hint,
        explanation,
        language: user?.preferredLanguage ?? "zh-CN",
      });
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法创建练习题。", "Could not create the practice question."),
      );
    } finally {
      setSaving(false);
    }
  }

  const valid = Boolean(
    courseId &&
    topicTitle.trim() &&
    prompt.trim() &&
    options.every((option) => option.trim()) &&
    Number(correctIndex) >= 1 &&
    Number(correctIndex) <= 4 &&
    hint.trim() &&
    explanation.trim(),
  );

  return (
    <Screen>
      <PageHeading
        eyebrow="Private to your account"
        title={t(
          "创建一道原创私人练习",
          "Create an original private practice question",
        )}
        lead={t(
          "这道题只属于当前账户，不会自动共享给其他学生。",
          "This question belongs only to your account and is never shared automatically with other students.",
        )}
      />
      <Surface>
        <Field
          label={t("知识点", "Topic")}
          placeholder={t("例如 Vector projection", "For example, vector projection")}
          value={topicTitle}
          onChangeText={setTopicTitle}
        />
        <Field
          label={t("题目", "Question")}
          multiline
          placeholder={t(
            "输入一道用于理解和练习的原创题",
            "Enter an original question for understanding and practice",
          )}
          value={prompt}
          onChangeText={setPrompt}
        />
        {options.map((option, index) => (
          <Field
            key={index}
            label={t(
              `选项 ${String.fromCharCode(65 + index)}`,
              `Option ${String.fromCharCode(65 + index)}`,
            )}
            value={option}
            onChangeText={(value) => updateOption(index, value)}
          />
        ))}
        <Field
          keyboardType="number-pad"
          label={t(
            "正确选项序号（1–4）",
            "Correct option number (1–4)",
          )}
          value={correctIndex}
          onChangeText={setCorrectIndex}
        />
        <Field
          label={t("最小提示", "Smallest hint")}
          multiline
          placeholder={t(
            "只给下一步，不直接泄露答案",
            "Give only the next step without revealing the answer",
          )}
          value={hint}
          onChangeText={setHint}
        />
        <Field
          label={t("答案解释", "Answer explanation")}
          multiline
          value={explanation}
          onChangeText={setExplanation}
        />
      </Surface>
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("创建失败", "Could not create question")}
          body={error}
        />
      ) : null}
      <ActionButton
        disabled={saving || !valid}
        label={
          saving
            ? t("正在保存…", "Saving…")
            : t("保存私人练习", "Save private question")
        }
        onPress={() => void create()}
      />
    </Screen>
  );
}
