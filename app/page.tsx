"use client";

import { useEffect, useMemo, useState } from "react";
import { deepLessons } from "./deep-lessons";
import { MathPhysicsTools } from "./learning-tools";
import { topicQuestionBank } from "./topic-questions";
import type { QuestionVisual } from "./advanced-questions";
import { assessments, semesterBreak, semesterWeeks, timetable } from "./semester-data";

type Lang = "zh" | "en";
type View = "today" | "plan" | "courses" | "tutor" | "quiz";
type Bi = { zh: string; en: string };
type QuestionKind = "truefalse" | "single" | "multiple" | "scenario" | "combination" | "calculation" | "data";
type AnswerValue = number | number[];
type AiTutorMessage = { role: "user" | "assistant"; content: string };
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

const courses: Course[] = [
  {
    id: "math",
    code: "33130",
    short: bi("数学 1", "Mathematics 1"),
    name: "Mathematics 1",
    accent: "#246BFD",
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
    accent: "#F66B4A",
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
    accent: "#1C9A70",
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
    accent: "#7755D9",
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

const practiceBank: Question[] = topicQuestionBank;

function answerIsCorrect(question: Question, value: AnswerValue | undefined) {
  if (value === undefined) return false;
  const expected = Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer];
  const actual = Array.isArray(value) ? [...value].sort() : [value];
  return expected.length === actual.length && expected.every((item, index) => item === actual[index]);
}

function answerContains(value: AnswerValue | undefined, option: number) {
  return Array.isArray(value) ? value.includes(option) : value === option;
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
    quizTitle: "Deep Learning Mode · 290 题",
    quizIntro: "包含复杂计算、代码推演、图表数据、判断、多选与情境题。解析按步骤教学，错题循环到完全掌握。",
    all: "全部 290 题",
    topicPrompt: "选择知识点（每组 10 题）",
    question: "题",
    score: "得分",
    correct: "答对了。",
    review: "再记一次。",
    next: "下一题",
    result: "本轮学习结果",
    retryWrong: "继续深度学习错题",
    retryAll: "重新练习本组",
    perfect: "本知识点已掌握：本轮全部独立答对。",
    submitAnswer: "提交答案",
    chooseMultiple: "可选择多个答案，选完后提交",
    deepMode: "深度学习模式",
    masteryRule: "掌握标准：本轮所有题独立答对。错题将重复训练，直到清零。",
    notMastered: "尚未掌握",
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
    aiSetupTitle: "连接你的 DeepSeek API",
    aiSetupIntro: "当前网址是静态网站。请输入 API Key 启用 AI；Key 只保存在这台设备的浏览器中，不会上传到网站代码。",
    aiKeyPlaceholder: "粘贴 DeepSeek API Key",
    aiSaveKey: "保存并启用 AI",
    aiRemoveKey: "移除本机 Key",
    aiReady: "AI 已连接 · 使用本机保存的 DeepSeek Key",
    planTitle: "学期执行中心",
    planIntro: "教学计划、个人课表和 assessment 已经对齐。每周按“课前—课堂—课后—交付”推进。",
    thisWeek: "本周行动",
    timetable: "固定课表",
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
    startTen: "开始本知识点 10 题",
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
    quizTitle: "Deep Learning Mode · 290 Questions",
    quizIntro: "Complex calculations, code tracing, charts, data, multiple-select and scenarios. Every applied solution is taught step by step; mistakes repeat until mastered.",
    all: "All 290",
    topicPrompt: "Choose a topic (10 questions each)",
    question: "Question",
    score: "Score",
    correct: "Correct.",
    review: "Review this.",
    next: "Next question",
    result: "Learning round result",
    retryWrong: "Deep-learn missed questions",
    retryAll: "Restart this set",
    perfect: "Topic mastered: every question was answered independently and correctly this round.",
    submitAnswer: "Submit answer",
    chooseMultiple: "Select every correct answer, then submit",
    deepMode: "Deep Learning Mode",
    masteryRule: "Mastery standard: answer every item correctly in one independent round. Missed items repeat until none remain.",
    notMastered: "Not mastered yet",
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
    aiSetupTitle: "Connect your DeepSeek API",
    aiSetupIntro: "This is a static site. Enter an API key to enable AI; it stays only in this browser and is never added to the website code.",
    aiKeyPlaceholder: "Paste DeepSeek API key",
    aiSaveKey: "Save and enable AI",
    aiRemoveKey: "Remove device key",
    aiReady: "AI connected · using this device’s DeepSeek key",
    planTitle: "Semester execution centre",
    planIntro: "Your teaching plans, personal timetable and assessments are aligned into a weekly pre-class–class–post-class–delivery rhythm.",
    thisWeek: "This week",
    timetable: "Weekly timetable",
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
    startTen: "Start this topic’s 10 questions",
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

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [view, setView] = useState<View>("today");
  const [selectedId, setSelectedId] = useState("math");
  const [selectedCourseTopic, setSelectedCourseTopic] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [quizFilter, setQuizFilter] = useState("all");
  const [quizTopic, setQuizTopic] = useState("all");
  const [sessionIds, setSessionIds] = useState(practiceBank.map((q) => q.id));
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [draftSelections, setDraftSelections] = useState<Record<string, number[]>>({});
  const [learningRound, setLearningRound] = useState(1);
  const [masteredTopics, setMasteredTopics] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [planFocus, setPlanFocus] = useState<"all" | "prepare" | "review">("all");
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({});
  const [planNotes, setPlanNotes] = useState<Record<string, string>>({});
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
  const [tutorStreak, setTutorStreak] = useState(0);
  const [aiMessages, setAiMessages] = useState<AiTutorMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [needsAiKey, setNeedsAiKey] = useState(false);

  const copy = ui[lang];
  const pick = (text: Bi) => text[lang];

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const savedProgress = window.localStorage.getItem("four-course-progress");
      const savedLang = window.localStorage.getItem("four-course-language") as Lang | null;
      if (savedProgress) setCompleted(JSON.parse(savedProgress));
      if (savedLang === "zh" || savedLang === "en") setLang(savedLang);
      const savedChecks = window.localStorage.getItem("four-course-plan-checks");
      const savedNotes = window.localStorage.getItem("four-course-plan-notes");
      const savedConfidence = window.localStorage.getItem("four-course-confidence");
      const savedMastery = window.localStorage.getItem("four-course-mastery");
      const savedAiKey = window.localStorage.getItem("four-course-deepseek-key");
      setNeedsAiKey(window.location.hostname.endsWith("github.io"));
      if (savedChecks) setPlanChecks(JSON.parse(savedChecks));
      if (savedNotes) setPlanNotes(JSON.parse(savedNotes));
      if (savedConfidence) setConfidence(JSON.parse(savedConfidence));
      if (savedMastery) setMasteredTopics(JSON.parse(savedMastery));
      if (savedAiKey) setAiApiKey(savedAiKey);
      const current = new Date();
      const active = semesterWeeks.find((week) => current >= new Date(`${week.start}T00:00:00`) && current <= new Date(`${week.end}T23:59:59`));
      if (active) setSelectedWeek(active.week);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("four-course-progress", JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    window.localStorage.setItem("four-course-language", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  useEffect(() => {
    window.localStorage.setItem("four-course-plan-checks", JSON.stringify(planChecks));
  }, [planChecks]);

  useEffect(() => {
    window.localStorage.setItem("four-course-plan-notes", JSON.stringify(planNotes));
  }, [planNotes]);

  useEffect(() => {
    window.localStorage.setItem("four-course-confidence", JSON.stringify(confidence));
  }, [confidence]);

  useEffect(() => {
    window.localStorage.setItem("four-course-mastery", JSON.stringify(masteredTopics));
  }, [masteredTopics]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  const selected = courses.find((course) => course.id === selectedId) ?? courses[0];
  const selectedTopicId = `${selected.id}-${selectedCourseTopic}`;
  const selectedDeepLesson = deepLessons[selectedTopicId] ?? deepLessons["math-0"];
  const nextCourse = useMemo(
    () => courses.find((course) => !completed.includes(course.id)) ?? courses[0],
    [completed],
  );
  const progress = Math.round((completed.length / courses.length) * 100);
  const currentQuestion = practiceBank.find((q) => q.id === sessionIds[quizIndex]);
  const answeredCurrent = currentQuestion ? answers[currentQuestion.id] : undefined;
  const sessionQuestions = sessionIds
    .map((id) => practiceBank.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));
  const correctCount = sessionQuestions.filter((q) => answerIsCorrect(q, answers[q.id])).length;
  const wrongIds = sessionQuestions
    .filter((q) => answers[q.id] !== undefined && !answerIsCorrect(q, answers[q.id]))
    .map((q) => q.id);
  const quizComplete = sessionIds.length > 0 && Object.keys(answers).length === sessionIds.length;
  const semesterWeek = semesterWeeks.find((week) => week.week === selectedWeek) ?? semesterWeeks[0];
  const weeklyPlanKeys = semesterWeek.plans.flatMap((plan) => [
    `w${selectedWeek}-${plan.courseId}-pre`,
    `w${selectedWeek}-${plan.courseId}-post`,
    `w${selectedWeek}-${plan.courseId}-output`,
  ]);
  const weeklyPlanDone = weeklyPlanKeys.filter((key) => planChecks[key]).length;
  const now = new Date();
  const todayClasses = timetable
    .filter((item) => item.day === now.getDay() && (!item.startsWeek || selectedWeek >= item.startsWeek))
    .sort((a, b) => a.start.localeCompare(b.start));
  const upcomingAssessments = assessments
    .filter((item) => !item.date || new Date(item.date).getTime() >= now.getTime() - 86400000)
    .sort((a, b) => (a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER) - (b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER));
  const tutorCourseData = courses.find((course) => course.id === tutorCourse) ?? courses[0];
  const tutorQuestions = practiceBank.filter((question) =>
    question.courseId === tutorCourse && (tutorTopic === "all" || question.topicId === tutorTopic),
  );
  const tutorQuestion = tutorQuestions[tutorIndex % Math.max(tutorQuestions.length, 1)];

  function daysUntil(date?: string) {
    if (!date) return null;
    return Math.max(0, Math.ceil((new Date(date).getTime() - now.getTime()) / 86400000));
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

  function chooseCourse(id: string) {
    setSelectedId(id);
    setSelectedCourseTopic(0);
    setView("courses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function markCourse(id: string) {
    setCompleted((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }

  function startQuiz(filter: string, ids?: string[], topicId = "all") {
    const nextIds =
      ids ??
      practiceBank
        .filter((question) =>
          (filter === "all" || question.courseId === filter) &&
          (topicId === "all" || question.topicId === topicId),
        )
        .map((question) => question.id);
    setQuizFilter(filter);
    setQuizTopic(topicId);
    setSessionIds(nextIds);
    setQuizIndex(0);
    setAnswers({});
    setDraftSelections({});
    if (!ids) setLearningRound(1);
  }

  function goNext() {
    if (quizIndex < sessionIds.length - 1) {
      setQuizIndex((index) => index + 1);
    }
  }

  function continueDeepLearning() {
    setSessionIds(wrongIds);
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

  function resetTutorQuestion(nextIndex = 0) {
    setTutorIndex(nextIndex);
    setTutorStage("think");
    setTutorThought("");
    setTutorChoice([]);
    setTutorAttempts(0);
    setTutorCorrect(false);
    setAiMessages([]);
    setAiInput("");
    setAiError("");
  }

  function chooseTutorCourse(id: string) {
    setTutorCourse(id);
    setTutorTopic("all");
    resetTutorQuestion();
  }

  function submitTutorAnswer() {
    if (!tutorQuestion || tutorChoice.length === 0) return;
    const value: AnswerValue = Array.isArray(tutorQuestion.answer) ? tutorChoice : tutorChoice[0];
    const correct = answerIsCorrect(tutorQuestion, value);
    setTutorAttempts((count) => count + 1);
    setTutorCorrect(correct);
    setTutorStage("feedback");
    if (correct) setTutorStreak((count) => count + 1);
    else setTutorStreak(0);
  }

  function nextTutorQuestion() {
    resetTutorQuestion((tutorIndex + 1) % Math.max(tutorQuestions.length, 1));
  }

  async function askAiTutor(message?: string) {
    if (!tutorQuestion || aiLoading) return;
    const content = (message ?? aiInput).trim();
    if (!content) return;
    const staticHost = window.location.hostname.endsWith("github.io");
    if (staticHost && !aiApiKey) {
      setShowAiSetup(true);
      setAiError("");
      return;
    }
    const userEntry: AiTutorMessage = { role: "user", content };
    const history = [...aiMessages, userEntry];
    setAiMessages(history);
    setAiInput("");
    setAiError("");
    setAiLoading(true);

    const answerIndexes = Array.isArray(tutorQuestion.answer) ? tutorQuestion.answer : [tutorQuestion.answer];
    const topicIndex = tutorQuestion.topicId ? Number(tutorQuestion.topicId.split("-").at(-1)) : -1;
    const requestPayload = {
      language: lang,
      course: `${tutorCourseData.code} ${tutorCourseData.name}`,
      topic: topicIndex >= 0 ? pick(tutorCourseData.topics[topicIndex]) : pick(tutorCourseData.focus),
      question: pick(tutorQuestion.question),
      options: tutorQuestion.options.map(pick),
      correctAnswer: answerIndexes.map((index) => `${String.fromCharCode(65 + index)}. ${pick(tutorQuestion.options[index])}`).join("; "),
      explanation: pick(tutorQuestion.explanation),
      originalThought: tutorThought,
      userMessage: content,
      attempted: tutorAttempts > 0,
      correct: tutorAttempts > 0 && tutorCorrect,
      history: aiMessages.slice(-8),
    };
    try {
      let reply = "";
      if (!staticHost) {
        const response = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });
        const payload = await response.json() as { reply?: string; error?: string };
        if (response.ok && payload.reply) reply = payload.reply;
      }
      if (!reply && aiApiKey) {
        const teachingState = requestPayload.attempted
          ? requestPayload.correct
            ? "The student has answered correctly. Explain deeply and test transfer."
            : "The student has answered incorrectly. Diagnose the misconception and repair it step by step."
          : "The student has not committed an answer. Do not reveal the final option; teach the definition and ask for one next step.";
        const system = `You are a Socratic Deep Tutor for a first-year UTS engineering student. Teach in ${lang === "zh" ? "Simplified Chinese" : "English"}.
Give formal definitions and plain-language intuition. Explain every symbol and every condition. Derive results step by step. For maths and physics, check units, signs, limiting cases and geometric or physical meaning. For C, trace values, types, control flow and memory. Do not give vague summaries. Use one confirming example and one common trap. End with exactly one short check question.
${teachingState}`;
        const context = `COURSE: ${requestPayload.course}
TOPIC: ${requestPayload.topic}
QUESTION: ${requestPayload.question}
OPTIONS: ${requestPayload.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n")}
CORRECT ANSWER (teacher-only): ${requestPayload.correctAnswer}
EXISTING EXPLANATION: ${requestPayload.explanation}
STUDENT REASONING: ${requestPayload.originalThought || "Not provided."}`;
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiApiKey}` },
          body: JSON.stringify({
            model: "deepseek-v4-pro",
            messages: [
              { role: "system", content: system },
              { role: "user", content: context },
              ...aiMessages.slice(-8),
              { role: "user", content },
            ],
            thinking: { type: "enabled" },
            reasoning_effort: "high",
            max_tokens: 1800,
            temperature: 0.25,
            stream: false,
          }),
        });
        const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "DeepSeek request failed");
        reply = payload.choices?.[0]?.message?.content?.trim() ?? "";
      }
      if (!reply) {
        setShowAiSetup(true);
        throw new Error("AI key required");
      }
      setAiMessages((items) => [...items, { role: "assistant", content: reply }]);
    } catch (error) {
      setAiError(error instanceof Error && error.message !== "AI key required" ? error.message : copy.aiError);
    } finally {
      setAiLoading(false);
    }
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

  useEffect(() => {
    if (quizComplete && wrongIds.length === 0) markMastered();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizComplete]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">{lang === "zh" ? "四" : "4"}</div>
        <div>
          <p className="eyebrow">SPRING 2026 · UTS</p>
          <h1>{copy.title}</h1>
        </div>
        <div className="top-actions">
          <button
            className="language-toggle"
            onClick={() => setLang((value) => (value === "zh" ? "en" : "zh"))}
            aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <span>{progress}%</span>
          </div>
        </div>
      </header>

      {view === "today" && (
        <section className="view-stack">
          <article className="hero-card">
            <p className="hero-kicker">{copy.todayStep}</p>
            <h2>{pick(nextCourse.focus)}</h2>
            <p>{nextCourse.code} · {pick(nextCourse.short)}</p>
            <button className="primary-button" onClick={() => chooseCourse(nextCourse.id)}>
              {copy.startStudy} <span>→</span>
            </button>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
          </article>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FOCUS</p>
                <h2>{copy.focusTitle}</h2>
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
            <div className="timer-card">
              <span className="timer-time">{formatTime(seconds)}</span>
              <div className="timer-track">
                <span style={{ width: `${(seconds / (25 * 60)) * 100}%` }} />
              </div>
              <p>{copy.focusPlan}</p>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR SEMESTER</p>
                <h2>{copy.fourCourses}</h2>
              </div>
              <button className="text-button" onClick={() => setView("courses")}>{copy.viewAll}</button>
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
                  <span><small>{course.code}</small><strong>{pick(course.short)}</strong></span>
                  <span className={completed.includes(course.id) ? "status-dot done" : "status-dot"} />
                </button>
              ))}
            </div>
          </section>

          <section className="week-pulse">
            <div className="week-pulse-head">
              <div>
                <p className="eyebrow">WEEK {selectedWeek} · {semesterWeek.range[lang]}</p>
                <h2>{copy.thisWeek}</h2>
              </div>
              <button onClick={() => setView("plan")}>{copy.openPlan} →</button>
            </div>
            <div className="today-class-list">
              {todayClasses.length === 0 && <p className="empty-note">{copy.noClass}</p>}
              {todayClasses.map((item) => {
                const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                return (
                  <article key={`${item.courseId}-${item.start}`} style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                    <span className="class-time">{item.start}</span>
                    <div>
                      <strong>{course.code} · {pick(course.short)}</strong>
                      <p>{item.activity[lang]} · {item.location}</p>
                      <small className="today-venue">
                        {item.venue.kind === "online"
                          ? copy.onlineClass
                          : `${item.venue.building[lang]} · ${item.venue.level?.[lang]} · ${item.venue.room?.[lang]}`}
                      </small>
                    </div>
                    <a
                      className="today-map-link"
                      href={item.venue.zoomUrl ?? item.venue.mapUrl ?? course.canvas}
                      target="_blank"
                      rel="noreferrer"
                    >
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
                  <button key={item.id} onClick={() => { setAssessmentFilter(item.courseId); setView("plan"); }}>
                    <span style={{ background: course.soft, color: course.accent }}>{course.code}</span>
                    <strong>{item.title[lang]}</strong>
                    <small>{days === null ? copy.datePending : days === 0 ? copy.todayDue : `${days} ${copy.days}`}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <blockquote>{copy.quote}<span>{copy.tip}</span></blockquote>
        </section>
      )}

      {view === "plan" && (
        <section className="view-stack plan-view">
          <div className="page-intro">
            <p className="eyebrow">SEMESTER OS · SPRING 2026</p>
            <h2>{copy.planTitle}</h2>
            <p>{copy.planIntro}</p>
          </div>

          <div className="week-picker" aria-label={copy.thisWeek}>
            {semesterWeeks.map((week) => (
              <button
                key={week.week}
                className={selectedWeek === week.week ? "active" : ""}
                onClick={() => setSelectedWeek(week.week)}
              >
                <strong>W{week.week}</strong>
                <small>{week.range[lang]}</small>
              </button>
            ))}
          </div>

          <section className="schedule-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PERSONAL TIMETABLE</p>
                <h2>{copy.timetable}</h2>
              </div>
              <span className="week-badge">W{selectedWeek}</span>
            </div>
            <div className="schedule-list">
              {timetable
                .filter((item) => !item.startsWeek || selectedWeek >= item.startsWeek)
                .map((item) => {
                  const course = courses.find((entry) => entry.id === item.courseId) ?? courses[0];
                  return (
                    <article key={`${item.courseId}-${item.activity.en}`} style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                      <div className="schedule-day">
                        <strong>{item.dayLabel[lang]}</strong>
                        <span>{item.start}</span>
                      </div>
                      <div>
                        <strong>{course.code} · {pick(course.short)}</strong>
                        <p>{item.activity[lang]} · {item.start}–{item.end}</p>
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
            {selectedWeek === 8 && <p className="break-note">{semesterBreak[lang]}</p>}
          </section>

          <section className="weekly-plan">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PREP → CLASS → REVIEW → RETRIEVAL</p>
                <h2>W{selectedWeek} · {semesterWeek.range[lang]}</h2>
              </div>
            </div>
            <div className="plan-control-panel">
              <div className="plan-progress-copy">
                <span>{copy.planProgress}</span>
                <strong>{weeklyPlanDone} / {weeklyPlanKeys.length}</strong>
              </div>
              <div className="plan-progress-track" aria-label={`${weeklyPlanDone} / ${weeklyPlanKeys.length}`}>
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
                const preKey = `w${selectedWeek}-${plan.courseId}-pre`;
                const postKey = `w${selectedWeek}-${plan.courseId}-post`;
                const outputKey = `w${selectedWeek}-${plan.courseId}-output`;
                const noteKey = `w${selectedWeek}-${plan.courseId}`;
                const topicIndex = Math.min(selectedWeek - 1, course.topics.length - 1);
                const topicId = `${course.id}-${topicIndex}`;
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
                      <span>10</span>{copy.startTen}<b>→</b>
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

          <section className="assessment-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DEADLINES & MILESTONES</p>
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
        </section>
      )}

      {view === "courses" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">COURSE MAP</p>
            <h2>{copy.mapTitle}</h2>
            <p>{copy.mapIntro}</p>
          </div>
          <div className="course-tabs" role="tablist" aria-label={copy.fourCourses}>
            {courses.map((course) => (
              <button
                key={course.id}
                role="tab"
                aria-selected={selected.id === course.id}
                className={selected.id === course.id ? "active" : ""}
                style={{ "--accent": course.accent } as React.CSSProperties}
                onClick={() => { setSelectedId(course.id); setSelectedCourseTopic(0); }}
              >
                {course.code}
              </button>
            ))}
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
                <MathPhysicsTools courseId={selected.id} topicId={selectedTopicId} lang={lang} />
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
                <button onClick={() => { setTutorCourse(selected.id); setTutorTopic(selectedTopicId); resetTutorQuestion(); setView("tutor"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  {lang === "zh" ? "让 AI 导师继续讲" : "Continue with AI tutor"}
                </button>
                <button className="secondary" onClick={() => { startQuiz(selected.id, undefined, selectedTopicId); setView("quiz"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  {lang === "zh" ? "开始本知识点 10 题" : "Start this topic’s 10 questions"}
                </button>
              </div>
            </div>
            <div className="action-row">
              <button
                className={completed.includes(selected.id) ? "complete-button completed" : "complete-button"}
                onClick={() => markCourse(selected.id)}
              >
                {completed.includes(selected.id) ? copy.done : copy.markDone}
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
            <p className="eyebrow">GUIDED MASTERY</p>
            <h2>{copy.tutorTitle}</h2>
            <p>{copy.tutorIntro}</p>
          </div>

          <div className="tutor-selector">
            <strong>{copy.tutorCourse}</strong>
            <div className="tutor-course-row">
              {courses.map((course) => (
                <button
                  key={course.id}
                  className={tutorCourse === course.id ? "active" : ""}
                  style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}
                  onClick={() => chooseTutorCourse(course.id)}
                >
                  <span>{course.mark}</span>{course.code}
                </button>
              ))}
            </div>
            <strong>{copy.tutorTopic}</strong>
            <div className="tutor-topic-row">
              <button
                className={tutorTopic === "all" ? "active" : ""}
                onClick={() => { setTutorTopic("all"); resetTutorQuestion(); }}
              >
                {lang === "zh" ? "全部知识点" : "All topics"}
              </button>
              {tutorCourseData.topics.map((topic, index) => {
                const topicId = `${tutorCourseData.id}-${index}`;
                return (
                  <button
                    key={topicId}
                    className={tutorTopic === topicId ? "active" : ""}
                    onClick={() => { setTutorTopic(topicId); resetTutorQuestion(); }}
                  >
                    {index + 1}. {pick(topic)}
                  </button>
                );
              })}
            </div>
          </div>

          {tutorQuestion && (
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
              <h3>{pick(tutorQuestion.question)}</h3>
              {renderTutorVisual(tutorQuestion.visual)}
              {(tutorQuestion.courseId === "math" || tutorQuestion.courseId === "physics") && (
                <MathPhysicsTools courseId={tutorQuestion.courseId} topicId={tutorQuestion.topicId} lang={lang} />
              )}

              {tutorStage === "think" && (
                <div className="tutor-step">
                  <label htmlFor="tutor-thought">{copy.tutorThought}</label>
                  <textarea
                    id="tutor-thought"
                    value={tutorThought}
                    placeholder={copy.tutorThoughtPlaceholder}
                    onChange={(event) => setTutorThought(event.target.value)}
                  />
                  <button disabled={tutorThought.trim().length < 8} onClick={() => setTutorStage("probe")}>{copy.tutorSubmitThought}</button>
                </div>
              )}

              {tutorStage === "probe" && (
                <div className="tutor-step">
                  <div className="saved-thought"><strong>{copy.tutorReasoningSaved}</strong><p>{tutorThought}</p></div>
                  <p className="tutor-label">{copy.tutorProbe}</p>
                  <ol className="probe-list">
                    {(tutorPrompts[tutorCourse] ?? tutorPrompts.math).map((prompt) => <li key={prompt.en}>{pick(prompt)}</li>)}
                  </ol>
                  <button onClick={() => setTutorStage("answer")}>{copy.tutorContinue}</button>
                </div>
              )}

              {tutorStage === "answer" && (
                <div className="tutor-step">
                  <p className="tutor-label">{copy.tutorCommit}</p>
                  <div className="options tutor-options">
                    {tutorQuestion.options.map((option, index) => (
                      <button
                        key={option.en}
                        className={tutorChoice.includes(index) ? "selected" : ""}
                        onClick={() => setTutorChoice((items) =>
                          Array.isArray(tutorQuestion.answer)
                            ? (items.includes(index) ? items.filter((item) => item !== index) : [...items, index])
                            : [index],
                        )}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>{pick(option)}
                      </button>
                    ))}
                  </div>
                  <button disabled={tutorChoice.length === 0} onClick={submitTutorAnswer}>{copy.submitAnswer}</button>
                </div>
              )}

              {tutorStage === "feedback" && (
                <div className={`tutor-feedback ${tutorCorrect ? "correct" : "wrong"}`}>
                  <strong>{tutorCorrect ? copy.tutorCorrect : copy.tutorWrong}</strong>
                  <p>{pick(tutorQuestion.explanation)}</p>
                  {!tutorCorrect && (
                    <div className="retry-coaching">
                      <span>{pick((tutorPrompts[tutorCourse] ?? tutorPrompts.math)[Math.min(tutorAttempts, 2)])}</span>
                      <button onClick={() => { setTutorChoice([]); setTutorStage("answer"); }}>{copy.tutorRetry}</button>
                    </div>
                  )}
                  {tutorCorrect && <button onClick={nextTutorQuestion}>{copy.tutorNext}</button>}
                </div>
              )}

              <section className="ai-tutor-panel" aria-label={copy.aiTutor}>
                <div className="ai-tutor-title">
                  <span>AI</span>
                  <div><strong>{copy.aiTutor}</strong><p>{copy.aiTutorIntro}</p></div>
                </div>
                {(showAiSetup || (needsAiKey && !aiApiKey)) && (
                  <div className="ai-key-setup">
                    <strong>{copy.aiSetupTitle}</strong>
                    <p>{copy.aiSetupIntro}</p>
                    <input
                      type="password"
                      autoComplete="off"
                      value={aiKeyInput}
                      placeholder={copy.aiKeyPlaceholder}
                      onChange={(event) => setAiKeyInput(event.target.value)}
                    />
                    <button
                      disabled={aiKeyInput.trim().length < 12}
                      onClick={() => {
                        const key = aiKeyInput.trim();
                        window.localStorage.setItem("four-course-deepseek-key", key);
                        setAiApiKey(key);
                        setAiKeyInput("");
                        setShowAiSetup(false);
                        setAiError("");
                      }}
                    >
                      {copy.aiSaveKey}
                    </button>
                  </div>
                )}
                {aiApiKey && (
                  <div className="ai-key-ready">
                    <span>● {copy.aiReady}</span>
                    <button onClick={() => {
                      window.localStorage.removeItem("four-course-deepseek-key");
                      setAiApiKey("");
                      setShowAiSetup(needsAiKey);
                    }}>{copy.aiRemoveKey}</button>
                  </div>
                )}
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
                        <p>{message.content}</p>
                      </article>
                    ))}
                  </div>
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
              </section>
            </article>
          )}
        </section>
      )}

      {view === "quiz" && (
        <section className="view-stack">
          <div className="page-intro">
            <p className="eyebrow">ACTIVE RECALL</p>
            <h2>{copy.quizTitle}</h2>
            <p>{copy.quizIntro}</p>
          </div>

          <div className="quiz-filters" role="tablist" aria-label={copy.quizTitle}>
            <button className={quizFilter === "all" ? "active" : ""} onClick={() => startQuiz("all")}>{copy.all}</button>
            {courses.map((course) => (
              <button
                key={course.id}
                className={quizFilter === course.id ? "active" : ""}
                style={{ "--accent": course.accent } as React.CSSProperties}
                onClick={() => startQuiz(course.id)}
              >
                {course.code} <small>{practiceBank.filter((q) => q.courseId === course.id).length}</small>
              </button>
            ))}
          </div>

          {quizFilter !== "all" && (() => {
            const quizCourse = courses.find((course) => course.id === quizFilter);
            if (!quizCourse) return null;
            return (
              <div className="topic-picker">
                <p>{copy.topicPrompt}</p>
                <div>
                  <button
                    className={quizTopic === "all" ? "active" : ""}
                    onClick={() => startQuiz(quizCourse.id)}
                  >
                    {lang === "zh" ? `本课程全部 ${practiceBank.filter((q) => q.courseId === quizCourse.id).length} 题` : `All ${practiceBank.filter((q) => q.courseId === quizCourse.id).length} in this course`}
                  </button>
                  {quizCourse.topics.map((topic, index) => {
                    const topicId = `${quizCourse.id}-${index}`;
                    return (
                      <button
                        key={topicId}
                        className={quizTopic === topicId ? "active" : ""}
                        onClick={() => startQuiz(quizCourse.id, undefined, topicId)}
                      >
                        <span>{index + 1}</span>
                        {pick(topic)}
                        <small>{masteredTopics.includes(topicId) ? `✓ ${copy.mastered}` : `10 ${lang === "zh" ? "题" : "Q"}`}</small>
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
            const kindLabels: Record<QuestionKind, Bi> = {
              truefalse: bi("判断题", "True / False"),
              single: bi("单选题", "Single choice"),
              multiple: bi("多选题", "Multiple select"),
              scenario: bi("情境分析", "Scenario"),
              combination: bi("组合题", "Combination"),
              calculation: bi("计算 / 推演题", "Calculation / Trace"),
              data: bi("图表 / 数据题", "Chart / Data"),
            };
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
                <div className="question-kind-badge">{pick(kindLabels[currentQuestion.kind ?? "single"])}</div>
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
                  <MathPhysicsTools courseId={currentQuestion.courseId} topicId={currentQuestion.topicId} lang={lang} />
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
                        disabled={answeredCurrent !== undefined}
                        onClick={() => {
                          if (!isMultiple) {
                            setAnswers((items) => ({ ...items, [currentQuestion.id]: index }));
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
                    disabled={draft.length === 0}
                    onClick={() => setAnswers((items) => ({ ...items, [currentQuestion.id]: draft }))}
                  >
                    {copy.submitAnswer}
                  </button>
                )}
                {answeredCurrent !== undefined && (
                  <>
                    <p className="explanation">
                      <strong>{answerIsCorrect(currentQuestion, answeredCurrent) ? copy.correct : copy.review}</strong>
                      {pick(currentQuestion.explanation)}
                    </p>
                    {quizIndex < sessionIds.length - 1 && <button className="next-button" onClick={goNext}>{copy.next} →</button>}
                  </>
                )}
              </article>
            );
          })()}

          {quizComplete && (
            <article className="result-card">
              <p className="eyebrow">{copy.result}</p>
              <div className="result-score"><strong>{correctCount}</strong><span>/ {sessionIds.length}</span></div>
              <p>{wrongIds.length === 0 ? copy.perfect : `${copy.score}: ${Math.round((correctCount / sessionIds.length) * 100)}%`}</p>
              <p className={`mastery-status ${wrongIds.length === 0 ? "mastered" : ""}`}>
                {wrongIds.length === 0 ? `✓ ${copy.mastered}` : `${copy.notMastered} · ${wrongIds.length} ${lang === "zh" ? "题待清零" : "to clear"}`}
              </p>
              <p className="mastery-rule">{copy.masteryRule}</p>
              <div className="result-actions">
                {wrongIds.length > 0 && <button onClick={continueDeepLearning}>{copy.retryWrong} ({wrongIds.length})</button>}
                <button className="secondary" onClick={() => startQuiz(quizFilter, undefined, quizTopic)}>{copy.retryAll}</button>
              </div>
            </article>
          )}
        </section>
      )}

      <nav className="bottom-nav" aria-label="Main navigation">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}><span>⌂</span>{copy.navToday}</button>
        <button className={view === "plan" ? "active" : ""} onClick={() => setView("plan")}><span>◫</span>{copy.navPlan}</button>
        <button className={view === "courses" ? "active" : ""} onClick={() => setView("courses")}><span>▤</span>{copy.navCourses}</button>
        <button className={view === "tutor" ? "active" : ""} onClick={() => setView("tutor")}><span>◇</span>{copy.navTutor}</button>
        <button className={view === "quiz" ? "active" : ""} onClick={() => setView("quiz")}><span>✓</span>{copy.navQuiz}</button>
      </nav>
    </main>
  );
}
