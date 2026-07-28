"use client";

import { useEffect, useMemo, useState } from "react";
import { topicQuestionBank } from "./topic-questions";
import { assessments, semesterBreak, semesterWeeks, timetable } from "./semester-data";

type Lang = "zh" | "en";
type View = "today" | "plan" | "courses" | "quiz";
type Bi = { zh: string; en: string };
type Question = {
  id: string;
  courseId: string;
  topicId?: string;
  question: Bi;
  options: Bi[];
  answer: number;
  explanation: Bi;
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
    id: "iep",
    code: "48230",
    short: bi("工程项目", "Engineering Projects"),
    name: "Introduction to Engineering Projects",
    accent: "#F66B4A",
    soft: "#FFF0EA",
    mark: "△",
    canvas: "https://canvas.uts.edu.au/courses/39889/modules",
    focus: bi("工程与设计入门", "Engineering & design fundamentals"),
    topics: [
      bi("什么是工程", "What is engineering?"),
      bi("工程设计流程", "Engineering design process"),
      bi("团队协作", "Teamwork"),
      bi("设计中的 Country", "Country in design"),
      bi("EWB Challenge", "EWB Challenge"),
      bi("自评与同伴评价", "Self & peer assessment"),
    ],
    lesson: {
      title: bi("把模糊问题变成可测试的设计", "Turn a fuzzy problem into a testable design"),
      intro: bi(
        "工程设计不是直接跳到答案，而是先把人的需求、环境和限制转化为可以验证的设计标准。",
        "Engineering design does not jump straight to an answer. It translates human needs, context and limits into criteria that can be tested.",
      ),
      points: [
        bi("理解情境：谁受到影响？真正的问题是什么？", "Understand context: who is affected, and what is the real problem?"),
        bi("定义标准：成功要满足哪些可衡量指标？", "Define criteria: what measurable outcomes mean success?"),
        bi("生成方案：先扩大选择，再用证据收敛。", "Generate ideas: diverge first, then converge using evidence."),
        bi("原型与测试：用最小成本验证最大风险。", "Prototype and test: validate the biggest risk at the lowest cost."),
      ],
      formula: "NEED → CRITERIA → IDEATE → PROTOTYPE → TEST → ITERATE",
      example: bi(
        "“设计一个净水装置”太宽泛。改写成“在无电环境下，每小时处理 10L 水，成本低于 $50”，才便于比较方案。",
        "“Design a water filter” is too broad. “Treat 10 L per hour without electricity for under $50” makes alternatives testable.",
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

  { id: "e1", courseId: "iep", question: bi("团队提出三个方案后，下一步最合理的做法是？", "After generating three concepts, what should the team do next?"), options: [bi("选最漂亮的", "Pick the prettiest"), bi("用设计标准比较", "Compare against design criteria"), bi("直接做最终产品", "Build the final product"), bi("让一个人决定", "Let one person decide")], answer: 1, explanation: bi("工程决策应依据明确标准与证据。", "Engineering decisions should use explicit criteria and evidence.") },
  { id: "e2", courseId: "iep", question: bi("“利益相关者”最准确的定义是？", "What best defines a stakeholder?"), options: [bi("只包括付钱的客户", "Only the paying client"), bi("受项目影响或能影响项目的人或群体", "Anyone affected by or able to affect the project"), bi("只包括工程师", "Engineers only"), bi("只包括政府", "Government only")], answer: 1, explanation: bi("利益相关者可能是使用者、社区、客户、监管者或维护人员。", "Stakeholders can include users, communities, clients, regulators and maintainers.") },
  { id: "e3", courseId: "iep", question: bi("以下哪一个更像“约束”而不是“评价标准”？", "Which is a constraint rather than a criterion?"), options: [bi("尽可能轻", "As light as possible"), bi("成本不得超过 $50", "Must cost no more than $50"), bi("更容易使用", "Easier to use"), bi("外观更吸引人", "More attractive")], answer: 1, explanation: bi("约束是必须满足的边界；评价标准常用于比较方案优劣。", "A constraint is a hard limit; criteria help compare alternatives.") },
  { id: "e4", courseId: "iep", question: bi("低保真原型最主要的价值是？", "What is the main value of a low-fidelity prototype?"), options: [bi("看起来像成品", "Looks finished"), bi("快速、低成本验证假设", "Tests assumptions quickly and cheaply"), bi("避免用户反馈", "Avoids user feedback"), bi("直接量产", "Enables mass production")], answer: 1, explanation: bi("原型的目的不是完美，而是尽早暴露风险并获得反馈。", "A prototype is not about perfection; it exposes risk and gathers feedback early.") },
  { id: "e5", courseId: "iep", question: bi("工程设计为什么需要迭代？", "Why is engineering design iterative?"), options: [bi("第一次设计必然失败", "The first design always fails"), bi("测试会产生新证据，促使方案改进", "Testing produces evidence that improves the design"), bi("为了拖延项目", "To delay the project"), bi("因为不需要计划", "Because planning is unnecessary")], answer: 1, explanation: bi("设计—测试—学习—改进是减少不确定性的循环。", "Design–test–learn–improve is a cycle for reducing uncertainty.") },
  { id: "e6", courseId: "iep", question: bi("团队成员对方案有分歧时，最佳做法是？", "When teammates disagree on a concept, what is the best response?"), options: [bi("忽略少数意见", "Ignore the minority"), bi("回到目标、标准和证据", "Return to goals, criteria and evidence"), bi("投硬币", "Flip a coin"), bi("停止记录", "Stop documenting")], answer: 1, explanation: bi("把讨论从个人偏好转回共同标准，更容易形成可靠决定。", "Moving from personal preference to shared criteria supports a defensible decision.") },
  { id: "e7", courseId: "iep", question: bi("有效的同伴评价应该主要基于什么？", "What should effective peer assessment mainly use?"), options: [bi("是否是朋友", "Friendship"), bi("可观察的贡献与既定标准", "Observed contribution and stated criteria"), bi("发言次数", "Number of times spoken"), bi("个人好恶", "Personal preference")], answer: 1, explanation: bi("具体行为和明确标准能减少偏见，使反馈更可操作。", "Specific behaviours and clear criteria reduce bias and make feedback actionable.") },
  { id: "e8", courseId: "iep", question: bi("在设计中尊重 Country，最重要的是？", "What matters most when engaging with Country in design?"), options: [bi("只使用原住民图案", "Use Indigenous patterns"), bi("尽早并持续与相关社区建立真实合作", "Build genuine, ongoing engagement with relevant communities"), bi("设计完成后再通知", "Notify people after design"), bi("假设所有社区相同", "Assume all communities are the same")], answer: 1, explanation: bi("尊重 Country 需要关系、倾听和共同决策，而不是表面装饰。", "Respecting Country requires relationships, listening and shared decision-making, not decoration.") },
  { id: "e9", courseId: "iep", question: bi("EWB Challenge 强调的设计思维是什么？", "What design approach does the EWB Challenge emphasise?"), options: [bi("脱离情境的技术炫技", "Context-free technical novelty"), bi("以社区情境和可持续性为中心", "Community context and sustainability"), bi("只追求最低成本", "Lowest cost only"), bi("只做个人项目", "Individual work only")], answer: 1, explanation: bi("好的方案必须适合当地情境，并考虑社会、环境和长期影响。", "Strong solutions fit the local context and consider social, environmental and long-term impacts.") },
  { id: "e10", courseId: "iep", question: bi("在课程允许使用生成式 AI 时，最负责任的做法是？", "If generative AI is permitted, what is the most responsible practice?"), options: [bi("直接提交生成内容", "Submit output unchanged"), bi("核查内容、遵守规则并透明说明使用方式", "Verify it, follow the rules and disclose use transparently"), bi("隐藏所有使用痕迹", "Hide all use"), bi("让 AI 代替团队决策", "Let AI replace team decisions")], answer: 1, explanation: bi("你仍需对准确性、引用、原创性和最终判断负责。", "You remain responsible for accuracy, attribution, originality and final judgement.") },

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
    quizTitle: "270 题知识点题库",
    quizIntro: "每个知识点 10 题。可按课程或知识点练习，逐题查看解析。",
    all: "全部 270 题",
    topicPrompt: "选择知识点（每组 10 题）",
    question: "题",
    score: "得分",
    correct: "答对了。",
    review: "再记一次。",
    next: "下一题",
    result: "完成本组练习",
    retryWrong: "只重练错题",
    retryAll: "重新练习本组",
    perfect: "全部答对，做得漂亮。",
    navToday: "今日",
    navPlan: "计划",
    navCourses: "课程",
    navQuiz: "题库",
    planTitle: "学期执行中心",
    planIntro: "教学计划、个人课表和 assessment 已经对齐。每周按“课前—课堂—课后—交付”推进。",
    thisWeek: "本周行动",
    timetable: "固定课表",
    assessments: "Assessment 时间线",
    preparation: "课前预习",
    afterClass: "课后练习",
    weeklyOutcome: "本周产出",
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
    quizTitle: "270-question topic bank",
    quizIntro: "Ten questions for every topic. Practise by course or one topic at a time.",
    all: "All 270",
    topicPrompt: "Choose a topic (10 questions each)",
    question: "Question",
    score: "Score",
    correct: "Correct.",
    review: "Review this.",
    next: "Next question",
    result: "Set complete",
    retryWrong: "Retry wrong answers",
    retryAll: "Restart this set",
    perfect: "Perfect score. Nicely done.",
    navToday: "Today",
    navPlan: "Plan",
    navCourses: "Courses",
    navQuiz: "Practice",
    planTitle: "Semester execution centre",
    planIntro: "Your teaching plans, personal timetable and assessments are aligned into a weekly pre-class–class–post-class–delivery rhythm.",
    thisWeek: "This week",
    timetable: "Weekly timetable",
    assessments: "Assessment timeline",
    preparation: "Pre-class",
    afterClass: "Post-class practice",
    weeklyOutcome: "Weekly output",
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
  },
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
  const [completed, setCompleted] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [quizFilter, setQuizFilter] = useState("all");
  const [quizTopic, setQuizTopic] = useState("all");
  const [sessionIds, setSessionIds] = useState(practiceBank.map((q) => q.id));
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({});
  const [planNotes, setPlanNotes] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [assessmentFilter, setAssessmentFilter] = useState("all");

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
      if (savedChecks) setPlanChecks(JSON.parse(savedChecks));
      if (savedNotes) setPlanNotes(JSON.parse(savedNotes));
      if (savedConfidence) setConfidence(JSON.parse(savedConfidence));
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
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  const selected = courses.find((course) => course.id === selectedId) ?? courses[0];
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
  const correctCount = sessionQuestions.filter((q) => answers[q.id] === q.answer).length;
  const wrongIds = sessionQuestions
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.answer)
    .map((q) => q.id);
  const quizComplete = sessionIds.length > 0 && Object.keys(answers).length === sessionIds.length;
  const semesterWeek = semesterWeeks.find((week) => week.week === selectedWeek) ?? semesterWeeks[0];
  const now = new Date();
  const todayClasses = timetable
    .filter((item) => item.day === now.getDay() && (!item.startsWeek || selectedWeek >= item.startsWeek))
    .sort((a, b) => a.start.localeCompare(b.start));
  const upcomingAssessments = assessments
    .filter((item) => !item.date || new Date(item.date).getTime() >= now.getTime() - 86400000)
    .sort((a, b) => (a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER) - (b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER));

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
  }

  function goNext() {
    if (quizIndex < sessionIds.length - 1) {
      setQuizIndex((index) => index + 1);
    }
  }

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
                      href={item.venue.mapUrl ?? course.canvas}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.venue.kind === "online" ? "Canvas" : copy.navigate} →
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
                            <div><b>1</b><span><small>Canvas</small><strong>{pick(course.short)}</strong></span></div>
                            <div><b>2</b><span><small>{copy.stepRoom}</small><strong>{item.location}</strong></span></div>
                            <div><b>3</b><span><small>{lang === "zh" ? "提前进入" : "Join early"}</small><strong>{lang === "zh" ? "提前 5 分钟测试声音" : "Test audio 5 minutes early"}</strong></span></div>
                          </div>
                        )}
                        <a href={item.venue.mapUrl ?? course.canvas} target="_blank" rel="noreferrer">
                          {item.venue.kind === "online" ? copy.openCanvasClass : copy.navigate} <span>→</span>
                        </a>
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
                <p className="eyebrow">PREP → CLASS → PRACTICE</p>
                <h2>W{selectedWeek} · {semesterWeek.range[lang]}</h2>
              </div>
            </div>
            <div className="weekly-course-list">
              {semesterWeek.plans.map((plan) => {
                const course = courses.find((entry) => entry.id === plan.courseId) ?? courses[0];
                const preKey = `w${selectedWeek}-${plan.courseId}-pre`;
                const postKey = `w${selectedWeek}-${plan.courseId}-post`;
                const outputKey = `w${selectedWeek}-${plan.courseId}-output`;
                const noteKey = `w${selectedWeek}-${plan.courseId}`;
                return (
                  <article key={plan.courseId} className="weekly-course-card" style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                    <header>
                      <span className="course-mark">{course.mark}</span>
                      <div>
                        <small>{course.code} · {pick(course.short)}</small>
                        <h3>{plan.topic[lang]}</h3>
                      </div>
                    </header>
                    <label className={planChecks[preKey] ? "plan-task checked" : "plan-task"}>
                      <input type="checkbox" checked={Boolean(planChecks[preKey])} onChange={() => setPlanChecks((items) => ({ ...items, [preKey]: !items[preKey] }))} />
                      <span><strong>{copy.preparation}</strong>{plan.prepare[lang]}</span>
                    </label>
                    <label className={planChecks[postKey] ? "plan-task checked" : "plan-task"}>
                      <input type="checkbox" checked={Boolean(planChecks[postKey])} onChange={() => setPlanChecks((items) => ({ ...items, [postKey]: !items[postKey] }))} />
                      <span><strong>{copy.afterClass}</strong>{plan.after[lang]}</span>
                    </label>
                    <label className={planChecks[outputKey] ? "plan-task checked" : "plan-task"}>
                      <input type="checkbox" checked={Boolean(planChecks[outputKey])} onChange={() => setPlanChecks((items) => ({ ...items, [outputKey]: !items[outputKey] }))} />
                      <span><strong>{copy.weeklyOutcome}</strong>{plan.outcome[lang]}</span>
                    </label>
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
                onClick={() => setSelectedId(course.id)}
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
            <div className="topic-strip">
              {selected.topics.map((topic, index) => (
                <span key={topic.en} className={index === 0 ? "current-topic" : ""}>
                  {index + 1}. {pick(topic)}
                </span>
              ))}
            </div>
            <div className="lesson-card">
              <p className="eyebrow">{copy.micro}</p>
              <h3>{pick(selected.lesson.title)}</h3>
              <p>{pick(selected.lesson.intro)}</p>
              <ul>{selected.lesson.points.map((point) => <li key={point.en}>{pick(point)}</li>)}</ul>
              <pre>{selected.lesson.formula}</pre>
              <div className="example-box"><strong>{copy.think}</strong><p>{pick(selected.lesson.example)}</p></div>
            </div>
            <div className="action-row">
              <button
                className={completed.includes(selected.id) ? "complete-button completed" : "complete-button"}
                onClick={() => markCourse(selected.id)}
              >
                {completed.includes(selected.id) ? copy.done : copy.markDone}
              </button>
              <a href={selected.canvas} target="_blank" rel="noreferrer">{copy.canvas}</a>
            </div>
          </article>
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
                        <small>10 {lang === "zh" ? "题" : "Q"}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {!quizComplete && currentQuestion && (() => {
            const course = courses.find((item) => item.id === currentQuestion.courseId) ?? courses[0];
            return (
              <article className="quiz-card quiz-player" style={{ "--accent": course.accent, "--soft": course.soft } as React.CSSProperties}>
                <div className="quiz-progress-row">
                  <div>
                    <p>{course.code} · {pick(course.short)}</p>
                    <strong>{copy.question} {quizIndex + 1} / {sessionIds.length}</strong>
                  </div>
                  <span>{correctCount}/{Object.keys(answers).length || 0}</span>
                </div>
                <div className="quiz-progress-track"><span style={{ width: `${((quizIndex + 1) / sessionIds.length) * 100}%` }} /></div>
                <h3>{pick(currentQuestion.question)}</h3>
                <div className="options">
                  {currentQuestion.options.map((option, index) => {
                    let state = "";
                    if (answeredCurrent !== undefined && index === currentQuestion.answer) state = "correct";
                    else if (answeredCurrent === index) state = "wrong";
                    return (
                      <button
                        key={option.en}
                        className={state}
                        disabled={answeredCurrent !== undefined}
                        onClick={() => setAnswers((items) => ({ ...items, [currentQuestion.id]: index }))}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>{pick(option)}
                      </button>
                    );
                  })}
                </div>
                {answeredCurrent !== undefined && (
                  <>
                    <p className="explanation">
                      <strong>{answeredCurrent === currentQuestion.answer ? copy.correct : copy.review}</strong>
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
              <div className="result-actions">
                {wrongIds.length > 0 && <button onClick={() => startQuiz(quizFilter, wrongIds, quizTopic)}>{copy.retryWrong} ({wrongIds.length})</button>}
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
        <button className={view === "quiz" ? "active" : ""} onClick={() => setView("quiz")}><span>✓</span>{copy.navQuiz}</button>
      </nav>
    </main>
  );
}
