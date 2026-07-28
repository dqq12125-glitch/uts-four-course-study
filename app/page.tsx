"use client";

import { useEffect, useMemo, useState } from "react";

type Course = {
  id: string;
  code: string;
  short: string;
  name: string;
  accent: string;
  soft: string;
  mark: string;
  canvas: string;
  focus: string;
  topics: string[];
  lesson: {
    title: string;
    intro: string;
    points: string[];
    formula?: string;
    example: string;
  };
  quiz: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
};

const courses: Course[] = [
  {
    id: "math",
    code: "33130",
    short: "数学 1",
    name: "Mathematics 1",
    accent: "#246BFD",
    soft: "#E8F0FF",
    mark: "∫",
    canvas: "https://canvas.uts.edu.au/courses/40822/modules",
    focus: "向量与三维空间",
    topics: [
      "向量与三维空间",
      "矩阵",
      "微积分建模",
      "隐函数与隐式微分",
      "积分与积分方法",
      "复数",
      "常微分方程",
    ],
    lesson: {
      title: "用点积看懂向量投影",
      intro:
        "点积把两个向量的方向关系变成一个数字。结果为正，夹角小于 90°；为零，两个向量正交；为负，方向大致相反。",
      points: [
        "点积：a·b = |a||b|cosθ",
        "标量投影：compᵦa = (a·b)/|b|",
        "向量投影：projᵦa = ((a·b)/|b|²)b",
      ],
      formula: "a = (3, 4), b = (1, 0)  →  a·b = 3",
      example:
        "a 在 x 轴方向的向量投影是 (3, 0)。几何上，就是把 a 垂直“照”到 x 轴上。",
    },
    quiz: {
      question: "若 a·b = 0，且两个向量都不是零向量，可以判断什么？",
      options: ["方向相同", "互相垂直", "长度相等"],
      answer: 1,
      explanation: "点积为 0 意味着 cosθ = 0，因此夹角为 90°。",
    },
  },
  {
    id: "iep",
    code: "48230",
    short: "工程项目",
    name: "Introduction to Engineering Projects",
    accent: "#F66B4A",
    soft: "#FFF0EA",
    mark: "△",
    canvas: "https://canvas.uts.edu.au/courses/39889/modules",
    focus: "工程与设计入门",
    topics: [
      "什么是工程",
      "工程设计流程",
      "团队协作",
      "设计中的 Country",
      "EWB Challenge",
      "自评与同伴评价",
    ],
    lesson: {
      title: "把模糊问题变成可测试的设计",
      intro:
        "工程设计不是直接跳到答案，而是先把人的需求、环境和限制转化为可以验证的设计标准。",
      points: [
        "理解情境：谁受到影响？真正的问题是什么？",
        "定义标准：成功要满足哪些可衡量指标？",
        "生成方案：先扩大选择，再用证据收敛。",
        "原型与测试：用最小成本验证最大风险。",
      ],
      formula: "需求 → 标准与约束 → 构想 → 原型 → 测试 → 迭代",
      example:
        "“设计一个净水装置”太宽泛。改写成“在无电环境下，每小时处理 10L 水，成本低于 $50”，才便于比较方案。",
    },
    quiz: {
      question: "团队提出三个方案后，下一步最合理的做法是什么？",
      options: ["选最漂亮的", "用设计标准比较", "立刻制作最终产品"],
      answer: 1,
      explanation: "工程决策需要依据明确的标准与约束，而不是直觉或外观。",
    },
  },
  {
    id: "c",
    code: "48430",
    short: "C 编程",
    name: "Fundamentals of C Programming",
    accent: "#1C9A70",
    soft: "#E6F6F0",
    mark: "{ }",
    canvas: "https://canvas.uts.edu.au/courses/41072/modules",
    focus: "编程基础",
    topics: [
      "编程基础",
      "数据类型、运算符与函数",
      "控制结构",
      "数组与字符串",
      "结构体与文件",
      "指针与动态内存",
      "大型程序组织",
      "命令行参数",
    ],
    lesson: {
      title: "变量、类型与表达式",
      intro:
        "C 语言要求你清楚告诉计算机：数据是什么类型、占用什么内存，以及每一步运算如何发生。",
      points: [
        "int 适合整数；double 适合需要小数精度的数值。",
        "整数相除仍得到整数：5 / 2 的结果是 2。",
        "函数把输入、处理和输出封装成可复用的小单元。",
      ],
      formula: "double mean = (a + b) / 2.0;",
      example:
        "写 2.0 而不是 2，会让除法在浮点数中进行，避免把 2.5 截断成 2。",
    },
    quiz: {
      question: "在 C 中，表达式 7 / 2 的结果是什么？",
      options: ["3", "3.5", "4"],
      answer: 0,
      explanation: "两个操作数都是整数，因此执行整数除法，小数部分被截断。",
    },
  },
  {
    id: "physics",
    code: "68037",
    short: "物理建模",
    name: "Physical Modelling",
    accent: "#7755D9",
    soft: "#F0ECFF",
    mark: "↗",
    canvas: "https://canvas.uts.edu.au/courses/41382/modules",
    focus: "一维运动学与测量不确定度",
    topics: [
      "一维运动学",
      "测量与不确定度",
      "实验前准备",
      "力学建模",
      "Mastering Physics",
      "实验数据分析",
    ],
    lesson: {
      title: "先画运动图，再选公式",
      intro:
        "运动学题最常见的错误，是看到数字就代公式。先确定正方向、列出已知量，并判断加速度是否恒定。",
      points: [
        "速度描述位置变化率；加速度描述速度变化率。",
        "恒加速度：v = v₀ + at",
        "位移：Δx = v₀t + ½at²",
        "单位和正负号属于模型的一部分。",
      ],
      formula: "v₀ = 2 m/s, a = 3 m/s², t = 4 s  →  v = 14 m/s",
      example:
        "若正方向向上，重力加速度应写成 −9.8 m/s²。负号表达方向，并不代表物体一定在减速。",
    },
    quiz: {
      question: "物体向上运动，取向上为正方向。忽略空气阻力，加速度应为？",
      options: ["+9.8 m/s²", "−9.8 m/s²", "0 m/s²"],
      answer: 1,
      explanation: "重力方向向下，与选定的正方向相反，所以加速度为负。",
    },
  },
];

type View = "today" | "courses" | "quiz";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [selectedId, setSelectedId] = useState("math");
  const [completed, setCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("four-course-progress");
    if (saved) setCompleted(JSON.parse(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "four-course-progress",
      JSON.stringify(completed),
    );
  }, [completed]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  const selected = courses.find((course) => course.id === selectedId) ?? courses[0];
  const progress = Math.round((completed.length / courses.length) * 100);
  const doneToday = completed.includes(selected.id);

  const nextCourse = useMemo(
    () => courses.find((course) => !completed.includes(course.id)) ?? courses[0],
    [completed],
  );

  function markCourse(id: string) {
    setCompleted((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }

  function chooseCourse(id: string, destination: View = "courses") {
    setSelectedId(id);
    setView(destination);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">四</div>
        <div>
          <p className="eyebrow">SPRING 2026 · UTS</p>
          <h1>四课随身学</h1>
        </div>
        <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <span>{progress}%</span>
        </div>
      </header>

      {view === "today" && (
        <section className="view-stack">
          <article className="hero-card">
            <p className="hero-kicker">今天，从一小步开始</p>
            <h2>{nextCourse.focus}</h2>
            <p>
              {nextCourse.code} · {nextCourse.short}
            </p>
            <button className="primary-button" onClick={() => chooseCourse(nextCourse.id)}>
              开始今日学习 <span>→</span>
            </button>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
          </article>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FOCUS</p>
                <h2>25 分钟专注</h2>
              </div>
              <button
                className="timer-button"
                onClick={() => {
                  if (seconds === 0) setSeconds(25 * 60);
                  setRunning((value) => !value);
                }}
              >
                {running ? "暂停" : seconds === 0 ? "重新开始" : "开始"}
              </button>
            </div>
            <div className="timer-card">
              <span className="timer-time">{formatTime(seconds)}</span>
              <div className="timer-track">
                <span style={{ width: `${(seconds / (25 * 60)) * 100}%` }} />
              </div>
              <p>读 10 分钟 · 手写 10 分钟 · 自测 5 分钟</p>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR SEMESTER</p>
                <h2>四门课</h2>
              </div>
              <button className="text-button" onClick={() => setView("courses")}>
                查看全部
              </button>
            </div>
            <div className="course-grid compact-grid">
              {courses.map((course) => (
                <button
                  key={course.id}
                  className="mini-course"
                  style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}
                  onClick={() => chooseCourse(course.id)}
                >
                  <span className="course-mark">{course.mark}</span>
                  <span>
                    <small>{course.code}</small>
                    <strong>{course.short}</strong>
                  </span>
                  <span className={completed.includes(course.id) ? "status-dot done" : "status-dot"} />
                </button>
              ))}
            </div>
          </section>

          <blockquote>
            “不要把看懂当成会做。合上答案，再独立做一次。”
            <span>今日学习提示</span>
          </blockquote>
        </section>
      )}

      {view === "courses" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">COURSE MAP</p>
            <h2>本学期学习地图</h2>
            <p>选一门课，先学当前重点，再回 Canvas 完成正式材料。</p>
          </div>

          <div className="course-tabs" role="tablist" aria-label="选择课程">
            {courses.map((course) => (
              <button
                key={course.id}
                role="tab"
                aria-selected={selected.id === course.id}
                className={selected.id === course.id ? "active" : ""}
                style={{ "--accent": course.accent } as React.CSSProperties}
                onClick={() => setSelectedId(course.id)}
              >
                {course.code}
              </button>
            ))}
          </div>

          <article
            className="course-detail"
            style={{ "--accent": selected.accent, "--soft": selected.soft } as React.CSSProperties}
          >
            <div className="detail-title">
              <span className="big-mark">{selected.mark}</span>
              <div>
                <p>{selected.code}</p>
                <h2>{selected.short}</h2>
                <small>{selected.name}</small>
              </div>
            </div>

            <div className="topic-strip">
              {selected.topics.map((topic, index) => (
                <span key={topic} className={index === 0 ? "current-topic" : ""}>
                  {index + 1}. {topic}
                </span>
              ))}
            </div>

            <div className="lesson-card">
              <p className="eyebrow">MICRO LESSON · 8 MIN</p>
              <h3>{selected.lesson.title}</h3>
              <p>{selected.lesson.intro}</p>
              <ul>
                {selected.lesson.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {selected.lesson.formula && <pre>{selected.lesson.formula}</pre>}
              <div className="example-box">
                <strong>想一想</strong>
                <p>{selected.lesson.example}</p>
              </div>
            </div>

            <div className="action-row">
              <button
                className={doneToday ? "complete-button completed" : "complete-button"}
                onClick={() => markCourse(selected.id)}
              >
                {doneToday ? "✓ 今日已学" : "标记今日完成"}
              </button>
              <a href={selected.canvas} target="_blank" rel="noreferrer">
                打开 Canvas ↗
              </a>
            </div>
          </article>
        </section>
      )}

      {view === "quiz" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">ACTIVE RECALL</p>
            <h2>四题快速自测</h2>
            <p>先作答，再看解释。错题比“看懂了”更有价值。</p>
          </div>

          <div className="quiz-stack">
            {courses.map((course, qIndex) => {
              const chosen = answers[course.id];
              const hasAnswered = chosen !== undefined;
              return (
                <article
                  className="quiz-card"
                  key={course.id}
                  style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}
                >
                  <div className="quiz-meta">
                    <span>0{qIndex + 1}</span>
                    <p>{course.code} · {course.short}</p>
                  </div>
                  <h3>{course.quiz.question}</h3>
                  <div className="options">
                    {course.quiz.options.map((option, index) => {
                      let state = "";
                      if (hasAnswered && index === course.quiz.answer) state = "correct";
                      else if (hasAnswered && index === chosen) state = "wrong";
                      return (
                        <button
                          key={option}
                          className={state}
                          disabled={hasAnswered}
                          onClick={() => setAnswers((items) => ({ ...items, [course.id]: index }))}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {hasAnswered && (
                    <p className="explanation">
                      <strong>{chosen === course.quiz.answer ? "答对了。" : "再记一次。"}</strong>
                      {course.quiz.explanation}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          {Object.keys(answers).length === courses.length && (
            <button className="reset-button" onClick={() => setAnswers({})}>
              再测一次
            </button>
          )}
        </section>
      )}

      <nav className="bottom-nav" aria-label="主要导航">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}>
          <span>⌂</span>今日
        </button>
        <button className={view === "courses" ? "active" : ""} onClick={() => setView("courses")}>
          <span>▤</span>课程
        </button>
        <button className={view === "quiz" ? "active" : ""} onClick={() => setView("quiz")}>
          <span>✓</span>自测
        </button>
      </nav>
    </main>
  );
}
