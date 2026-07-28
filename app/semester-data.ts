export type SemesterBi = { zh: string; en: string };

const bi = (zh: string, en: string): SemesterBi => ({ zh, en });

export type TimetableItem = {
  courseId: "math" | "iep" | "c" | "physics";
  activity: SemesterBi;
  day: number;
  dayLabel: SemesterBi;
  start: string;
  end: string;
  location: string;
  startsWeek?: number;
  venue: {
    kind: "physical" | "online";
    building: SemesterBi;
    level?: SemesterBi;
    room?: SemesterBi;
    address?: string;
    mapUrl?: string;
  };
};

export type WeeklyCoursePlan = {
  courseId: TimetableItem["courseId"];
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
};

export const timetable: TimetableItem[] = [
  {
    courseId: "physics", activity: bi("实践课 Prc1", "Practical Prc1"), day: 1, dayLabel: bi("周一", "Monday"), start: "17:00", end: "20:00", location: "CB04.03.551",
    venue: { kind: "physical", building: bi("4号楼 · Science Building", "Building 4 · Science Building"), level: bi("3层", "Level 3"), room: bi("551室", "Room 551"), address: "745 Harris Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+4+745+Harris+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "physics", activity: bi("讲座 Lec1", "Lecture Lec1"), day: 2, dayLabel: bi("周二", "Tuesday"), start: "17:00", end: "18:00", location: "CB06.03.028",
    venue: { kind: "physical", building: bi("6号楼 · Peter Johnson Building", "Building 6 · Peter Johnson Building"), level: bi("3层", "Level 3"), room: bi("028室 · Guthrie Theatre", "Room 028 · Guthrie Theatre"), address: "702 Harris Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+6+702+Harris+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "iep", activity: bi("辅导课 Tut1", "Tutorial Tut1"), day: 3, dayLabel: bi("周三", "Wednesday"), start: "11:00", end: "14:00", location: "CB06.06.103",
    venue: { kind: "physical", building: bi("6号楼 · Peter Johnson Building", "Building 6 · Peter Johnson Building"), level: bi("6层", "Level 6"), room: bi("103室", "Room 103"), address: "702 Harris Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+6+702+Harris+Street+Ultimo+NSW+2007" },
  },
  {
    courseId: "c", activity: bi("在线课 Olr1", "Online Olr1"), day: 3, dayLabel: bi("周三", "Wednesday"), start: "15:00", end: "17:00", location: "ONLINE060",
    venue: { kind: "online", building: bi("线上教室", "Online classroom"), room: bi("ONLINE060 · 从 Canvas 进入", "ONLINE060 · Join from Canvas") },
  },
  {
    courseId: "math", activity: bi("工作坊 Wrk1", "Workshop Wrk1"), day: 3, dayLabel: bi("周三", "Wednesday"), start: "17:00", end: "19:00", location: "ONLINE058",
    venue: { kind: "online", building: bi("线上教室", "Online classroom"), room: bi("ONLINE058 · 从 Canvas 进入", "ONLINE058 · Join from Canvas") },
  },
  {
    courseId: "c", activity: bi("机房课 Cmp1", "Computer lab Cmp1"), day: 5, dayLabel: bi("周五", "Friday"), start: "08:00", end: "10:00", location: "CB11.B1.100", startsWeek: 2,
    venue: { kind: "physical", building: bi("11号楼 · Engineering & IT", "Building 11 · Engineering & IT"), level: bi("地下1层", "Basement 1"), room: bi("100室", "Room 100"), address: "81 Broadway, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+11+81+Broadway+Ultimo+NSW+2007" },
  },
  {
    courseId: "math", activity: bi("辅导课 Tut1", "Tutorial Tut1"), day: 5, dayLabel: bi("周五", "Friday"), start: "15:00", end: "17:00", location: "CB10.03.470", startsWeek: 2,
    venue: { kind: "physical", building: bi("10号楼 · Building 10", "Building 10"), level: bi("3层", "Level 3"), room: bi("470室", "Room 470"), address: "235 Jones Street, Ultimo NSW 2007", mapUrl: "https://www.google.com/maps/search/?api=1&query=UTS+Building+10+235+Jones+Street+Ultimo+NSW+2007" },
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

const iepTopics = [
  bi("工程、设计、团队与 Country", "Engineering, design, teamwork and Country"),
  bi("EWB 情境、利益相关者与问题定义", "EWB context, stakeholders and problem framing"),
  bi("思维导图展示与研究范围", "Mindmap presentation and research scope"),
  bi("桌面研究：证据、APA 7 与论证", "Desktop study: evidence, APA 7 and argument"),
  bi("桌面研究收尾与团队贡献记录", "Desktop-study completion and contribution records"),
  bi("设计标准、创意生成与方案筛选", "Design criteria, ideation and concept selection"),
  bi("设计评审展示与同伴反馈", "Design review presentation and peer feedback"),
  bi("原型、测试和迭代", "Prototyping, testing and iteration"),
  bi("设计提案：证据、风险与可行性", "Design proposal: evidence, risk and feasibility"),
  bi("设计提案展示", "Design proposal presentation"),
  bi("网站、过程文档与版本证据", "Website, process documentation and version evidence"),
  bi("最终交付、反思与同伴评价", "Final delivery, reflection and peer assessment"),
];

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
  topic: SemesterBi,
  week: number,
): WeeklyCoursePlan => {
  if (courseId === "iep") {
    return {
      courseId,
      topic,
      prepare: bi("完成 Canvas 本周 preparation；带着 2 条证据和 1 个问题进课堂。", "Complete the Canvas preparation; bring two pieces of evidence and one question."),
      after: bi("当天更新过程文档、会议决定和个人贡献记录；补齐 APA 7 引用。", "Update process documentation, decisions and your contribution log that day; fix APA 7 references."),
      outcome: bi("产出一个可交付证据：研究卡、决策矩阵、原型记录或展示页。", "Produce one assessable artefact: a research card, decision matrix, prototype record or slide."),
    };
  }
  if (courseId === "c") {
    return {
      courseId,
      topic,
      prepare: bi("先读对应章节并手写 1 个最小程序；机房课前尝试 lab 任务。", "Read the listed chapter and hand-write one minimal program; attempt the lab before class."),
      after: bi("重写课堂代码，不复制粘贴；完成 10 题并把错误代码加入调试日志。", "Rebuild the class code without copy-paste; do 10 questions and add failures to your debug log."),
      outcome: bi(week >= 8 ? "把本周功能合并进小组项目，并留下 commit/版本记录。" : "能从空文件独立写出本周核心语法。", week >= 8 ? "Merge this week’s feature into the group project with a commit/version record." : "Write the week’s core syntax independently from a blank file."),
    };
  }
  if (courseId === "math") {
    return {
      courseId,
      topic,
      prepare: bi("工作坊前看例题并做 2 道基础题；标出不会的代数步骤。", "Before the workshop, review examples and attempt two basics; flag unclear algebra steps."),
      after: bi("辅导课后 24 小时内完成 10 题；错题隔天不看答案重做。", "Within 24 hours of the tutorial, do 10 questions; redo errors the next day without notes."),
      outcome: bi("做出一页公式—条件—典型错误卡，并能口头解释一道题。", "Create a one-page formula–conditions–common-errors card and explain one problem aloud."),
    };
  }
  return {
    courseId,
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
      makePlan("math", mathTopics[index], week),
      makePlan("iep", iepTopics[index], week),
      makePlan("c", cTopics[index], week),
      makePlan("physics", physicsTopics[index], week),
    ],
  };
});

export const assessments: Assessment[] = [
  { id: "iep-opela", courseId: "iep", title: bi("OPELA", "OPELA"), date: "2026-07-31T23:59:00+10:00", displayDate: bi("7月31日 23:59", "31 Jul, 23:59"), weight: "0%", note: bi("入门必做任务", "Required setup task"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "math-s1", courseId: "math", title: bi("技能测试 1（在线）", "Skills Test 1 (online)"), date: "2026-08-02T23:59:00+10:00", displayDate: bi("8月2日 23:59", "2 Aug, 23:59"), weight: "10%", note: bi("假定知识；Canvas 在线完成", "Assumed knowledge; complete in Canvas"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "iep-team", courseId: "iep", title: bi("完成团队协作设置", "Set up for teamwork"), date: "2026-08-03T23:59:00+10:00", displayDate: bi("8月3日 23:59", "3 Aug, 23:59"), weight: "0%", note: bi("小组与版本工具设置", "Group and version-tool setup"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "iep-doc2", courseId: "iep", title: bi("过程文档 Week 2", "Process documentation Week 2"), date: "2026-08-07T23:59:00+10:00", displayDate: bi("8月7日 23:59", "7 Aug, 23:59"), weight: "Task E", note: bi("持续积累过程证据", "Build process evidence continuously"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments", milestone: true },
  { id: "iep-a", courseId: "iep", title: bi("Task A：思维导图展示", "Task A: Mindmap presentation"), date: "2026-08-10T23:59:00+10:00", displayDate: bi("8月10日 23:59", "10 Aug, 23:59"), weight: "5%", note: bi("小组提交，个人评分；第3周展示", "Group submission, individually assessed; Week 3 presentation"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "c-q1", courseId: "c", title: bi("Quiz 01（两部分）", "Quiz 01 (two parts)"), date: "2026-08-16T23:59:00+10:00", displayDate: bi("8月16日 23:59", "16 Aug, 23:59"), weight: "20%组内", note: bi("Quiz 1–5 合计占 20%", "Quizzes 1–5 total 20%"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "math-s2", courseId: "math", title: bi("技能测试 2（辅导课）", "Skills Test 2 (tutorial)"), date: "2026-08-21T15:00:00+10:00", displayDate: bi("8月21日 15:00", "21 Aug, 15:00"), weight: "10%", note: bi("向量、点积、叉积和平面", "Vectors, dot/cross products and planes"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-q2", courseId: "c", title: bi("Quiz 02（两部分）", "Quiz 02 (two parts)"), date: "2026-08-23T23:59:00+10:00", displayDate: bi("8月23日 23:59", "23 Aug, 23:59"), weight: "20%组内", note: bi("控制结构与循环", "Control and loop statements"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "iep-b", courseId: "iep", title: bi("Task B：桌面研究", "Task B: Desktop study"), date: "2026-08-28T23:59:00+10:00", displayDate: bi("8月28日 23:59", "28 Aug, 23:59"), weight: "20%", note: bi("个人任务；APA 7", "Individual task; APA 7"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "c-q3", courseId: "c", title: bi("Quiz 03（两部分）", "Quiz 03 (two parts)"), date: "2026-08-30T23:59:00+10:00", displayDate: bi("8月30日 23:59", "30 Aug, 23:59"), weight: "20%组内", note: bi("数组与字符串", "Arrays and strings"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "math-s3", courseId: "math", title: bi("技能测试 3（辅导课）", "Skills Test 3 (tutorial)"), date: "2026-09-04T15:00:00+10:00", displayDate: bi("9月4日 15:00", "4 Sep, 15:00"), weight: "10%", note: bi("矩阵、微分、双曲函数与牛顿法", "Matrices, differentiation, hyperbolic functions and Newton’s method"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-q4", courseId: "c", title: bi("Quiz 04（两部分）", "Quiz 04 (two parts)"), date: "2026-09-06T23:59:00+10:00", displayDate: bi("9月6日 23:59", "6 Sep, 23:59"), weight: "20%组内", note: bi("结构体与文件", "Structures and files"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "iep-c", courseId: "iep", title: bi("Task C：设计评审展示", "Task C: Design review presentation"), date: "2026-09-07T23:59:00+10:00", displayDate: bi("9月7日 23:59", "7 Sep, 23:59"), weight: "15%", note: bi("小组提交，个人评分；第7周课堂展示", "Group submission, individually assessed; Week 7 presentation"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "physics-t1", courseId: "physics", title: bi("课堂测试 1", "In-Class Test 1"), date: "2026-09-07T17:00:00+10:00", displayDate: bi("9月7日 17:00", "7 Sep, 17:00"), weight: "25%", note: bi("实践课内；覆盖第1–5周", "In practical class; covers Weeks 1–5"), canvas: "https://canvas.uts.edu.au/courses/41382/assignments" },
  { id: "c-q5", courseId: "c", title: bi("Quiz 05（两部分）", "Quiz 05 (two parts)"), date: "2026-09-13T23:59:00+10:00", displayDate: bi("9月13日 23:59", "13 Sep, 23:59"), weight: "20%组内", note: bi("指针与动态内存", "Pointers and dynamic memory"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "math-s4", courseId: "math", title: bi("技能测试 4（辅导课）", "Skills Test 4 (tutorial)"), date: "2026-09-18T15:00:00+10:00", displayDate: bi("9月18日 15:00", "18 Sep, 15:00"), weight: "10%", note: bi("隐函数、隐式微分、积分概念与黎曼和", "Implicit functions/differentiation, integration concepts and Riemann sums"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-a2", courseId: "c", title: bi("Assessment 2：个人编程作业", "Assessment 2: Programming assignment"), date: "2026-09-20T23:59:00+10:00", displayDate: bi("9月20日 23:59", "20 Sep, 23:59"), weight: "20%", note: bi("功能 15 分 + 代码风格 5 分", "Functionality 15 pts + coding style 5 pts"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "math-s5", courseId: "math", title: bi("技能测试 5（辅导课）", "Skills Test 5 (tutorial)"), date: "2026-10-02T15:00:00+10:00", displayDate: bi("10月2日 15:00", "2 Oct, 15:00"), weight: "10%", note: bi("积分方法", "Methods of integration"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-check", courseId: "c", title: bi("小组项目 Checkpoint 1", "Group project Checkpoint 1"), date: "2026-10-04T23:59:00+11:00", displayDate: bi("10月4日 23:59", "4 Oct, 23:59"), weight: "里程碑", note: bi("预览上传，不计分但必须按时检查", "Preview upload; ungraded but important"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments", milestone: true },
  { id: "iep-d", courseId: "iep", title: bi("Task D：设计提案展示", "Task D: Design proposal presentation"), date: "2026-10-05T23:59:00+11:00", displayDate: bi("10月5日 23:59", "5 Oct, 23:59"), weight: "30%", note: bi("小组提交，个人评分；第10周展示", "Group submission, individually assessed; Week 10 presentation"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "physics-t2", courseId: "physics", title: bi("课堂测试 2", "In-Class Test 2"), date: "2026-10-12T17:00:00+11:00", displayDate: bi("10月12日 17:00", "12 Oct, 17:00"), weight: "25%", note: bi("实践课内；覆盖第6–9周", "In practical class; covers Weeks 6–9"), canvas: "https://canvas.uts.edu.au/courses/41382/assignments" },
  { id: "iep-e", courseId: "iep", title: bi("Task E：网站 + 过程文档", "Task E: Website + process documentation"), date: "2026-10-23T23:59:00+11:00", displayDate: bi("10月23日 23:59", "23 Oct, 23:59"), weight: "30%", note: bi("网站 15% + 过程文档 15%；另完成 SPARK", "Website 15% + documentation 15%; complete SPARK too"), canvas: "https://canvas.uts.edu.au/courses/39889/assignments" },
  { id: "math-final", courseId: "math", title: bi("期末考试（辅导课）", "Final exam (tutorial)"), date: "2026-10-23T15:00:00+11:00", displayDate: bi("10月23日 15:00", "23 Oct, 15:00"), weight: "40%", note: bi("90 分钟闭卷；可带一张双面手写 A4", "90-minute closed book; one double-sided handwritten A4 sheet"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "math-s6", courseId: "math", title: bi("技能测试 6（在线）", "Skills Test 6 (online)"), date: "2026-10-30T23:59:00+11:00", displayDate: bi("10月30日 23:59", "30 Oct, 23:59"), weight: "10%", note: bi("10月26日 09:00 开放", "Opens 26 Oct at 09:00"), canvas: "https://canvas.uts.edu.au/courses/40822/assignments" },
  { id: "c-group", courseId: "c", title: bi("Assessment 3：小组项目", "Assessment 3: Group project"), date: "2026-11-01T23:59:00+11:00", displayDate: bi("11月1日 23:59", "1 Nov, 23:59"), weight: "30%", note: bi("报告与 C 源代码", "Report and C source code"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
  { id: "c-exam", courseId: "c", title: bi("Assessment 4：期末在线考试", "Assessment 4: Final online exam"), displayDate: bi("日期待 Canvas/考试安排公布", "Date pending Canvas/exam timetable"), weight: "30%", note: bi("每周累计复习，不等日期公布再开始", "Revise cumulatively; do not wait for the date"), canvas: "https://canvas.uts.edu.au/courses/41072/assignments" },
];

export const semesterBreak = bi("9月21–27日：期中休息周，无固定课", "21–27 Sep: mid-semester break, no scheduled classes");
