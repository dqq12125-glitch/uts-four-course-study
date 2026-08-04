"use client";

import { useEffect, useState } from "react";
import {
  AnswerWorkspace,
  type AnswerToolKind,
  type AnswerWorkspaceEvidence,
} from "@/app/answer-workspace";
import {
  evidenceIsMeaningful,
  upsertAnswerEvidence,
} from "@/app/answer-evidence";
import { cDifficultyQuestionBank } from "@/app/c-difficulty-bank";
import { deepLessons } from "@/app/deep-lessons";
import { eeeDifficultyQuestionBank } from "@/app/eee-difficulty-bank";
import { MathPhysicsTools } from "@/app/learning-tools";
import type { LearningVisualIntent } from "@/app/learning-tools";
import { mathDifficultyQuestionBank } from "@/app/math-difficulty-bank";
import { IOSTimetableWidget } from "@/app/personal/ios-timetable-widget";
import {
  mainModuleForDestination,
  ModuleContextBar,
  PersonalNavigationIcon,
  PersonalModuleMenu,
  type PersonalDestinationId,
  type PersonalView,
  type PlanModule,
} from "@/app/personal/personal-module-menu";
import { physicsDifficultyQuestionBank } from "@/app/physics-difficulty-bank";
import {
  normalizeQuestionProgress,
  pendingQuestionIds,
  recordQuestionAttempt,
  setQuestionMastery,
  summarizeQuestionProgress,
  type QuestionProgressStore,
} from "@/app/question-progress";
import {
  topicQuestionBank,
  type QuestionDifficulty,
} from "@/app/topic-questions";
import type { QuestionVisual } from "@/app/advanced-questions";
import {
  assessments,
  semesterBreak,
  semesterWeeks,
  timetable,
  timetableChoiceGroups,
  type TimetableItem,
} from "@/app/semester-data";
import { countsTowardTutorMastery } from "@/app/tutor-mastery";

type Lang = "zh" | "en";
type View = PersonalView;
type QuizQueueMode = "learning" | "mastered" | "all";
type Bi = { zh: string; en: string };
type QuestionKind = "truefalse" | "single" | "multiple" | "scenario" | "combination" | "calculation" | "data";
type AnswerValue = number | number[];
type AiTutorMessage = { role: "user" | "assistant"; content: string; hintLevel?: number };
type ResumeState = {
  view: Exclude<View, "today">;
  planModule?: PlanModule;
  selectedId: string;
  selectedCourseTopic: number;
  browsedWeek: number;
  quizFilter: string;
  quizTopic: string;
  quizQueueMode?: QuizQueueMode;
  quizIndex: number;
  sessionIds: string[];
  answers: Record<string, AnswerValue>;
  draftSelections: Record<string, number[]>;
  tutorCourse: string;
  tutorTopic: string;
  tutorIndex: number;
  answerEvidenceByQuestion?: Record<string, AnswerWorkspaceEvidence>;
  updatedAt: number;
};
type DailyTask = {
  id: string;
  kind: "resume" | "assessment" | "class" | "prepare" | "review" | "recall";
  title: string;
  meta: string;
  cta: string;
  priority: number;
  courseId?: string;
  topicId?: string;
  week?: number;
  href?: string;
};
type Question = {
  id: string;
  courseId: string;
  topicId?: string;
  question: Bi;
  options: Bi[];
  kind?: QuestionKind;
  answer: AnswerValue;
  explanation: Bi;
  visual?: QuestionVisual;
  learningVisual?: LearningVisualIntent;
  answerTools?: AnswerToolKind[];
  difficulty?: QuestionDifficulty;
  estimatedMinutes?: number;
  rubric?: { zh: string[]; en: string[] };
};
type Course = {
  id: string;
  code: string;
  short: Bi;
  name: string;
  accent: string;
  soft: string;
  mark: string;
  canvas: string;
  zoom?: { url: string; label: Bi };
  focus: Bi;
  topics: Bi[];
  lesson: {
    title: Bi;
    intro: Bi;
    points: Bi[];
    formula: string;
    example: Bi;
  };
};

const bi = (zh: string, en: string): Bi => ({ zh, en });

function buildTutorVisualContext(question: Question, language: Lang) {
  const visual = question.visual
    ? question.visual.kind === "table"
      ? {
          kind: "table",
          title: question.visual.title[language],
          columns: question.visual.columns.map((column) => column[language]),
          rows: question.visual.rows,
        }
      : question.visual.kind === "bars"
        ? {
            kind: "bar-chart",
            title: question.visual.title[language],
            labels: question.visual.labels.map((label) => label[language]),
            values: question.visual.values,
            unit: question.visual.unit,
          }
        : {
            kind: "code",
            title: question.visual.title[language],
            code: question.visual.code,
          }
    : null;
  const learningVisual = question.learningVisual
    ? (() => {
        const { alt, caption, ...data } = question.learningVisual;
        return {
          ...data,
          alt: alt[language],
          caption: caption?.[language],
        };
      })()
    : null;
  if (!visual && !learningVisual) return "No separate visual data.";
  return JSON.stringify({ questionVisual: visual, learningVisual });
}

const difficultyOrder: QuestionDifficulty[] = [
  "foundation",
  "application",
  "complex",
  "challenge",
  "instructor",
];
const difficultyRank = new Map(
  difficultyOrder.map((difficulty, index) => [difficulty, index]),
);

const difficultyLabels: Record<QuestionDifficulty, Bi> = {
  foundation: bi("基础", "Foundation"),
  application: bi("应用", "Application"),
  complex: bi("复杂", "Complex"),
  challenge: bi("挑战", "Challenge"),
  instructor: bi("教师题型难度（原创）", "Instructor-style difficulty (original)"),
};

const courses: Course[] = [
  {
    id: "math",
    code: "33130",
    short: bi("数学 1", "Mathematics 1"),
    name: "Mathematics 1",
    accent: "#1854C7",
    soft: "#E8F0FF",
    mark: "∫",
    canvas: "https://canvas.uts.edu.au/courses/40822/modules",
    zoom: { url: "https://canvas.uts.edu.au/courses/40822/modules/items/2812965", label: bi("在线工作坊 Zoom", "Online workshop Zoom") },
    focus: bi("向量与三维空间", "Vectors & 3D space"),
    topics: [
      bi("向量与三维空间", "Vectors & 3D space"),
      bi("矩阵", "Matrices"),
      bi("微积分建模", "Calculus modelling"),
      bi("隐函数与隐式微分", "Implicit differentiation"),
      bi("积分与积分方法", "Integration methods"),
      bi("复数", "Complex numbers"),
      bi("常微分方程", "Differential equations"),
    ],
    lesson: {
      title: bi("用点积看懂向量投影", "Understand projections with the dot product"),
      intro: bi(
        "点积把两个向量的方向关系变成一个数字。结果为正，夹角小于 90°；为零，两个向量正交；为负，方向大致相反。",
        "The dot product turns the directional relationship between two vectors into one number. Positive means an acute angle, zero means perpendicular, and negative means they point broadly apart.",
      ),
      points: [
        bi("点积：a·b = |a||b|cosθ", "Dot product: a·b = |a||b|cosθ"),
        bi("标量投影：compᵦa = (a·b)/|b|", "Scalar projection: compᵦa = (a·b)/|b|"),
        bi("向量投影：projᵦa = ((a·b)/|b|²)b", "Vector projection: projᵦa = ((a·b)/|b|²)b"),
      ],
      formula: "a = (3, 4), b = (1, 0)  →  a·b = 3",
      example: bi(
        "a 在 x 轴方向的向量投影是 (3, 0)。几何上，就是把 a 垂直“照”到 x 轴上。",
        "The vector projection of a onto the x-axis is (3, 0). Geometrically, it is the perpendicular shadow of a on that axis.",
      ),
    },
  },
  {
    id: "eee",
    code: "48510",
    short: bi("电气与电子", "Electrical & Electronic"),
    name: "Introduction to Electrical and Electronic Engineering",
    accent: "#9F341F",
    soft: "#FFF0EA",
    mark: "Ω",
    canvas: "https://canvas.uts.edu.au/courses/41070/modules",
    zoom: { url: "https://canvas.uts.edu.au/courses/41070/external_tools/3695", label: bi("课程 Zoom", "Course Zoom") },
    focus: bi("基础电路与欧姆定律", "Basic circuits & Ohm's law"),
    topics: [
      bi("电路基本量与欧姆定律", "Circuit quantities & Ohm's law"),
      bi("KCL、KVL 与串并联", "KCL, KVL & series/parallel"),
      bi("节点电压与网孔电流", "Nodal & mesh analysis"),
      bi("叠加、戴维南与诺顿", "Superposition, Thevenin & Norton"),
      bi("电容", "Capacitors"),
      bi("电感与瞬态", "Inductors & transients"),
      bi("二极管与整流", "Diodes & rectifiers"),
      bi("交流、相量与复阻抗", "AC, phasors & complex impedance"),
    ],
    lesson: {
      title: bi("先定参考方向，再写电路方程", "Choose references before writing circuit equations"),
      intro: bi(
        "电压和电流的正负号来自你选择的参考方向。先标节点、电流箭头和元件极性，再使用欧姆定律、KCL 与 KVL，才能避免靠直觉猜符号。",
        "Voltage and current signs come from chosen references. Mark nodes, current arrows and polarities before applying Ohm's law, KCL and KVL.",
      ),
      points: [
        bi("电流：单位时间通过截面的电荷量，I = dq/dt。", "Current is charge flow rate: I = dq/dt."),
        bi("电压：单位电荷的能量差，V = W/q。", "Voltage is energy difference per unit charge: V = W/q."),
        bi("欧姆定律：对欧姆元件 V = IR。", "Ohm's law for an ohmic element: V = IR."),
        bi("功率：p = vi；正号表示吸收功率，负号表示供给功率。", "Power: p = vi; positive absorbs power, negative supplies it."),
      ],
      formula: "V = IR    P = VI = I²R = V²/R",
      example: bi(
        "一个 12 V 电源接 6 Ω 电阻：I=12/6=2 A，电阻吸收功率 P=VI=24 W。用 I²R 再算一次也得到 24 W。",
        "A 12 V source across 6 Ω gives I=12/6=2 A. The resistor absorbs P=VI=24 W; I²R gives the same check.",
      ),
    },
  },
  {
    id: "c",
    code: "48430",
    short: bi("C 编程", "C Programming"),
    name: "Fundamentals of C Programming",
    accent: "#116147",
    soft: "#E6F6F0",
    mark: "{ }",
    canvas: "https://canvas.uts.edu.au/courses/41072/modules",
    zoom: { url: "https://canvas.uts.edu.au/courses/41072/external_tools/3695", label: bi("在线课 Zoom", "Online class Zoom") },
    focus: bi("编程基础", "Programming fundamentals"),
    topics: [
      bi("编程基础", "Programming fundamentals"),
      bi("数据类型、运算符与函数", "Types, operators & functions"),
      bi("控制结构", "Control structures"),
      bi("数组与字符串", "Arrays & strings"),
      bi("结构体与文件", "Structures & files"),
      bi("指针与动态内存", "Pointers & dynamic memory"),
      bi("大型程序组织", "Programming in the large"),
      bi("命令行参数", "Command-line arguments"),
    ],
    lesson: {
      title: bi("变量、类型与表达式", "Variables, types and expressions"),
      intro: bi(
        "C 语言要求你清楚告诉计算机：数据是什么类型、占用什么内存，以及每一步运算如何发生。",
        "C asks you to be explicit about a value’s type, how memory is used and how every operation is evaluated.",
      ),
      points: [
        bi("int 适合整数；double 适合需要小数精度的数值。", "Use int for whole numbers and double when fractional precision matters."),
        bi("整数相除仍得到整数：5 / 2 的结果是 2。", "Integer division stays integer: 5 / 2 evaluates to 2."),
        bi("函数把输入、处理和输出封装成可复用的小单元。", "Functions package inputs, processing and outputs into reusable units."),
      ],
      formula: "double mean = (a + b) / 2.0;",
      example: bi(
        "写 2.0 而不是 2，会让除法在浮点数中进行，避免把 2.5 截断成 2。",
        "Writing 2.0 instead of 2 forces floating-point division, preventing 2.5 from being truncated to 2.",
      ),
    },
  },
  {
    id: "physics",
    code: "68037",
    short: bi("物理建模", "Physical Modelling"),
    name: "Physical Modelling",
    accent: "#5D3AB3",
    soft: "#F0ECFF",
    mark: "↗",
    canvas: "https://canvas.uts.edu.au/courses/41382/modules",
    zoom: { url: "https://canvas.uts.edu.au/courses/41382/modules/items/2699713", label: bi("Zoom 讲座说明", "Zoom lecture information") },
    focus: bi("一维运动学与测量不确定度", "1D kinematics & uncertainty"),
    topics: [
      bi("一维运动学", "1D kinematics"),
      bi("测量与不确定度", "Measurement uncertainty"),
      bi("实验前准备", "Pre-class preparation"),
      bi("力学建模", "Mechanics modelling"),
      bi("Mastering Physics", "Mastering Physics"),
      bi("实验数据分析", "Experimental data analysis"),
      bi("热学与热力学", "Thermal physics & thermodynamics"),
      bi("电学与电路", "Electricity & circuits"),
      bi("振动与波", "Oscillations & waves"),
      bi("流体力学", "Fluid mechanics"),
    ],
    lesson: {
      title: bi("先画运动图，再选公式", "Draw the motion before choosing a formula"),
      intro: bi(
        "运动学题最常见的错误，是看到数字就代公式。先确定正方向、列出已知量，并判断加速度是否恒定。",
        "A common kinematics mistake is substituting numbers too soon. First choose a positive direction, list known quantities and decide whether acceleration is constant.",
      ),
      points: [
        bi("速度描述位置变化率；加速度描述速度变化率。", "Velocity is the rate of change of position; acceleration is the rate of change of velocity."),
        bi("恒加速度：v = v₀ + at", "Constant acceleration: v = v₀ + at"),
        bi("位移：Δx = v₀t + ½at²", "Displacement: Δx = v₀t + ½at²"),
        bi("单位和正负号属于模型的一部分。", "Units and signs are part of the model."),
      ],
      formula: "v₀ = 2 m/s, a = 3 m/s², t = 4 s  →  v = 14 m/s",
      example: bi(
        "若正方向向上，重力加速度应写成 −9.8 m/s²。负号表达方向，并不代表物体一定在减速。",
        "If upward is positive, gravity is −9.8 m/s². The negative sign indicates direction; it does not always mean the object is slowing down.",
      ),
    },
  },
];

const questionBank: Question[] = [
  { id: "m1", courseId: "math", question: bi("若 a·b = 0，且两个向量都不是零向量，可以判断什么？", "If a·b = 0 and neither vector is zero, what follows?"), options: [bi("方向相同", "Same direction"), bi("互相垂直", "They are perpendicular"), bi("长度相等", "Equal length"), bi("方向相反", "Opposite directions")], answer: 1, explanation: bi("点积为 0 意味着 cosθ = 0，因此夹角为 90°。", "A zero dot product gives cosθ = 0, so the angle is 90°.") },
  { id: "m2", courseId: "math", question: bi("向量 (3, 4) 的长度是多少？", "What is the magnitude of the vector (3, 4)?"), options: [bi("4", "4"), bi("5", "5"), bi("7", "7"), bi("25", "25")], answer: 1, explanation: bi("长度为 √(3²+4²)=√25=5。", "Magnitude = √(3²+4²) = √25 = 5.") },
  { id: "m3", courseId: "math", question: bi("向量 (3,4) 在 x 轴上的向量投影是？", "What is the vector projection of (3,4) onto the x-axis?"), options: [bi("(3,0)", "(3,0)"), bi("(0,4)", "(0,4)"), bi("(3,4)", "(3,4)"), bi("(4,0)", "(4,0)")], answer: 0, explanation: bi("x 方向的分量保留为 3，垂直方向的分量变为 0。", "Keep the x-component 3 and remove the perpendicular component.") },
  { id: "m4", courseId: "math", question: bi("矩阵 [[1,2],[3,4]] 的行列式是多少？", "What is det([[1,2],[3,4]])?"), options: [bi("−2", "−2"), bi("2", "2"), bi("10", "10"), bi("−10", "−10")], answer: 0, explanation: bi("2×2 行列式为 ad−bc，所以 1×4−2×3=−2。", "For a 2×2 matrix, det = ad−bc = 1×4−2×3 = −2.") },
  { id: "m5", courseId: "math", question: bi("函数 f(x)=x³ 的导数是？", "What is the derivative of f(x)=x³?"), options: [bi("x²", "x²"), bi("2x", "2x"), bi("3x²", "3x²"), bi("3x", "3x")], answer: 2, explanation: bi("幂函数法则：d(xⁿ)/dx = nxⁿ⁻¹。", "Power rule: d(xⁿ)/dx = nxⁿ⁻¹.") },
  { id: "m6", courseId: "math", question: bi("对 x²+y²=25 隐式求导，dy/dx 等于？", "For x²+y²=25, what is dy/dx?"), options: [bi("x/y", "x/y"), bi("−x/y", "−x/y"), bi("−y/x", "−y/x"), bi("2x+2y", "2x+2y")], answer: 1, explanation: bi("2x+2y(dy/dx)=0，所以 dy/dx=−x/y。", "2x+2y(dy/dx)=0, hence dy/dx=−x/y.") },
  { id: "m7", courseId: "math", question: bi("∫2x dx 的结果是？", "What is ∫2x dx?"), options: [bi("2", "2"), bi("x²+C", "x²+C"), bi("2x²+C", "2x²+C"), bi("ln x+C", "ln x+C")], answer: 1, explanation: bi("x² 的导数是 2x，别忘记积分常数 C。", "The derivative of x² is 2x; include the constant C.") },
  { id: "m8", courseId: "math", question: bi("复数单位 i 的平方等于？", "What is i²?"), options: [bi("1", "1"), bi("−1", "−1"), bi("i", "i"), bi("−i", "−i")], answer: 1, explanation: bi("i 定义为满足 i²=−1 的数。", "The imaginary unit is defined by i²=−1.") },
  { id: "m9", courseId: "math", question: bi("微分方程 dy/dx=ky 的一般解是哪一种形式？", "What form solves dy/dx=ky?"), options: [bi("y=C+kx", "y=C+kx"), bi("y=Ceᵏˣ", "y=Ceᵏˣ"), bi("y=Cxᵏ", "y=Cxᵏ"), bi("y=C/k", "y=C/k")], answer: 1, explanation: bi("指数函数的导数仍与自身成比例。", "An exponential function has a derivative proportional to itself.") },
  { id: "m10", courseId: "math", question: bi("方程 y″+4y=0 的解主要由什么函数组成？", "Solutions of y″+4y=0 are built from which functions?"), options: [bi("指数增长函数", "Growing exponentials"), bi("正弦和余弦", "Sine and cosine"), bi("对数函数", "Logarithms"), bi("常数函数", "Constants")], answer: 1, explanation: bi("特征根为 ±2i，因此解是 cos(2x) 与 sin(2x) 的线性组合。", "The roots are ±2i, giving a linear combination of cos(2x) and sin(2x).") },

  { id: "e1", courseId: "eee", question: bi("12 V 加在 6 Ω 电阻两端，电流是多少？", "A 6 Ω resistor has 12 V across it. What current flows?"), options: [bi("0.5 A", "0.5 A"), bi("2 A", "2 A"), bi("6 A", "6 A"), bi("72 A", "72 A")], answer: 1, explanation: bi("由 V=IR，I=V/R=12/6=2 A。先写公式，再代单位，最后检查电流数量级。", "From V=IR, I=V/R=12/6=2 A. State the law, substitute with units and check the scale.") },
  { id: "e2", courseId: "eee", question: bi("对一个节点应用 KCL，核心依据是什么？", "What principle underlies KCL at a node?"), options: [bi("能量守恒", "Energy conservation"), bi("电荷守恒", "Charge conservation"), bi("动量守恒", "Momentum conservation"), bi("电阻恒定", "Constant resistance")], answer: 1, explanation: bi("节点不能持续积累电荷，因此流入电流代数和等于流出电流代数和。", "A node cannot continually accumulate charge, so the algebraic sum of currents is zero.") },
  { id: "e3", courseId: "eee", question: bi("两个电阻 3 Ω 与 6 Ω 并联，等效电阻是多少？", "What is the equivalent resistance of 3 Ω and 6 Ω in parallel?"), options: [bi("2 Ω", "2 Ω"), bi("3 Ω", "3 Ω"), bi("4.5 Ω", "4.5 Ω"), bi("9 Ω", "9 Ω")], answer: 0, explanation: bi("1/Req=1/3+1/6=1/2，因此 Req=2 Ω；并联等效值应小于最小支路电阻。", "1/Req=1/3+1/6=1/2, so Req=2 Ω; a parallel equivalent must be below the smallest branch resistance.") },
  { id: "e4", courseId: "eee", question: bi("戴维南等效电路由什么组成？", "What forms a Thevenin equivalent?"), options: [bi("电流源并联电阻", "Current source in parallel with resistance"), bi("电压源串联电阻", "Voltage source in series with resistance"), bi("两个电压源串联", "Two voltage sources in series"), bi("只有一个电阻", "One resistor only")], answer: 1, explanation: bi("从负载端口看，线性网络可化为 Vth 与 Rth 串联；诺顿形式则是 In 与 Rn 并联。", "At a load port, a linear network becomes Vth in series with Rth; Norton uses In in parallel with Rn.") },
  { id: "e5", courseId: "eee", question: bi("电容电压能否瞬间跳变？", "Can capacitor voltage change instantaneously?"), options: [bi("总是可以", "Always"), bi("理想有限电流下不可以", "Not with finite ideal current"), bi("只在直流中可以", "Only in DC"), bi("取决于电阻颜色", "Depends on resistor colour")], answer: 1, explanation: bi("i=C dv/dt；有限电流对应有限 dv/dt，因此电容电压连续。瞬间跳变需要无限电流。", "Because i=C dv/dt, finite current gives finite dv/dt, so capacitor voltage is continuous; a jump requires infinite current.") },
  { id: "e6", courseId: "eee", question: bi("电感中储存的能量是？", "What energy is stored in an inductor?"), options: [bi("½CV²", "½CV²"), bi("½LI²", "½LI²"), bi("VI", "VI"), bi("I²R", "I²R")], answer: 1, explanation: bi("电感磁场能量为 W=½LI²；½CV² 是电容电场能量。", "Inductor magnetic energy is W=½LI²; ½CV² is capacitor electric-field energy.") },
  { id: "e7", courseId: "eee", question: bi("理想硅二极管正向导通模型常取多大压降？", "What forward drop is commonly used for a conducting silicon diode model?"), options: [bi("0 V", "0 V"), bi("约 0.7 V", "About 0.7 V"), bi("5 V", "5 V"), bi("无限大", "Infinite")], answer: 1, explanation: bi("常用恒压降模型取约 0.7 V；解题时仍需先假设状态，再检查电流方向是否自洽。", "The constant-drop model uses about 0.7 V; assume a state, solve, then verify the current direction.") },
  { id: "e8", courseId: "eee", question: bi("正弦电压峰值为 10 V，其 RMS 值约为？", "A sinusoidal voltage has a 10 V peak. What is its RMS value?"), options: [bi("5 V", "5 V"), bi("7.07 V", "7.07 V"), bi("10 V", "10 V"), bi("14.14 V", "14.14 V")], answer: 1, explanation: bi("正弦波 Vrms=Vp/√2=10/1.414≈7.07 V。RMS 表示产生相同平均功率的直流等效值。", "For a sinusoid, Vrms=Vp/√2≈7.07 V. RMS is the DC-equivalent heating value.") },
  { id: "e9", courseId: "eee", question: bi("电容的复阻抗是哪一个？", "Which is the complex impedance of a capacitor?"), options: [bi("jωL", "jωL"), bi("1/(jωC)", "1/(jωC)"), bi("R+jωL", "R+jωL"), bi("ωC", "ωC")], answer: 1, explanation: bi("ZC=1/(jωC)=−j/(ωC)，所以电容阻抗的虚部为负，频率越高幅值越小。", "ZC=1/(jωC)=−j/(ωC), so its imaginary part is negative and its magnitude falls with frequency.") },
  { id: "e10", courseId: "eee", question: bi("被动电路中各元件功率的代数和应满足什么？", "What should the algebraic sum of element powers satisfy in a circuit?"), options: [bi("等于零", "Equal zero"), bi("等于最大电阻", "Equal the largest resistance"), bi("永远为正", "Always positive"), bi("等于电流平方", "Equal current squared")], answer: 0, explanation: bi("按被动符号约定，吸收功率为正、供给功率为负；所有元件功率代数和为零，是能量守恒检查。", "With passive sign convention, absorbed power is positive and supplied power negative; the algebraic sum is zero.") },

  { id: "c1", courseId: "c", question: bi("在 C 中，表达式 7 / 2 的结果是？", "In C, what does 7 / 2 evaluate to?"), options: [bi("3", "3"), bi("3.5", "3.5"), bi("4", "4"), bi("编译错误", "Compile error")], answer: 0, explanation: bi("两个操作数都是整数，因此执行整数除法。", "Both operands are integers, so C performs integer division.") },
  { id: "c2", courseId: "c", question: bi("printf 输出 int 常用的格式说明符是？", "Which printf format specifier is used for int?"), options: [bi("%f", "%f"), bi("%s", "%s"), bi("%d", "%d"), bi("%c", "%c")], answer: 2, explanation: bi("%d 用于以十进制形式输出 int。", "%d prints an int in decimal form.") },
  { id: "c3", courseId: "c", question: bi("在 C 中，比较两个值是否相等应使用？", "Which operator tests equality in C?"), options: [bi("=", "="), bi("==", "=="), bi("!=", "!="), bi(":=", ":=")], answer: 1, explanation: bi("= 是赋值，== 才是相等比较。", "= assigns a value; == compares for equality.") },
  { id: "c4", courseId: "c", question: bi("for (int i=0; i<5; i++) 循环多少次？", "How many times does for (int i=0; i<5; i++) run?"), options: [bi("4", "4"), bi("5", "5"), bi("6", "6"), bi("无限次", "Forever")], answer: 1, explanation: bi("i 依次为 0、1、2、3、4，共 5 次。", "i takes 0, 1, 2, 3 and 4: five iterations.") },
  { id: "c5", courseId: "c", question: bi("长度为 10 的数组，最后一个合法下标是？", "What is the last valid index of an array of length 10?"), options: [bi("8", "8"), bi("9", "9"), bi("10", "10"), bi("11", "11")], answer: 1, explanation: bi("C 数组从 0 开始，所以范围是 0 到 9。", "C arrays are zero-indexed, so valid indices are 0 through 9.") },
  { id: "c6", courseId: "c", question: bi("C 字符串以哪个字符结束？", "Which character terminates a C string?"), options: [bi("换行 \\n", "Newline \\n"), bi("空字符 \\0", "Null character \\0"), bi("空格", "Space"), bi("句点", "Period")], answer: 1, explanation: bi("字符串是以 \\0 结尾的字符数组。", "A C string is a character array terminated by \\0.") },
  { id: "c7", courseId: "c", question: bi("若 int x=5;，表达式 &x 表示什么？", "Given int x=5;, what does &x mean?"), options: [bi("x 的值", "Value of x"), bi("x 的地址", "Address of x"), bi("x 的大小", "Size of x"), bi("删除 x", "Delete x")], answer: 1, explanation: bi("& 是取地址运算符，结果可存入 int* 指针。", "& is the address-of operator; its result can be stored in an int* pointer.") },
  { id: "c8", courseId: "c", question: bi("用 malloc 分配的内存使用完后应该？", "What should happen after memory allocated by malloc is no longer needed?"), options: [bi("调用 free", "Call free"), bi("调用 printf", "Call printf"), bi("再次 malloc", "Call malloc again"), bi("什么都不做", "Do nothing")], answer: 0, explanation: bi("free 释放动态内存，避免内存泄漏。", "free releases dynamic memory and prevents a memory leak.") },
  { id: "c9", courseId: "c", question: bi("struct 最适合用来做什么？", "What is struct best used for?"), options: [bi("重复一个循环", "Repeat a loop"), bi("把相关的不同类型数据组合成一个记录", "Group related values of different types"), bi("分配动态内存", "Allocate dynamic memory"), bi("结束程序", "End a program")], answer: 1, explanation: bi("结构体能把姓名、编号、分数等不同字段组成一个实体。", "A structure combines fields such as name, ID and score into one record.") },
  { id: "c10", courseId: "c", question: bi("main(int argc, char *argv[]) 中 argc 表示？", "In main(int argc, char *argv[]), what is argc?"), options: [bi("参数字符串数组", "Array of argument strings"), bi("命令行参数数量", "Number of command-line arguments"), bi("程序返回值", "Program return value"), bi("字符数量", "Number of characters")], answer: 1, explanation: bi("argc 是 argument count；argv 保存各参数字符串。", "argc is the argument count; argv stores the argument strings.") },

  { id: "p1", courseId: "physics", question: bi("物体向上运动，取向上为正。忽略空气阻力，加速度是？", "An object moves upward and up is positive. Ignoring drag, its acceleration is?"), options: [bi("+9.8 m/s²", "+9.8 m/s²"), bi("−9.8 m/s²", "−9.8 m/s²"), bi("0 m/s²", "0 m/s²"), bi("取决于速度", "Depends on velocity")], answer: 1, explanation: bi("重力方向向下，与正方向相反。", "Gravity points downward, opposite to the chosen positive direction.") },
  { id: "p2", courseId: "physics", question: bi("v₀=2 m/s，a=3 m/s²，t=4 s，末速度是多少？", "If v₀=2 m/s, a=3 m/s² and t=4 s, what is v?"), options: [bi("8 m/s", "8 m/s"), bi("10 m/s", "10 m/s"), bi("14 m/s", "14 m/s"), bi("20 m/s", "20 m/s")], answer: 2, explanation: bi("v=v₀+at=2+3×4=14 m/s。", "v=v₀+at=2+3×4=14 m/s.") },
  { id: "p3", courseId: "physics", question: bi("物体从静止开始，以 2 m/s² 加速 3 s，位移是多少？", "Starting from rest at 2 m/s² for 3 s, what is the displacement?"), options: [bi("3 m", "3 m"), bi("6 m", "6 m"), bi("9 m", "9 m"), bi("18 m", "18 m")], answer: 2, explanation: bi("Δx=½at²=½×2×3²=9 m。", "Δx=½at²=½×2×3²=9 m.") },
  { id: "p4", courseId: "physics", question: bi("位置—时间图像的斜率表示？", "What does the slope of a position–time graph represent?"), options: [bi("速度", "Velocity"), bi("加速度", "Acceleration"), bi("力", "Force"), bi("能量", "Energy")], answer: 0, explanation: bi("速度是位置对时间的变化率。", "Velocity is the rate of change of position with time.") },
  { id: "p5", courseId: "physics", question: bi("速度—时间图像下的有符号面积表示？", "What does signed area under a velocity–time graph give?"), options: [bi("加速度", "Acceleration"), bi("位移", "Displacement"), bi("速率", "Speed"), bi("质量", "Mass")], answer: 1, explanation: bi("对速度关于时间积分得到位移。", "Integrating velocity over time gives displacement.") },
  { id: "p6", courseId: "physics", question: bi("测量结果 12.4 ± 0.2 cm 中，0.2 cm 表示？", "In 12.4 ± 0.2 cm, what does 0.2 cm represent?"), options: [bi("百分误差", "Percentage error"), bi("绝对不确定度", "Absolute uncertainty"), bi("平均值", "Mean"), bi("单位换算", "Unit conversion")], answer: 1, explanation: bi("± 后面的量与测量值单位相同，是绝对不确定度。", "The quantity after ± has the same unit and is the absolute uncertainty.") },
  { id: "p7", courseId: "physics", question: bi("测量 10.0 ± 0.2 cm 的百分不确定度是？", "What is the percentage uncertainty of 10.0 ± 0.2 cm?"), options: [bi("0.2%", "0.2%"), bi("2%", "2%"), bi("5%", "5%"), bi("20%", "20%")], answer: 1, explanation: bi("(0.2/10.0)×100%=2%。", "(0.2/10.0)×100%=2%.") },
  { id: "p8", courseId: "physics", question: bi("力的 SI 单位可以写成？", "Which base-unit form equals one newton?"), options: [bi("kg·m·s⁻²", "kg·m·s⁻²"), bi("kg·m²·s⁻¹", "kg·m²·s⁻¹"), bi("kg·s⁻¹", "kg·s⁻¹"), bi("m·s⁻²", "m·s⁻²")], answer: 0, explanation: bi("F=ma，所以单位是 kg×m/s²。", "From F=ma, the unit is kg×m/s².") },
  { id: "p9", courseId: "physics", question: bi("物体以恒定速度沿直线运动，它的加速度是？", "An object moves in a straight line at constant velocity. Its acceleration is?"), options: [bi("恒定但非零", "Constant and non-zero"), bi("零", "Zero"), bi("不断增大", "Increasing"), bi("无法判断", "Impossible to tell")], answer: 1, explanation: bi("速度大小和方向都不变，因此速度变化率为零。", "Velocity has unchanged magnitude and direction, so its rate of change is zero.") },
  { id: "p10", courseId: "physics", question: bi("平均速度的定义是？", "How is average velocity defined?"), options: [bi("总路程/总时间", "Total distance / total time"), bi("位移/时间间隔", "Displacement / time interval"), bi("末速度−初速度", "Final velocity − initial velocity"), bi("加速度×时间", "Acceleration × time")], answer: 1, explanation: bi("平均速度使用位移；平均速率才使用总路程。", "Average velocity uses displacement; average speed uses total distance.") },
];

const difficultyQuestionBank: Question[] = [
  ...mathDifficultyQuestionBank,
  ...eeeDifficultyQuestionBank,
  ...cDifficultyQuestionBank,
  ...physicsDifficultyQuestionBank,
];

const regularTopicQuestionBank: Question[] = (
  topicQuestionBank.length > 0 ? topicQuestionBank : questionBank
)
  .filter((question) => {
    const suffix = Number(question.id.match(/-(\d+)$/)?.[1]);
    return Boolean(question.topicId) && suffix >= 3 && suffix <= 9;
  })
  .map((question) => ({
    ...question,
    difficulty: question.difficulty ?? "application",
    estimatedMinutes: question.estimatedMinutes ?? 6,
  }));

const practiceBank: Question[] = courses.flatMap((course) =>
  course.topics.flatMap((_, topicIndex) => {
    const topicId = `${course.id}-${topicIndex}`;
    return [
      ...regularTopicQuestionBank.filter((question) => question.topicId === topicId),
      ...difficultyQuestionBank.filter((question) => question.topicId === topicId),
    ].sort(
      (a, b) =>
        (difficultyRank.get(a.difficulty ?? "application") ?? 0) -
        (difficultyRank.get(b.difficulty ?? "application") ?? 0),
    );
  }),
);

function answerIsCorrect(question: Question, value: AnswerValue | undefined) {
  if (value === undefined) return false;
  const expected = Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer];
  const actual = Array.isArray(value) ? [...value].sort() : [value];
  return expected.length === actual.length && expected.every((item, index) => item === actual[index]);
}

function answerContains(value: AnswerValue | undefined, option: number) {
  return Array.isArray(value) ? value.includes(option) : value === option;
}

function scopedQuestionIds(filter: string, topicId = "all") {
  return practiceBank
    .filter(
      (question) =>
        (filter === "all" || question.courseId === filter) &&
        (topicId === "all" || question.topicId === topicId),
    )
    .map((question) => question.id);
}

const ui = {
  zh: {
    title: "四课随身学",
    todayStep: "今天，从一小步开始",
    startStudy: "开始今日学习",
    focusTitle: "25 分钟专注",
    start: "开始",
    pause: "暂停",
    restart: "重新开始",
    focusPlan: "读 10 分钟 · 手写 10 分钟 · 自测 5 分钟",
    fourCourses: "四门课",
    viewAll: "查看全部",
    quote: "“不要把看懂当成会做。合上答案，再独立做一次。”",
    tip: "今日学习提示",
    mapTitle: "本学期学习地图",
    mapIntro: "选一门课，先学当前重点，再回 Canvas 完成正式材料。",
    micro: "微课 · 8 分钟",
    think: "想一想",
    done: "✓ 今日已学",
    markDone: "标记今日完成",
    canvas: "打开 Canvas ↗",
    quizTitle: "深度练习模式",
    quizIntro: "每个知识点固定 10 题：1 道基础、2 道应用、4 道复杂/挑战、3 道原创教师题型。答对只记录正确，不自动算掌握；你确认能独立解释后，题目才会离开未掌握队列。",
    all: "全部题目",
    topicPrompt: "选择知识点｜每个知识点 10 题，按基础 → 应用 → 复杂 → 挑战 → 教师题型递进",
    question: "题",
    score: "得分",
    correct: "答对了。",
    review: "再记一次。",
    next: "下一题",
    result: "本轮学习结果",
    retryWrong: "继续练未掌握题",
    retryAll: "重新练习本组",
    perfect: "本轮全部答对，并且都已由你确认掌握。",
    questionRecord: "逐题学习记录",
    practiceQueue: "选择题目状态",
    queueHelp: "答对后仍要自评；选择“未掌握”会让题目留在后续练习中。",
    queueLearning: "未掌握",
    queueMastered: "已掌握",
    queueAll: "全部",
    attemptedQuestions: "已作答",
    masteredQuestions: "已掌握",
    reviewQuestions: "学习中",
    remainingQuestions: "未掌握总数",
    scopeCleared: "这个范围没有未掌握题",
    scopeClearedIntro: "所有题都已由你标记为已掌握。可切换到“已掌握”复查，或重刷全部题目。",
    reviewCompleted: "重刷全部题目",
    historyMastered: "已掌握题",
    historyReview: "未掌握题",
    historyUnrated: "待确认掌握",
    masteryPrompt: "这次是真的理解，还是刚好选对？",
    masteryHelp: "只有不看解析也能说明定义、条件和关键步骤时，才选择“已掌握”。",
    markMastered: "我能解释，已掌握",
    markLearning: "只是猜对 / 仍未掌握",
    noMasteredQuestions: "这个范围还没有已掌握题",
    practiceLearning: "去练未掌握题",
    submitAnswer: "提交答案",
    chooseMultiple: "可选择多个答案，选完后提交",
    deepMode: "深度学习模式",
    masteryRule: "掌握标准：答案正确，并且你能不看解析解释定义、适用条件和关键步骤；猜对或仍不确定时请选择“未掌握”。",
    notMastered: "仍有题目未掌握",
    mastered: "已掌握",
    navToday: "今日",
    navPlan: "计划",
    navCourses: "课程",
    navTutor: "导师",
    navQuiz: "题库",
    tutorTitle: "苏格拉底深度导师",
    tutorIntro: "不急着告诉你答案。先说出思路，再通过追问、提示和重做，把每个知识点真正弄懂。",
    tutorCourse: "选择课程",
    tutorTopic: "选择知识点",
    tutorOptions: "完整答案选项",
    tutorOptionsThink: "先读完并选出你目前认为正确的答案，再在下面写出理由。",
    tutorOptionsProbe: "选项会一直保留；完成导师追问后，你还可以修改答案。",
    tutorOptionsAnswer: "根据刚才的思考确认或修改选项，然后正式提交。",
    tutorOptionsFeedback: "这是你刚才提交的选择；结合下面的反馈检查思路。",
    tutorThought: "先写下你的思路",
    tutorThoughtPlaceholder: "我认为应该……因为……我还不确定的是……",
    tutorSubmitThought: "提交思路，接受追问",
    tutorProbe: "导师追问",
    tutorContinue: "我想过了，继续",
    tutorCommit: "现在提交你的答案",
    tutorRetry: "根据提示重新作答",
    tutorNext: "进入下一道",
    tutorCorrect: "推理成立。现在把方法讲透：",
    tutorWrong: "这一步还没站稳。先定位错误，不跳题。",
    tutorReasoningSaved: "你的原始思路",
    tutorAttempts: "本题尝试",
    tutorStreak: "连续掌握",
    tutorRule: "规则：必须先表达思路；答错后看引导并重做；只有亲自答对才能进入下一题。",
    aiTutor: "DeepSeek AI 导师",
    aiTutorIntro: "它会阅读你的具体疑问，先补定义和条件，再针对你的思路追问。",
    aiPlaceholder: "例如：为什么点积为零就代表垂直？“非零”条件有什么用？",
    askAi: "问 AI 导师",
    aiThinking: "正在分析你的思路……",
    aiError: "AI 暂时没有回答，请稍后再试。",
    aiStarter: "先解释这道题涉及的核心定义、每个符号和必要条件，不要只重复题目。",
    planTitle: "学期执行中心",
    planIntro: "教学计划、个人课表和作业考试已经对齐。每周按“课前—课堂—课后—交付”推进。",
    thisWeek: "本周行动",
    timetable: "个人课表 · 可切换",
    timetableChoiceTitle: "选择个人版显示的数学辅导课",
    timetableChoiceIntro: "选择会立即更新“今天”和本周课表，并保存在这台设备；不会改动 UTS Allocate+。",
    allocatedStatus: "已正式分配",
    waitlistStatus: "候补预览",
    allocatedDisplay: "当前按 UTS 正式分配显示。",
    waitlistDisplay: "当前正在预览候补方案。Allocate+ 显示换班成功前，它不是正式课表。",
    timetableVerification: "已于 2026年8月4日按 Allocate+ 更新：数学正式分配为周二 13:00，候补周二 11:00；C 语言机房课为周五 10:00。",
    assessments: "Assessment 时间线",
    preparation: "课前预习",
    afterClass: "课后练习",
    weeklyOutcome: "本周产出",
    planAll: "全部流程",
    planPrepOnly: "只看预习",
    planReviewOnly: "只看复习",
    planProgress: "本周学习流程",
    beforeWhen: "上课前 30 分钟",
    afterWhen: "下课后 24 小时内",
    recallWhen: "隔天闭卷检查",
    startTen: "开始本知识点练习",
    notes: "本周笔记 / 疑问",
    notesPlaceholder: "记下课堂问题、易错点、老师反馈或下一步……",
    confidence: "掌握度",
    low: "需复习",
    medium: "在进步",
    high: "能独立做",
    completedLabel: "已完成",
    openPlan: "打开本周计划",
    noClass: "今天没有固定课，用 25 分钟处理最近的 assessment。",
    dueSoon: "最近截止",
    days: "天",
    todayDue: "今天",
    datePending: "待公布",
    assessmentStep: "当前建议",
    allCourses: "全部",
    navigate: "打开 Google 地图",
    onlineClass: "在线上课，不需要到校园",
    roomGuide: "课室代码：CB 后两位是楼号，中间是楼层，最后三位是房间号。",
    howToGet: "怎么去",
    stepBuilding: "先到教学楼",
    stepLevel: "再到楼层",
    stepRoom: "最后找房间",
    openCanvasClass: "打开 Canvas 进入课堂",
    physicalBadge: "到校上课",
    onlineBadge: "线上上课",
    arriveTip: "第一次去建议提前 15 分钟到楼下。",
    zoom: "进入 Zoom",
    zoomInfo: "Zoom 入口",
    zoomProtected: "通过 Canvas 登录后进入，不公开会议密码",
  },
  en: {
    title: "Four-Course Study",
    todayStep: "One small step today",
    startStudy: "Start today’s lesson",
    focusTitle: "25-minute focus",
    start: "Start",
    pause: "Pause",
    restart: "Restart",
    focusPlan: "Read 10 min · Work 10 min · Recall 5 min",
    fourCourses: "Four courses",
    viewAll: "View all",
    quote: "“Do not confuse recognising a solution with being able to produce it.”",
    tip: "Study tip",
    mapTitle: "Your semester learning map",
    mapIntro: "Choose a course, learn the current focus, then complete the official material in Canvas.",
    micro: "MICRO LESSON · 8 MIN",
    think: "Think it through",
    done: "✓ Studied today",
    markDone: "Mark today complete",
    canvas: "Open Canvas ↗",
    quizTitle: "Deep Learning Mode",
    quizIntro: "Every topic has 10 questions: 1 foundation, 2 application, 4 complex/challenge and 3 original instructor-style problems. A correct answer records correctness only; the item leaves your learning queue only after you confirm you can explain it independently.",
    all: "All questions",
    topicPrompt: "Choose a topic | 10 questions progress from foundation → application → complex → challenge → instructor style",
    question: "Question",
    score: "Score",
    correct: "Correct.",
    review: "Review this.",
    next: "Next question",
    result: "Learning round result",
    retryWrong: "Continue unmastered questions",
    retryAll: "Restart this set",
    perfect: "Every item was correct and explicitly confirmed as mastered.",
    questionRecord: "Question learning record",
    practiceQueue: "Choose question status",
    queueHelp: "Correct answers still require self-assessment. Choose “Not mastered” to keep an item in future practice.",
    queueLearning: "Not mastered",
    queueMastered: "Mastered",
    queueAll: "All",
    attemptedQuestions: "Attempted",
    masteredQuestions: "Mastered",
    reviewQuestions: "Still learning",
    remainingQuestions: "Not mastered",
    scopeCleared: "There are no unmastered questions in this scope",
    scopeClearedIntro: "You have marked every item as mastered. Switch to “Mastered” to verify them, or restart the complete scope.",
    reviewCompleted: "Restart all questions",
    historyMastered: "Mastered item",
    historyReview: "Not mastered",
    historyUnrated: "Mastery not confirmed",
    masteryPrompt: "Did you understand it, or did the choice happen to be right?",
    masteryHelp: "Choose mastered only if you can explain the definition, conditions and key steps without reading the solution.",
    markMastered: "I can explain it — mastered",
    markLearning: "Guessed / still learning",
    noMasteredQuestions: "There are no mastered questions in this scope yet",
    practiceLearning: "Practise unmastered questions",
    submitAnswer: "Submit answer",
    chooseMultiple: "Select every correct answer, then submit",
    deepMode: "Deep Learning Mode",
    masteryRule: "Mastery means the answer is correct and you can explain the definition, conditions and key steps without the solution. Choose “Not mastered” after a guess or whenever you are unsure.",
    notMastered: "Some questions are still unmastered",
    mastered: "Mastered",
    navToday: "Today",
    navPlan: "Plan",
    navCourses: "Courses",
    navTutor: "Tutor",
    navQuiz: "Practice",
    tutorTitle: "Socratic Deep Tutor",
    tutorIntro: "No instant answer. State your reasoning, follow targeted questions, use hints and retry until the idea is genuinely understood.",
    tutorCourse: "Choose a course",
    tutorTopic: "Choose a topic",
    tutorOptions: "Complete answer choices",
    tutorOptionsThink: "Read every choice, select your current answer, then explain your reasoning below.",
    tutorOptionsProbe: "The choices stay visible; you can revise your answer after the tutor question.",
    tutorOptionsAnswer: "Confirm or revise your choice from the reasoning above, then submit it.",
    tutorOptionsFeedback: "This is the choice you submitted; compare it with the feedback below.",
    tutorThought: "Write your reasoning first",
    tutorThoughtPlaceholder: "I think I should… because… What I am unsure about is…",
    tutorSubmitThought: "Submit reasoning",
    tutorProbe: "Tutor question",
    tutorContinue: "I have thought about it — continue",
    tutorCommit: "Commit your answer",
    tutorRetry: "Retry with the guidance",
    tutorNext: "Next challenge",
    tutorCorrect: "Your reasoning holds. Now make the method explicit:",
    tutorWrong: "This step is not secure yet. Locate the error before moving on.",
    tutorReasoningSaved: "Your original reasoning",
    tutorAttempts: "Attempts",
    tutorStreak: "Mastery streak",
    tutorRule: "Rule: explain your thinking first, retry every mistake, and advance only after you answer correctly yourself.",
    aiTutor: "DeepSeek AI Tutor",
    aiTutorIntro: "It reads your exact question, repairs missing definitions and conditions, then probes your reasoning.",
    aiPlaceholder: "For example: why does a zero dot product imply perpendicular vectors, and why must they be non-zero?",
    askAi: "Ask AI tutor",
    aiThinking: "Analysing your reasoning…",
    aiError: "The AI tutor could not answer just now. Please try again.",
    aiStarter: "Explain the core definitions, every symbol and all necessary conditions. Do not merely repeat the question.",
    planTitle: "Semester execution centre",
    planIntro: "Your teaching plans, personal timetable and assessments are aligned into a weekly pre-class–class–post-class–delivery rhythm.",
    thisWeek: "This week",
    timetable: "Personal timetable · selectable",
    timetableChoiceTitle: "Choose the Mathematics tutorial shown here",
    timetableChoiceIntro: "Your choice updates Today and the weekly timetable and is saved on this device. It does not change UTS Allocate+.",
    allocatedStatus: "Officially allocated",
    waitlistStatus: "Waitlist preview",
    allocatedDisplay: "Showing the timetable currently allocated by UTS.",
    waitlistDisplay: "Previewing a waitlisted option. It is not official until Allocate+ confirms the swap.",
    timetableVerification: "Updated from Allocate+ on 4 August 2026: Mathematics is allocated Tuesday 13:00 with Tuesday 11:00 waitlisted; the C computer lab is Friday 10:00.",
    assessments: "Assessment timeline",
    preparation: "Pre-class",
    afterClass: "Post-class practice",
    weeklyOutcome: "Weekly output",
    planAll: "Full flow",
    planPrepOnly: "Pre-class only",
    planReviewOnly: "Review only",
    planProgress: "Weekly learning flow",
    beforeWhen: "30 min before class",
    afterWhen: "Within 24 hours",
    recallWhen: "Closed-book next day",
    startTen: "Start this topic practice",
    notes: "Notes / questions",
    notesPlaceholder: "Capture questions, mistakes, tutor feedback or your next step…",
    confidence: "Confidence",
    low: "Review",
    medium: "Progressing",
    high: "Independent",
    completedLabel: "Complete",
    openPlan: "Open this week’s plan",
    noClass: "No scheduled class today. Use 25 minutes on the nearest assessment.",
    dueSoon: "Due soon",
    days: "days",
    todayDue: "Today",
    datePending: "Pending",
    assessmentStep: "Next move",
    allCourses: "All",
    navigate: "Open Google Maps",
    onlineClass: "Online class — no campus room",
    roomGuide: "Room codes show the building, level and room number in that order.",
    howToGet: "How to get there",
    stepBuilding: "Find the building",
    stepLevel: "Go to the level",
    stepRoom: "Find the room",
    openCanvasClass: "Open Canvas to join",
    physicalBadge: "On campus",
    onlineBadge: "Online",
    arriveTip: "For your first visit, arrive at the building 15 minutes early.",
    zoom: "Join Zoom",
    zoomInfo: "Zoom access",
    zoomProtected: "Opens through Canvas sign-in; meeting credentials stay private",
  },
};

const planModuleHeadings: Record<PlanModule, { eyebrow: Bi; title: Bi; intro: Bi }> = {
  weekly: {
    eyebrow: bi("预习 → 上课 → 复习 → 回忆", "PREP → CLASS → REVIEW → RETRIEVAL"),
    title: bi("本周学习流程", "Weekly study flow"),
    intro: bi("一次只处理一周：先预习、再复习，最后用闭卷回忆确认是否真正掌握。", "Work one week at a time: prepare, review, then verify mastery with closed-book retrieval."),
  },
  timetable: {
    eyebrow: bi("时间 · 地点 · 入口", "TIME · PLACE · ACCESS"),
    title: bi("个人课程表", "Personal timetable"),
    intro: bi("集中查看上课时间、课室、线上入口和数学辅导课的个人显示方案。", "See class times, rooms, online access and your selected Mathematics tutorial display."),
  },
  assessments: {
    eyebrow: bi("截止日期与里程碑", "DEADLINES & MILESTONES"),
    title: bi("作业与考试", "Assignments and exams"),
    intro: bi("按截止日期和课程筛选 Assessment，并明确现在应该推进的下一步。", "Filter assessments by deadline and course, with one clear next action for each item."),
  },
  widget: {
    eyebrow: bi("iOS 主屏幕", "IOS HOME SCREEN"),
    title: bi("iOS 课表组件", "iOS timetable widget"),
    intro: bi("单独管理桌面组件的预览、安装、课表参数和更新步骤。", "Manage the Home Screen widget preview, installation, timetable parameter and updates."),
  },
};

const tutorPrompts: Record<string, Bi[]> = {
  math: [
    bi("先不要代数值：题目给了哪些量，真正要求的量是什么？", "Before substituting: which quantities are given, and what exactly must be found?"),
    bi("你准备使用哪个定义、定理或公式？它的适用条件在这里成立吗？", "Which definition, theorem or formula will you use, and are its conditions satisfied here?"),
    bi("检查一次符号、运算顺序与最终形式。有没有一个简单特例能验证你的结果？", "Check signs, operation order and final form. Can a simple special case test your result?"),
  ],
  eee: [
    bi("先标出所有节点、电流参考方向和元件极性。你选择的符号约定是什么？", "Mark every node, current reference and element polarity first. What sign convention are you using?"),
    bi("你准备使用欧姆定律、KCL、KVL，还是等效电路？为什么这个方法适用？", "Will you use Ohm's law, KCL, KVL or an equivalent circuit, and why does it apply?"),
    bi("用单位、功率守恒或极限情况检查结果。负号是在说明方向，还是计算错误？", "Check units, power balance or a limiting case. Does a negative sign indicate direction or an error?"),
  ],
  c: [
    bi("先逐行追踪：这一行执行前，每个相关变量的值和类型是什么？", "Trace line by line: before this statement, what are the values and types of the relevant variables?"),
    bi("这一操作改变的是数值、控制流，还是内存中的位置？", "Does this operation change a value, the control flow, or a location in memory?"),
    bi("别凭感觉运行代码：写出下一步的精确结果，并检查边界、类型转换和未定义行为。", "Do not run it by intuition: write the exact next state and check bounds, conversions and undefined behaviour."),
  ],
  physics: [
    bi("先画模型：选定正方向，并列出已知量、未知量及每个量的单位。", "Model first: choose a positive direction and list knowns, unknowns and units."),
    bi("你使用的物理关系有哪些前提？例如加速度恒定、系统封闭或忽略阻力。", "What assumptions support the physical relation—for example constant acceleration, a closed system or negligible drag?"),
    bi("结果的正负号、单位和数量级分别告诉你什么？它符合图像或现实趋势吗？", "What do the sign, unit and order of magnitude tell you? Does the result match the graph or physical trend?"),
  ],
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentSemesterWeek(date: Date) {
  const active = semesterWeeks.find(
    (week) => date >= new Date(`${week.start}T00:00:00`) && date <= new Date(`${week.end}T23:59:59`),
  );
  if (active) return active.week;
  if (date < new Date(`${semesterWeeks[0].start}T00:00:00`)) return semesterWeeks[0].week;
  return semesterWeeks.at(-1)?.week ?? semesterWeeks[0].week;
}

function formatAiSections(content: string) {
  const cleaned = content
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();

  return cleaned
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const [first, ...rest] = lines;
      const isHeading =
        rest.length > 0 &&
        (/^(?:\d+[\s.、)]|step\s+\d+|步骤\s*\d+|你已经抓住了|现在只差这一点|下一步问题|what you got right|one gap|one next question|定义|直觉|思路|例子|误区|检查|结论|下一步|问题)/i.test(first) ||
          /[:：]$/.test(first));
      return isHeading
        ? { heading: first.replace(/[:：]$/, ""), body: rest.join("\n") }
        : { body: lines.join("\n") };
    });
}

function AiMessageBody({ content }: { content: string }) {
  return (
    <div className="ai-message-content">
      {formatAiSections(content).map((section, index) => (
        <section key={`${section.heading ?? "paragraph"}-${index}`}>
          {section.heading && <h4>{section.heading}</h4>}
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

export default function Home({
  initialLocale = "zh-CN",
}: {
  initialLocale?: "zh-CN" | "en";
}) {
  const [lang, setLang] = useState<Lang>(initialLocale === "zh-CN" ? "zh" : "en");
  const [view, setView] = useState<View>("today");
  const [planModule, setPlanModule] = useState<PlanModule>("weekly");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("math");
  const [selectedCourseTopic, setSelectedCourseTopic] = useState(0);
  const [sessionCompletions, setSessionCompletions] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [quizFilter, setQuizFilter] = useState("all");
  const [quizTopic, setQuizTopic] = useState("all");
  const [quizQueueMode, setQuizQueueMode] = useState<QuizQueueMode>("learning");
  const [sessionIds, setSessionIds] = useState(practiceBank.map((q) => q.id));
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionProgress, setQuestionProgress] = useState<QuestionProgressStore>({});
  const [draftSelections, setDraftSelections] = useState<Record<string, number[]>>({});
  const [answerEvidenceByQuestion, setAnswerEvidenceByQuestion] = useState<
    Record<string, AnswerWorkspaceEvidence>
  >({});
  const [learningRound, setLearningRound] = useState(1);
  const [masteredTopics, setMasteredTopics] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [browsedWeek, setBrowsedWeek] = useState(1);
  const [planFocus, setPlanFocus] = useState<"all" | "prepare" | "review">("all");
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({});
  const [planNotes, setPlanNotes] = useState<Record<string, string>>({});
  const [timetableSelections, setTimetableSelections] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [assessmentFilter, setAssessmentFilter] = useState("all");
  const [tutorCourse, setTutorCourse] = useState("math");
  const [tutorTopic, setTutorTopic] = useState("all");
  const [tutorIndex, setTutorIndex] = useState(0);
  const [tutorStage, setTutorStage] = useState<"think" | "probe" | "answer" | "feedback">("think");
  const [tutorThought, setTutorThought] = useState("");
  const [tutorChoice, setTutorChoice] = useState<number[]>([]);
  const [tutorAttempts, setTutorAttempts] = useState(0);
  const [tutorCorrect, setTutorCorrect] = useState(false);
  const [tutorMasteryEligible, setTutorMasteryEligible] = useState(false);
  const [tutorMasteryCredit, setTutorMasteryCredit] = useState(false);
  const [tutorScopeFinished, setTutorScopeFinished] = useState(false);
  const [tutorStreak, setTutorStreak] = useState(0);
  const [tutorHintLevel, setTutorHintLevel] = useState(0);
  const [viewedSolutionIds, setViewedSolutionIds] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<AiTutorMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [resumeState, setResumeState] = useState<ResumeState | null>(null);
  const [sessionTakeaways, setSessionTakeaways] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(
    () => new Date("2026-07-27T12:00:00+10:00"),
  );

  const copy = ui[lang];
  const pick = (text: Bi) => text[lang];

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const savedLang = window.localStorage.getItem("four-course-language") as Lang | null;
      const publicLocale = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("deepstudy_locale="))
        ?.split("=")[1];
      const systemLanguage = (window.navigator.languages?.[0] ?? window.navigator.language)
        .toLowerCase()
        .startsWith("zh")
        ? "zh"
        : "en";
      const resolvedLanguage =
        savedLang === "zh" || savedLang === "en"
          ? savedLang
          : publicLocale === "zh-CN"
            ? "zh"
            : publicLocale === "en"
              ? "en"
              : systemLanguage;
      setLang(resolvedLanguage);
      const savedChecks = window.localStorage.getItem("four-course-plan-checks");
      const savedNotes = window.localStorage.getItem("four-course-plan-notes");
      const savedTimetableSelections = window.localStorage.getItem("four-course-timetable-selections-v1");
      const savedConfidence = window.localStorage.getItem("four-course-confidence");
      const savedMastery = window.localStorage.getItem("four-course-mastery");
      const savedSessions = window.localStorage.getItem("four-course-session-completions");
      const savedTakeaways = window.localStorage.getItem("four-course-session-takeaways");
      const savedResume = window.localStorage.getItem("four-course-resume-v2");
      const savedQuestionProgress = window.localStorage.getItem("four-course-question-progress-v1");
      let restoredQuestionProgress: QuestionProgressStore = {};
      try {
        if (savedChecks) setPlanChecks(JSON.parse(savedChecks));
        if (savedNotes) setPlanNotes(JSON.parse(savedNotes));
        if (savedTimetableSelections) {
          const parsedSelections = JSON.parse(savedTimetableSelections) as Record<string, string>;
          const validSelections = Object.fromEntries(
            timetableChoiceGroups.flatMap((group) => {
              const selectedId = parsedSelections[group.id];
              if (!selectedId || !group.choices.some((choice) => choice.id === selectedId)) {
                return [];
              }
              return [[group.id, selectedId] as const];
            }),
          );
          setTimetableSelections(validSelections);
        }
        if (savedConfidence) setConfidence(JSON.parse(savedConfidence));
        if (savedMastery) setMasteredTopics(JSON.parse(savedMastery));
        if (savedSessions) setSessionCompletions(JSON.parse(savedSessions));
        if (savedTakeaways) setSessionTakeaways(JSON.parse(savedTakeaways));
        if (savedQuestionProgress) {
          restoredQuestionProgress = normalizeQuestionProgress(
            JSON.parse(savedQuestionProgress),
            new Set(practiceBank.map((question) => question.id)),
          );
        }
        if (savedResume) {
          const parsed = JSON.parse(savedResume) as ResumeState;
          if (parsed && parsed.view && parsed.selectedId) {
            setResumeState(parsed);
            setSelectedId(parsed.selectedId);
            setPlanModule(parsed.planModule ?? "weekly");
            setSelectedCourseTopic(parsed.selectedCourseTopic ?? 0);
            setBrowsedWeek(parsed.browsedWeek ?? 1);
            setQuizFilter(parsed.quizFilter ?? "all");
            setQuizTopic(parsed.quizTopic ?? "all");
            setQuizQueueMode(parsed.quizQueueMode ?? "learning");
            setQuizIndex(parsed.quizIndex ?? 0);
            if (Array.isArray(parsed.sessionIds)) setSessionIds(parsed.sessionIds);
            setAnswers(parsed.answers ?? {});
            setDraftSelections(parsed.draftSelections ?? {});
            setAnswerEvidenceByQuestion(parsed.answerEvidenceByQuestion ?? {});
            for (const [questionId, value] of Object.entries(parsed.answers ?? {})) {
              if (restoredQuestionProgress[questionId]) continue;
              const question = practiceBank.find((item) => item.id === questionId);
              if (!question) continue;
              restoredQuestionProgress = recordQuestionAttempt(
                restoredQuestionProgress,
                questionId,
                {
                  correct: answerIsCorrect(question, value),
                  answeredAt: parsed.updatedAt,
                },
              );
            }
            const restoredTutorCourse = parsed.tutorCourse ?? "math";
            const restoredTutorTopic = parsed.tutorTopic ?? "all";
            const restoredTutorQuestions = practiceBank.filter(
              (question) =>
                question.courseId === restoredTutorCourse &&
                (restoredTutorTopic === "all" || question.topicId === restoredTutorTopic),
            );
            const requestedTutorIndex = Math.max(
              0,
              Math.min(parsed.tutorIndex ?? 0, restoredTutorQuestions.length - 1),
            );
            const requestedTutorQuestion = restoredTutorQuestions[requestedTutorIndex];
            const firstPendingTutorIndex = restoredTutorQuestions.findIndex(
              (question) => !restoredQuestionProgress[question.id]?.mastered,
            );
            const restoredTutorIndex =
              requestedTutorQuestion &&
              !restoredQuestionProgress[requestedTutorQuestion.id]?.mastered
                ? requestedTutorIndex
                : firstPendingTutorIndex;
            setTutorCourse(restoredTutorCourse);
            setTutorTopic(restoredTutorTopic);
            setTutorIndex(Math.max(0, restoredTutorIndex));
            setTutorScopeFinished(
              restoredTutorQuestions.length > 0 && restoredTutorIndex < 0,
            );
            setView(parsed.view);
          }
        }
      } catch {
        // Ignore malformed legacy browser data and start from safe defaults.
      }
      setQuestionProgress(restoredQuestionProgress);
      const current = new Date();
      setNow(current);
      const resolvedWeek = getCurrentSemesterWeek(current);
      setCurrentWeek(resolvedWeek);
      if (!savedResume) setBrowsedWeek(resolvedWeek);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-session-completions", JSON.stringify(sessionCompletions));
  }, [hydrated, sessionCompletions]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-session-takeaways", JSON.stringify(sessionTakeaways));
  }, [hydrated, sessionTakeaways]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      "four-course-question-progress-v1",
      JSON.stringify(questionProgress),
    );
  }, [hydrated, questionProgress]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-language", lang);
    document.cookie = `deepstudy_locale=${lang === "zh" ? "zh-CN" : "en"}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en-AU";
    document.title = lang === "zh" ? "四课随身学 · DeepStudy" : "Four-Course Study · DeepStudy";
  }, [hydrated, lang]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-plan-checks", JSON.stringify(planChecks));
  }, [hydrated, planChecks]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-plan-notes", JSON.stringify(planNotes));
  }, [hydrated, planNotes]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      "four-course-timetable-selections-v1",
      JSON.stringify(timetableSelections),
    );
  }, [hydrated, timetableSelections]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-confidence", JSON.stringify(confidence));
  }, [confidence, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("four-course-mastery", JSON.stringify(masteredTopics));
  }, [hydrated, masteredTopics]);

  useEffect(() => {
    if (!hydrated || view === "today") return;
    const nextResume: ResumeState = {
      view,
      planModule,
      selectedId,
      selectedCourseTopic,
      browsedWeek,
      quizFilter,
      quizTopic,
      quizQueueMode,
      quizIndex,
      sessionIds,
      answers,
      draftSelections,
      tutorCourse,
      tutorTopic,
      tutorIndex,
      answerEvidenceByQuestion,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem("four-course-resume-v2", JSON.stringify(nextResume));
  }, [
    answers,
    answerEvidenceByQuestion,
    browsedWeek,
    draftSelections,
    hydrated,
    planModule,
    quizFilter,
    quizIndex,
    quizQueueMode,
    quizTopic,
    selectedCourseTopic,
    selectedId,
    sessionIds,
    tutorCourse,
    tutorIndex,
    tutorTopic,
    view,
  ]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  useEffect(() => {
    if (!hydrated) return;
    const clock = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(clock);
  }, [hydrated]);

  const selected = courses.find((course) => course.id === selectedId) ?? courses[0];
  const activeDestinationId: PersonalDestinationId =
    view === "plan"
      ? (`plan-${planModule}` as PersonalDestinationId)
      : view === "courses"
        ? (`course-${selected.id}` as PersonalDestinationId)
        : view;
  const activeMainModule = mainModuleForDestination(activeDestinationId);
  const activePlanHeading = planModuleHeadings[planModule];
  const selectedTopicId = `${selected.id}-${selectedCourseTopic}`;
  const selectedDeepLesson = deepLessons[selectedTopicId] ?? deepLessons["math-0"];
  const currentQuestion = practiceBank.find((q) => q.id === sessionIds[quizIndex]);
  const answeredCurrent = currentQuestion ? answers[currentQuestion.id] : undefined;
  const sessionQuestions = sessionIds
    .map((id) => practiceBank.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));
  const correctCount = sessionQuestions.filter((q) => answerIsCorrect(q, answers[q.id])).length;
  const unmasteredSessionIds = sessionQuestions
    .filter((q) => answers[q.id] !== undefined && !questionProgress[q.id]?.mastered)
    .map((q) => q.id);
  const quizComplete =
    sessionIds.length > 0 &&
    sessionQuestions.length === sessionIds.length &&
    sessionQuestions.every((question) => {
      const answer = answers[question.id];
      if (answer === undefined) return false;
      if (!answerIsCorrect(question, answer)) return true;
      return questionProgress[question.id]?.masteryStatus !== "unrated";
    });
  const overallQuestionProgress = summarizeQuestionProgress(
    practiceBank.map((question) => question.id),
    questionProgress,
  );
  const semesterWeek = semesterWeeks.find((week) => week.week === browsedWeek) ?? semesterWeeks[0];
  const currentSemesterWeek = semesterWeeks.find((week) => week.week === currentWeek) ?? semesterWeeks[0];
  const weeklyPlanKeys = semesterWeek.plans.flatMap((plan) => [
    `w${browsedWeek}-${plan.courseId}-pre`,
    `w${browsedWeek}-${plan.courseId}-post`,
    `w${browsedWeek}-${plan.courseId}-output`,
  ]);
  const weeklyPlanDone = weeklyPlanKeys.filter((key) => planChecks[key]).length;
  const currentPlanKeys = currentSemesterWeek.plans.flatMap((plan) => [
    `w${currentWeek}-${plan.courseId}-pre`,
    `w${currentWeek}-${plan.courseId}-post`,
    `w${currentWeek}-${plan.courseId}-output`,
  ]);
  const currentPlanDone = currentPlanKeys.filter((key) => planChecks[key]).length;
  const progress = currentPlanKeys.length === 0 ? 0 : Math.round((currentPlanDone / currentPlanKeys.length) * 100);
  const semesterIsActive =
    now >= new Date(`${semesterWeeks[0].start}T00:00:00`) &&
    now <= new Date(`${semesterWeeks.at(-1)?.end ?? semesterWeeks[0].end}T23:59:59`);
  const selectedChoiceForGroup = (groupId: string) => {
    const group = timetableChoiceGroups.find((entry) => entry.id === groupId);
    if (!group) return undefined;
    return (
      group.choices.find((choice) => choice.id === timetableSelections[group.id]) ??
      group.choices.find((choice) => choice.status === "allocated") ??
      group.choices[0]
    );
  };
  const activeTimetable: TimetableItem[] = timetable.map((item) => {
    const group = timetableChoiceGroups.find(
      (entry) =>
        entry.courseId === item.courseId &&
        item.activity.en.includes(entry.activityGroup),
    );
    if (!group) return item;
    const choice = selectedChoiceForGroup(group.id);
    if (!choice) return item;
    return {
      ...item,
      activity: choice.activity,
      day: choice.day,
      dayLabel: choice.dayLabel,
      start: choice.start,
      end: choice.end,
      location: choice.location,
      startsWeek: choice.startsWeek ?? item.startsWeek,
      venue: choice.venue ?? item.venue,
    };
  });
  const choiceForTimetableItem = (item: TimetableItem) => {
    const group = timetableChoiceGroups.find(
      (entry) =>
        entry.courseId === item.courseId &&
        item.activity.en.includes(entry.activityGroup),
    );
    return group ? selectedChoiceForGroup(group.id) : undefined;
  };
  const todayClasses = activeTimetable
    .filter((item) => semesterIsActive && item.day === now.getDay() && (!item.startsWeek || currentWeek >= item.startsWeek))
    .sort((a, b) => a.start.localeCompare(b.start));
  const upcomingAssessments = assessments
    .filter((item) => !item.date || new Date(item.date).getTime() >= now.getTime() - 86400000)
    .sort((a, b) => (a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER) - (b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER));
  const tutorCourseData = courses.find((course) => course.id === tutorCourse) ?? courses[0];
  const tutorQuestions = practiceBank.filter((question) =>
    question.courseId === tutorCourse && (tutorTopic === "all" || question.topicId === tutorTopic),
  );
  const tutorQuestion = tutorQuestions[tutorIndex % Math.max(tutorQuestions.length, 1)];
  const tutorQuestionProgress = tutorQuestion
    ? questionProgress[tutorQuestion.id]
    : undefined;
  const tutorMasteryDecisionPending =
    tutorCorrect &&
    tutorMasteryEligible &&
    tutorQuestionProgress?.masteryStatus !== "mastered" &&
    tutorQuestionProgress?.masteryStatus !== "learning";
  const tutorScopeProgress = summarizeQuestionProgress(
    tutorQuestions.map((question) => question.id),
    questionProgress,
  );
  const tutorAnswerEvidence = tutorQuestion
    ? answerEvidenceByQuestion[tutorQuestion.id]
    : undefined;
  const tutorEvidenceRequired = Boolean(tutorQuestion?.answerTools?.length);
  const tutorEvidenceReady =
    !tutorEvidenceRequired || evidenceIsMeaningful(tutorAnswerEvidence);
  const selectedSessionKey = `${localDateKey(now)}-${selectedTopicId}`;
  const aiTutorUnlocked =
    tutorThought.trim().length >= 8 && tutorAttempts > 0 && tutorEvidenceReady;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const topicQuestionCount = (topicId: string) =>
    practiceBank.filter((question) => question.topicId === topicId).length;
  const dailyTasks = (() => {
    const tasks: DailyTask[] = [];
    const add = (task: DailyTask) => tasks.push(task);

    const urgentAssessments = upcomingAssessments.filter((item) => {
      const days = daysUntil(item.date);
      return days !== null && days <= 7 && !planChecks[`assessment-${item.id}`];
    });
    urgentAssessments.forEach((item) => {
      const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
      const days = daysUntil(item.date) ?? 0;
      add({
        id: `assessment-${item.id}`,
        kind: "assessment",
        title: item.title[lang],
        meta:
          lang === "zh"
            ? `${course.code} · ${days === 0 ? "今天截止" : `${days} 天后截止`}`
            : `${course.code} · ${days === 0 ? "due today" : `due in ${days} days`}`,
        cta: lang === "zh" ? "查看下一步" : "Open next step",
        priority: days <= 2 ? 0 : 4,
        courseId: item.courseId,
        week: currentWeek,
      });
    });

    todayClasses.forEach((item) => {
      const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
      const plan = currentSemesterWeek.plans.find((entry) => entry.courseId === item.courseId);
      const topicId = plan?.topicId ?? `${course.id}-0`;
      const [startHour, startMinute] = item.start.split(":").map(Number);
      const [endHour, endMinute] = item.end.split(":").map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      if (currentMinutes >= start && currentMinutes < end) {
        add({
          id: `class-${item.courseId}-${item.start}`,
          kind: "class",
          title: `${item.activity[lang]} · ${course.code}`,
          meta: `${item.start}–${item.end} · ${item.location}`,
          cta: item.venue.kind === "online" ? copy.zoom : copy.navigate,
          priority: 1,
          courseId: item.courseId,
          topicId,
          href: item.venue.zoomUrl ?? item.venue.mapUrl ?? course.canvas,
        });
      } else if (currentMinutes < start && !planChecks[`w${currentWeek}-${item.courseId}-pre`]) {
        add({
          id: `today-pre-${item.courseId}`,
          kind: "prepare",
          title: plan?.prepare[lang] ?? pick(course.focus),
          meta:
            lang === "zh"
              ? `${course.code} · ${item.start} 上课前预习`
              : `${course.code} · prepare before the ${item.start} class`,
          cta: lang === "zh" ? "开始预习" : "Start pre-class",
          priority: 2,
          courseId: item.courseId,
          topicId,
          week: currentWeek,
        });
      } else if (currentMinutes >= end && !planChecks[`w${currentWeek}-${item.courseId}-post`]) {
        add({
          id: `today-post-${item.courseId}`,
          kind: "review",
          title: plan?.after[lang] ?? pick(course.focus),
          meta:
            lang === "zh"
              ? `${course.code} · 今天下课后复习`
              : `${course.code} · post-class review due today`,
          cta: lang === "zh" ? "开始复习" : "Start review",
          priority: 2,
          courseId: item.courseId,
          topicId,
          week: currentWeek,
        });
      }
    });

    if (resumeState && now.getTime() - resumeState.updatedAt < 14 * 86400000) {
      const course = courses.find((entry) => entry.id === resumeState.selectedId) ?? courses[0];
      const topic = course.topics[resumeState.selectedCourseTopic] ?? course.focus;
      add({
        id: "resume",
        kind: "resume",
        title:
          resumeState.view === "quiz"
            ? lang === "zh"
              ? `继续第 ${resumeState.quizIndex + 1} 题`
              : `Continue question ${resumeState.quizIndex + 1}`
            : resumeState.view === "tutor"
              ? lang === "zh"
                ? "继续苏格拉底导师"
                : "Continue Socratic tutor"
              : resumeState.view === "plan"
                ? lang === "zh"
                  ? `继续 W${resumeState.browsedWeek} 学习计划`
                  : `Continue the W${resumeState.browsedWeek} plan`
                : pick(topic),
        meta: `${course.code} · ${pick(course.short)}`,
        cta: lang === "zh" ? "从上次位置继续" : "Resume where I stopped",
        priority: 3,
        courseId: course.id,
        topicId: `${course.id}-${resumeState.selectedCourseTopic}`,
      });
    }

    if (currentWeek > 1) {
      const previous = semesterWeeks.find((week) => week.week === currentWeek - 1);
      previous?.plans.forEach((plan) => {
        const course = courses.find((entry) => entry.id === plan.courseId) ?? courses[0];
        const topicId = plan.topicId;
        if (!planChecks[`w${previous.week}-${plan.courseId}-output`]) {
          add({
            id: `due-recall-${previous.week}-${plan.courseId}`,
            kind: "recall",
            title: plan.outcome[lang],
            meta:
              lang === "zh"
                ? `${course.code} · 上周延迟回忆到期`
                : `${course.code} · last week’s delayed retrieval is due`,
            cta: lang === "zh" ? "闭卷检查" : "Start closed-book check",
            priority: 5,
            courseId: plan.courseId,
            topicId,
            week: previous.week,
          });
        }
      });
    }

    sessionCompletions.forEach((sessionKey) => {
      const completedOn = new Date(`${sessionKey.slice(0, 10)}T23:59:59`);
      const topicId = sessionKey.slice(11);
      const courseId = topicId.split("-")[0];
      const course = courses.find((entry) => entry.id === courseId);
      if (
        course &&
        now.getTime() >= completedOn.getTime() + 48 * 60 * 60 * 1000 &&
        !planChecks[`session-retrieval-${sessionKey}`]
      ) {
        const topicIndex = Number(topicId.split("-").at(-1));
        add({
          id: `session-retrieval-${sessionKey}`,
          kind: "recall",
          title:
            lang === "zh"
              ? `48 小时复测：${pick(course.topics[topicIndex] ?? course.focus)}`
              : `48-hour retrieval: ${pick(course.topics[topicIndex] ?? course.focus)}`,
          meta: `${course.code} · ${lang === "zh" ? "不看笔记独立完成" : "complete without notes"}`,
          cta: lang === "zh" ? "开始复测" : "Start retrieval",
          priority: 4,
          courseId,
          topicId,
          week: currentWeek,
        });
      }
    });

    currentSemesterWeek.plans.forEach((plan) => {
      const course = courses.find((entry) => entry.id === plan.courseId) ?? courses[0];
      const topicId = plan.topicId;
      if (!planChecks[`w${currentWeek}-${plan.courseId}-pre`]) {
        add({
          id: `week-pre-${plan.courseId}`,
          kind: "prepare",
          title: plan.prepare[lang],
          meta: `${course.code} · ${lang === "zh" ? "本周课前" : "this week · pre-class"}`,
          cta: lang === "zh" ? "开始预习" : "Start pre-class",
          priority: 7,
          courseId: plan.courseId,
          topicId,
          week: currentWeek,
        });
      } else if (!planChecks[`w${currentWeek}-${plan.courseId}-post`]) {
        add({
          id: `week-review-${plan.courseId}`,
          kind: "review",
          title: plan.after[lang],
          meta: `${course.code} · ${lang === "zh" ? "本周课后" : "this week · post-class"}`,
          cta: lang === "zh" ? "开始复习" : "Start review",
          priority: 8,
          courseId: plan.courseId,
          topicId,
          week: currentWeek,
        });
      } else if (!planChecks[`w${currentWeek}-${plan.courseId}-output`]) {
        add({
          id: `week-recall-${plan.courseId}`,
          kind: "recall",
          title: plan.outcome[lang],
          meta: `${course.code} · ${lang === "zh" ? "隔天闭卷检查" : "delayed closed-book check"}`,
          cta: lang === "zh" ? "开始检查" : "Start check",
          priority: 9,
          courseId: plan.courseId,
          topicId,
          week: currentWeek,
        });
      }
    });

    if (tasks.length === 0) {
      const course = courses[0];
      add({
        id: "fallback-practice",
        kind: "recall",
        title: pick(course.focus),
        meta: `${course.code} · ${topicQuestionCount(`${course.id}-0`)} ${lang === "zh" ? "题主动回忆" : "active-recall questions"}`,
        cta: lang === "zh" ? "开始练习" : "Start practice",
        priority: 20,
        courseId: course.id,
        topicId: `${course.id}-0`,
        week: currentWeek,
      });
    }

    return tasks
      .sort((a, b) => a.priority - b.priority)
      .filter((task, index, list) => list.findIndex((entry) => entry.id === task.id) === index);
  })();
  const primaryTask = dailyTasks[0];
  const queuedTasks = dailyTasks.slice(1, 4);

  function daysUntil(date?: string) {
    if (!date) return null;
    const due = new Date(date);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.round((dueDay.getTime() - today.getTime()) / 86400000));
  }

  function assessmentAdvice(date?: string) {
    const days = daysUntil(date);
    if (days === null) return lang === "zh" ? "建立每周累计复习，不等日期公布。" : "Build cumulative weekly revision; do not wait for the date.";
    if (days > 28) return lang === "zh" ? "读 rubric，建文件夹、时间线和交付清单。" : "Read the rubric; create folders, timeline and deliverables.";
    if (days > 14) return lang === "zh" ? "完成研究/题型地图，做出第一版。" : "Finish research/topic mapping and produce a first version.";
    if (days > 7) return lang === "zh" ? "做完整草稿或模拟卷，主动拿反馈。" : "Build a full draft or mock test and seek feedback.";
    if (days > 2) return lang === "zh" ? "按 rubric 逐项检查，修正最大风险。" : "Check every rubric item and fix the biggest risk.";
    return lang === "zh" ? "最终检查、备份并预留提前提交时间。" : "Final QA, backup and leave an early-submission buffer.";
  }

  function chooseCourse(id: string, topicId?: string) {
    setSelectedId(id);
    const topicIndex = topicId ? Number(topicId.split("-").at(-1)) : 0;
    setSelectedCourseTopic(Number.isFinite(topicIndex) ? topicIndex : 0);
    setView("courses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeStudySession() {
    if ((sessionTakeaways[selectedSessionKey] ?? "").trim().length < 8) return;
    setSessionCompletions((items) =>
      items.includes(selectedSessionKey) ? items : [...items, selectedSessionKey],
    );
  }

  function restoreResume(saved: ResumeState) {
    setSelectedId(saved.selectedId);
    setPlanModule(saved.planModule ?? "weekly");
    setSelectedCourseTopic(saved.selectedCourseTopic ?? 0);
    setBrowsedWeek(saved.browsedWeek ?? currentWeek);
    setQuizFilter(saved.quizFilter ?? "all");
    setQuizTopic(saved.quizTopic ?? "all");
    setQuizQueueMode(saved.quizQueueMode ?? "learning");
    setQuizIndex(saved.quizIndex ?? 0);
    if (Array.isArray(saved.sessionIds)) setSessionIds(saved.sessionIds);
    setAnswers(saved.answers ?? {});
    setDraftSelections(saved.draftSelections ?? {});
    setAnswerEvidenceByQuestion(saved.answerEvidenceByQuestion ?? {});
    if (saved.view === "tutor") {
      openTutorScope(saved.tutorCourse ?? "math", saved.tutorTopic ?? "all");
    } else {
      setTutorCourse(saved.tutorCourse ?? "math");
      setTutorTopic(saved.tutorTopic ?? "all");
      setTutorIndex(saved.tutorIndex ?? 0);
    }
    setView(saved.view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToday() {
    const savedResume = window.localStorage.getItem("four-course-resume-v2");
    if (savedResume) {
      try {
        setResumeState(JSON.parse(savedResume) as ResumeState);
      } catch {
        setResumeState(null);
      }
    }
    setView("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateToDestination(id: PersonalDestinationId) {
    setMenuOpen(false);
    if (id === "today") {
      goToday();
      return;
    }
    if (id.startsWith("plan-")) {
      setPlanModule(id.slice("plan-".length) as PlanModule);
      setView("plan");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id.startsWith("course-")) {
      const courseId = id.slice("course-".length);
      if (courseId !== selectedId) setSelectedCourseTopic(0);
      setSelectedId(courseId);
      setView("courses");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id === "tutor") {
      showTutorView();
    } else {
      setView("quiz");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function executeDailyTask(task: DailyTask) {
    if (task.kind === "resume" && resumeState) {
      restoreResume(resumeState);
      return;
    }
    if (task.kind === "assessment") {
      setAssessmentFilter(task.courseId ?? "all");
      setBrowsedWeek(task.week ?? currentWeek);
      setPlanModule("assessments");
      setView("plan");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (task.kind === "class" && task.href) {
      window.open(task.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (task.kind === "prepare" && task.courseId) {
      chooseCourse(task.courseId, task.topicId);
      return;
    }
    if (task.courseId) {
      startQuiz(task.courseId, undefined, task.topicId ?? "all");
      setView("quiz");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handoffToAiExplanation(question: Question, value: AnswerValue) {
    const topicId = question.topicId ?? "all";
    const scopedQuestions = practiceBank.filter(
      (item) => item.courseId === question.courseId && (topicId === "all" || item.topicId === topicId),
    );
    const nextIndex = Math.max(0, scopedQuestions.findIndex((item) => item.id === question.id));
    const correct = answerIsCorrect(question, value);
    const selectedLabels = (Array.isArray(value) ? value : [value])
      .map((index) => `${String.fromCharCode(65 + index)}. ${pick(question.options[index])}`)
      .join(", ");
    const originalThought = correct
      ? lang === "zh"
        ? `我刚才选择了 ${selectedLabels}，答案正确，但我需要确认这不是猜对的。`
        : `I chose ${selectedLabels}. It was correct, but I need to verify that it was not a guess.`
      : lang === "zh"
        ? `我刚才选择了 ${selectedLabels}，但答案错误。请从我最早出错的概念或计算步骤开始修正。`
        : `I chose ${selectedLabels}, but it was incorrect. Start from my earliest conceptual or calculation error.`;
    const request = correct
      ? lang === "zh"
        ? "请把这道题作为教师难度题完整地、一步一步讲解：先解释定义和适用条件，再读取题目中的图表或数据，列出公式并解释每个符号，展示计算，检查单位、符号和合理性，最后给一道新的迁移题。"
        : "Teach this instructor-style problem completely, step by step: define the ideas and conditions, read the visual or data, explain every symbol in the formula, calculate, check units/signs/reasonableness, then give one fresh transfer problem."
      : lang === "zh"
        ? "请针对我的错误做完整教学讲解：先指出我最早错在哪里，再从定义和条件开始一步一步重建解法，读取图表或数据，展示计算并检查单位、符号和合理性，最后给一道新的迁移题。"
        : "Teach from my error: identify the earliest wrong step, rebuild the solution from definitions and conditions, read the visual or data, show the calculation and check units/signs/reasonableness, then give one fresh transfer problem.";
    setTutorCourse(question.courseId);
    setTutorTopic(topicId);
    setTutorIndex(nextIndex);
    setTutorStage("feedback");
    setTutorThought(originalThought);
    setTutorChoice(Array.isArray(value) ? value : [value]);
    setTutorAttempts(1);
    setTutorCorrect(correct);
    setTutorMasteryEligible(false);
    setTutorMasteryCredit(false);
    setTutorScopeFinished(false);
    setTutorHintLevel(5);
    setAiMessages([]);
    setAiInput("");
    setAiError("");
    setView("tutor");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void requestAiTutor({
      question,
      content: request,
      hintLevel: 5,
      originalThought,
      attempted: true,
      correct,
      history: [],
    });
  }

  function startQuiz(
    filter: string,
    ids?: string[],
    topicId = "all",
    queueMode: QuizQueueMode = "learning",
  ) {
    const scopeIds = scopedQuestionIds(filter, topicId);
    const nextIds =
      ids ??
      (queueMode === "mastered"
        ? scopeIds.filter((questionId) => questionProgress[questionId]?.mastered)
        : queueMode === "all"
          ? scopeIds
          : pendingQuestionIds(scopeIds, questionProgress));
    setQuizFilter(filter);
    setQuizTopic(topicId);
    setQuizQueueMode(queueMode);
    setSessionIds(nextIds);
    setQuizIndex(0);
    setAnswers({});
    setDraftSelections({});
    if (!ids) {
      const nextIdSet = new Set(nextIds);
      setAnswerEvidenceByQuestion((items) =>
        Object.fromEntries(
          Object.entries(items).filter(([questionId]) => !nextIdSet.has(questionId)),
        ),
      );
    }
    if (!ids) setLearningRound(1);
  }

  function restartQuiz(filter: string, topicId = "all") {
    startQuiz(filter, scopedQuestionIds(filter, topicId), topicId, "all");
    setLearningRound(1);
  }

  function chooseQuizQueue(queueMode: QuizQueueMode) {
    startQuiz(quizFilter, undefined, quizTopic, queueMode);
  }

  function recordAnswerEvidence(evidence: AnswerWorkspaceEvidence) {
    if (!evidenceIsMeaningful(evidence)) return;
    setAnswerEvidenceByQuestion((items) => upsertAnswerEvidence(items, evidence));
  }

  function goNext() {
    if (quizIndex < sessionIds.length - 1) {
      setQuizIndex((index) => index + 1);
    }
  }

  function continueDeepLearning() {
    setQuizQueueMode("learning");
    setSessionIds(unmasteredSessionIds);
    setQuizIndex(0);
    setAnswers({});
    setDraftSelections({});
    setLearningRound((round) => round + 1);
  }

  function markMastered() {
    if (quizTopic !== "all") {
      setMasteredTopics((items) => items.includes(quizTopic) ? items : [...items, quizTopic]);
    }
  }

  function recordQuizAnswer(question: Question, value: AnswerValue) {
    const correct = answerIsCorrect(question, value);
    setQuestionProgress((items) =>
      recordQuestionAttempt(items, question.id, { correct }),
    );
    setAnswers((items) => ({ ...items, [question.id]: value }));
  }

  function decideQuizMastery(questionId: string, mastered: boolean) {
    const nextProgress = setQuestionMastery(
      questionProgress,
      questionId,
      mastered,
    );
    setQuestionProgress(nextProgress);
    if (!mastered || !sessionIds.every((id) => nextProgress[id]?.mastered)) return;

    markMastered();
    if (quizTopic === "all") return;
    const clearedReviews = sessionCompletions
      .filter((sessionKey) => sessionKey.endsWith(`-${quizTopic}`))
      .reduce<Record<string, boolean>>((items, sessionKey) => {
        const completedOn = new Date(`${sessionKey.slice(0, 10)}T23:59:59`);
        if (Date.now() >= completedOn.getTime() + 48 * 60 * 60 * 1000) {
          items[`session-retrieval-${sessionKey}`] = true;
        }
        return items;
      }, {});
    if (Object.keys(clearedReviews).length > 0) {
      setPlanChecks((items) => ({ ...items, ...clearedReviews }));
    }
  }

  function resetTutorQuestion(nextIndex = 0, scopeFinished = false) {
    setTutorIndex(nextIndex);
    setTutorScopeFinished(scopeFinished);
    setTutorStage("think");
    setTutorThought("");
    setTutorChoice([]);
    setTutorAttempts(0);
    setTutorCorrect(false);
    setTutorMasteryEligible(false);
    setTutorMasteryCredit(false);
    setTutorHintLevel(0);
    setAiMessages([]);
    setAiInput("");
    setAiError("");
  }

  function openTutorScope(courseId: string, topicId = "all") {
    const scope = practiceBank.filter(
      (question) =>
        question.courseId === courseId &&
        (topicId === "all" || question.topicId === topicId),
    );
    const pendingIndex = scope.findIndex(
      (question) => !questionProgress[question.id]?.mastered,
    );
    setTutorCourse(courseId);
    setTutorTopic(topicId);
    resetTutorQuestion(
      Math.max(0, pendingIndex),
      scope.length > 0 && pendingIndex < 0,
    );
  }

  function chooseTutorCourse(id: string) {
    openTutorScope(id);
  }

  function showTutorView() {
    if (tutorStage !== "feedback") {
      const current = tutorQuestions[tutorIndex % Math.max(tutorQuestions.length, 1)];
      if (!current || questionProgress[current.id]?.mastered) {
        const pendingIndex = tutorQuestions.findIndex(
          (question) => !questionProgress[question.id]?.mastered,
        );
        resetTutorQuestion(
          Math.max(0, pendingIndex),
          tutorQuestions.length > 0 && pendingIndex < 0,
        );
      }
    }
    setView("tutor");
  }

  function submitTutorAnswer() {
    if (!tutorQuestion || tutorChoice.length === 0) return;
    const value: AnswerValue = Array.isArray(tutorQuestion.answer) ? tutorChoice : tutorChoice[0];
    const correct = answerIsCorrect(tutorQuestion, value);
    const receivesMasteryCredit = countsTowardTutorMastery({
      correct,
      reasoning: tutorThought,
      hasAnswerEvidence: evidenceIsMeaningful(tutorAnswerEvidence),
      requiresAnswerEvidence: tutorEvidenceRequired,
      highestHintLevel: tutorHintLevel,
      viewedFullSolution: viewedSolutionIds.includes(tutorQuestion.id),
      isFreshTransfer: !viewedSolutionIds.includes(tutorQuestion.id),
    });
    setQuestionProgress((items) =>
      recordQuestionAttempt(items, tutorQuestion.id, {
        correct,
        masteryStatus:
          correct && receivesMasteryCredit ? "unrated" : "learning",
      }),
    );
    setTutorAttempts((count) => count + 1);
    setTutorCorrect(correct);
    setTutorMasteryEligible(correct && receivesMasteryCredit);
    setTutorMasteryCredit(false);
    setTutorStage("feedback");
    if (!receivesMasteryCredit) setTutorStreak(0);
  }

  function decideTutorMastery(mastered: boolean) {
    if (!tutorQuestion) return;
    const wasMastered = questionProgress[tutorQuestion.id]?.mastered === true;
    setQuestionProgress((items) =>
      setQuestionMastery(items, tutorQuestion.id, mastered),
    );
    setTutorMasteryCredit(mastered);
    if (mastered && !wasMastered) {
      setTutorStreak((count) => count + 1);
    } else if (!mastered) {
      setTutorStreak(0);
    }
  }

  function nextTutorQuestion() {
    for (let offset = 1; offset <= tutorQuestions.length; offset += 1) {
      const nextIndex = (tutorIndex + offset) % tutorQuestions.length;
      const nextQuestion = tutorQuestions[nextIndex];
      if (!questionProgress[nextQuestion.id]?.mastered) {
        resetTutorQuestion(nextIndex);
        return;
      }
    }
    setTutorScopeFinished(true);
  }

  async function requestAiTutor({
    question,
    content,
    hintLevel,
    originalThought,
    attempted,
    correct,
    history,
  }: {
    question: Question;
    content: string;
    hintLevel: number;
    originalThought: string;
    attempted: boolean;
    correct: boolean;
    history: AiTutorMessage[];
  }) {
    if (aiLoading || !content.trim()) return;
    const effectiveHintLevel = Math.max(0, Math.min(5, hintLevel));
    if (effectiveHintLevel >= 5) {
      setViewedSolutionIds((items) =>
        items.includes(question.id) ? items : [...items, question.id],
      );
      setTutorMasteryCredit(false);
    }
    const userEntry: AiTutorMessage = { role: "user", content: content.trim() };
    setAiMessages([...history, userEntry]);
    setAiInput("");
    setAiError("");
    setAiLoading(true);

    const courseData = courses.find((course) => course.id === question.courseId) ?? courses[0];
    const answerIndexes = Array.isArray(question.answer) ? question.answer : [question.answer];
    const topicIndex = question.topicId ? Number(question.topicId.split("-").at(-1)) : -1;
    const requestPayload = {
      language: lang,
      course: `${courseData.code} ${courseData.name}`,
      topic: topicIndex >= 0 ? pick(courseData.topics[topicIndex]) : pick(courseData.focus),
      question: pick(question.question),
      options: question.options.map(pick),
      correctAnswer: answerIndexes.map((index) => `${String.fromCharCode(65 + index)}. ${pick(question.options[index])}`).join("; "),
      explanation: pick(question.explanation),
      visualContext: buildTutorVisualContext(question, lang),
      originalThought,
      answerEvidence: answerEvidenceByQuestion[question.id] ?? null,
      userMessage:
        effectiveHintLevel >= 5
          ? content.trim()
          : `${content.trim()}\n\nTutor constraint: preserve what is correct, diagnose one gap only, do not reveal the correct option or final answer, and end with exactly one next-step question.`,
      attempted,
      correct,
      hintLevel: effectiveHintLevel,
      history: history.slice(-8).map(({ role, content: messageContent }) => ({ role, content: messageContent })),
    };
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      const payload = (await response.json()) as {
        reply?: string;
        error?: string | { message?: string };
      };
      const errorMessage =
        typeof payload.error === "string"
          ? payload.error
          : payload.error?.message;
      if (!response.ok || !payload.reply) {
        throw new Error(errorMessage || "AI tutor is temporarily unavailable.");
      }
      const reply = payload.reply;
      setAiMessages((items) => [...items, { role: "assistant", content: reply, hintLevel: effectiveHintLevel }]);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : copy.aiError);
    } finally {
      setAiLoading(false);
    }
  }

  async function askAiTutor(message?: string, hintOverride?: number) {
    if (!tutorQuestion || aiLoading) return;
    if (!aiTutorUnlocked) {
      setAiError(
        lang === "zh"
          ? "先写出你的思路并提交一次答案，AI 才会根据真实错误提供提示。"
          : "Write your reasoning and commit one answer before asking AI for a targeted hint.",
      );
      return;
    }
    const content = (message ?? aiInput).trim();
    if (!content) return;
    await requestAiTutor({
      question: tutorQuestion,
      content,
      hintLevel: hintOverride ?? tutorHintLevel,
      originalThought: tutorThought,
      attempted: tutorAttempts > 0,
      correct: tutorAttempts > 0 && tutorCorrect,
      history: aiMessages,
    });
  }

  function renderTutorVisual(visual?: QuestionVisual) {
    if (!visual) return null;
    if (visual.kind === "code") {
      return <figure className="question-visual code-visual"><figcaption>{pick(visual.title)}</figcaption><pre><code>{visual.code}</code></pre></figure>;
    }
    if (visual.kind === "table") {
      return (
        <figure className="question-visual table-visual">
          <figcaption>{pick(visual.title)}</figcaption>
          <div className="visual-scroll"><table><thead><tr>{visual.columns.map((column) => <th key={column.en}>{pick(column)}</th>)}</tr></thead>
            <tbody>{visual.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
        </figure>
      );
    }
    const maxValue = Math.max(...visual.values);
    return (
      <figure className="question-visual bars-visual">
        <figcaption>{pick(visual.title)}</figcaption>
        <div className="bar-plot" role="img" aria-label={pick(visual.title)}>
          {visual.values.map((value, index) => (
            <div className="bar-column" key={visual.labels[index].en}>
              <span className="bar-value">{value}{visual.unit}</span>
              <span className="bar-shape" style={{ height: `${Math.max(12, (value / maxValue) * 116)}px` }} />
              <span className="bar-label">{pick(visual.labels[index])}</span>
            </div>
          ))}
        </div>
      </figure>
    );
  }

  return (
    <main className="app-shell personal-workspace">
      <header className="topbar">
        <div className="personal-brand">
          <span className="personal-brand-signal" aria-hidden="true" />
          <div>
            <p>{lang === "zh" ? "2026 春季学期 · UTS" : "Spring 2026 · UTS"}</p>
            <h1>{copy.title}</h1>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="language-toggle"
            onClick={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
            aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
          >
            {lang === "zh" ? "English" : "中文"}
          </button>
          <div
            className="top-progress"
            role="progressbar"
            aria-label={lang === "zh" ? `本周学习计划完成 ${progress}%` : `Weekly plan ${progress}% complete`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            title={lang === "zh" ? "本周计划进度" : "Weekly plan progress"}
          >
            <span>{lang === "zh" ? "本周" : "Week"}</span>
            <strong>{progress}%</strong>
          </div>
        </div>
      </header>

      <PersonalModuleMenu
        lang={lang}
        open={menuOpen}
        activeId={activeDestinationId}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateToDestination}
      />

      <ModuleContextBar
        lang={lang}
        activeId={activeDestinationId}
        menuOpen={menuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onNavigate={navigateToDestination}
      />

      {view === "today" && (
        <section className="view-stack today-view">
          <article className="hero-card daily-hero">
            <p className="hero-kicker">
              {now.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-AU", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })} · W{currentWeek}
            </p>
            <span className="task-kind">
              {primaryTask.kind === "resume"
                ? lang === "zh" ? "继续学习" : "Resume"
                : primaryTask.kind === "assessment"
                  ? lang === "zh" ? "作业与考试" : "Assessment"
                  : primaryTask.kind === "class"
                    ? lang === "zh" ? "现在上课" : "Class now"
                    : primaryTask.kind === "prepare"
                      ? lang === "zh" ? "课前预习" : "Pre-class"
                      : primaryTask.kind === "review"
                        ? lang === "zh" ? "课后复习" : "Post-class"
                        : lang === "zh" ? "延迟回忆" : "Retrieval"}
            </span>
            <h2>{primaryTask.title}</h2>
            <p>{primaryTask.meta}</p>
            <button className="primary-button" onClick={() => executeDailyTask(primaryTask)}>
              {primaryTask.cta} <span aria-hidden="true">→</span>
            </button>
          </article>

          <section className="daily-queue" aria-labelledby="daily-queue-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{lang === "zh" ? "今天接下来" : "Up next today"}</p>
                <h2 id="daily-queue-title">{lang === "zh" ? "接下来" : "Up next"}</h2>
              </div>
            </div>
            <ol>
              {queuedTasks.map((task, index) => (
                <li key={task.id}>
                  <button onClick={() => executeDailyTask(task)}>
                    <span className="queue-number">{index + 2}</span>
                    <span className="queue-copy"><strong>{task.title}</strong><small>{task.meta}</small></span>
                    <span className="queue-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="focus-strip" aria-label={copy.focusTitle}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{lang === "zh" ? "专注计时" : "Focus timer"}</p>
                <h2>{formatTime(seconds)}</h2>
              </div>
              <button
                className="timer-button"
                onClick={() => {
                  if (seconds === 0) setSeconds(25 * 60);
                  setRunning((value) => !value);
                }}
              >
                {running ? copy.pause : seconds === 0 ? copy.restart : copy.start}
              </button>
            </div>
            <div
              className="timer-track"
              role="progressbar"
              aria-label={copy.focusTitle}
              aria-valuemin={0}
              aria-valuemax={25 * 60}
              aria-valuenow={25 * 60 - seconds}
            >
              <span style={{ width: `${(seconds / (25 * 60)) * 100}%` }} />
            </div>
            <p>{copy.focusPlan}</p>
          </section>

          <details className="today-context">
            <summary>
              <span>
                <strong>{lang === "zh" ? "今天的课和最近截止" : "Today’s classes and due dates"}</strong>
                <small>{todayClasses.length} {lang === "zh" ? "节课" : "classes"} · {upcomingAssessments.length} {lang === "zh" ? "项待办" : "upcoming"}</small>
              </span>
              <span aria-hidden="true">＋</span>
            </summary>
            <div className="today-class-list">
              {todayClasses.length === 0 && <p className="empty-note">{copy.noClass}</p>}
              {todayClasses.map((item) => {
                const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                const timetableChoice = choiceForTimetableItem(item);
                return (
                  <article key={`${item.courseId}-${item.start}`} style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                    <span className="class-time">{item.start}</span>
                    <div>
                      <strong>{course.code} · {pick(course.short)}</strong>
                      <p>{item.activity[lang]} · {item.location}</p>
                      {timetableChoice?.status === "waitlist" && (
                        <small className="today-preview-badge">{copy.waitlistStatus}</small>
                      )}
                    </div>
                    <a className="today-map-link" href={item.venue.zoomUrl ?? item.venue.mapUrl ?? course.canvas} target="_blank" rel="noreferrer">
                      {item.venue.kind === "online" ? copy.zoom : copy.navigate} →
                    </a>
                  </article>
                );
              })}
            </div>
            <div className="deadline-peek">
              <p>{copy.dueSoon}</p>
              {upcomingAssessments.slice(0, 3).map((item) => {
                const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                const days = daysUntil(item.date);
                return (
                  <button key={item.id} onClick={() => { setAssessmentFilter(item.courseId); setBrowsedWeek(currentWeek); setPlanModule("assessments"); setView("plan"); }}>
                    <span style={{ background: course.soft }}>{course.code}</span>
                    <strong>{item.title[lang]}</strong>
                    <small>{days === null ? copy.datePending : days === 0 ? copy.todayDue : `${days} ${copy.days}`}</small>
                  </button>
                );
              })}
            </div>
          </details>
        </section>
      )}

      {view === "plan" && (
        <section className="view-stack plan-view">
          {planModule !== "widget" && <div className="page-intro">
            <p className="eyebrow">{pick(activePlanHeading.eyebrow)}</p>
            <h2>{pick(activePlanHeading.title)}</h2>
            <p>{pick(activePlanHeading.intro)}</p>
          </div>}

          {(planModule === "weekly" || planModule === "timetable") && (
          <div className="week-picker" aria-label={copy.thisWeek}>
            {semesterWeeks.map((week) => (
              <button
                key={week.week}
                className={browsedWeek === week.week ? "active" : ""}
                aria-current={currentWeek === week.week ? "date" : undefined}
                aria-pressed={browsedWeek === week.week}
                onClick={() => setBrowsedWeek(week.week)}
              >
                <strong>W{week.week}</strong>
                <small>{currentWeek === week.week ? (lang === "zh" ? "本周" : "Current") : week.range[lang]}</small>
              </button>
            ))}
          </div>
          )}

          {planModule === "widget" && (
          <IOSTimetableWidget
            lang={lang}
            now={now}
            timetable={activeTimetable}
            assessments={assessments}
            selectedMathChoiceId={selectedChoiceForGroup("math-tutorial")?.id}
          />
          )}

          {planModule === "timetable" && (
          <section className="schedule-card schedule-module" aria-label={copy.timetable}>
            <div className="timetable-choice-panel">
              {timetableChoiceGroups.map((group) => {
                const selectedChoice = selectedChoiceForGroup(group.id);
                const selectedId = selectedChoice?.id;
                return (
                  <fieldset key={group.id} className="timetable-choice-fieldset">
                    <legend>{copy.timetableChoiceTitle}</legend>
                    <div className="timetable-choice-heading">
                      <div>
                        <strong>{group.title[lang]}</strong>
                        <small>{group.checkedAt[lang]}</small>
                      </div>
                      <span>{lang === "zh" ? "本机保存" : "Saved locally"}</span>
                    </div>
                    <p>{copy.timetableChoiceIntro}</p>
                    <div className="timetable-choice-list">
                      {group.choices.map((choice) => {
                        const selected = selectedId === choice.id;
                        return (
                          <label
                            key={choice.id}
                            className={selected ? "timetable-choice-option selected" : "timetable-choice-option"}
                          >
                            <input
                              type="radio"
                              name={`timetable-choice-${group.id}`}
                              value={choice.id}
                              checked={selected}
                              onChange={() =>
                                setTimetableSelections((current) => ({
                                  ...current,
                                  [group.id]: choice.id,
                                }))
                              }
                            />
                            <span className="timetable-choice-time">
                              <strong>{choice.dayLabel[lang]} · {choice.start}–{choice.end}</strong>
                              <small>{choice.activity[lang]} · {choice.location}</small>
                            </span>
                            <span className={`timetable-choice-status ${choice.status}`}>
                              {choice.status === "allocated" ? copy.allocatedStatus : copy.waitlistStatus}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedChoice && (
                      <div
                        className={`timetable-choice-result ${selectedChoice.status}`}
                        aria-live="polite"
                      >
                        <strong>
                          {selectedChoice.status === "allocated"
                            ? copy.allocatedDisplay
                            : copy.waitlistDisplay}
                        </strong>
                        <p>{selectedChoice.note[lang]}</p>
                      </div>
                    )}
                  </fieldset>
                );
              })}
              <p className="timetable-verification-note">ⓘ {copy.timetableVerification}</p>
            </div>
            <div className="schedule-list">
              {activeTimetable
                .filter((item) => !item.startsWeek || browsedWeek >= item.startsWeek)
                .map((item) => {
                  const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                  const timetableChoice = choiceForTimetableItem(item);
                  return (
                    <article key={`${item.courseId}-${item.activity.en}-${item.start}`} style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                      <div className="schedule-day">
                        <strong>{item.dayLabel[lang]}</strong>
                        <span>{item.start}</span>
                      </div>
                      <div>
                        <strong>{course.code} · {pick(course.short)}</strong>
                        <p>{item.activity[lang]} · {item.start}–{item.end}</p>
                        {timetableChoice && (
                          <span className={`schedule-choice-badge ${timetableChoice.status}`}>
                            {timetableChoice.status === "allocated" ? copy.allocatedStatus : copy.waitlistStatus}
                          </span>
                        )}
                      </div>
                      <small className="room-code">{item.location}</small>
                      <div className="route-card">
                        <div className="route-title">
                          <strong>{copy.howToGet}</strong>
                          <span className={item.venue.kind === "online" ? "online" : ""}>
                            {item.venue.kind === "online" ? copy.onlineBadge : copy.physicalBadge}
                          </span>
                        </div>
                        {item.venue.kind === "physical" ? (
                          <div className="route-steps">
                            <div>
                              <b>1</b>
                              <span><small>{copy.stepBuilding}</small><strong>{item.venue.building[lang]}</strong><em>{item.venue.address}</em></span>
                            </div>
                            <div>
                              <b>2</b>
                              <span><small>{copy.stepLevel}</small><strong>{item.venue.level?.[lang]}</strong></span>
                            </div>
                            <div>
                              <b>3</b>
                              <span><small>{copy.stepRoom}</small><strong>{item.venue.room?.[lang]}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="route-steps online-steps">
                            <div><b>1</b><span><small>Canvas</small><strong>{lang === "zh" ? "登录 UTS Canvas" : "Sign in to UTS Canvas"}</strong></span></div>
                            <div><b>2</b><span><small>{copy.zoomInfo}</small><strong>{pick(course.short)} · {item.location}</strong></span></div>
                            <div><b>3</b><span><small>{lang === "zh" ? "提前进入" : "Join early"}</small><strong>{lang === "zh" ? "提前 5 分钟测试声音" : "Test audio 5 minutes early"}</strong></span></div>
                          </div>
                        )}
                        <a href={item.venue.zoomUrl ?? item.venue.mapUrl ?? course.canvas} target="_blank" rel="noreferrer">
                          {item.venue.kind === "online" ? copy.zoom : copy.navigate} <span>→</span>
                        </a>
                        {item.venue.kind === "online" && <small className="zoom-privacy">🔒 {copy.zoomProtected}</small>}
                      </div>
                    </article>
                  );
                })}
            </div>
            <p className="room-guide">{copy.roomGuide}</p>
            <p className="arrival-tip">ⓘ {copy.arriveTip}</p>
            {browsedWeek === 8 && <p className="break-note">{semesterBreak[lang]}</p>}
          </section>
          )}

          {planModule === "weekly" && (
          <section className="weekly-plan">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{lang === "zh" ? "预习 → 上课 → 复习 → 回忆" : "Prep → class → review → retrieval"}</p>
                <h2>W{browsedWeek} · {semesterWeek.range[lang]}</h2>
              </div>
              {browsedWeek !== currentWeek && (
                <button className="return-current-week" onClick={() => setBrowsedWeek(currentWeek)}>
                  {lang === "zh" ? "回到本周" : "Current week"}
                </button>
              )}
            </div>
            <div className="plan-control-panel">
              <div className="plan-progress-copy">
                <span>{copy.planProgress}</span>
                <strong>{weeklyPlanDone} / {weeklyPlanKeys.length}</strong>
              </div>
              <div
                className="plan-progress-track"
                role="progressbar"
                aria-label={`${weeklyPlanDone} / ${weeklyPlanKeys.length}`}
                aria-valuemin={0}
                aria-valuemax={weeklyPlanKeys.length}
                aria-valuenow={weeklyPlanDone}
              >
                <span style={{ width: `${(weeklyPlanDone / weeklyPlanKeys.length) * 100}%` }} />
              </div>
              <div className="plan-focus-tabs">
                <button className={planFocus === "all" ? "active" : ""} onClick={() => setPlanFocus("all")}>{copy.planAll}</button>
                <button className={planFocus === "prepare" ? "active" : ""} onClick={() => setPlanFocus("prepare")}>{copy.planPrepOnly}</button>
                <button className={planFocus === "review" ? "active" : ""} onClick={() => setPlanFocus("review")}>{copy.planReviewOnly}</button>
              </div>
            </div>
            <div className="weekly-course-list">
              {semesterWeek.plans.map((plan) => {
                const course = courses.find((entry) => entry.id === plan.courseId) ?? courses[0];
                const preKey = `w${browsedWeek}-${plan.courseId}-pre`;
                const postKey = `w${browsedWeek}-${plan.courseId}-post`;
                const outputKey = `w${browsedWeek}-${plan.courseId}-output`;
                const noteKey = `w${browsedWeek}-${plan.courseId}`;
                const topicId = plan.topicId;
                return (
                  <article key={plan.courseId} className="weekly-course-card" style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                    <header>
                      <span className="course-mark">{course.mark}</span>
                      <div>
                        <small>{course.code} · {pick(course.short)}</small>
                        <h3>{plan.topic[lang]}</h3>
                      </div>
                    </header>
                    <div className="learning-flow">
                      {(planFocus === "all" || planFocus === "prepare") && (
                        <label className={planChecks[preKey] ? "flow-step prepare checked" : "flow-step prepare"}>
                          <input type="checkbox" checked={Boolean(planChecks[preKey])} onChange={() => setPlanChecks((items) => ({ ...items, [preKey]: !items[preKey] }))} />
                          <b>1</b>
                          <span>
                            <em>{copy.beforeWhen}</em>
                            <strong>{copy.preparation}</strong>
                            <p>{plan.prepare[lang]}</p>
                          </span>
                        </label>
                      )}
                      {(planFocus === "all" || planFocus === "review") && (
                        <>
                          <label className={planChecks[postKey] ? "flow-step review checked" : "flow-step review"}>
                            <input type="checkbox" checked={Boolean(planChecks[postKey])} onChange={() => setPlanChecks((items) => ({ ...items, [postKey]: !items[postKey] }))} />
                            <b>2</b>
                            <span>
                              <em>{copy.afterWhen}</em>
                              <strong>{copy.afterClass}</strong>
                              <p>{plan.after[lang]}</p>
                            </span>
                          </label>
                          <label className={planChecks[outputKey] ? "flow-step retrieval checked" : "flow-step retrieval"}>
                            <input type="checkbox" checked={Boolean(planChecks[outputKey])} onChange={() => setPlanChecks((items) => ({ ...items, [outputKey]: !items[outputKey] }))} />
                            <b>3</b>
                            <span>
                              <em>{copy.recallWhen}</em>
                              <strong>{copy.weeklyOutcome}</strong>
                              <p>{plan.outcome[lang]}</p>
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                    <button
                      className="weekly-practice-button"
                      onClick={() => { startQuiz(course.id, undefined, topicId); setView("quiz"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                      <span>{topicQuestionCount(topicId)}</span>{copy.startTen}<b>→</b>
                    </button>
                    <div className="confidence-row">
                      <span>{copy.confidence}</span>
                      {[copy.low, copy.medium, copy.high].map((label, index) => (
                        <button
                          key={label}
                          className={confidence[noteKey] === index + 1 ? "active" : ""}
                          onClick={() => setConfidence((items) => ({ ...items, [noteKey]: index + 1 }))}
                        >
                          {index + 1} · {label}
                        </button>
                      ))}
                    </div>
                    <label className="note-field">
                      <span>{copy.notes}</span>
                      <textarea
                        value={planNotes[noteKey] ?? ""}
                        placeholder={copy.notesPlaceholder}
                        onChange={(event) => setPlanNotes((items) => ({ ...items, [noteKey]: event.target.value }))}
                      />
                    </label>
                    <a href={course.canvas} target="_blank" rel="noreferrer">{copy.canvas}</a>
                  </article>
                );
              })}
            </div>
          </section>
          )}

          {planModule === "assessments" && (
          <section className="assessment-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{lang === "zh" ? "截止日期与里程碑" : "Deadlines and milestones"}</p>
                <h2>{copy.assessments}</h2>
              </div>
            </div>
            <div className="assessment-filters">
              <button className={assessmentFilter === "all" ? "active" : ""} onClick={() => setAssessmentFilter("all")}>{copy.allCourses}</button>
              {courses.map((course) => (
                <button key={course.id} className={assessmentFilter === course.id ? "active" : ""} onClick={() => setAssessmentFilter(course.id)}>{course.code}</button>
              ))}
            </div>
            <div className="assessment-list">
              {assessments
                .filter((item) => assessmentFilter === "all" || item.courseId === assessmentFilter)
                .map((item) => {
                  const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                  const days = daysUntil(item.date);
                  const checkKey = `assessment-${item.id}`;
                  return (
                    <article key={item.id} className={planChecks[checkKey] ? "assessment-card complete" : "assessment-card"} style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                      <div className="assessment-top">
                        <span className="assessment-code">{course.code}</span>
                        <span className="assessment-countdown">{days === null ? copy.datePending : days === 0 ? copy.todayDue : `${days} ${copy.days}`}</span>
                      </div>
                      <h3>{item.title[lang]}</h3>
                      <div className="assessment-meta"><strong>{item.weight}</strong><span>{item.displayDate[lang]}</span></div>
                      <p>{item.note[lang]}</p>
                      <div className="assessment-advice"><strong>{copy.assessmentStep}</strong><span>{assessmentAdvice(item.date)}</span></div>
                      <div className="assessment-actions">
                        <label>
                          <input type="checkbox" checked={Boolean(planChecks[checkKey])} onChange={() => setPlanChecks((items) => ({ ...items, [checkKey]: !items[checkKey] }))} />
                          {copy.completedLabel}
                        </label>
                        <a href={item.canvas} target="_blank" rel="noreferrer">Canvas ↗</a>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
          )}
        </section>
      )}

      {view === "courses" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">{lang === "zh" ? "课程知识地图" : "Course map"}</p>
            <h2>{copy.mapTitle}</h2>
            <p>{copy.mapIntro}</p>
          </div>
          <article className="course-detail" style={{ "--accent": selected.accent, "--soft": selected.soft } as React.CSSProperties}>
            <div className="detail-title">
              <span className="big-mark">{selected.mark}</span>
              <div>
                <p>{selected.code}</p>
                <h2>{pick(selected.short)}</h2>
                <small>{selected.name}</small>
              </div>
            </div>
            <div className="topic-strip" role="tablist" aria-label={lang === "zh" ? "课程知识点" : "Course topics"}>
              {selected.topics.map((topic, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCourseTopic === index}
                  key={topic.en}
                  className={selectedCourseTopic === index ? "current-topic" : ""}
                  onClick={() => setSelectedCourseTopic(index)}
                >
                  {index + 1}. {pick(topic)}
                </button>
              ))}
            </div>
            <div className="deep-lesson">
              <header className="deep-lesson-head">
                <div>
                  <p className="eyebrow">{lang === "zh" ? `完整章节 · 约 ${selectedDeepLesson.duration} 分钟` : `FULL CHAPTER · ABOUT ${selectedDeepLesson.duration} MIN`}</p>
                  <h3>{pick(selected.topics[selectedCourseTopic])}</h3>
                  <p>{lang === "zh" ? "不是只背结论：按定义 → 直觉 → 条件 → 例题 → 自测完整学一遍。" : "Learn the full chain: definition → intuition → conditions → worked example → self-check."}</p>
                </div>
                <span>{selectedCourseTopic + 1}/{selected.topics.length}</span>
              </header>

              <div className="lesson-route" aria-label={lang === "zh" ? "学习顺序" : "Learning sequence"}>
                {[lang === "zh" ? "定义" : "Define", lang === "zh" ? "理解" : "Understand", lang === "zh" ? "会用" : "Apply", lang === "zh" ? "检验" : "Check"].map((item, index) => (
                  <span key={item}><b>{index + 1}</b>{item}</span>
                ))}
              </div>

              <section className="lesson-section definition-section">
                <span className="lesson-section-number">01</span>
                <div>
                  <p className="eyebrow">{lang === "zh" ? "先把定义说清楚" : "START WITH THE DEFINITION"}</p>
                  <h4>{lang === "zh" ? "它到底是什么？" : "What is it, exactly?"}</h4>
                  <p>{selectedDeepLesson.definition[lang]}</p>
                </div>
              </section>

              <section className="lesson-section intuition-section">
                <span className="lesson-section-number">02</span>
                <div>
                  <p className="eyebrow">{lang === "zh" ? "建立直觉" : "BUILD INTUITION"}</p>
                  <h4>{lang === "zh" ? "为什么要这样理解？" : "Why should it make sense?"}</h4>
                  <p>{selectedDeepLesson.intuition[lang]}</p>
                </div>
              </section>

              <section className="lesson-section">
                <span className="lesson-section-number">03</span>
                <div>
                  <p className="eyebrow">{lang === "zh" ? "逐个术语拆开" : "UNPACK THE TERMS"}</p>
                  <h4>{lang === "zh" ? "每个词和符号是什么意思？" : "What does each term mean?"}</h4>
                  <div className="term-list">
                    {selectedDeepLesson.terms.map((term) => (
                      <article key={term.term}><strong>{term.term}</strong><p>{term.meaning[lang]}</p></article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="lesson-section">
                <span className="lesson-section-number">04</span>
                <div>
                  <p className="eyebrow">{lang === "zh" ? "公式与适用条件" : "FORMULAS AND CONDITIONS"}</p>
                  <h4>{lang === "zh" ? "什么时候能用，什么时候不能用？" : "When can each formula be used?"}</h4>
                  <div className="formula-list">
                    {selectedDeepLesson.formulas.map((formula) => (
                      <article key={formula.expression}><code>{formula.expression}</code><p>{formula.condition[lang]}</p></article>
                    ))}
                  </div>
                </div>
              </section>

              {(selected.id === "math" || selected.id === "physics") && (
                <MathPhysicsTools courseId={selected.id} topicId={selectedTopicId} lang={lang} showCalculator />
              )}

              <section className="worked-example">
                <div className="worked-example-title">
                  <span>{lang === "zh" ? "完整例题" : "WORKED EXAMPLE"}</span>
                  <strong>{selectedDeepLesson.example.prompt[lang]}</strong>
                </div>
                <ol>
                  {selectedDeepLesson.example.steps.map((step, index) => (
                    <li key={step.en}><b>{lang === "zh" ? `第 ${index + 1} 步` : `Step ${index + 1}`}</b><p>{step[lang]}</p></li>
                  ))}
                </ol>
                <div className="worked-answer"><span>{lang === "zh" ? "答案与解释" : "Answer and interpretation"}</span><strong>{selectedDeepLesson.example.answer[lang]}</strong></div>
              </section>

              <section className="lesson-traps">
                <p className="eyebrow">{lang === "zh" ? "常见错误" : "COMMON TRAPS"}</p>
                <h4>{lang === "zh" ? "为什么“看懂了”仍然会做错？" : "Why can recognition still fail?"}</h4>
                {selectedDeepLesson.traps.map((trap, index) => <p key={trap.en}><b>{index + 1}</b>{trap[lang]}</p>)}
              </section>

              <details className="lesson-checkpoint">
                <summary>{lang === "zh" ? "理解检查：先自己回答，再展开" : "Checkpoint: answer before opening"}</summary>
                <strong>{selectedDeepLesson.checkpoint.question[lang]}</strong>
                <p>{selectedDeepLesson.checkpoint.answer[lang]}</p>
              </details>

              <div className="deep-lesson-actions">
                <button className="secondary" onClick={() => { openTutorScope(selected.id, selectedTopicId); setView("tutor"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  {lang === "zh" ? "让 AI 导师继续讲" : "Continue with AI tutor"}
                </button>
                <button onClick={() => { startQuiz(selected.id, undefined, selectedTopicId); setView("quiz"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  {lang === "zh"
                    ? `开始本知识点 ${topicQuestionCount(selectedTopicId)} 题`
                    : `Start ${topicQuestionCount(selectedTopicId)} questions`}
                </button>
              </div>
            </div>
            <label className="session-takeaway">
              <span>{lang === "zh" ? "用一句话教回来" : "Teach it back in one sentence"}</span>
              <textarea
                value={sessionTakeaways[selectedSessionKey] ?? ""}
                disabled={sessionCompletions.includes(selectedSessionKey)}
                placeholder={lang === "zh" ? "我今天真正弄懂的是……" : "What I truly understood today is…"}
                onChange={(event) =>
                  setSessionTakeaways((items) => ({ ...items, [selectedSessionKey]: event.target.value }))
                }
              />
              <small>
                {lang === "zh"
                  ? "写出自己的结论，至少 8 个字；看过答案不等于掌握。"
                  : "Use your own words (at least 8 characters); viewing a solution is not mastery."}
              </small>
            </label>
            <div className="action-row">
              <button
                className={sessionCompletions.includes(selectedSessionKey) ? "complete-button completed" : "complete-button"}
                disabled={
                  sessionCompletions.includes(selectedSessionKey) ||
                  (sessionTakeaways[selectedSessionKey] ?? "").trim().length < 8
                }
                onClick={completeStudySession}
              >
                {sessionCompletions.includes(selectedSessionKey)
                  ? lang === "zh" ? "✓ 本次学习已记录" : "✓ Session recorded"
                  : lang === "zh" ? "结束本次学习" : "Finish this session"}
              </button>
              <a href={selected.canvas} target="_blank" rel="noreferrer">{copy.canvas}</a>
              {selected.zoom && (
                <a className="zoom-action" href={selected.zoom.url} target="_blank" rel="noreferrer">
                  <span>◉</span> {pick(selected.zoom.label)}
                </a>
              )}
            </div>
          </article>
        </section>
      )}

      {view === "tutor" && (
        <section className="view-stack tutor-view">
          <div className="page-intro">
            <p className="eyebrow">{lang === "zh" ? "引导式掌握" : "Guided mastery"}</p>
            <h2>{copy.tutorTitle}</h2>
            <p>{copy.tutorIntro}</p>
          </div>

          <div className="tutor-selector">
            <div className="tutor-selector-fields">
              <label>
                <span>{copy.tutorCourse}</span>
                <select
                  value={tutorCourse}
                  onChange={(event) => chooseTutorCourse(event.target.value)}
                >
                  {courses.map((course) => {
                    const courseProgress = summarizeQuestionProgress(
                      scopedQuestionIds(course.id),
                      questionProgress,
                    );
                    return (
                      <option key={course.id} value={course.id}>
                        {course.code} · {pick(course.short)} · {courseProgress.mastered}/{courseProgress.total}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                <span>{copy.tutorTopic}</span>
                <select
                  value={tutorTopic}
                  onChange={(event) => openTutorScope(tutorCourseData.id, event.target.value)}
                >
                  <option value="all">
                    {lang === "zh" ? "全部知识点" : "All topics"} · {summarizeQuestionProgress(
                      scopedQuestionIds(tutorCourseData.id),
                      questionProgress,
                    ).mastered}/{scopedQuestionIds(tutorCourseData.id).length}
                  </option>
                  {tutorCourseData.topics.map((topic, index) => {
                    const topicId = `${tutorCourseData.id}-${index}`;
                    const topicProgress = summarizeQuestionProgress(
                      scopedQuestionIds(tutorCourseData.id, topicId),
                      questionProgress,
                    );
                    return (
                      <option key={topicId} value={topicId}>
                        {index + 1}. {pick(topic)} · {topicProgress.mastered}/{topicProgress.total}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
            <div className="tutor-scope-progress" aria-label={copy.questionRecord}>
              <span>{copy.masteredQuestions} <strong>{tutorScopeProgress.mastered}/{tutorScopeProgress.total}</strong></span>
              <span>{copy.reviewQuestions} <strong>{tutorScopeProgress.review}</strong></span>
              <span>{copy.remainingQuestions} <strong>{tutorScopeProgress.remaining}</strong></span>
            </div>
          </div>

          {tutorScopeFinished && (
            <article className="tutor-card tutor-scope-complete" style={{ "--accent": tutorCourseData.accent, "--soft": tutorCourseData.soft } as React.CSSProperties}>
              <p className="eyebrow">{copy.questionRecord}</p>
              <h3>✓ {copy.scopeCleared}</h3>
              <p>{copy.scopeClearedIntro}</p>
              <button onClick={() => { setView("quiz"); startQuiz(tutorCourse, undefined, tutorTopic); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                {lang === "zh" ? "查看题库记录" : "View practice record"}
              </button>
            </article>
          )}

          {tutorQuestion && !tutorScopeFinished && (
            <article className="tutor-card" style={{ "--accent": tutorCourseData.accent, "--soft": tutorCourseData.soft } as React.CSSProperties}>
              <div className="tutor-card-head">
                <div>
                  <p>{tutorCourseData.code} · {pick(tutorCourseData.short)}</p>
                  <strong>{copy.question} {tutorIndex + 1} / {tutorQuestions.length}</strong>
                </div>
                <div className="tutor-stats">
                  <span>{copy.tutorAttempts} <b>{tutorAttempts}</b></span>
                  <span>{copy.tutorStreak} <b>{tutorStreak}</b></span>
                </div>
              </div>
              <p className="tutor-rule">{copy.tutorRule}</p>
              <div className="question-meta-row">
                <div
                  className="difficulty-badge"
                  data-level={tutorQuestion.difficulty ?? "application"}
                >
                  {pick(difficultyLabels[tutorQuestion.difficulty ?? "application"])}
                </div>
                {tutorQuestion.estimatedMinutes && (
                  <div className="question-time-badge">
                    {lang === "zh"
                      ? `预计 ${tutorQuestion.estimatedMinutes} 分钟`
                      : `About ${tutorQuestion.estimatedMinutes} min`}
                  </div>
                )}
              </div>
              <h3>{pick(tutorQuestion.question)}</h3>
              {renderTutorVisual(tutorQuestion.visual)}
              <section
                className={`tutor-choice-panel stage-${tutorStage}`}
                aria-label={copy.tutorOptions}
                data-testid="tutor-options"
              >
                <div className="tutor-choice-heading">
                  <p className="tutor-label">{copy.tutorOptions}</p>
                  <small>
                    {tutorStage === "think"
                      ? copy.tutorOptionsThink
                      : tutorStage === "probe"
                        ? copy.tutorOptionsProbe
                        : tutorStage === "answer"
                          ? copy.tutorOptionsAnswer
                          : copy.tutorOptionsFeedback}
                  </small>
                </div>
                <div className="options tutor-options">
                  {tutorQuestion.options.map((option, index) => {
                    const selected = tutorChoice.includes(index);
                    const optionState =
                      tutorStage === "feedback"
                        ? tutorCorrect && answerContains(tutorQuestion.answer, index)
                          ? "correct"
                          : selected
                            ? "selected"
                            : ""
                        : selected
                          ? "selected"
                          : "";
                    return (
                      <button
                        key={option.en}
                        className={optionState}
                        disabled={tutorStage === "probe" || tutorStage === "feedback"}
                        onClick={() => setTutorChoice((items) =>
                          Array.isArray(tutorQuestion.answer)
                            ? (items.includes(index) ? items.filter((item) => item !== index) : [...items, index])
                            : [index],
                        )}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>{pick(option)}
                      </button>
                    );
                  })}
                </div>
              </section>
              {(tutorQuestion.courseId === "math" || tutorQuestion.courseId === "physics") && (
                <MathPhysicsTools
                  courseId={tutorQuestion.courseId}
                  topicId={tutorQuestion.topicId}
                  lang={lang}
                  visual={tutorQuestion.learningVisual}
                  showCalculator={
                    !tutorQuestion.answerTools?.length &&
                    (tutorQuestion.kind === "calculation" || tutorQuestion.kind === "data")
                  }
                />
              )}
              <AnswerWorkspace
                courseId={tutorQuestion.courseId}
                topicId={tutorQuestion.topicId}
                questionId={tutorQuestion.id}
                questionText={pick(tutorQuestion.question)}
                toolKind={tutorQuestion.answerTools}
                language={lang}
                onEvidenceChange={recordAnswerEvidence}
              />

              {tutorStage === "think" && (
                <div className="tutor-step">
                  <label htmlFor="tutor-thought">{copy.tutorThought}</label>
                  <textarea
                    id="tutor-thought"
                    value={tutorThought}
                    placeholder={copy.tutorThoughtPlaceholder}
                    onChange={(event) => setTutorThought(event.target.value)}
                  />
                  {tutorEvidenceRequired && !tutorEvidenceReady && (
                    <p className="workspace-requirement" role="status">
                      {lang === "zh"
                        ? "先在上方答题工作台记录计算、图或代码，并写一句为什么这样做。"
                        : "Record your calculation, diagram or code above and explain why you used it."}
                    </p>
                  )}
                  <button
                    disabled={
                      tutorChoice.length === 0 ||
                      tutorThought.trim().length < 8 ||
                      !tutorEvidenceReady
                    }
                    onClick={() => setTutorStage("probe")}
                  >
                    {copy.tutorSubmitThought}
                  </button>
                </div>
              )}

              {tutorStage === "probe" && (
                <div className="tutor-step">
                  <div className="saved-thought"><strong>{copy.tutorReasoningSaved}</strong><p>{tutorThought}</p></div>
                  <p className="tutor-label">{copy.tutorProbe}</p>
                  <p className="single-probe">
                    {pick((tutorPrompts[tutorCourse] ?? tutorPrompts.math)[Math.min(tutorHintLevel, 2)])}
                  </p>
                  <div className="probe-actions">
                    <button className="secondary" onClick={() => setTutorHintLevel((level) => Math.min(4, level + 1))}>
                      {lang === "zh" ? "我不知道，给一点提示" : "I’m stuck — one hint"}
                    </button>
                    <button onClick={() => setTutorStage("answer")}>{copy.tutorContinue}</button>
                  </div>
                </div>
              )}

              {tutorStage === "answer" && (
                <div className="tutor-step">
                  <p className="tutor-label">{copy.tutorCommit}</p>
                  <button disabled={tutorChoice.length === 0 || !tutorEvidenceReady} onClick={submitTutorAnswer}>{copy.submitAnswer}</button>
                </div>
              )}

              {tutorStage === "feedback" && (
                <div className={`tutor-feedback ${tutorCorrect ? "correct" : "wrong"}`}>
                  <strong>{tutorCorrect ? copy.tutorCorrect : copy.tutorWrong}</strong>
                  {tutorCorrect && <p>{pick(tutorQuestion.explanation)}</p>}
                  {tutorCorrect && !tutorMasteryEligible && (
                    <p className="mastery-evidence-note">
                      {lang === "zh"
                        ? "这次答案正确，但使用 H5、缺少独立过程或仍在原题上，因此暂不计入掌握。换一道迁移题再独立完成。"
                        : "The answer is correct, but this attempt used H5, lacks independent work, or repeats the revealed item, so it does not count as mastery yet."}
                    </p>
                  )}
                  {tutorCorrect && tutorMasteryEligible && (
                    <aside
                      className="mastery-decision tutor-mastery-decision"
                      aria-label={copy.masteryPrompt}
                    >
                      <div>
                        <strong>{copy.masteryPrompt}</strong>
                        <p>{copy.masteryHelp}</p>
                      </div>
                      <div className="mastery-decision-actions">
                        <button
                          type="button"
                          className={tutorQuestionProgress?.masteryStatus === "learning" ? "learning active" : "learning"}
                          aria-pressed={tutorQuestionProgress?.masteryStatus === "learning"}
                          onClick={() => decideTutorMastery(false)}
                        >
                          <span aria-hidden="true">↻</span>
                          {copy.markLearning}
                        </button>
                        <button
                          type="button"
                          className={tutorQuestionProgress?.masteryStatus === "mastered" ? "mastered active" : "mastered"}
                          aria-pressed={tutorQuestionProgress?.masteryStatus === "mastered"}
                          onClick={() => decideTutorMastery(true)}
                        >
                          <span aria-hidden="true">✓</span>
                          {copy.markMastered}
                        </button>
                      </div>
                    </aside>
                  )}
                  {!tutorCorrect && (
                    <div className="retry-coaching">
                      <span>{pick((tutorPrompts[tutorCourse] ?? tutorPrompts.math)[Math.min(tutorAttempts, 2)])}</span>
                      <div className="retry-actions">
                        <button className="secondary" onClick={() => askAiTutor(lang === "zh" ? "我哪里想错了？只指出第一处错误，再问我一个问题。" : "Where did my reasoning first go wrong? Identify one gap, then ask me one question.")}>
                          {lang === "zh" ? "AI 解释这次错误" : "Explain this mistake"}
                        </button>
                        <button onClick={() => { setTutorChoice([]); setTutorStage("answer"); }}>{copy.tutorRetry}</button>
                      </div>
                    </div>
                  )}
                  {tutorCorrect && !tutorMasteryDecisionPending && (
                    <button onClick={nextTutorQuestion}>
                      {tutorMasteryCredit
                        ? copy.tutorNext
                        : lang === "zh"
                          ? "开始迁移题"
                          : "Start transfer question"}
                    </button>
                  )}
                </div>
              )}

              <section className="ai-tutor-panel" aria-label={copy.aiTutor}>
                <div className="ai-tutor-title">
                  <span>AI</span>
                  <div><strong>{copy.aiTutor}</strong><p>{copy.aiTutorIntro}</p></div>
                </div>
                {!aiTutorUnlocked ? (
                  <div className="ai-locked">
                    <strong>{lang === "zh" ? "先思考，再调用 AI" : "Think first, then use AI"}</strong>
                    <p>
                      {lang === "zh"
                        ? "写下思路并提交一次答案后，AI 会保留你做对的部分，只补一个缺口。"
                        : "Write your reasoning and commit one answer. AI will preserve what is right and repair one gap."}
                    </p>
                  </div>
                ) : (
                  <>
                <div className="hint-level-control">
                  <div>
                    <span>{lang === "zh" ? "提示层级" : "Hint level"}</span>
                    <strong>H{tutorHintLevel}</strong>
                  </div>
                  <p>
                    {[
                      lang === "zh" ? "确认目标" : "Target",
                      lang === "zh" ? "指出关系" : "Relation",
                      lang === "zh" ? "定义与条件" : "Definition",
                      lang === "zh" ? "公式骨架" : "Formula skeleton",
                      lang === "zh" ? "第一步" : "First step",
                      lang === "zh" ? "完整讲解" : "Full solution",
                    ][tutorHintLevel]}
                  </p>
                  {tutorHintLevel < 4 && (
                    <button className="hint-more" onClick={() => setTutorHintLevel((level) => Math.min(4, level + 1))}>
                      {lang === "zh" ? "提示再具体一点" : "Make the hint more specific"}
                    </button>
                  )}
                  <details className="full-solution-request">
                    <summary>{lang === "zh" ? "仍然卡住？" : "Still stuck?"}</summary>
                    <p>{lang === "zh" ? "完整讲解可以展开查看，但不会计入掌握。" : "A full solution can teach the method, but does not count as mastery."}</p>
                    <button onClick={() => {
                      setTutorHintLevel(5);
                      void askAiTutor(lang === "zh" ? "请给出完整教学解法，并在最后留一道迁移问题。" : "Give the full teaching solution, then leave one transfer question.", 5);
                    }}>
                      {lang === "zh" ? "请求 H5 完整讲解" : "Request H5 full solution"}
                    </button>
                  </details>
                </div>
                {aiMessages.length === 0 && (
                  <button className="ai-starter" disabled={aiLoading} onClick={() => askAiTutor(copy.aiStarter)}>
                    {copy.aiStarter}
                  </button>
                )}
                {aiMessages.length > 0 && (
                  <div className="ai-conversation" aria-live="polite">
                    {aiMessages.map((message, index) => (
                      <article key={`${message.role}-${index}`} className={message.role}>
                        <strong>{message.role === "assistant" ? copy.aiTutor : (lang === "zh" ? "我的问题" : "My question")}</strong>
                        {message.role === "assistant" && message.hintLevel === 5 ? (
                          <details className="full-solution">
                            <summary>{lang === "zh" ? "展开完整讲解（不计掌握）" : "Open full solution (not mastery)"}</summary>
                            <AiMessageBody content={message.content} />
                          </details>
                        ) : (
                          <AiMessageBody content={message.content} />
                        )}
                      </article>
                    ))}
                  </div>
                )}
                {viewedSolutionIds.includes(tutorQuestion.id) &&
                  aiMessages.some(
                    (message) => message.role === "assistant" && message.hintLevel === 5,
                  ) && (
                    <button className="transfer-question-button" onClick={nextTutorQuestion}>
                      {lang === "zh"
                        ? "换一道题，独立迁移这个方法 →"
                        : "Try a fresh question independently →"}
                    </button>
                  )}
                {aiLoading && <p className="ai-loading">{copy.aiThinking}</p>}
                {aiError && <p className="ai-error">{aiError}</p>}
                <div className="ai-compose">
                  <textarea
                    value={aiInput}
                    placeholder={copy.aiPlaceholder}
                    onChange={(event) => setAiInput(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") askAiTutor();
                    }}
                  />
                  <button disabled={aiLoading || !aiInput.trim()} onClick={() => askAiTutor()}>{copy.askAi}</button>
                </div>
                  </>
                )}
              </section>
            </article>
          )}
        </section>
      )}

      {view === "quiz" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">{lang === "zh" ? "主动回忆" : "Active recall"}</p>
            <h2>{copy.quizTitle} · {practiceBank.length} {lang === "zh" ? "题" : "questions"}</h2>
            <p>{copy.quizIntro}</p>
            <div
              className="question-progress-summary"
              aria-label={copy.questionRecord}
            >
              <div className="question-progress-heading">
                <span>{copy.questionRecord}</span>
                <strong>
                  {overallQuestionProgress.mastered} / {overallQuestionProgress.total}
                </strong>
              </div>
              <div
                className="question-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={overallQuestionProgress.total}
                aria-valuenow={overallQuestionProgress.mastered}
                aria-label={`${copy.masteredQuestions} ${overallQuestionProgress.mastered} / ${overallQuestionProgress.total}`}
              >
                <span
                  style={{
                    width: `${overallQuestionProgress.total === 0
                      ? 0
                      : (overallQuestionProgress.mastered / overallQuestionProgress.total) * 100}%`,
                  }}
                />
              </div>
              <div className="question-progress-stats">
                <span>
                  {copy.attemptedQuestions}
                  <strong>{overallQuestionProgress.attempted}</strong>
                </span>
                <span>
                  {copy.reviewQuestions}
                  <strong>{overallQuestionProgress.review}</strong>
                </span>
                <span>
                  {copy.remainingQuestions}
                  <strong>{overallQuestionProgress.remaining}</strong>
                </span>
              </div>
            </div>
            <div
              className="difficulty-legend"
              aria-label={lang === "zh" ? "题库难度分布" : "Question-bank difficulty distribution"}
            >
              {difficultyOrder.map((level) => (
                <span className="difficulty-badge" data-level={level} key={level}>
                  <span>{pick(difficultyLabels[level])}</span>
                  <strong>
                    {practiceBank.filter((question) => question.difficulty === level).length}
                  </strong>
                </span>
              ))}
            </div>
          </div>

          <div className="practice-queue-panel">
            <div className="practice-queue-copy">
              <strong>{copy.practiceQueue}</strong>
              <p>{copy.queueHelp}</p>
            </div>
            <div
              className="practice-queue-switch"
              role="tablist"
              aria-label={copy.practiceQueue}
            >
              {([
                ["learning", copy.queueLearning, overallQuestionProgress.remaining],
                ["mastered", copy.queueMastered, overallQuestionProgress.mastered],
                ["all", copy.queueAll, overallQuestionProgress.total],
              ] as const).map(([mode, label, count]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={quizQueueMode === mode}
                  className={quizQueueMode === mode ? "active" : ""}
                  onClick={() => chooseQuizQueue(mode)}
                >
                  <span>{label}</span>
                  <strong>{count}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-filters" role="tablist" aria-label={copy.quizTitle}>
            <button
              className={quizFilter === "all" ? "active" : ""}
              onClick={() => startQuiz("all", undefined, "all", quizQueueMode)}
            >
              {copy.all} · {overallQuestionProgress.mastered}/{overallQuestionProgress.total}
            </button>
            {courses.map((course) => {
              const courseProgress = summarizeQuestionProgress(
                scopedQuestionIds(course.id),
                questionProgress,
              );
              return (
                <button
                  key={course.id}
                  className={quizFilter === course.id ? "active" : ""}
                  style={{ "--accent": course.accent } as React.CSSProperties}
                  onClick={() => startQuiz(course.id, undefined, "all", quizQueueMode)}
                >
                  {course.code} <small>{courseProgress.mastered}/{courseProgress.total}</small>
                </button>
              );
            })}
          </div>

          {quizFilter !== "all" && (() => {
            const quizCourse = courses.find((course) => course.id === quizFilter);
            if (!quizCourse) return null;
            const courseProgress = summarizeQuestionProgress(
              scopedQuestionIds(quizCourse.id),
              questionProgress,
            );
            return (
              <div className="topic-picker">
                <p>{copy.topicPrompt}</p>
                <div>
                  <button
                    className={quizTopic === "all" ? "active" : ""}
                    onClick={() => startQuiz(quizCourse.id, undefined, "all", quizQueueMode)}
                  >
                    {lang === "zh"
                      ? `本课程全部 · 已掌握 ${courseProgress.mastered}/${courseProgress.total}`
                      : `All in this course · ${courseProgress.mastered}/${courseProgress.total} mastered`}
                  </button>
                  {quizCourse.topics.map((topic, index) => {
                    const topicId = `${quizCourse.id}-${index}`;
                    const topicProgress = summarizeQuestionProgress(
                      scopedQuestionIds(quizCourse.id, topicId),
                      questionProgress,
                    );
                    return (
                      <button
                        key={topicId}
                        className={quizTopic === topicId ? "active" : ""}
                        onClick={() => startQuiz(quizCourse.id, undefined, topicId, quizQueueMode)}
                      >
                        <span>{index + 1}</span>
                        {pick(topic)}
                        <small>
                          {topicProgress.mastered === topicProgress.total
                            ? `✓ ${topicProgress.mastered}/${topicProgress.total}`
                            : `${topicProgress.mastered}/${topicProgress.total}`}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {!quizComplete && currentQuestion && (() => {
            const course = courses.find((item) => item.id === currentQuestion.courseId) ?? courses[0];
            const isMultiple = Array.isArray(currentQuestion.answer);
            const draft = draftSelections[currentQuestion.id] ?? [];
            const currentAnswerEvidence = answerEvidenceByQuestion[currentQuestion.id];
            const currentEvidenceRequired = Boolean(currentQuestion.answerTools?.length);
            const currentEvidenceReady =
              !currentEvidenceRequired || evidenceIsMeaningful(currentAnswerEvidence);
            const kindLabels: Record<QuestionKind, Bi> = {
              truefalse: bi("判断题", "True / False"),
              single: bi("单选题", "Single choice"),
              multiple: bi("多选题", "Multiple select"),
              scenario: bi("情境分析", "Scenario"),
              combination: bi("组合题", "Combination"),
              calculation: bi("计算 / 推演题", "Calculation / Trace"),
              data: bi("图表 / 数据题", "Chart / Data"),
            };
            const questionDifficulty = currentQuestion.difficulty ?? "application";
            const currentQuestionHistory = questionProgress[currentQuestion.id];
            const currentIsCorrect =
              answeredCurrent !== undefined && answerIsCorrect(currentQuestion, answeredCurrent);
            const currentMasteryStatus =
              currentQuestionHistory?.masteryStatus ??
              (currentIsCorrect ? "unrated" : "learning");
            const masteryDecisionPending =
              currentIsCorrect && currentMasteryStatus === "unrated";
            const formatAnswerValue = (value: AnswerValue) =>
              (Array.isArray(value) ? value : [value])
                .map((index) => {
                  const option = currentQuestion.options[index];
                  return `${String.fromCharCode(65 + index)}. ${option ? pick(option) : ""}`.trim();
                })
                .join(lang === "zh" ? "；" : "; ");
            return (
              <article className="quiz-card quiz-player" style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                <div className="quiz-progress-row">
                  <div>
                    <p>{course.code} · {pick(course.short)}</p>
                    <strong>{copy.question} {quizIndex + 1} / {sessionIds.length}</strong>
                  </div>
                  <span>{copy.deepMode} · R{learningRound}</span>
                </div>
                <div className="quiz-progress-track"><span style={{ width: `${((quizIndex + 1) / sessionIds.length) * 100}%` }} /></div>
                <div className="question-meta-row">
                  <div className="question-kind-badge">{pick(kindLabels[currentQuestion.kind ?? "single"])}</div>
                  <div className="difficulty-badge" data-level={questionDifficulty}>
                    {pick(difficultyLabels[questionDifficulty])}
                  </div>
                  {currentQuestion.estimatedMinutes && (
                    <div className="question-time-badge">
                      {lang === "zh"
                        ? `预计 ${currentQuestion.estimatedMinutes} 分钟`
                        : `About ${currentQuestion.estimatedMinutes} min`}
                    </div>
                  )}
                  {currentQuestionHistory?.attempts > 0 && (
                    <div
                      className="question-history-badge"
                      data-status={currentMasteryStatus}
                    >
                      {currentMasteryStatus === "mastered"
                        ? "✓"
                        : currentMasteryStatus === "unrated"
                          ? "?"
                          : "↻"}{" "}
                      {currentMasteryStatus === "mastered"
                        ? copy.historyMastered
                        : currentMasteryStatus === "unrated"
                          ? copy.historyUnrated
                          : copy.historyReview}
                      {" · "}
                      {currentQuestionHistory.attempts}
                      {lang === "zh" ? " 次记录" : " attempts"}
                    </div>
                  )}
                </div>
                <h3>{pick(currentQuestion.question)}</h3>
                {currentQuestion.visual && (() => {
                  const visual = currentQuestion.visual;
                  if (visual.kind === "code") {
                    return (
                      <figure className="question-visual code-visual">
                        <figcaption>{pick(visual.title)}</figcaption>
                        <pre><code>{visual.code}</code></pre>
                      </figure>
                    );
                  }
                  if (visual.kind === "table") {
                    return (
                      <figure className="question-visual table-visual">
                        <figcaption>{pick(visual.title)}</figcaption>
                        <div className="visual-scroll">
                          <table>
                            <thead><tr>{visual.columns.map((column) => <th key={column.en}>{pick(column)}</th>)}</tr></thead>
                            <tbody>{visual.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
                          </table>
                        </div>
                      </figure>
                    );
                  }
                  const maxValue = Math.max(...visual.values);
                  return (
                    <figure className="question-visual bars-visual">
                      <figcaption>{pick(visual.title)}</figcaption>
                      <div className="bar-plot" role="img" aria-label={pick(visual.title)}>
                        {visual.values.map((value, index) => (
                          <div className="bar-column" key={visual.labels[index].en}>
                            <span className="bar-value">{value}{visual.unit}</span>
                            <span className="bar-shape" style={{ height: `${Math.max(12, (value / maxValue) * 116)}px` }} />
                            <span className="bar-label">{pick(visual.labels[index])}</span>
                          </div>
                        ))}
                      </div>
                    </figure>
                  );
                })()}
                {(currentQuestion.courseId === "math" || currentQuestion.courseId === "physics") && (
                  <MathPhysicsTools
                    courseId={currentQuestion.courseId}
                    topicId={currentQuestion.topicId}
                    lang={lang}
                    visual={currentQuestion.learningVisual}
                    showCalculator={
                      !currentQuestion.answerTools?.length &&
                      (currentQuestion.kind === "calculation" || currentQuestion.kind === "data")
                    }
                  />
                )}
                <AnswerWorkspace
                  courseId={currentQuestion.courseId}
                  topicId={currentQuestion.topicId}
                  questionId={currentQuestion.id}
                  questionText={pick(currentQuestion.question)}
                  toolKind={currentQuestion.answerTools}
                  language={lang}
                  onEvidenceChange={recordAnswerEvidence}
                />
                {currentEvidenceRequired && !currentEvidenceReady && (
                  <p className="workspace-requirement" role="status">
                    {lang === "zh"
                      ? "先记录计算、作图或代码过程，再提交选项。只选答案不算完成。"
                      : "Record your calculation, drawing or code before submitting. Choosing an option alone is not completion."}
                  </p>
                )}
                {isMultiple && answeredCurrent === undefined && <p className="multiple-hint">{copy.chooseMultiple}</p>}
                <div className="options">
                  {currentQuestion.options.map((option, index) => {
                    let state = "";
                    if (answeredCurrent !== undefined && answerContains(currentQuestion.answer, index)) state = "correct";
                    else if (answeredCurrent !== undefined && answerContains(answeredCurrent, index)) state = "wrong";
                    else if (answeredCurrent === undefined && isMultiple && draft.includes(index)) state = "selected";
                    return (
                      <button
                        key={option.en}
                        className={state}
                        disabled={answeredCurrent !== undefined || !currentEvidenceReady}
                        onClick={() => {
                          if (!isMultiple) {
                            recordQuizAnswer(currentQuestion, index);
                            return;
                          }
                          setDraftSelections((items) => ({
                            ...items,
                            [currentQuestion.id]: draft.includes(index)
                              ? draft.filter((item) => item !== index)
                              : [...draft, index],
                          }));
                        }}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>{pick(option)}
                      </button>
                    );
                  })}
                </div>
                {isMultiple && answeredCurrent === undefined && (
                  <button
                    className="submit-answer-button"
                    disabled={draft.length === 0 || !currentEvidenceReady}
                    onClick={() => recordQuizAnswer(currentQuestion, draft)}
                  >
                    {copy.submitAnswer}
                  </button>
                )}
                {answeredCurrent !== undefined && (
                  <>
                    {!currentIsCorrect && (
                      <aside
                        className="answer-correction"
                        role="status"
                        aria-label={lang === "zh" ? "答案纠正" : "Answer correction"}
                      >
                        <div className="answer-correction-row submitted">
                          <span>{lang === "zh" ? "你的答案" : "Your answer"}</span>
                          <strong>{formatAnswerValue(answeredCurrent)}</strong>
                        </div>
                        <div className="answer-correction-row correct">
                          <span>{lang === "zh" ? "正确答案" : "Correct answer"}</span>
                          <strong>{formatAnswerValue(currentQuestion.answer)}</strong>
                        </div>
                      </aside>
                    )}
                    <p className="explanation">
                      <strong>{currentIsCorrect ? copy.correct : copy.review}</strong>
                      {pick(currentQuestion.explanation)}
                    </p>
                    {currentQuestion.rubric && (
                      <details className="marking-rubric">
                        <summary>
                          {lang === "zh"
                            ? `查看得分检查表 · ${currentQuestion.rubric.zh.length} 项`
                            : `View marking checklist · ${currentQuestion.rubric.en.length} items`}
                        </summary>
                        <ul>
                          {currentQuestion.rubric[lang].map((criterion) => (
                            <li key={criterion}>{criterion}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <button
                      className="ai-explanation-handoff"
                      data-difficulty={questionDifficulty}
                      onClick={() => handoffToAiExplanation(currentQuestion, answeredCurrent)}
                    >
                      <span className="ai-explanation-mark" aria-hidden="true">AI</span>
                      <span>
                        <strong>
                          {questionDifficulty === "instructor"
                            ? lang === "zh"
                              ? "教师难度题 · AI 分步讲解"
                              : "Instructor-style · AI walkthrough"
                            : lang === "zh"
                              ? "让 AI 一步一步讲这道题"
                              : "Ask AI for a step-by-step explanation"}
                        </strong>
                        <small>
                          {currentIsCorrect
                            ? lang === "zh"
                              ? "检查是不是猜对，并补齐定义、图表读取、计算与迁移题"
                              : "Check for guessing, then teach definitions, visual reading, calculation and transfer"
                            : lang === "zh"
                              ? "从你最早出错的位置开始重建解法，不只重复标准答案"
                              : "Rebuild from your earliest error instead of repeating the model answer"}
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                    {currentIsCorrect && (
                      <aside
                        className="mastery-decision"
                        aria-label={copy.masteryPrompt}
                      >
                        <div>
                          <strong>{copy.masteryPrompt}</strong>
                          <p>{copy.masteryHelp}</p>
                        </div>
                        <div className="mastery-decision-actions">
                          <button
                            type="button"
                            className={currentMasteryStatus === "learning" ? "learning active" : "learning"}
                            aria-pressed={currentMasteryStatus === "learning"}
                            onClick={() => decideQuizMastery(currentQuestion.id, false)}
                          >
                            <span aria-hidden="true">↻</span>
                            {copy.markLearning}
                          </button>
                          <button
                            type="button"
                            className={currentMasteryStatus === "mastered" ? "mastered active" : "mastered"}
                            aria-pressed={currentMasteryStatus === "mastered"}
                            onClick={() => decideQuizMastery(currentQuestion.id, true)}
                          >
                            <span aria-hidden="true">✓</span>
                            {copy.markMastered}
                          </button>
                        </div>
                      </aside>
                    )}
                    {masteryDecisionPending && (
                      <p className="mastery-decision-required" role="status">
                        {lang === "zh"
                          ? "请先选择掌握状态，再进入下一题。"
                          : "Choose a mastery status before moving to the next question."}
                      </p>
                    )}
                    {!masteryDecisionPending && quizIndex < sessionIds.length - 1 && (
                      <button className="next-button" onClick={goNext}>{copy.next} →</button>
                    )}
                  </>
                )}
              </article>
            );
          })()}

          {sessionIds.length === 0 && (() => {
            const emptyScopeProgress = summarizeQuestionProgress(
              scopedQuestionIds(quizFilter, quizTopic),
              questionProgress,
            );
            const emptyTitle =
              quizQueueMode === "mastered"
                ? copy.noMasteredQuestions
                : quizQueueMode === "learning"
                  ? copy.scopeCleared
                  : lang === "zh"
                    ? "这个范围还没有题目"
                    : "There are no questions in this scope";
            const emptyIntro =
              quizQueueMode === "mastered"
                ? lang === "zh"
                  ? "先练习未掌握题；答对并确认理解后，它们会出现在这里。"
                  : "Practise unmastered items first. Correct answers appear here after you confirm mastery."
                : copy.scopeClearedIntro;
            return (
              <article className="result-card progress-empty-card">
                <p className="eyebrow">{copy.questionRecord}</p>
                <h3>{emptyTitle}</h3>
                <div className="result-score">
                  <strong>{emptyScopeProgress.mastered}</strong>
                  <span>/ {emptyScopeProgress.total}</span>
                </div>
                <p>{emptyIntro}</p>
                <div className="result-actions">
                  {quizQueueMode === "mastered" ? (
                    <button onClick={() => chooseQuizQueue("learning")}>
                      {copy.practiceLearning}
                    </button>
                  ) : (
                    <button onClick={() => restartQuiz(quizFilter, quizTopic)}>
                      {copy.reviewCompleted}
                    </button>
                  )}
                </div>
              </article>
            );
          })()}

          {quizComplete && (
            <article className="result-card">
              <p className="eyebrow">{copy.result}</p>
              <div className="result-score"><strong>{correctCount}</strong><span>/ {sessionIds.length}</span></div>
              <p>{unmasteredSessionIds.length === 0 ? copy.perfect : `${copy.score}: ${Math.round((correctCount / sessionIds.length) * 100)}%`}</p>
              <p className={`mastery-status ${unmasteredSessionIds.length === 0 ? "mastered" : ""}`}>
                {unmasteredSessionIds.length === 0 ? `✓ ${copy.mastered}` : `${copy.notMastered} · ${unmasteredSessionIds.length} ${lang === "zh" ? "题继续保留" : "kept for practice"}`}
              </p>
              <p className="mastery-rule">{copy.masteryRule}</p>
              <div className="result-actions">
                {unmasteredSessionIds.length > 0 && <button onClick={continueDeepLearning}>{copy.retryWrong} ({unmasteredSessionIds.length})</button>}
                <button className="secondary" onClick={() => restartQuiz(quizFilter, quizTopic)}>{copy.retryAll}</button>
              </div>
            </article>
          )}
        </section>
      )}

      <footer className="study-footer">
        <span>{lang === "zh" ? "2026 春季学期 · UTS" : "Spring 2026 · UTS"}</span>
        <span>{lang === "zh" ? "难度递进 · 原创教师题型 · 独立作答 · 48 小时复测" : "Difficulty progression · original instructor-style problems · independent work · 48-hour review"}</span>
      </footer>

      <nav className="bottom-nav" aria-label={lang === "zh" ? "主要导航" : "Main navigation"}>
        <button type="button" aria-current={activeMainModule === "overview" ? "page" : undefined} className={activeMainModule === "overview" ? "active" : ""} onClick={() => navigateToDestination("today")}>
          <span aria-hidden="true"><PersonalNavigationIcon name="today" /></span>{lang === "zh" ? "今天" : "Today"}
        </button>
        <button type="button" aria-current={activeMainModule === "planning" ? "page" : undefined} className={activeMainModule === "planning" ? "active" : ""} onClick={() => navigateToDestination(`plan-${planModule}` as PersonalDestinationId)}>
          <span aria-hidden="true"><PersonalNavigationIcon name="plan" /></span>{lang === "zh" ? "计划" : "Plan"}
        </button>
        <button type="button" aria-current={activeMainModule === "courses" ? "page" : undefined} className={activeMainModule === "courses" ? "active" : ""} onClick={() => navigateToDestination(`course-${selected.id}` as PersonalDestinationId)}>
          <span aria-hidden="true"><PersonalNavigationIcon name="courses" /></span>{lang === "zh" ? "课程" : "Courses"}
        </button>
        <button type="button" aria-current={activeMainModule === "mastery" ? "page" : undefined} className={activeMainModule === "mastery" ? "active" : ""} onClick={() => navigateToDestination(activeMainModule === "mastery" ? activeDestinationId : "tutor")}>
          <span aria-hidden="true"><PersonalNavigationIcon name="tutor" /></span>{lang === "zh" ? "导师" : "Tutor"}
        </button>
        <button type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <span aria-hidden="true"><PersonalNavigationIcon name="menu" /></span>{lang === "zh" ? "菜单" : "Menu"}
        </button>
      </nav>
    </main>
  );
}
