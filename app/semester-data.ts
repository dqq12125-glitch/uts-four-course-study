export type SemesterBi = { zh: string; en: string };

const bi = (zh: string, en: string): SemesterBi => ({ zh, en });

export type TimetableItem = {
  courseId: "math" | "eee" | "c" | "physics";
  activity: SemesterBi;
  day: number;
  dayLabel: SemesterBi;
  start: string;
  end: string;
  location: string;
  startsWeek?: number;
  teachingDates: SemesterBi;
  venue: {
    kind: "physical" | "online";
    building: SemesterBi;
    level?: SemesterBi;
    room?: SemesterBi;
    address?: string;
    mapUrl?: string;
    zoomUrl?: string;
  };
};

export type TimetableChoice = {
  id: string;
  status: "allocated" | "waitlist";
  activity: SemesterBi;
  day: number;
  dayLabel: SemesterBi;
  start: string;
  end: string;
  location: string;
  startsWeek?: number;
  note: SemesterBi;
  venue?: TimetableItem["venue"];
};

export type TimetableChoiceGroup = {
  id: string;
  courseId: TimetableItem["courseId"];
  activityGroup: string;
  title: SemesterBi;
  checkedAt: SemesterBi;
  choices: TimetableChoice[];
};

export type WeeklyCoursePlan = {
  courseId: TimetableItem["courseId"];
  topicId: string;
  topic: SemesterBi;
  prepare: SemesterBi;
  after: SemesterBi;
  outcome: SemesterBi;
};

export type SemesterWeek = {
  week: number;
  range: SemesterBi;
  start: string;
  end: string;
  plans: WeeklyCoursePlan[];
};

export type Assessment = {
  id: string;
  courseId: TimetableItem["courseId"];
  title: SemesterBi;
  date?: string;
  displayDate: SemesterBi;
  weight: string;
  note: SemesterBi;
  canvas: string;
  milestone?: boolean;
  submissionDue?: boolean;
};

export const timetable: TimetableItem[] = [
  {
    courseId: "physics", activity: bi("实践课 Prc1", "Practical Prc1"), day: 1, dayLabel: bi("周一", "Monday"), start: "17:00", end: "20:00", location: "CB04.03.551",
    teachingDates: bi("7月27日–9月14日；9月28日–10月19日", "27 Jul–14 Sep; 28 Sep–19 Oct"),
    venue: { kind: "physical", building: bi("4号楼 · Science Building", "Building 4 · Science Building"), level: bi("3层", "Level 3"), room: bi("551室", "Room 551"), address: "745 Harris Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+4+745+Harris+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "physics", activity: bi("讲座 Lec1", "Lecture Lec1"), day: 2, dayLabel: bi("周二", "Tuesday"), start: "17:00", end: "18:00", location: "CB06.03.028",
    teachingDates: bi("7月28日–9月15日；9月29日–10月20日", "28 Jul–15 Sep; 29 Sep–20 Oct"),
    venue: { kind: "physical", building: bi("6号楼 · Peter Johnson Building", "Building 6 · Peter Johnson Building"), level: bi("3层", "Level 3"), room: bi("028室 · Guthrie Theatre", "Room 028 · Guthrie Theatre"), address: "702 Harris Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+6+702+Harris+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "eee", activity: bi("辅导课 Tut1 02", "Tutorial Tut1 02"), day: 2, dayLabel: bi("周二", "Tuesday"), start: "08:30", end: "10:30", location: "CB10.02.470",
    teachingDates: bi("8月4日–9月15日；9月29日–10月20日", "4 Aug–15 Sep; 29 Sep–20 Oct"),
    venue: { kind: "physical", building: bi("10号楼 · Building 10", "Building 10"), level: bi("2层", "Level 2"), room: bi("470室", "Room 470"), address: "235 Jones Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+10+235+Jones+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "eee", activity: bi("实验课 Lab1 01", "Laboratory Lab1 01"), day: 5, dayLabel: bi("周五", "Friday"), start: "15:00", end: "18:00", location: "CB11.11.402",
    teachingDates: bi("7月31日–9月18日；10月2日–10月23日", "31 Jul–18 Sep; 2 Oct–23 Oct"),
    venue: { kind: "physical", building: bi("11号楼 · Engineering & IT", "Building 11 · Engineering & IT"), level: bi("11层", "Level 11"), room: bi("402室", "Room 402"), address: "81 Broadway, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+11+81+Broadway+Ultimo+NSW+2007" },
  },
  {
    courseId: "eee", activity: bi("预录讲座 Rec1", "Prerecorded lecture Rec1"), day: 0, dayLabel: bi("周日", "Sunday"), start: "06:00", end: "07:00", location: "PRERECORDED.ACTIVITY026",
    teachingDates: bi("8月2日–9月20日；10月4日–10月25日", "2 Aug–20 Sep; 4 Oct–25 Oct"),
    venue: { kind: "online", building: bi("Canvas 预录内容", "Canvas prerecorded content"), room: bi("按周观看，不需到校", "Watch weekly; no campus room"), zoomUrl: "https://canvas.uts.edu.au/courses/41070/modules" },
  },
  {
    courseId: "c", activity: bi("在线课 Olr1", "Online Olr1"), day: 3, dayLabel: bi("周三", "Wednesday"), start: "15:00", end: "17:00", location: "ONLINE060",
    teachingDates: bi("7月29日–9月16日；9月30日–10月21日", "29 Jul–16 Sep; 30 Sep–21 Oct"),
    venue: { kind: "online", building: bi("线上教室", "Online classroom"), room: bi("ONLINE060 · 从 Canvas 进入", "ONLINE060 · Join from Canvas"), zoomUrl: "https://canvas.uts.edu.au/courses/41072/external_tools/3695" },
  },
  {
    courseId: "math", activity: bi("工作坊 Wrk1", "Workshop Wrk1"), day: 3, dayLabel: bi("周三", "Wednesday"), start: "17:00", end: "19:00", location: "ONLINE058",
    teachingDates: bi("7月29日–9月16日；9月30日–10月21日", "29 Jul–16 Sep; 30 Sep–21 Oct"),
    venue: { kind: "online", building: bi("线上教室", "Online classroom"), room: bi("ONLINE058 · 从 Canvas 进入", "ONLINE058 · Join from Canvas"), zoomUrl: "https://canvas.uts.edu.au/courses/40822/modules/items/2812965" },
  },
  {
    courseId: "c", activity: bi("机房课 Cmp1 03", "Computer lab Cmp1 03"), day: 5, dayLabel: bi("周五", "Friday"), start: "10:00", end: "12:00", location: "CB11.B1.100", startsWeek: 2,
    teachingDates: bi("8月7日–9月18日；10月2日–10月23日", "7 Aug–18 Sep; 2 Oct–23 Oct"),
    venue: { kind: "physical", building: bi("11号楼 · Engineering & IT", "Building 11 · Engineering & IT"), level: bi("地下1层", "Basement 1"), room: bi("100室", "Room 100"), address: "81 Broadway, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+11+81+Broadway+Ultimo+NSW+2007" },
  },
  {
    courseId: "math", activity: bi("辅导课 Tut1 09", "Tutorial Tut1 09"), day: 2, dayLabel: bi("周二", "Tuesday"), start: "13:00", end: "15:00", location: "CB10.03.460", startsWeek: 2,
    teachingDates: bi("8月4日–9月15日；9月29日–10月20日", "4 Aug–15 Sep; 29 Sep–20 Oct"),
    venue: { kind: "physical", building: bi("10号楼 · Building 10", "Building 10"), level: bi("3层", "Level 3"), room: bi("460室", "Room 460"), address: "235 Jones Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+10+235+Jones+Street+Ultimo+NSW+2007" },
  },
];

export const timetableChoiceGroups: TimetableChoiceGroup[] = [
  {
    id: "math-tutorial",
    courseId: "math",
    activityGroup: "Tut1",
    title: bi("33130 数学辅导课", "33130 Mathematics tutorial"),
    checkedAt: bi(
      "UTS Allocate+ · 2026年8月6日核对",
      "UTS Allocate+ · checked 6 August 2026",
    ),
    choices: [
      {
        id: "math-tut1-09",
        status: "allocated",
        activity: bi("辅导课 Tut1 09", "Tutorial Tut1 09"),
        day: 2,
        dayLabel: bi("周二", "Tuesday"),
        start: "13:00",
        end: "15:00",
        location: "CB10.03.460",
        startsWeek: 2,
        note: bi(
          "UTS 当前正式分配。Allocate+ 显示 9 个活动已分配、0 个活动候补；原周二 11:00 方案已不在候补队列。",
          "Currently allocated by UTS. Allocate+ shows 9 allocated activities and 0 pending; the former Tuesday 11:00 option is no longer waitlisted.",
        ),
      },
    ],
  },
];

const mathTopics = [
  bi("向量与三维空间：点积和投影", "Vectors & 3D space: dot products and projections"),
  bi("向量续：叉积和平面", "Vectors continued: cross products and planes"),
  bi("矩阵与线性代数", "Matrices and linear algebra"),
  bi("微分、双曲函数与牛顿法", "Differentiation, hyperbolic functions & Newton’s method"),
  bi("反函数、隐函数与隐式微分", "Inverse and implicit functions; implicit differentiation"),
  bi("积分概念、黎曼和与基础方法", "Integration, Riemann sums and basic methods"),
  bi("换元、分部积分与部分分式", "Substitution, integration by parts & partial fractions"),
  bi("复数", "Complex numbers"),
  bi("一阶微分方程", "First-order differential equations"),
  bi("二阶微分方程与幂级数（一）", "Second-order DEs & power series I"),
  bi("综合复习与答疑", "Revision and Q&A"),
  bi("二阶微分方程与幂级数（二）", "Second-order DEs & power series II"),
];

const cTopics = [
  bi("编程基础与 C 概览", "Programming fundamentals and overview of C"),
  bi("数据类型、运算符和简单函数", "Data types, operators and simple functions"),
  bi("选择与循环控制结构", "Selection and loop statements"),
  bi("数组与字符串", "Arrays and strings"),
  bi("结构体与文件处理", "Structures and file processing"),
  bi("指针与动态内存（一）", "Pointers and dynamic memory I"),
  bi("指针与动态内存（二）", "Pointers and dynamic memory II"),
  bi("大型程序组织与小组项目", "Programming in the large and group project"),
  bi("交叉开发与命令行参数", "Cross development and command-line parsing"),
  bi("从 C 走向 C++", "Moving from C to C++"),
  bi("小组项目实现与测试", "Group project implementation and testing"),
  bi("复习、报告与代码提交", "Revision, report and source-code submission"),
];

const physicsTopics = [
  bi("运动学（一）与测量不确定度", "Kinematics I and measurement uncertainty"),
  bi("运动学（二）与运动学工作坊", "Kinematics II and Kinematics I workshop"),
  bi("动力学（一）与抛体实验", "Dynamics I and projectile-motion experiment"),
  bi("动力学（二）", "Dynamics II"),
  bi("转动与静力学", "Rotation and statics"),
  bi("热学（一）", "Thermal physics I"),
  bi("热学（二）与课堂测试 1", "Thermal physics II and In-Class Test 1"),
  bi("电学、滚动运动实验", "Electricity and rolling-motion experiment"),
  bi("振动与热学实验", "Oscillations and thermal experiment"),
  bi("波动力学", "Wave mechanics"),
  bi("流体力学与课堂测试 2", "Fluid mechanics and In-Class Test 2"),
  bi("流体力学、直流电路实验", "Fluid mechanics and DC-circuit experiment"),
];

const eeeTopics = [
  bi("电荷、电流、电压、电阻、欧姆定律与功率", "Charge, current, voltage, resistance, Ohm's law and power"),
  bi("串并联、电流定律 KCL 与电压定律 KVL", "Series/parallel circuits, KCL and KVL"),
  bi("网孔电流法与节点电压法", "Mesh-current and node-voltage analysis"),
  bi("叠加原理、源变换、戴维南与诺顿等效", "Superposition, source transformations, Thevenin and Norton equivalents"),
  bi("电容、电容连接与储能", "Capacitors, equivalent capacitance and stored energy"),
  bi("电感、电感连接与储能", "Inductors, equivalent inductance and stored energy"),
  bi("电容和电感的一阶瞬态响应", "First-order transients of capacitors and inductors"),
  bi("二极管与整流电路", "Diodes and rectifier circuits"),
  bi("交流正弦波、RMS 与相位", "AC sinusoids, RMS and phase"),
  bi("相量、复阻抗与交流功率", "Phasors, complex impedance and AC power"),
  bi("交流电路综合分析", "Integrated AC circuit analysis"),
  bi("期末复习：DC、瞬态、二极管与 AC", "Final review: DC, transients, diodes and AC"),
];

// The teaching timetable has 12 weeks, while the in-app course library groups
// closely related weeks into broader knowledge points. Keep this mapping
// explicit so a weekly preparation card never opens an unrelated quiz.
const weeklyTopicIds: Record<TimetableItem["courseId"], readonly string[]> = {
  math: [
    "math-0", "math-0", "math-1", "math-2", "math-3", "math-4",
    "math-4", "math-5", "math-6", "math-6", "math-6", "math-6",
  ],
  eee: [
    "eee-0", "eee-1", "eee-2", "eee-3", "eee-4", "eee-5",
    "eee-5", "eee-6", "eee-7", "eee-7", "eee-7", "eee-7",
  ],
  c: [
    "c-0", "c-1", "c-2", "c-3", "c-4", "c-5",
    "c-5", "c-6", "c-7", "c-6", "c-6", "c-6",
  ],
  physics: [
    "physics-0", "physics-0", "physics-3", "physics-3", "physics-3", "physics-6",
    "physics-6", "physics-7", "physics-8", "physics-8", "physics-9", "physics-9",
  ],
};

const weekRanges = [
  ["27 Jul–2 Aug", "2026-07-27", "2026-08-02"],
  ["3–9 Aug", "2026-08-03", "2026-08-09"],
  ["10–16 Aug", "2026-08-10", "2026-08-16"],
  ["17–23 Aug", "2026-08-17", "2026-08-23"],
  ["24–30 Aug", "2026-08-24", "2026-08-30"],
  ["31 Aug–6 Sep", "2026-08-31", "2026-09-06"],
  ["7–13 Sep", "2026-09-07", "2026-09-13"],
  ["14–20 Sep", "2026-09-14", "2026-09-20"],
  ["28 Sep–4 Oct", "2026-09-28", "2026-10-04"],
  ["5–11 Oct", "2026-10-05", "2026-10-11"],
  ["12–18 Oct", "2026-10-12", "2026-10-18"],
  ["19–25 Oct", "2026-10-19", "2026-10-25"],
] as const;

const zhWeekRanges = [
  "7月27日–8月2日",
  "8月3–9日",
  "8月10–16日",
  "8月17–23日",
  "8月24–30日",
  "8月31日–9月6日",
  "9月7–13日",
  "9月14–20日",
  "9月28日–10月4日",
  "10月5–11日",
  "10月12–18日",
  "10月19–25日",
] as const;

const makePlan = (
  courseId: WeeklyCoursePlan["courseId"],
  topicId: string,
  topic: SemesterBi,
  week: number,
): WeeklyCoursePlan => {
  if (courseId === "eee") {
    return {
      courseId,
      topicId,
      topic,
      prepare: bi("先看本周 Canvas 讲座并整理公式、方向约定和单位；实验前读完 lab instruction。", "Watch the Canvas lecture first and organise formulas, reference directions and units; read the lab instructions before class."),
      after: bi("重画课堂电路并独立重算；完成 10 题，逐项检查 KCL/KVL、极性、单位和功率守恒。", "Redraw and independently re-solve the class circuits; do 10 questions and check KCL/KVL, polarity, units and power balance."),
      outcome: bi(week >= 8 ? "能从波形或电路图选择相量、阻抗或二极管模型并完整求解。" : "能从电路图写出方程、计算结果并用物理意义核对。", week >= 8 ? "Choose an appropriate phasor, impedance or diode model from a waveform/circuit and solve it fully." : "Translate a circuit into equations, calculate it and verify the result physically."),
    };
  }
  if (courseId === "c") {
    return {
      courseId,
      topicId,
      topic,
      prepare: bi("先读对应章节并手写 1 个最小程序；机房课前尝试 lab 任务。", "Read the listed chapter and hand-write one minimal program; attempt the lab before class."),
      after: bi("重写课堂代码，不复制粘贴；完成 10 题并把错误代码加入调试日志。", "Rebuild the class code without copy-paste; do 10 questions and add failures to your debug log."),
      outcome: bi(week >= 8 ? "把本周功能合并进小组项目，并留下 commit/版本记录。" : "能从空文件独立写出本周核心语法。", week >= 8 ? "Merge this week’s feature into the group project with a commit/version record." : "Write the week’s core syntax independently from a blank file."),
    };
  }
  if (courseId === "math") {
    return {
      courseId,
      topicId,
      topic,
      prepare: bi("工作坊前看例题并做 2 道基础题；标出不会的代数步骤。", "Before the workshop, review examples and attempt two basics; flag unclear algebra steps."),
      after: bi("辅导课后 24 小时内完成 10 题；错题隔天不看答案重做。", "Within 24 hours of the tutorial, do 10 questions; redo errors the next day without notes."),
      outcome: bi("做出一页公式—条件—典型错误卡，并能口头解释一道题。", "Create a one-page formula–conditions–common-errors card and explain one problem aloud."),
    };
  }
  return {
    courseId,
    topicId,
    topic,
    prepare: bi("课前完成 Canvas 概念检查，写出已知量、单位和模型假设。", "Complete the Canvas concept check; list knowns, units and model assumptions."),
    after: bi("实践课后整理数据/步骤，完成 10 题，并检查量纲和正负号。", "After class, clean up data/steps, do 10 questions and check dimensions and signs."),
    outcome: bi("能从图示建立模型，并说明公式为什么适用。", "Build a model from a diagram and justify why the equation applies."),
  };
};

export const semesterWeeks: SemesterWeek[] = weekRanges.map(([range, start, end], index) => {
  const week = index + 1;
  return {
    week,
    range: bi(zhWeekRanges[index], range),
    start,
    end,
    plans: [
      makePlan("math", weeklyTopicIds.math[index], mathTopics[index], week),
      makePlan("eee", weeklyTopicIds.eee[index], eeeTopics[index], week),
      makePlan("c", weeklyTopicIds.c[index], cTopics[index], week),
      makePlan("physics", weeklyTopicIds.physics[index], physicsTopics[index], week),
    ],
  };
});

export const assessments: Assessment[] = [
  { id: "math-s1", courseId: "math", title: bi("技能测试 1（在线）", "Skills Test 1 (online)"), date: "2026-08-02T23:59:00+10:00", displayDate: bi("8月2日 23:59", "2 Aug, 23:59"), weight: "10%", note: bi("假定知识；Canvas 在线完成", "Assumed knowledge; complete in Canvas"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments", submissionDue: true },
  { id: "eee-practice", courseId: "eee", title: bi("每周 Tutorial Practice", "Weekly Tutorial Practice"), displayDate: bi("每周辅导课（第7次除外）", "Each tutorial except Tutorial 7"), weight: "15%", note: bi("课堂完成；用于持续检查电路分析步骤", "Completed in class; continuous checks of circuit-analysis method"), canvas: "https://canvas.uts.edu.au/courses/41070/assignments", milestone: true },
  { id: "c-q1", courseId: "c", title: bi("Quiz 01（两部分）", "Quiz 01 (two parts)"), date: "2026-08-16T23:59:00+10:00", displayDate: bi("8月16日 23:59", "16 Aug, 23:59"), weight: "20%组内", note: bi("Quiz 1–5 合计占 20%", "Quizzes 1–5 total 20%"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "math-s2", courseId: "math", title: bi("技能测试 2（辅导课）", "Skills Test 2 (tutorial)"), date: "2026-08-21T15:00:00+10:00", displayDate: bi("8月21日 15:00", "21 Aug, 15:00"), weight: "10%", note: bi("向量、点积、叉积和平面", "Vectors, dot/cross products and planes"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-q2", courseId: "c", title: bi("Quiz 02（两部分）", "Quiz 02 (two parts)"), date: "2026-08-23T23:59:00+10:00", displayDate: bi("8月23日 23:59", "23 Aug, 23:59"), weight: "20%组内", note: bi("控制结构与循环", "Control and loop statements"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "c-q3", courseId: "c", title: bi("Quiz 03（两部分）", "Quiz 03 (two parts)"), date: "2026-08-30T23:59:00+10:00", displayDate: bi("8月30日 23:59", "30 Aug, 23:59"), weight: "20%组内", note: bi("数组与字符串", "Arrays and strings"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "math-s3", courseId: "math", title: bi("技能测试 3（辅导课）", "Skills Test 3 (tutorial)"), date: "2026-09-04T15:00:00+10:00", displayDate: bi("9月4日 15:00", "4 Sep, 15:00"), weight: "10%", note: bi("矩阵、微分、双曲函数与牛顿法", "Matrices, differentiation, hyperbolic functions and Newton’s method"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-q4", courseId: "c", title: bi("Quiz 04（两部分）", "Quiz 04 (two parts)"), date: "2026-09-06T23:59:00+10:00", displayDate: bi("9月6日 23:59", "6 Sep, 23:59"), weight: "20%组内", note: bi("结构体与文件", "Structures and files"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "eee-lab1", courseId: "eee", title: bi("实验测试 1", "Lab Test 1"), date: "2026-09-11T15:00:00+10:00", displayDate: bi("第7周实验课 · 9月11日", "Week 7 laboratory · 11 Sep"), weight: "15%（实验测试合计30%）", note: bi("课堂完成；覆盖前半学期实验技能", "Completed in class; first-half laboratory skills"), canvas: "https://canvas.uts.edu.au/courses/41070/assignments" },
  { id: "eee-mid", courseId: "eee", title: bi("期中测验", "Mid-term Quiz"), date: "2026-09-15T08:30:00+10:00", displayDate: bi("第8周辅导课 · 9月15日", "Week 8 tutorial · 15 Sep"), weight: "15%", note: bi("Tutorial 7 课堂测验；重点复习 DC 电路、KCL/KVL、等效电路与暂态基础", "In Tutorial 7; revise DC circuits, KCL/KVL, equivalents and transient foundations"), canvas: "https://canvas.uts.edu.au/courses/41070/assignments" },
  { id: "physics-t1", courseId: "physics", title: bi("课堂测试 1", "In-Class Test 1"), date: "2026-09-07T17:00:00+10:00", displayDate: bi("9月7日 17:00", "7 Sep, 17:00"), weight: "25%", note: bi("实践课内；覆盖第1–5周", "In practical class; covers Weeks 1–5"), canvas: "https://canvas.uts.edu.au/courses/41382/assignments" },
  { id: "c-q5", courseId: "c", title: bi("Quiz 05（两部分）", "Quiz 05 (two parts)"), date: "2026-09-13T23:59:00+10:00", displayDate: bi("9月13日 23:59", "13 Sep, 23:59"), weight: "20%组内", note: bi("指针与动态内存", "Pointers and dynamic memory"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "math-s4", courseId: "math", title: bi("技能测试 4（辅导课）", "Skills Test 4 (tutorial)"), date: "2026-09-18T15:00:00+10:00", displayDate: bi("9月18日 15:00", "18 Sep, 15:00"), weight: "10%", note: bi("隐函数、隐式微分、积分概念与黎曼和", "Implicit functions/differentiation, integration concepts and Riemann sums"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-a2", courseId: "c", title: bi("Assessment 2：个人编程作业", "Assessment 2: Programming assignment"), date: "2026-09-20T23:59:00+10:00", displayDate: bi("9月20日 23:59", "20 Sep, 23:59"), weight: "20%", note: bi("功能 15 分 + 代码风格 5 分", "Functionality 15 pts + coding style 5 pts"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "math-s5", courseId: "math", title: bi("技能测试 5（辅导课）", "Skills Test 5 (tutorial)"), date: "2026-10-02T15:00:00+10:00", displayDate: bi("10月2日 15:00", "2 Oct, 15:00"), weight: "10%", note: bi("积分方法", "Methods of integration"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-check", courseId: "c", title: bi("小组项目 Checkpoint 1", "Group project Checkpoint 1"), date: "2026-10-04T23:59:00+11:00", displayDate: bi("10月4日 23:59", "4 Oct, 23:59"), weight: "里程碑", note: bi("预览上传，不计分但必须按时检查", "Preview upload; ungraded but important"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", milestone: true, submissionDue: true },
  { id: "physics-t2", courseId: "physics", title: bi("课堂测试 2", "In-Class Test 2"), date: "2026-10-12T17:00:00+11:00", displayDate: bi("10月12日 17:00", "12 Oct, 17:00"), weight: "25%", note: bi("实践课内；覆盖第6–9周", "In practical class; covers Weeks 6–9"), canvas: "https://canvas.uts.edu.au/courses/41382/assignments" },
  { id: "eee-lab2", courseId: "eee", title: bi("实验测试 2", "Lab Test 2"), date: "2026-10-23T15:00:00+11:00", displayDate: bi("第12周实验课 · 10月23日", "Week 12 laboratory · 23 Oct"), weight: "15%（实验测试合计30%）", note: bi("课堂完成；覆盖二极管、交流与实验分析", "Completed in class; diodes, AC and laboratory analysis"), canvas: "https://canvas.uts.edu.au/courses/41070/assignments" },
  { id: "math-final", courseId: "math", title: bi("期末考试（辅导课）", "Final exam (tutorial)"), date: "2026-10-23T15:00:00+11:00", displayDate: bi("10月23日 15:00", "23 Oct, 15:00"), weight: "40%", note: bi("90 分钟闭卷；可带一张双面手写 A4", "90-minute closed book; one double-sided handwritten A4 sheet"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "math-s6", courseId: "math", title: bi("技能测试 6（在线）", "Skills Test 6 (online)"), date: "2026-10-30T23:59:00+11:00", displayDate: bi("10月30日 23:59", "30 Oct, 23:59"), weight: "10%", note: bi("10月26日 09:00 开放", "Opens 26 Oct at 09:00"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments", submissionDue: true },
  { id: "c-group", courseId: "c", title: bi("Assessment 3：小组项目", "Assessment 3: Group project"), date: "2026-11-01T23:59:00+11:00", displayDate: bi("11月1日 23:59", "1 Nov, 23:59"), weight: "30%", note: bi("报告与 C 源代码", "Report and C source code"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "c-sparkplus", courseId: "c", title: bi("Assessment 3：SparkPlus 小组互评", "Assessment 3: SparkPlus peer review"), date: "2026-11-08T23:59:00+11:00", displayDate: bi("11月8日 23:59", "8 Nov, 23:59"), weight: "Assessment 3 内", note: bi("Canvas 列出的团队贡献互评截止项", "Team-contribution peer review listed in Canvas"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", submissionDue: true },
  { id: "c-exam", courseId: "c", title: bi("Assessment 4：期末在线考试", "Assessment 4: Final online exam"), displayDate: bi("日期待 Canvas/考试安排公布", "Date pending Canvas/exam timetable"), weight: "30%", note: bi("每周累计复习，不等日期公布再开始", "Revise cumulatively; do not wait for the date"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "eee-final", courseId: "eee", title: bi("期末考试", "Final Exam"), displayDate: bi("日期待 UTS 考试安排公布", "Date pending UTS exam timetable"), weight: "40%", note: bi("综合 DC 电路、暂态、二极管、相量与交流电路", "Comprehensive DC circuits, transients, diodes, phasors and AC circuits"), canvas: "https://canvas.uts.edu.au/courses/41070/assignments" },
];

export const semesterBreak = bi("9月21–27日：期中休息周，无固定课", "21–27 Sep: mid-semester break, no scheduled classes");
