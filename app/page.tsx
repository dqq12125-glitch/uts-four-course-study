import Link from "next/link";
import type { Metadata } from "next";
import PersonalFourCourseApp from "@/app/personal/four-course-app";
import { PublicFooter, PublicHeader } from "@/app/public-site-chrome";
import { getPublicLocale } from "@/src/application/public-locale";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";

export const dynamic = "force-dynamic";

const homeCopy = {
  "zh-CN": {
    title: "把整个学期，变成下一步",
    description:
      "DeepStudy 读取课程资料、建立知识结构，并根据截止日期与真实掌握程度生成每天的学习 Session。",
    heroLabel: "面向大学课程的自适应学习系统",
    heroLineOne: "把整个学期，",
    heroLineTwo: "变成下一步。",
    heroLead:
      "让课程、作业、知识点和专业工具进入同一个学习闭环。DeepStudy 不只记录你看过什么，而是持续验证你是否真的会了。",
    start: "免费开始",
    seeWorkflow: "了解工作方式",
    traceLabel: "今日学习路径示例",
    traceDay: "今天 · 周四",
    traceDuration: "45 分钟",
    traceCourse: "电路分析",
    traceTitle: "用仿真验证基尔霍夫电压定律",
    traceReason: "作业还有 3 天截止；回路符号是当前前置缺口。",
    traceAction: "开始学习",
    traceNext: "接下来",
    traceNextOne: "学术英语 · 论点与证据",
    traceNextTwo: "微积分 · 48 小时复测",
    sample: "界面示例，不代表真实用户数据",
    workflowLabel: "工作方式",
    workflowTitle: "每一份课程资料，最后都要变成可验证的学习证据。",
    workflowLead:
      "工作流由代码和状态控制，AI 只在需要判断、解释与反馈的环节介入。",
    workflow: [
      {
        number: "01",
        title: "读取课程",
        body: "增量同步课程表、文件、作业和考试。未变化的资料不会重复处理，每条内容保留原始出处。",
        meta: "课程系统 · 文件 · 音视频",
      },
      {
        number: "02",
        title: "建立课程大脑",
        body: "提取学习目标、概念、前置关系与考核关系，让系统知道一项作业究竟在考什么。",
        meta: "目标 · 概念 · 关系 · 引用",
      },
      {
        number: "03",
        title: "选择学习方法",
        body: "根据任务动词、错误类型、可用时间和工具，把任务路由到回忆、理解、计算、编程或论证流程。",
        meta: "规则优先 · 结构化判断",
      },
      {
        number: "04",
        title: "验证真实掌握",
        body: "记录独立正确、提示依赖、迁移表现和延迟复测，再据此安排下一次学习。",
        meta: "尝试 · 错误 · 复测 · 掌握",
      },
    ],
    evidenceLabel: "从计划到证据",
    evidenceTitle: "完成任务，不等于掌握知识。",
    evidenceLead:
      "每场学习都是可恢复的结构化流程。它从诊断开始，以独立测试和延迟复测结束。",
    evidenceSteps: [
      { label: "诊断", value: "先确认前置缺口" },
      { label: "练习", value: "分层提示，不抢答" },
      { label: "独立测试", value: "无提示完成变式题" },
      { label: "延迟复测", value: "48 小时后再次提取" },
    ],
    modeLabel: "一种系统，多种学习方式",
    modeTitle: "不按课程名称套模板，按眼前的任务选择方法。",
    modes: [
      "记忆与主动回忆",
      "概念理解与迁移",
      "定量问题求解",
      "编程与计算",
      "阅读与论证",
      "语言与沟通",
      "设计与项目",
      "仿真与实验",
    ],
    toolsTitle: "需要专业工具时，学习流程不会停在聊天框。",
    toolsBody:
      "桌面端将连接 Jupyter、VS Code、MATLAB 与 LTspice。系统先观察和解释，提出操作方案，获得批准后才执行并验证结果。",
    pricingLabel: "首个学期",
    pricingTitle: "先免费验证价值，再决定是否扩展。",
    free: "免费版",
    freeBody: "一门课程、基础每日计划与有限练习。",
    pass: "创始学期通行证",
    passBody: "最多四门课程、资料处理、复测与合理使用的 AI 额度。",
    pricingAction: "查看完整方案",
    integrityLabel: "学术诚信",
    integrityTitle: "帮助你学会，不替你提交。",
    integrityBody:
      "受评分任务默认采用引导模式。系统不会自动提交作业、参加考试或生成可直接提交的完整答案；独立测试模式也不会暗中提供提示。",
  },
  en: {
    title: "Turn your semester into the next right step",
    description:
      "DeepStudy understands course material, maps knowledge and builds daily learning sessions from deadlines and genuine mastery.",
    heroLabel: "Adaptive learning for every university subject",
    heroLineOne: "Turn your semester",
    heroLineTwo: "into the next right step.",
    heroLead:
      "Bring courses, assessments, concepts and professional tools into one learning loop. DeepStudy tracks more than what you viewed—it keeps testing what you can truly do.",
    start: "Start free",
    seeWorkflow: "See how it works",
    traceLabel: "Example learning path for today",
    traceDay: "Today · Thursday",
    traceDuration: "45 minutes",
    traceCourse: "Circuit analysis",
    traceTitle: "Verify Kirchhoff’s voltage law with a simulation",
    traceReason: "Assignment due in 3 days; loop signs are the current prerequisite gap.",
    traceAction: "Start learning",
    traceNext: "Up next",
    traceNextOne: "Academic English · Claims and evidence",
    traceNextTwo: "Calculus · 48-hour retest",
    sample: "Illustrative interface, not real user data",
    workflowLabel: "How it works",
    workflowTitle: "Every course resource should become verifiable learning evidence.",
    workflowLead:
      "Code and state control the workflow. AI steps in only where judgement, explanation or feedback is useful.",
    workflow: [
      {
        number: "01",
        title: "Read the course",
        body: "Incrementally sync schedules, files, assignments and exams. Unchanged material is skipped and every passage keeps its source.",
        meta: "Learning systems · Files · Media",
      },
      {
        number: "02",
        title: "Build the course brain",
        body: "Extract objectives, concepts, prerequisites and assessment links so the system knows what each task actually tests.",
        meta: "Objectives · Concepts · Links · Sources",
      },
      {
        number: "03",
        title: "Choose how to learn",
        body: "Route the task into retrieval, understanding, calculation, programming or argumentation using its verbs, errors, time and tools.",
        meta: "Rules first · Structured decisions",
      },
      {
        number: "04",
        title: "Verify real mastery",
        body: "Track independent accuracy, hint dependence, transfer and delayed recall, then schedule the next learning action.",
        meta: "Attempts · Errors · Retests · Mastery",
      },
    ],
    evidenceLabel: "From plan to evidence",
    evidenceTitle: "Finishing a task is not the same as mastering it.",
    evidenceLead:
      "Every learning session is structured and resumable. It begins with diagnosis and ends with independent and delayed testing.",
    evidenceSteps: [
      { label: "Diagnose", value: "Find the prerequisite gap first" },
      { label: "Practise", value: "Layer hints without taking over" },
      { label: "Test", value: "Solve a variation without help" },
      { label: "Retest", value: "Retrieve it again after 48 hours" },
    ],
    modeLabel: "One system, many ways to learn",
    modeTitle: "Choose a method for the task—not a template for the course name.",
    modes: [
      "Memory and retrieval",
      "Concept understanding",
      "Quantitative problem solving",
      "Programming and computation",
      "Reading and argumentation",
      "Language and communication",
      "Design and projects",
      "Simulation and experiments",
    ],
    toolsTitle: "When a subject needs specialist software, learning should not stop at chat.",
    toolsBody:
      "The desktop app will connect to Jupyter, VS Code, MATLAB and LTspice. It observes and explains first, proposes a plan, and only acts after approval—then verifies the result.",
    pricingLabel: "Your first semester",
    pricingTitle: "Prove the value for free, then expand when it helps.",
    free: "Free",
    freeBody: "One course, a basic daily plan and limited practice.",
    pass: "Founding Semester Pass",
    passBody: "Up to four courses, resource processing, retests and fair-use AI capacity.",
    pricingAction: "See full plans",
    integrityLabel: "Academic integrity",
    integrityTitle: "Learn the work. Do not outsource it.",
    integrityBody:
      "Assessed work defaults to guided mode. DeepStudy does not submit assignments, take exams or create a complete submission-ready answer. Examiner mode never hides hints in a test.",
  },
} as const;

function personalDeploymentEnabled(): boolean {
  try {
    const runtimeFlag = getRuntimeEnvironment().PERSONAL_DEPLOYMENT;
    return runtimeFlag === "true" ||
      (runtimeFlag === undefined && process.env.PERSONAL_DEPLOYMENT === "true");
  } catch {
    return process.env.PERSONAL_DEPLOYMENT === "true";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  if (personalDeploymentEnabled()) {
    return {
      title: language === "zh-CN" ? "四课随身学" : "Four-Course Study",
      description: language === "zh-CN"
        ? "面向四门 UTS 课程的个人学习、练习与掌握空间。"
        : "A personal study, practice and mastery workspace for four UTS courses.",
    };
  }
  const content = homeCopy[language];
  return {
    title: content.title,
    description: content.description,
  };
}

export default async function MarketingHomePage() {
  const language = await getPublicLocale();
  if (personalDeploymentEnabled()) return <PersonalFourCourseApp initialLocale={language} />;

  const content = homeCopy[language];

  return (
    <div className="public-site public-home">
      <PublicHeader language={language} />
      <main>
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-section-label">{content.heroLabel}</p>
            <h1>
              <span>{content.heroLineOne}</span>
              <span>{content.heroLineTwo}</span>
            </h1>
            <p className="public-hero-lead">{content.heroLead}</p>
            <div className="public-actions">
              <Link className="public-button public-button-primary" href="/auth/sign-up">
                {content.start}
              </Link>
              <a className="public-text-link" href="#workflow">
                {content.seeWorkflow}<span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <figure className="learning-trace" aria-label={content.traceLabel}>
            <div className="learning-trace-header">
              <span>{content.traceDay}</span>
              <span>{content.traceDuration}</span>
            </div>
            <div className="learning-trace-now">
              <span className="learning-trace-node" aria-hidden="true" />
              <p>{content.traceCourse}</p>
              <h2>{content.traceTitle}</h2>
              <p>{content.traceReason}</p>
              <span className="learning-trace-action">{content.traceAction}</span>
            </div>
            <div className="learning-trace-next">
              <p>{content.traceNext}</p>
              <ol>
                <li>{content.traceNextOne}</li>
                <li>{content.traceNextTwo}</li>
              </ol>
            </div>
            <figcaption>{content.sample}</figcaption>
          </figure>
        </section>

        <section className="public-workflow" id="workflow">
          <div className="public-workflow-layout">
            <div className="public-workflow-intro">
              <p className="public-section-label">{content.workflowLabel}</p>
              <h2>{content.workflowTitle}</h2>
              <p>{content.workflowLead}</p>
            </div>
            <ol className="public-workflow-steps">
              {content.workflow.map((step) => (
                <li key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    <small>{step.meta}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="public-evidence">
          <div className="public-section-heading">
            <p className="public-section-label">{content.evidenceLabel}</p>
            <h2>{content.evidenceTitle}</h2>
            <p>{content.evidenceLead}</p>
          </div>
          <ol className="evidence-trace">
            {content.evidenceSteps.map((step, index) => (
              <li key={step.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
                <p>{step.value}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="public-modes">
          <div className="public-modes-copy">
            <p className="public-section-label">{content.modeLabel}</p>
            <h2>{content.modeTitle}</h2>
          </div>
          <ol className="public-mode-list">
            {content.modes.map((mode, index) => (
              <li key={mode}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {mode}
              </li>
            ))}
          </ol>
          <aside className="public-tools-note">
            <h3>{content.toolsTitle}</h3>
            <p>{content.toolsBody}</p>
          </aside>
        </section>

        <section className="public-pricing-preview">
          <div>
            <p className="public-section-label">{content.pricingLabel}</p>
            <h2>{content.pricingTitle}</h2>
          </div>
          <div className="public-price-lines">
            <div>
              <span>{content.free}</span>
              <strong>A$0</strong>
              <p>{content.freeBody}</p>
            </div>
            <div>
              <span>{content.pass}</span>
              <strong>A$19</strong>
              <p>{content.passBody}</p>
            </div>
            <Link className="public-text-link" href="/pricing">
              {content.pricingAction}<span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="public-integrity">
          <div className="public-integrity-heading">
            <p className="public-section-label">{content.integrityLabel}</p>
            <h2>{content.integrityTitle}</h2>
          </div>
          <p>{content.integrityBody}</p>
        </section>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
