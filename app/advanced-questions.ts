type Bi = { zh: string; en: string };

const b = (zh: string, en: string): Bi => ({ zh, en });

export type QuestionVisual =
  | { kind: "bars"; title: Bi; labels: Bi[]; values: number[]; unit: string }
  | { kind: "table"; title: Bi; columns: Bi[]; rows: string[][] }
  | { kind: "code"; title: Bi; code: string };

export type AdvancedQuestion = {
  id: string;
  courseId: string;
  topicId: string;
  kind: "calculation" | "data";
  question: Bi;
  options: Bi[];
  answer: number;
  explanation: Bi;
  visual: QuestionVisual;
};

export const advancedQuestionBank: AdvancedQuestion[] = [
  {
    id: "math-0-9", courseId: "math", topicId: "math-0", kind: "calculation",
    question: b("无人机先沿向量 a=(6,8,0) m 飞行，再沿 b=(−2,1,2) m 飞行。它相对起点的直线距离是多少？", "A drone travels along a=(6,8,0) m and then b=(−2,1,2) m. What is its straight-line distance from the start?"),
    options: [b("√85 m ≈ 9.22 m", "√85 m ≈ 9.22 m"), b("√101 m ≈ 10.05 m", "√101 m ≈ 10.05 m"), b("11 m", "11 m"), b("√109 m ≈ 10.44 m", "√109 m ≈ 10.44 m")],
    answer: 1,
    visual: { kind: "table", title: b("两段位移分量", "Displacement components"), columns: [b("位移", "Vector"), b("x", "x"), b("y", "y"), b("z", "z")], rows: [["a", "6", "8", "0"], ["b", "−2", "1", "2"]] },
    explanation: b(
      "第 1 步｜识别目标\n题目问的是“相对起点的直线距离”，所以先求合位移，再求它的长度；不能把两段路程直接相加。\n\n第 2 步｜逐分量相加\na+b=(6−2, 8+1, 0+2)=(4,9,2) m。\n\n第 3 步｜使用三维向量长度\n|a+b|=√(4²+9²+2²)=√(16+81+4)=√101 m≈10.05 m。\n\n第 4 步｜验证\n结果应小于两段长度之和 10+3=13 m，10.05 m 合理。\n\n易错点\n√85 只计算了部分分量；11 是把分量直接相加，不是欧氏距离。",
      "Step 1 | Identify the target\n“Straight-line distance from the start” means find the resultant displacement first, then its magnitude. Do not simply add path lengths.\n\nStep 2 | Add components\na+b=(6−2, 8+1, 0+2)=(4,9,2) m.\n\nStep 3 | Use the 3D magnitude\n|a+b|=√(4²+9²+2²)=√101 m≈10.05 m.\n\nStep 4 | Check\nThe result should be below the total path length 10+3=13 m, so 10.05 m is plausible.\n\nCommon trap\n√85 omits a component; 11 adds components rather than finding Euclidean distance."
    ),
  },
  {
    id: "math-1-9", courseId: "math", topicId: "math-1", kind: "data",
    question: b("表中给出三个 2×2 矩阵的行列式计算结果。哪一行计算正确？", "The table shows determinant calculations for three 2×2 matrices. Which row is correct?"),
    options: [b("只有 A", "A only"), b("只有 B", "B only"), b("A 和 C", "A and C"), b("B 和 C", "B and C")],
    answer: 2,
    visual: { kind: "table", title: b("行列式检查表", "Determinant audit"), columns: [b("行", "Row"), b("矩阵", "Matrix"), b("报告值", "Reported det")], rows: [["A", "[[2,1],[3,4]]", "5"], ["B", "[[1,−2],[3,0]]", "−6"], ["C", "[[4,2],[2,1]]", "0"]] },
    explanation: b(
      "第 1 步｜写通用公式\n对 [[a,b],[c,d]]，det=ad−bc。顺序必须是“主对角线乘积减副对角线乘积”。\n\n第 2 步｜检查 A\n2×4−1×3=8−3=5，A 正确。\n\n第 3 步｜检查 B\n1×0−(−2×3)=0−(−6)=6，不是 −6，B 错误。\n\n第 4 步｜检查 C\n4×1−2×2=4−4=0，C 正确。\n\n结论\nA 和 C 正确，选 C。\n\n易错点\nB 的负号有两层：公式中的减号和元素 −2 的负号，负负得正。",
      "Step 1 | State the rule\nFor [[a,b],[c,d]], det=ad−bc: main-diagonal product minus off-diagonal product.\n\nStep 2 | Check A\n2×4−1×3=5, so A is correct.\n\nStep 3 | Check B\n1×0−(−2×3)=6, not −6, so B is wrong.\n\nStep 4 | Check C\n4×1−2×2=0, so C is correct.\n\nConclusion\nA and C are correct; choose C.\n\nCommon trap\nRow B contains two minus signs: the determinant subtraction and the negative matrix entry."
    ),
  },
  {
    id: "math-2-9", courseId: "math", topicId: "math-2", kind: "data",
    question: b("图表给出储水量 V 随时间 t 的测量值。用 t=2 到 t=4 的割线估计 t=3 附近的变化率，结果是多少？", "The chart shows stored volume V over time t. Estimate the rate near t=3 using the secant from t=2 to t=4."),
    options: [b("8 L/min", "8 L/min"), b("10 L/min", "10 L/min"), b("12 L/min", "12 L/min"), b("20 L/min", "20 L/min")],
    answer: 1,
    visual: { kind: "bars", title: b("储水量 V(t)", "Stored volume V(t)"), labels: [b("t=0", "t=0"), b("t=2", "t=2"), b("t=4", "t=4"), b("t=6", "t=6")], values: [20, 32, 52, 80], unit: "L" },
    explanation: b(
      "第 1 步｜把“变化率”翻译成斜率\n平均变化率=纵向变化量/横向变化量=ΔV/Δt。\n\n第 2 步｜读取正确的两个点\nV(2)=32 L，V(4)=52 L。\n\n第 3 步｜代入\n[52−32]/[4−2]=20/2=10 L/min。\n\n第 4 步｜解释结果\n这表示在 t=3 附近，储水量每分钟约增加 10 L；它不是 t=3 的精确瞬时导数，而是对它的中心割线估计。\n\n易错点\n20 L 是储水量变化量，不是变化率；必须再除以 2 min。",
      "Step 1 | Translate “rate” into slope\nAverage rate=vertical change/horizontal change=ΔV/Δt.\n\nStep 2 | Read the correct points\nV(2)=32 L and V(4)=52 L.\n\nStep 3 | Substitute\n(52−32)/(4−2)=20/2=10 L/min.\n\nStep 4 | Interpret\nNear t=3, volume increases by about 10 L each minute. This is a centred secant estimate, not the exact instantaneous derivative.\n\nCommon trap\n20 L is the change in volume, not the rate; divide by 2 min."
    ),
  },
  {
    id: "math-4-9", courseId: "math", topicId: "math-4", kind: "calculation",
    question: b("速度 v(t)=3t²−4t（m/s）。物体从 t=1 到 t=3 的位移是多少？", "Velocity is v(t)=3t²−4t m/s. What is the displacement from t=1 to t=3?"),
    options: [b("8 m", "8 m"), b("10 m", "10 m"), b("12 m", "12 m"), b("18 m", "18 m")],
    answer: 2,
    visual: { kind: "table", title: b("已知条件", "Given"), columns: [b("量", "Quantity"), b("表达式", "Expression")], rows: [["v(t)", "3t²−4t m/s"], ["interval", "1 ≤ t ≤ 3"]] },
    explanation: b(
      "第 1 步｜识别位移与速度的关系\n位移是速度对时间的定积分：Δx=∫₁³v(t)dt。\n\n第 2 步｜求原函数\n∫(3t²−4t)dt=t³−2t²。\n\n第 3 步｜代上下限\n[t³−2t²]₁³=(27−18)−(1−2)=9−(−1)=10 m。\n\n答案核对\n因此正确答案是 10 m（选 B）。\n\n易错点\n不要只代上限；定积分必须 F(3)−F(1)。这里下限结果是 −1，所以减去它会增加 1。",
      "Step 1 | Connect displacement and velocity\nDisplacement is the definite integral: Δx=∫₁³v(t)dt.\n\nStep 2 | Find an antiderivative\n∫(3t²−4t)dt=t³−2t².\n\nStep 3 | Apply both limits\n[t³−2t²]₁³=(27−18)−(1−2)=9−(−1)=10 m.\n\nAnswer check\nThe correct answer is 10 m (B).\n\nCommon trap\nDo not substitute only the upper limit. A definite integral is F(3)−F(1); subtracting −1 adds 1."
    ),
  },
  {
    id: "iep-0-9", courseId: "iep", topicId: "iep-0", kind: "calculation",
    question: b("团队用加权决策矩阵比较方案。总分=0.5×安全+0.3×成本+0.2×可维护性。哪个方案得分最高？", "A team uses a weighted decision matrix: total=0.5×safety+0.3×cost+0.2×maintainability. Which concept scores highest?"),
    options: [b("方案 A", "Concept A"), b("方案 B", "Concept B"), b("方案 C", "Concept C"), b("A 与 B 并列", "A and B tie")],
    answer: 1,
    visual: { kind: "table", title: b("评分（1–5，越高越好）", "Scores (1–5, higher is better)"), columns: [b("方案", "Concept"), b("安全", "Safety"), b("成本", "Cost"), b("维护", "Maintain.")], rows: [["A", "5", "2", "3"], ["B", "4", "4", "4"], ["C", "3", "5", "2"]] },
    explanation: b(
      "第 1 步｜确认权重\n安全 0.5、成本 0.3、维护 0.2，合计 1.0，说明可直接做加权和。\n\n第 2 步｜分别计算\nA=0.5×5+0.3×2+0.2×3=2.5+0.6+0.6=3.7。\nB=0.5×4+0.3×4+0.2×4=4.0。\nC=0.5×3+0.3×5+0.2×2=1.5+1.5+0.4=3.4。\n\n第 3 步｜比较并解释\nB 的 4.0 最高。A 虽然安全最好，但低成本分拉低总分。\n\n工程判断\n矩阵支持选择 B，但还要做敏感性分析：如果安全权重增加，结论可能变化。",
      "Step 1 | Confirm weights\n0.5+0.3+0.2=1.0, so a weighted sum is appropriate.\n\nStep 2 | Calculate\nA=0.5×5+0.3×2+0.2×3=3.7.\nB=0.5×4+0.3×4+0.2×4=4.0.\nC=0.5×3+0.3×5+0.2×2=3.4.\n\nStep 3 | Compare and interpret\nB is highest at 4.0. A leads on safety but its low cost score reduces its total.\n\nEngineering judgement\nThe matrix supports B, but sensitivity analysis is still needed because a larger safety weight could change the ranking."
    ),
  },
  {
    id: "iep-1-9", courseId: "iep", topicId: "iep-1", kind: "data",
    question: b("风险分数=可能性×后果。根据表格，团队应优先处理哪项风险？", "Risk score=likelihood×consequence. Which risk should the team prioritise?"),
    options: [b("材料延误", "Material delay"), b("电池过热", "Battery overheating"), b("用户培训不足", "Insufficient user training"), b("成本上涨", "Cost increase")],
    answer: 1,
    visual: { kind: "table", title: b("风险登记表", "Risk register"), columns: [b("风险", "Risk"), b("可能性", "Likelihood"), b("后果", "Consequence")], rows: [["材料延误", "4", "3"], ["电池过热", "3", "5"], ["培训不足", "4", "2"], ["成本上涨", "3", "4"]] },
    explanation: b(
      "第 1 步｜明确规则\n用题目给定的半定量方法：风险分数 L×C。先计算再比较，不能只看“最可能”或“后果最大”。\n\n第 2 步｜计算四项\n材料延误=4×3=12；电池过热=3×5=15；培训不足=4×2=8；成本上涨=3×4=12。\n\n第 3 步｜确定优先级\n15 最高，所以优先处理电池过热。\n\n第 4 步｜转化为行动\n优先不等于只处理这一项。应先采用降低后果或可能性的控制措施，再记录负责人、期限和残余风险。\n\n易错点\n“培训不足”的可能性最高之一，但综合风险不是最高。",
      "Step 1 | State the rule\nUse the given semi-quantitative score L×C. Calculate before ranking; do not look only at likelihood or consequence.\n\nStep 2 | Calculate\nDelay=4×3=12; overheating=3×5=15; training=4×2=8; cost=3×4=12.\n\nStep 3 | Prioritise\n15 is highest, so battery overheating comes first.\n\nStep 4 | Turn it into action\nPriority does not mean ignoring other risks. Add controls, an owner, a due date and a residual-risk rating.\n\nCommon trap\nTraining has high likelihood, but not the highest combined score."
    ),
  },
  {
    id: "iep-3-9", courseId: "iep", topicId: "iep-3", kind: "data",
    question: b("计划图显示四项任务的预计工时。团队本周只有 12 小时，且原型必须在测试前完成。哪种安排可行？", "The chart shows planned hours. The team has 12 hours this week, and the prototype must finish before testing. Which plan is feasible?"),
    options: [b("完成研究、原型和测试", "Finish research, prototype and testing"), b("完成原型和测试，并开始报告", "Finish prototype and testing, then start the report"), b("只完成研究和报告", "Finish only research and report"), b("四项全部完成", "Finish all four tasks")],
    answer: 1,
    visual: { kind: "bars", title: b("任务预计工时", "Estimated task hours"), labels: [b("研究", "Research"), b("原型", "Prototype"), b("测试", "Testing"), b("报告", "Report")], values: [5, 6, 4, 3], unit: "h" },
    explanation: b(
      "第 1 步｜识别约束\n总时间≤12 h；并且“原型→测试”存在先后依赖。\n\n第 2 步｜计算候选计划\nA：研究5+原型6+测试4=15 h，超时。\nB：原型6+测试4=10 h，剩2 h，可开始报告，且依赖顺序正确。\nC：研究5+报告3=8 h，但没有推进必须的原型—测试链。\nD：总计18 h，超时。\n\n第 3 步｜选择\nB 是唯一同时满足工时和依赖关系的方案。\n\n项目管理提醒\n“可行”不仅看总工时，还要看任务依赖、人员能力和交付优先级。",
      "Step 1 | Identify constraints\nTotal time must be ≤12 h, and prototype must precede testing.\n\nStep 2 | Test each plan\nA=5+6+4=15 h, over capacity.\nB=6+4=10 h, leaving 2 h to start the report, with the dependency satisfied.\nC=8 h but fails to advance the required prototype–test chain.\nD=18 h, over capacity.\n\nStep 3 | Select\nB is the only plan satisfying both capacity and dependency.\n\nProject reminder\nFeasibility depends on dependencies, capability and delivery priority—not total hours alone."
    ),
  },
  {
    id: "iep-5-9", courseId: "iep", topicId: "iep-5", kind: "calculation",
    question: b("原型预算为 $500。已花 $180，已承诺但未付款 $140，还需保留 15% 总预算作为应急金。现在最多还能新增多少支出？", "Prototype budget is $500. Spent cost is $180, committed cost is $140, and 15% of total budget must remain as contingency. What is the maximum new spend?"),
    options: [b("$75", "$75"), b("$105", "$105"), b("$180", "$180"), b("$255", "$255")],
    answer: 1,
    visual: { kind: "table", title: b("预算状态", "Budget status"), columns: [b("项目", "Item"), b("金额", "Amount")], rows: [["总预算", "$500"], ["已花", "$180"], ["已承诺", "$140"], ["应急比例", "15%"]] },
    explanation: b(
      "第 1 步｜先算必须保留的应急金\n500×15%=$75。这部分不能用于新增支出。\n\n第 2 步｜把已花和已承诺都计入\n已占用预算=180+140=$320。承诺支出虽然尚未付款，但已经不能再分配。\n\n第 3 步｜求可新增金额\n500−320−75=$105。\n\n第 4 步｜反向验证\n320+105+75=500，刚好等于预算上限。\n\n易错点\n忽略 committed cost 会得到 $245；把应急金按“剩余预算”算也不符合题目所说的“总预算 15%”。",
      "Step 1 | Reserve contingency\n500×15%=$75, which cannot be used for new spending.\n\nStep 2 | Include spent and committed costs\nOccupied budget=180+140=$320. A commitment is unavailable even before payment.\n\nStep 3 | Find available new spend\n500−320−75=$105.\n\nStep 4 | Reverse-check\n320+105+75=500, exactly the budget limit.\n\nCommon trap\nIgnoring committed cost overstates available funds; the contingency is 15% of total budget, not remaining budget."
    ),
  },
  {
    id: "c-0-9", courseId: "c", topicId: "c-0", kind: "calculation",
    question: b("下面 C 表达式的最终值是多少？注意整数除法和运算优先级。", "What is the final value of this C expression? Account for integer division and precedence."),
    options: [b("5", "5"), b("7", "7"), b("8", "8"), b("9", "9")],
    answer: 1,
    visual: { kind: "code", title: b("代码", "Code"), code: "int x = 17;\nint y = 5;\nint result = x / y + x % y * 2;" },
    explanation: b(
      "第 1 步｜处理同一优先级\n/、% 和 * 优先级相同，按从左到右分别求值。\n\n第 2 步｜整数除法\n17/5=3，小数部分被截去。\n\n第 3 步｜求余与乘法\n17%5=2，所以 2×2=4。\n\n第 4 步｜相加\nresult=3+4=7。\n\n第 5 步｜快速验证\n17=5×3+2，商 3、余数 2 相互吻合。\n\n易错点\n把 17/5 当成 3.4 会混入浮点规则；所有操作数都是 int。",
      "Step 1 | Apply precedence\n/, % and * share precedence and are evaluated left to right as needed.\n\nStep 2 | Integer division\n17/5=3; the fractional part is discarded.\n\nStep 3 | Remainder and multiplication\n17%5=2, then 2×2=4.\n\nStep 4 | Add\nresult=3+4=7.\n\nStep 5 | Check\n17=5×3+2 confirms quotient 3 and remainder 2.\n\nCommon trap\n17/5 is not 3.4 because every operand is int."
    ),
  },
  {
    id: "c-2-9", courseId: "c", topicId: "c-2", kind: "data",
    question: b("根据代码和追踪表，程序最终输出什么？", "Using the code and trace table, what does the program finally print?"),
    options: [b("6", "6"), b("7", "7"), b("8", "8"), b("10", "10")],
    answer: 2,
    visual: { kind: "code", title: b("循环代码", "Loop code"), code: "int sum = 0;\nfor (int i = 1; i <= 4; i++) {\n  if (i % 2 == 0) sum += i;\n  else sum += 1;\n}\nprintf(\"%d\", sum);" },
    explanation: b(
      "第 1 步｜建立初始状态\nsum=0，i 会依次取 1、2、3、4。\n\n第 2 步｜逐轮追踪\ni=1 是奇数：sum=0+1=1。\ni=2 是偶数：sum=1+2=3。\ni=3 是奇数：sum=3+1=4。\ni=4 是偶数：sum=4+4=8。\n\n第 3 步｜读取输出\n循环结束后 printf 输出 8。\n\n易错点\n奇数分支加的是常数 1，不是 i；循环条件是 i<=4，因此 i=4 那轮必须执行。",
      "Step 1 | Initial state\nsum=0, and i takes 1, 2, 3, 4.\n\nStep 2 | Trace each iteration\ni=1 odd: sum=1.\ni=2 even: sum=3.\ni=3 odd: sum=4.\ni=4 even: sum=8.\n\nStep 3 | Read output\nAfter the loop, printf prints 8.\n\nCommon traps\nThe odd branch adds constant 1, not i. The condition is i<=4, so the i=4 iteration runs."
    ),
  },
  {
    id: "c-4-9", courseId: "c", topicId: "c-4", kind: "data",
    question: b("图表表示数组 scores 的内容。执行 scores[3] = scores[1] + scores[4] 后，数组总和是多少？", "The chart shows array scores. After scores[3] = scores[1] + scores[4], what is the array sum?"),
    options: [b("51", "51"), b("58", "58"), b("61", "61"), b("65", "65")],
    answer: 1,
    visual: { kind: "bars", title: b("scores 数组（标签为下标）", "scores array (labels are indices)"), labels: [b("[0]", "[0]"), b("[1]", "[1]"), b("[2]", "[2]"), b("[3]", "[3]"), b("[4]", "[4]")], values: [8, 12, 6, 15, 10], unit: "" },
    explanation: b(
      "第 1 步｜读取右侧，暂不修改数组\nscores[1]=12，scores[4]=10，所以右侧为 22。\n\n第 2 步｜执行赋值\nscores[3] 原来是 15，现在被覆盖为 22。数组变成 [8,12,6,22,10]。\n\n第 3 步｜求和\n8+12+6+22+10=58，选 B。\n\n第 4 步｜用差值法复核\n原数组总和为 51；只把 15 换成 22，所以新总和=51−15+22=58。\n\n易错点\n下标从 0 开始，scores[3] 是第四个元素；赋值是覆盖，不是在数组末尾添加。",
      "Step 1 | Read the right-hand side before mutation\nscores[1]=12 and scores[4]=10, giving 22.\n\nStep 2 | Assign\nscores[3] is overwritten from 15 to 22. The array becomes [8,12,6,22,10].\n\nStep 3 | Sum\n8+12+6+22+10=58, choice B.\n\nStep 4 | Difference check\nThe original sum is 51. Replacing 15 with 22 gives 51−15+22=58.\n\nCommon traps\nIndices start at zero, so scores[3] is the fourth element. Assignment overwrites; it does not append."
    ),
  },
  {
    id: "c-5-9", courseId: "c", topicId: "c-5", kind: "calculation",
    question: b("假设 sizeof(int)=4。代码成功分配了多少字节，并把哪些元素初始化为 0？", "Assume sizeof(int)=4. How many bytes are allocated, and which elements are initialised to zero?"),
    options: [b("5 字节；只有 p[0]", "5 bytes; p[0] only"), b("20 字节；p[0] 到 p[4]", "20 bytes; p[0] through p[4]"), b("20 字节；只有 p[4]", "20 bytes; p[4] only"), b("25 字节；p[0] 到 p[4]", "25 bytes; p[0] through p[4]")],
    answer: 1,
    visual: { kind: "code", title: b("动态内存代码", "Dynamic-memory code"), code: "int n = 5;\nint *p = calloc(n, sizeof(int));" },
    explanation: b(
      "第 1 步｜识别 calloc 的两个参数\ncalloc(元素个数, 每个元素字节数)。这里个数 n=5，每个 int 为 4 字节。\n\n第 2 步｜计算总字节数\n5×4=20 bytes。\n\n第 3 步｜理解初始化行为\ncalloc 会把分配区域的所有位清零，因此五个 int 元素 p[0]…p[4] 初始都是 0。\n\n第 4 步｜边界检查\n合法下标是 0 到 n−1，即 0 到 4；p[5] 越界。\n\n易错点\nmalloc 不保证清零；calloc 才提供零初始化。使用结束后仍需 free(p)。",
      "Step 1 | Read calloc arguments\ncalloc(element count, bytes per element): n=5 and each int is 4 bytes.\n\nStep 2 | Calculate bytes\n5×4=20 bytes.\n\nStep 3 | Understand initialisation\ncalloc zeroes the allocated region, so p[0] through p[4] all begin as 0.\n\nStep 4 | Check bounds\nValid indices are 0 to n−1, so p[5] is out of bounds.\n\nCommon trap\nmalloc does not guarantee zeroing; calloc does. The memory must still be released with free(p)."
    ),
  },
  {
    id: "physics-0-9", courseId: "physics", topicId: "physics-0", kind: "calculation",
    question: b("汽车以 6 m/s 行驶，随后以 2.5 m/s² 匀加速 4 s。它在这 4 s 内的位移是多少？", "A car starts at 6 m/s and accelerates uniformly at 2.5 m/s² for 4 s. What displacement does it cover?"),
    options: [b("24 m", "24 m"), b("32 m", "32 m"), b("44 m", "44 m"), b("64 m", "64 m")],
    answer: 2,
    visual: { kind: "table", title: b("运动条件", "Motion data"), columns: [b("量", "Quantity"), b("值", "Value")], rows: [["u", "6 m/s"], ["a", "2.5 m/s²"], ["t", "4 s"]] },
    explanation: b(
      "第 1 步｜列已知量并选方向\n取运动方向为正：u=6 m/s，a=2.5 m/s²，t=4 s，求 s。\n\n第 2 步｜选择不需要末速度的公式\ns=ut+½at²。\n\n第 3 步｜代入并分开计算\nut=6×4=24 m；½at²=0.5×2.5×4²=20 m。\n所以 s=24+20=44 m。\n\n第 4 步｜量纲与合理性检查\n两项单位都是 m。末速度为 16 m/s，平均速度 (6+16)/2=11 m/s，11×4=44 m，与结果一致。\n\n易错点\n4²=16；加速产生的额外位移项含有 ½。",
      "Step 1 | List data and direction\nTake forward as positive: u=6 m/s, a=2.5 m/s², t=4 s; find s.\n\nStep 2 | Choose a formula without final velocity\ns=ut+½at².\n\nStep 3 | Substitute\nut=24 m; ½at²=0.5×2.5×16=20 m; hence s=44 m.\n\nStep 4 | Check units and reasonableness\nBoth terms are metres. Final speed is 16 m/s, so average speed is 11 m/s and 11×4=44 m.\n\nCommon trap\nSquare the time, and keep the factor ½."
    ),
  },
  {
    id: "physics-1-9", courseId: "physics", topicId: "physics-1", kind: "calculation",
    question: b("长度 L=(12.0±0.2) cm，宽度 W=(5.0±0.1) cm。用“乘法时百分不确定度相加”的规则，面积及其绝对不确定度约为多少？", "L=(12.0±0.2) cm and W=(5.0±0.1) cm. Using the rule that percentage uncertainties add for multiplication, what are area and absolute uncertainty?"),
    options: [b("(60±0.3) cm²", "(60±0.3) cm²"), b("(60±1.2) cm²", "(60±1.2) cm²"), b("(60±2.2) cm²", "(60±2.2) cm²"), b("(17±0.3) cm²", "(17±0.3) cm²")],
    answer: 2,
    visual: { kind: "table", title: b("测量数据", "Measurements"), columns: [b("量", "Quantity"), b("值", "Value"), b("绝对不确定度", "Abs. uncertainty")], rows: [["L", "12.0 cm", "0.2 cm"], ["W", "5.0 cm", "0.1 cm"]] },
    explanation: b(
      "第 1 步｜先算面积中心值\nA=L×W=12.0×5.0=60.0 cm²。\n\n第 2 步｜分别转成百分不确定度\nL：0.2/12.0×100%=1.67%。\nW：0.1/5.0×100%=2.00%。\n\n第 3 步｜乘法规则\n总百分不确定度≈1.67%+2.00%=3.67%。\n\n第 4 步｜转回绝对不确定度\n60.0×3.67%=2.20 cm²。\n\n第 5 步｜规范报告\nA≈(60±2.2) cm²，选 C。\n\n易错点\n绝对不确定度 0.2 和 0.1 不能直接用于面积；先转成相对/百分不确定度。",
      "Step 1 | Central area\nA=L×W=12.0×5.0=60.0 cm².\n\nStep 2 | Convert to percentage uncertainties\nL: 0.2/12.0×100%=1.67%; W: 0.1/5.0×100%=2.00%.\n\nStep 3 | Multiplication rule\nTotal percentage≈1.67%+2.00%=3.67%.\n\nStep 4 | Convert back to absolute uncertainty\n60.0×3.67%=2.20 cm².\n\nStep 5 | Report\nA≈(60±2.2) cm², choice C.\n\nCommon trap\nDo not directly add 0.2 and 0.1 to an area; convert to relative uncertainty first."
    ),
  },
  {
    id: "physics-3-9", courseId: "physics", topicId: "physics-3", kind: "data",
    question: b("柱状图给出同一物体在连续四秒的合力。质量为 2 kg。第 2 秒（合力 8 N）时加速度是多少？", "The chart gives net force on the same object over four seconds. Its mass is 2 kg. What is acceleration during the second second, when force is 8 N?"),
    options: [b("2 m/s²", "2 m/s²"), b("4 m/s²", "4 m/s²"), b("8 m/s²", "8 m/s²"), b("16 m/s²", "16 m/s²")],
    answer: 1,
    visual: { kind: "bars", title: b("合力—时间数据", "Net force over time"), labels: [b("0–1 s", "0–1 s"), b("1–2 s", "1–2 s"), b("2–3 s", "2–3 s"), b("3–4 s", "3–4 s")], values: [4, 8, 6, 0], unit: "N" },
    explanation: b(
      "第 1 步｜从图中读值\n第二个时间段 1–2 s 的合力是 8 N。题目已说明这是“合力”，不用再把各力相加。\n\n第 2 步｜应用牛顿第二定律\nΣF=ma，所以 a=ΣF/m。\n\n第 3 步｜代入\n a=8 N/2 kg=4 N/kg=4 m/s²。\n\n第 4 步｜物理解释\n正合力表示沿选定正方向加速。最后一秒合力为零则加速度为零，但速度不一定为零。\n\n易错点\n不要用 F×m；公式重排后是 F/m。",
      "Step 1 | Read the chart\nDuring 1–2 s, net force is 8 N. It is already the net force, so no additional force summation is needed.\n\nStep 2 | Newton’s second law\nΣF=ma, so a=ΣF/m.\n\nStep 3 | Substitute\na=8 N/2 kg=4 N/kg=4 m/s².\n\nStep 4 | Interpret\nPositive net force gives acceleration in the positive direction. Zero net force later means zero acceleration, not necessarily zero velocity.\n\nCommon trap\nRearrange to F/m, not F×m."
    ),
  },
  {
    id: "physics-5-9", courseId: "physics", topicId: "physics-5", kind: "data",
    question: b("实验中测得力 F 与伸长量 x 的数据。用首末点估计图线斜率（弹簧常量 k），结果是多少？", "Force F and extension x were measured. Estimate the graph slope (spring constant k) using the first and last points."),
    options: [b("0.025 N/m", "0.025 N/m"), b("25 N/m", "25 N/m"), b("40 N/m", "40 N/m"), b("250 N/m", "250 N/m")],
    answer: 1,
    visual: { kind: "table", title: b("F–x 数据", "F–x data"), columns: [b("x (m)", "x (m)"), b("F (N)", "F (N)")], rows: [["0.02", "0.5"], ["0.04", "1.0"], ["0.06", "1.5"], ["0.08", "2.0"]] },
    explanation: b(
      "第 1 步｜确定坐标关系\n胡克定律 F=kx。如果纵轴是 F、横轴是 x，斜率就是 k。\n\n第 2 步｜选择相距较远的点\n首点 (0.02,0.5)，末点 (0.08,2.0)。使用远点可减小读图误差的相对影响。\n\n第 3 步｜计算斜率\nk=ΔF/Δx=(2.0−0.5)/(0.08−0.02)=1.5/0.06=25 N/m。\n\n第 4 步｜单位检查\nN÷m=N/m，正是弹簧常量单位。\n\n第 5 步｜模型检查\n每个点的 F/x 都约为 25，说明线性模型合理且截距接近零。\n\n易错点\n若算 Δx/ΔF 会得到 0.04 m/N，那是斜率的倒数。",
      "Step 1 | Identify axes\nHooke’s law is F=kx. With F vertical and x horizontal, slope equals k.\n\nStep 2 | Choose well-separated points\nUse (0.02,0.5) and (0.08,2.0) to reduce relative reading error.\n\nStep 3 | Calculate slope\nk=ΔF/Δx=(2.0−0.5)/(0.08−0.02)=1.5/0.06=25 N/m.\n\nStep 4 | Unit check\nN divided by m gives N/m, the spring-constant unit.\n\nStep 5 | Model check\nEach F/x is about 25, supporting a linear model with near-zero intercept.\n\nCommon trap\nΔx/ΔF gives 0.04 m/N, the reciprocal slope."
    ),
  },
];
