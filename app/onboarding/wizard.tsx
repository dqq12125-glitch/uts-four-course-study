"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface CourseTemplate {
  id: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionShortName: string | null;
  courseCode: string | null;
  courseName: string;
}

interface OnboardingWizardProps {
  initialLanguage: "zh-CN" | "en";
  initialTimezone: string;
  templates: CourseTemplate[];
}

const steps = [
  ["语言与时区", "Language and timezone"],
  ["学校与学期", "Institution and semester"],
  ["添加课程", "Add course"],
  ["添加课表", "Add timetable"],
  ["添加截止日期", "Add deadline"],
  ["生成今日计划", "Generate today's plan"],
] as const;

const days = [
  ["周日", "Sunday"],
  ["周一", "Monday"],
  ["周二", "Tuesday"],
  ["周三", "Wednesday"],
  ["周四", "Thursday"],
  ["周五", "Friday"],
  ["周六", "Saturday"],
] as const;

export function OnboardingWizard({
  initialLanguage,
  initialTimezone,
  templates,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(60);
  const [displayName, setDisplayName] = useState("");
  const [institutionId, setInstitutionId] = useState<string | null>("inst_uts");
  const [institutionName, setInstitutionName] = useState(
    "University of Technology Sydney",
  );
  const [semesterName, setSemesterName] = useState("Spring 2026");
  const [startDate, setStartDate] = useState("2026-08-03");
  const [endDate, setEndDate] = useState("2026-11-29");
  const [courseMode, setCourseMode] = useState<"template" | "manual">(
    templates.length ? "template" : "manual",
  );
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [colourKey, setColourKey] = useState("ocean");
  const [hasClass, setHasClass] = useState(false);
  const [sessionType, setSessionType] = useState("lecture");
  const [classTitle, setClassTitle] = useState("Lecture");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [hasAssessment, setHasAssessment] = useState(true);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("assignment");
  const [dueLocal, setDueLocal] = useState("");
  const [weightPercent, setWeightPercent] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && initialTimezone === "Australia/Sydney") {
        setTimezone(detected);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialTimezone]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templateId, templates],
  );
  const chosenCourseName =
    courseMode === "template"
      ? selectedTemplate?.courseName ?? ""
      : courseName.trim();
  const chosenCourseCode =
    courseMode === "template"
      ? selectedTemplate?.courseCode ?? ""
      : courseCode.trim();

  function canContinue(): boolean {
    if (step === 0) return Boolean(timezone) && dailyStudyMinutes >= 15;
    if (step === 1) {
      return Boolean(
        institutionName.trim() &&
          semesterName.trim() &&
          startDate &&
          endDate &&
          endDate >= startDate,
      );
    }
    if (step === 2) return Boolean(chosenCourseName);
    if (step === 3) {
      return (
        !hasClass ||
        Boolean(classTitle.trim() && startTime && endTime && endTime > startTime)
      );
    }
    if (step === 4) {
      return !hasAssessment || Boolean(assessmentTitle.trim());
    }
    return true;
  }

  async function finish() {
    setState("saving");
    setError("");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName || null,
        language,
        timezone,
        dailyStudyMinutes,
        semester: {
          institutionId,
          institutionName,
          name: semesterName,
          startDate,
          endDate,
        },
        course: {
          templateId: courseMode === "template" ? templateId : null,
          courseCode: courseMode === "manual" ? courseCode || null : null,
          courseName: courseMode === "manual" ? courseName : null,
          colourKey,
          instructorName: instructorName || null,
        },
        classSessions: hasClass
          ? [
              {
                sessionType,
                title: classTitle,
                dayOfWeek,
                startTime,
                endTime,
                location: location || null,
                mapUrl: null,
              },
            ]
          : [],
        assessments: hasAssessment
          ? [
              {
                title: assessmentTitle,
                assessmentType,
                dueLocal: dueLocal || null,
                weightPercent: weightPercent
                  ? Number(weightPercent)
                  : null,
                estimatedMinutes: estimatedMinutes
                  ? Number(estimatedMinutes)
                  : null,
                notes: null,
              },
            ]
          : [],
      }),
    });
    const result = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setState("error");
      setError(
        result.error?.message ??
          t(
            "暂时无法生成计划，请重试。",
            "The plan could not be generated. Please try again.",
          ),
      );
      return;
    }
    router.push("/app/today");
    router.refresh();
  }

  return (
    <section
      className="saas-onboarding"
      lang={language === "zh-CN" ? "zh-CN" : "en"}
    >
      <nav aria-label="Onboarding progress">
        <ol className="saas-stepper">
          {steps.map(([zh, en], index) => (
            <li
              className={
                index === step
                  ? "is-current"
                  : index < step
                    ? "is-complete"
                    : ""
              }
              key={zh}
              aria-current={index === step ? "step" : undefined}
            >
              <span>{index + 1}</span>
              <small>{t(zh, en)}</small>
            </li>
          ))}
        </ol>
      </nav>

      <div className="saas-card saas-wizard-card">
        {step === 0 ? (
          <>
            <p className="saas-eyebrow">Step 1 of 6</p>
            <h1>
              {t(
                "先按你的方式显示学习计划",
                "Set up the plan your way",
              )}
            </h1>
            <div className="saas-form-grid">
              <div className="saas-field">
                <label htmlFor="display-name">
                  {t("称呼（可选）", "Display name (optional)")}
                </label>
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="saas-field">
                <label htmlFor="language">
                  {t("界面与解释语言", "Interface and explanation language")}
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as "zh-CN" | "en")
                  }
                >
                  <option value="zh-CN">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="saas-field">
                <label htmlFor="timezone">{t("时区", "Timezone")}</label>
                <input
                  id="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  required
                />
                <p className="saas-help">
                  {t("例如 Australia/Sydney", "For example: Australia/Sydney")}
                </p>
              </div>
              <div className="saas-field">
                <label htmlFor="daily-minutes">
                  {t("每天可用时间", "Time available each day")}
                </label>
                <select
                  id="daily-minutes"
                  value={dailyStudyMinutes}
                  onChange={(event) =>
                    setDailyStudyMinutes(Number(event.target.value))
                  }
                >
                  {[30, 45, 60, 90, 120].map((minutes) => (
                    <option value={minutes} key={minutes}>
                      {minutes} {t("分钟", "min")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="saas-eyebrow">Step 2 of 6</p>
            <h1>{t("学校和学期", "Institution and semester")}</h1>
            <p className="saas-lead">
              {t(
                "默认提供 UTS Spring 2026，但所有字段都可以改成你的学校和学期。",
                "UTS Spring 2026 is prefilled, but every field can be changed for your institution and semester.",
              )}
            </p>
            <div className="saas-form-grid">
              <div className="saas-field saas-field-wide">
                <label htmlFor="institution">
                  {t("学校", "Institution")}
                </label>
                <input
                  id="institution"
                  value={institutionName}
                  onChange={(event) => {
                    setInstitutionName(event.target.value);
                    setInstitutionId(
                      event.target.value ===
                        "University of Technology Sydney"
                        ? "inst_uts"
                        : null,
                    );
                  }}
                  required
                />
              </div>
              <div className="saas-field">
                <label htmlFor="semester-name">
                  {t("学期名称", "Semester name")}
                </label>
                <input
                  id="semester-name"
                  value={semesterName}
                  onChange={(event) => setSemesterName(event.target.value)}
                  required
                />
              </div>
              <div className="saas-field">
                <label htmlFor="semester-start">
                  {t("开始日期", "Start date")}
                </label>
                <input
                  id="semester-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </div>
              <div className="saas-field">
                <label htmlFor="semester-end">
                  {t("结束日期", "End date")}
                </label>
                <input
                  id="semester-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="saas-eyebrow">Step 3 of 6</p>
            <h1>{t("添加你的第一门课程", "Add your first course")}</h1>
            <p className="saas-lead">
              {t(
                "模板只是快捷入口。医学、商科、语言、艺术或任何其他课程都能手动创建。",
                "Templates are shortcuts only. Medicine, business, language, arts, or any other course can be created manually.",
              )}
            </p>
            <div
              className="saas-segmented"
              role="group"
              aria-label={t("课程添加方式", "Course creation method")}
            >
              <button
                type="button"
                className={courseMode === "template" ? "is-selected" : ""}
                onClick={() => setCourseMode("template")}
                disabled={!templates.length}
              >
                {t("从模板选择", "Choose template")}
              </button>
              <button
                type="button"
                className={courseMode === "manual" ? "is-selected" : ""}
                onClick={() => setCourseMode("manual")}
              >
                {t("创建任意课程", "Create any course")}
              </button>
            </div>
            <div className="saas-form-grid">
              {courseMode === "template" ? (
                <div className="saas-field saas-field-wide">
                  <label htmlFor="course-template">
                    {t("课程模板", "Course template")}
                  </label>
                  <select
                    id="course-template"
                    value={templateId}
                    onChange={(event) => setTemplateId(event.target.value)}
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {[template.courseCode, template.courseName]
                          .filter(Boolean)
                          .join(" · ")}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="saas-field">
                    <label htmlFor="course-code">
                      {t("课程代码（可选）", "Course code (optional)")}
                    </label>
                    <input
                      id="course-code"
                      value={courseCode}
                      onChange={(event) => setCourseCode(event.target.value)}
                      placeholder="BIO101"
                      maxLength={32}
                    />
                  </div>
                  <div className="saas-field">
                    <label htmlFor="course-name">
                      {t("课程名称", "Course name")}
                    </label>
                    <input
                      id="course-name"
                      value={courseName}
                      onChange={(event) => setCourseName(event.target.value)}
                      placeholder="Academic English"
                      required
                      maxLength={160}
                    />
                  </div>
                </>
              )}
              <div className="saas-field">
                <label htmlFor="instructor">
                  {t("教师（可选）", "Instructor (optional)")}
                </label>
                <input
                  id="instructor"
                  value={instructorName}
                  onChange={(event) => setInstructorName(event.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="saas-field">
                <label htmlFor="course-colour">
                  {t("课程颜色", "Course colour")}
                </label>
                <select
                  id="course-colour"
                  value={colourKey}
                  onChange={(event) => setColourKey(event.target.value)}
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
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="saas-eyebrow">Step 4 of 6</p>
            <h1>{t("添加课表", "Add your timetable")}</h1>
            <label className="saas-check">
              <input
                type="checkbox"
                checked={hasClass}
                onChange={(event) => setHasClass(event.target.checked)}
              />
              {t("现在添加一项固定课程", "Add a recurring class now")}
            </label>
            {hasClass ? (
              <div className="saas-form-grid">
                <div className="saas-field">
                  <label htmlFor="session-type">{t("类型", "Type")}</label>
                  <select
                    id="session-type"
                    value={sessionType}
                    onChange={(event) => setSessionType(event.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="workshop">Workshop</option>
                    <option value="lab">Lab</option>
                    <option value="practical">Practical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="saas-field">
                  <label htmlFor="class-title">{t("名称", "Title")}</label>
                  <input
                    id="class-title"
                    value={classTitle}
                    onChange={(event) => setClassTitle(event.target.value)}
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="class-day">{t("星期", "Day")}</label>
                  <select
                    id="class-day"
                    value={dayOfWeek}
                    onChange={(event) => setDayOfWeek(Number(event.target.value))}
                  >
                    {days.map(
                      ([zh, en], index) => (
                        <option key={zh} value={index}>
                          {t(zh, en)}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="saas-field">
                  <label htmlFor="class-start">
                    {t("开始", "Starts")}
                  </label>
                  <input
                    id="class-start"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="class-end">{t("结束", "Ends")}</label>
                  <input
                    id="class-end"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="class-location">
                    {t("地点（可选）", "Location (optional)")}
                  </label>
                  <input
                    id="class-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="saas-muted">
                {t(
                  "可以跳过，之后在课程页面补充。",
                  "You can skip this and add it from the course later.",
                )}
              </p>
            )}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="saas-eyebrow">Step 5 of 6</p>
            <h1>
              {t("添加最近的截止日期", "Add the nearest deadline")}
            </h1>
            <label className="saas-check">
              <input
                type="checkbox"
                checked={hasAssessment}
                onChange={(event) => setHasAssessment(event.target.checked)}
              />
              {t("现在添加一项 Assessment", "Add an assessment now")}
            </label>
            {hasAssessment ? (
              <div className="saas-form-grid">
                <div className="saas-field saas-field-wide">
                  <label htmlFor="assessment-title">
                    {t("名称", "Title")}
                  </label>
                  <input
                    id="assessment-title"
                    value={assessmentTitle}
                    onChange={(event) =>
                      setAssessmentTitle(event.target.value)
                    }
                    placeholder="Lab report 1"
                    required
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="assessment-type">
                    {t("类型", "Type")}
                  </label>
                  <select
                    id="assessment-type"
                    value={assessmentType}
                    onChange={(event) =>
                      setAssessmentType(event.target.value)
                    }
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                    <option value="lab">Lab</option>
                    <option value="project">Project</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="saas-field">
                  <label htmlFor="assessment-due">
                    {t("截止时间（可选）", "Due date and time (optional)")}
                  </label>
                  <input
                    id="assessment-due"
                    type="datetime-local"
                    value={dueLocal}
                    onChange={(event) => setDueLocal(event.target.value)}
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="assessment-weight">
                    {t("权重 %（可选）", "Weight % (optional)")}
                  </label>
                  <input
                    id="assessment-weight"
                    type="number"
                    min="0"
                    max="100"
                    value={weightPercent}
                    onChange={(event) =>
                      setWeightPercent(event.target.value)
                    }
                  />
                </div>
                <div className="saas-field">
                  <label htmlFor="assessment-minutes">
                    {t("预计总用时", "Estimated total minutes")}
                  </label>
                  <input
                    id="assessment-minutes"
                    type="number"
                    min="5"
                    value={estimatedMinutes}
                    onChange={(event) =>
                      setEstimatedMinutes(event.target.value)
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="saas-muted">
                {t(
                  "可以跳过，系统仍会生成课程起步任务。",
                  "You can skip this; a starting course task will still be generated.",
                )}
              </p>
            )}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <p className="saas-eyebrow">Step 6 of 6</p>
            <h1>
              {t(
                "准备生成第一份今日计划",
                "Ready to generate your first plan",
              )}
            </h1>
            <div className="saas-summary">
              <div>
                <span>{t("学校与学期", "Institution and semester")}</span>
                <strong>
                  {institutionName} · {semesterName}
                </strong>
              </div>
              <div>
                <span>{t("第一门课程", "First course")}</span>
                <strong>
                  {[chosenCourseCode, chosenCourseName]
                    .filter(Boolean)
                    .join(" · ")}
                </strong>
              </div>
              <div>
                <span>{t("今日容量", "Daily capacity")}</span>
                <strong>
                  {dailyStudyMinutes} {t("分钟", "min")}
                </strong>
              </div>
              <div>
                <span>{t("完成状态", "Done means")}</span>
                <strong>
                  {t(
                    "会给出可检查的完成标准",
                    "A verifiable completion criterion",
                  )}
                </strong>
              </div>
            </div>
            <p className="saas-lead">
              {t(
                "规则引擎会先看截止日期、权重与可用时间，再给出一个当前任务和最多两个候选任务。",
                "The rule engine considers deadlines, weight, and available time before selecting one current task and up to two alternatives.",
              )}
            </p>
            {error ? (
              <p className="saas-error" role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : null}

        <div className="saas-wizard-actions">
          {step > 0 ? (
            <button
              className="saas-button saas-button-secondary"
              type="button"
              onClick={() => setStep((current) => current - 1)}
              disabled={state === "saving"}
            >
              {t("上一步", "Back")}
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button
              className="saas-button saas-button-primary"
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canContinue()}
            >
              {t("继续", "Continue")}
            </button>
          ) : (
            <button
              className="saas-button saas-button-primary"
              type="button"
              onClick={finish}
              disabled={state === "saving"}
            >
              {state === "saving"
                ? t("正在生成…", "Generating…")
                : t("生成今日计划", "Generate today's plan")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
