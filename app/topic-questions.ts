import { advancedQuestionBank, type QuestionVisual } from "./advanced-questions";

export type LocalizedText = { zh: string; en: string };

export type TopicQuestion = {
  id: string;
  courseId: string;
  topicId: string;
  kind: "truefalse" | "single" | "multiple" | "scenario" | "combination" | "calculation" | "data";
  question: LocalizedText;
  options: LocalizedText[];
  answer: number | number[];
  explanation: LocalizedText;
  visual?: QuestionVisual;
};

type Check = [zh: string, en: string, truth: boolean];
type TopicSpec = {
  courseId: string;
  topicId: string;
  note: LocalizedText;
  checks: Check[];
};

const b = (zh: string, en: string): LocalizedText => ({ zh, en });

const specs: TopicSpec[] = [
  {
    courseId: "math",
    topicId: "math-0",
    note: b("向量问题要同时关注大小、方向、分量和几何关系。", "Vector problems combine magnitude, direction, components and geometry."),
    checks: [
      ["向量 (3,4) 的长度是 5。", "The magnitude of (3,4) is 5.", true],
      ["两个非零向量点积为零时互相垂直。", "Two non-zero vectors with zero dot product are perpendicular.", true],
      ["向量 (2,−1) 与 (−2,1) 方向相同。", "Vectors (2,−1) and (−2,1) point in the same direction.", false],
      ["单位向量的长度为 1。", "A unit vector has magnitude 1.", true],
      ["a·b 的结果仍然是一个向量。", "The result of a·b is another vector.", false],
      ["平行向量一定具有相同长度。", "Parallel vectors must have equal magnitude.", false],
      ["向量投影表示一个向量在另一个方向上的分量。", "A vector projection is the component of one vector along another direction.", true],
      ["三维向量 (x,y,z) 的长度是 x+y+z。", "The magnitude of (x,y,z) is x+y+z.", false],
      ["若 a=2b，则 a 与 b 平行。", "If a=2b, then a and b are parallel.", true],
      ["交换点积顺序不会改变结果：a·b=b·a。", "The dot product is commutative: a·b=b·a.", true],
    ],
  },
  {
    courseId: "math",
    topicId: "math-1",
    note: b("矩阵运算必须检查维数；行列式与可逆性紧密相关。", "Matrix operations require dimension checks; determinants are closely tied to invertibility."),
    checks: [
      ["2×3 矩阵可以与 3×4 矩阵相乘。", "A 2×3 matrix can multiply a 3×4 matrix.", true],
      ["矩阵乘法通常满足 AB=BA。", "Matrix multiplication generally satisfies AB=BA.", false],
      ["单位矩阵 I 满足 AI=A。", "The identity matrix satisfies AI=A.", true],
      ["行列式为零的方阵不可逆。", "A square matrix with determinant zero is not invertible.", true],
      ["只有方阵才定义普通行列式。", "The usual determinant is defined only for square matrices.", true],
      ["两个 2×2 矩阵相加时对应元素相加。", "Two 2×2 matrices are added element by element.", true],
      ["矩阵转置会交换行和列。", "Transposition swaps rows and columns.", true],
      ["任意矩阵都有逆矩阵。", "Every matrix has an inverse.", false],
      ["det([[1,2],[3,4]])=2。", "det([[1,2],[3,4]])=2.", false],
      ["线性方程组可以写成 Ax=b。", "A linear system can be written as Ax=b.", true],
    ],
  },
  {
    courseId: "math",
    topicId: "math-2",
    note: b("微积分建模用导数描述变化率，并用函数把现实关系数学化。", "Calculus modelling uses derivatives for rates of change and functions to represent real relationships."),
    checks: [
      ["位置函数对时间求导得到速度。", "Differentiating position with respect to time gives velocity.", true],
      ["速度对时间求导得到位移。", "Differentiating velocity with respect to time gives displacement.", false],
      ["f(x)=x³ 的导数是 3x²。", "The derivative of f(x)=x³ is 3x².", true],
      ["常数函数的导数为零。", "The derivative of a constant is zero.", true],
      ["函数的极值点一定满足函数值为零。", "At an extremum, the function value must be zero.", false],
      ["导数的单位等于输出单位除以输入单位。", "Derivative units are output units divided by input units.", true],
      ["线性函数的导数是常数。", "A linear function has a constant derivative.", true],
      ["乘积求导只需分别求导后相乘。", "To differentiate a product, simply multiply the two derivatives.", false],
      ["二阶导数可以描述曲率或加速度。", "A second derivative can describe curvature or acceleration.", true],
      ["模型假设不影响最终解释。", "Model assumptions do not affect the final interpretation.", false],
    ],
  },
  {
    courseId: "math",
    topicId: "math-3",
    note: b("隐式微分时，凡是对含 y 的项求导，都要乘上 dy/dx。", "In implicit differentiation, differentiating any term containing y introduces a factor dy/dx."),
    checks: [
      ["对 y² 关于 x 求导得到 2y(dy/dx)。", "Differentiating y² with respect to x gives 2y(dy/dx).", true],
      ["对 x²+y²=25 求导可得 dy/dx=−x/y。", "Differentiating x²+y²=25 gives dy/dx=−x/y.", true],
      ["隐式方程必须先解出 y 才能求导。", "An implicit equation must be solved for y before differentiating.", false],
      ["对 xy 求导得到 x(dy/dx)+y。", "Differentiating xy gives x(dy/dx)+y.", true],
      ["链式法则在隐式微分中不需要。", "The chain rule is unnecessary in implicit differentiation.", false],
      ["曲线 x²+y²=1 在点 (1,0) 的切线是竖直的。", "The curve x²+y²=1 has a vertical tangent at (1,0).", true],
      ["dy/dx 表示曲线切线的斜率。", "dy/dx is the slope of the tangent to the curve.", true],
      ["对 sin(y) 求导得到 cos(y)。", "Differentiating sin(y) with respect to x gives only cos(y).", false],
      ["隐式微分可以处理多个变量相互依赖的关系。", "Implicit differentiation handles relationships between dependent variables.", true],
      ["若 dy/dx=0，则切线是竖直的。", "If dy/dx=0, the tangent is vertical.", false],
    ],
  },
  {
    courseId: "math",
    topicId: "math-4",
    note: b("积分既是反导数，也能表示累积量；不定积分要写积分常数。", "Integration is both antidifferentiation and accumulation; indefinite integrals need a constant."),
    checks: [
      ["∫2x dx=x²+C。", "∫2x dx=x²+C.", true],
      ["不定积分不需要积分常数。", "An indefinite integral does not need a constant of integration.", false],
      ["定积分可以表示曲线下的有符号面积。", "A definite integral can represent signed area under a curve.", true],
      ["∫1/x dx=ln|x|+C。", "∫1/x dx=ln|x|+C.", true],
      ["换元积分对应于链式法则的逆过程。", "Substitution is the reverse process of the chain rule.", true],
      ["分部积分来自乘积求导法则。", "Integration by parts comes from the product rule.", true],
      ["∫x² dx=2x+C。", "∫x² dx=2x+C.", false],
      ["若积分上下限相同，定积分为零。", "A definite integral with equal limits is zero.", true],
      ["交换积分上下限不会改变符号。", "Swapping integration limits does not change the sign.", false],
      ["微积分基本定理连接了导数与积分。", "The Fundamental Theorem of Calculus links differentiation and integration.", true],
    ],
  },
  {
    courseId: "math",
    topicId: "math-5",
    note: b("复数由实部和虚部组成，i²=−1；模和共轭是常用工具。", "Complex numbers have real and imaginary parts with i²=−1; modulus and conjugate are key tools."),
    checks: [
      ["i²=−1。", "i²=−1.", true],
      ["i³=−i。", "i³=−i.", true],
      ["(2+3i)+(1−i)=3+2i。", "(2+3i)+(1−i)=3+2i.", true],
      ["复数 3+4i 的模是 7。", "The modulus of 3+4i is 7.", false],
      ["3+4i 的共轭是 3−4i。", "The conjugate of 3+4i is 3−4i.", true],
      ["复数相乘时可以使用普通代数展开并用 i²=−1 化简。", "Complex multiplication uses ordinary expansion followed by i²=−1.", true],
      ["所有复数都位于实数轴上。", "All complex numbers lie on the real axis.", false],
      ["复数的极坐标形式包含模和辐角。", "Polar form uses modulus and argument.", true],
      ["i 的四次方等于 −1。", "i to the fourth power equals −1.", false],
      ["一个复数乘以其共轭得到非负实数。", "A complex number times its conjugate is a non-negative real number.", true],
    ],
  },
  {
    courseId: "math",
    topicId: "math-6",
    note: b("微分方程描述未知函数与其导数的关系；初始条件用来确定特解。", "Differential equations relate an unknown function to its derivatives; initial conditions select a particular solution."),
    checks: [
      ["dy/dx=ky 的解具有指数形式。", "Solutions of dy/dx=ky have exponential form.", true],
      ["一阶微分方程最高只含一阶导数。", "A first-order differential equation contains derivatives no higher than first order.", true],
      ["初始条件可以确定积分常数。", "An initial condition can determine an integration constant.", true],
      ["y″+4y=0 的解包含正弦和余弦。", "Solutions of y″+4y=0 involve sine and cosine.", true],
      ["所有微分方程都能用同一种方法求解。", "Every differential equation is solved by the same method.", false],
      ["可分离方程可以把 y 项和 x 项分到两边。", "A separable equation allows y terms and x terms to be placed on opposite sides.", true],
      ["指数衰减模型中的增长常数 k 通常为正。", "The constant k in exponential decay is usually positive.", false],
      ["二阶方程通常需要两个独立条件确定特解。", "A second-order equation usually needs two independent conditions.", true],
      ["平衡解是随时间不变的解。", "An equilibrium solution is constant in time.", true],
      ["微分方程不能用于物理建模。", "Differential equations cannot be used in physical modelling.", false],
    ],
  },

  {
    courseId: "iep",
    topicId: "iep-0",
    note: b("工程把科学、数学、伦理和现实约束结合起来，为人解决问题。", "Engineering combines science, mathematics, ethics and real constraints to solve problems for people."),
    checks: [
      ["工程问题通常有多个可行解。", "Engineering problems often have multiple feasible solutions.", true],
      ["工程只关心技术性能，不关心人。", "Engineering concerns technical performance but not people.", false],
      ["工程决策需要权衡成本、安全和影响。", "Engineering decisions trade off cost, safety and impact.", true],
      ["科学与工程的目标和方法完全相同。", "Science and engineering have identical goals and methods.", false],
      ["工程师需要清楚沟通设计理由。", "Engineers must communicate design reasoning clearly.", true],
      ["伦理责任属于工程工作的一部分。", "Ethical responsibility is part of engineering work.", true],
      ["只要技术可行，方案就一定合适。", "A technically feasible solution is always appropriate.", false],
      ["系统思维关注部分之间的相互作用。", "Systems thinking examines interactions among parts.", true],
      ["工程项目不需要记录假设。", "Engineering projects do not need assumptions documented.", false],
      ["失败的测试也能提供有价值的证据。", "A failed test can still provide valuable evidence.", true],
    ],
  },
  {
    courseId: "iep",
    topicId: "iep-1",
    note: b("设计流程以需求和标准为起点，通过构想、原型、测试和迭代降低风险。", "The design process begins with needs and criteria, then reduces risk through ideation, prototyping, testing and iteration."),
    checks: [
      ["设计前应先理解问题情境。", "The problem context should be understood before designing.", true],
      ["评价标准用于比较不同方案。", "Criteria are used to compare design alternatives.", true],
      ["约束是可以随意忽略的偏好。", "Constraints are optional preferences.", false],
      ["构想阶段应先产生多个选择。", "Ideation should initially generate multiple options.", true],
      ["原型必须与最终产品一样精致。", "A prototype must be as polished as the final product.", false],
      ["测试计划应明确测量什么和如何判断成功。", "A test plan should define what to measure and what counts as success.", true],
      ["迭代意味着根据证据修改设计。", "Iteration means changing a design in response to evidence.", true],
      ["需求陈述越宽泛越容易测试。", "A broader need statement is easier to test.", false],
      ["决策矩阵可以帮助比较方案。", "A decision matrix can help compare concepts.", true],
      ["选择方案后就不再需要利益相关者反馈。", "Stakeholder feedback is unnecessary after a concept is selected.", false],
    ],
  },
  {
    courseId: "iep",
    topicId: "iep-2",
    note: b("高效团队需要清晰角色、共同目标、心理安全和可追踪的协作。", "Effective teams need clear roles, shared goals, psychological safety and traceable collaboration."),
    checks: [
      ["团队应尽早约定沟通方式和责任。", "Teams should agree early on communication and responsibilities.", true],
      ["分歧一定表示团队失败。", "Disagreement always means a team is failing.", false],
      ["基于标准讨论比基于个人偏好更可靠。", "Discussing criteria is more reliable than debating personal preference.", true],
      ["会议记录可以保存决定和行动项。", "Meeting notes can preserve decisions and action items.", true],
      ["团队中只有领导者需要倾听。", "Only the team leader needs to listen.", false],
      ["心理安全让成员更敢于提出风险和错误。", "Psychological safety helps members raise risks and mistakes.", true],
      ["同伴评价应依据可观察的贡献。", "Peer assessment should use observable contributions.", true],
      ["把所有任务交给最强成员最有效。", "Giving all tasks to the strongest member is most effective.", false],
      ["冲突可以通过回到共同目标来处理。", "Conflict can be managed by returning to shared goals.", true],
      ["反馈越模糊越容易接受和行动。", "Vague feedback is easier to act on.", false],
    ],
  },
  {
    courseId: "iep",
    topicId: "iep-3",
    note: b("在设计中尊重 Country 需要真实关系、倾听、同意和持续合作。", "Respecting Country in design requires genuine relationships, listening, consent and ongoing collaboration."),
    checks: [
      ["不同原住民社区具有不同知识、优先事项和协议。", "Different Indigenous communities have distinct knowledge, priorities and protocols.", true],
      ["在设计完成后再通知社区就足够了。", "It is enough to notify a community after the design is complete.", false],
      ["Country 包含土地、水域、文化、关系和责任。", "Country includes land, waters, culture, relationships and responsibilities.", true],
      ["使用原住民图案就自动代表文化尊重。", "Using Indigenous patterns automatically demonstrates cultural respect.", false],
      ["合作应从项目早期开始。", "Engagement should begin early in the project.", true],
      ["社区知识可以在未经允许时自由使用。", "Community knowledge can be used freely without permission.", false],
      ["设计决策应重视当地知识持有者的声音。", "Design decisions should value the voices of local knowledge holders.", true],
      ["关系建立通常需要时间和持续投入。", "Relationship-building usually requires time and continuity.", true],
      ["所有 Country 都可以用同一套方案处理。", "The same approach works for every Country.", false],
      ["共同设计比单方面咨询更有可能形成合适方案。", "Co-design is more likely than one-way consultation to produce appropriate outcomes.", true],
    ],
  },
  {
    courseId: "iep",
    topicId: "iep-4",
    note: b("EWB Challenge 强调情境适配、可持续性、社区价值和有证据的工程设计。", "The EWB Challenge emphasises contextual fit, sustainability, community value and evidence-based design."),
    checks: [
      ["EWB Challenge 的方案应回应真实社区情境。", "EWB Challenge concepts should respond to a real community context.", true],
      ["技术越复杂，方案一定越好。", "A more technically complex concept is always better.", false],
      ["可持续性包含社会、环境和经济方面。", "Sustainability includes social, environmental and economic dimensions.", true],
      ["维护和长期运行不属于设计考虑。", "Maintenance and long-term operation are outside design considerations.", false],
      ["利益相关者分析有助于理解不同需求。", "Stakeholder analysis helps reveal different needs.", true],
      ["方案应考虑当地可获得的材料和技能。", "A concept should consider locally available materials and skills.", true],
      ["展示时只需说明最终形状，不需解释理由。", "A presentation only needs the final form, not the reasoning.", false],
      ["证据可以来自研究、计算、原型和反馈。", "Evidence can come from research, calculations, prototypes and feedback.", true],
      ["低成本是唯一重要的评价标准。", "Low cost is the only important criterion.", false],
      ["风险和意外影响应被识别并讨论。", "Risks and unintended impacts should be identified and discussed.", true],
    ],
  },
  {
    courseId: "iep",
    topicId: "iep-5",
    note: b("有效评价应基于明确标准、具体证据和可行动的反馈。", "Effective assessment uses clear criteria, specific evidence and actionable feedback."),
    checks: [
      ["自评可以帮助识别自己的学习差距。", "Self-assessment can reveal personal learning gaps.", true],
      ["同伴评价应主要依据友情。", "Peer assessment should mainly reflect friendship.", false],
      ["具体例子能让反馈更可信。", "Specific examples make feedback more credible.", true],
      ["反馈只需要指出问题，不需建议改进。", "Feedback only needs to identify problems, not suggest improvement.", false],
      ["量规有助于统一评价标准。", "A rubric helps make assessment criteria consistent.", true],
      ["贡献包括技术工作、组织、沟通和支持。", "Contribution includes technical work, organisation, communication and support.", true],
      ["自评分数越高越说明反思质量好。", "A higher self-score always means better reflection.", false],
      ["评价应关注行为而不是人格。", "Assessment should focus on behaviour rather than personality.", true],
      ["及时反馈通常比很晚的反馈更有用。", "Timely feedback is usually more useful than delayed feedback.", true],
      ["所有团队成员必须获得完全相同的评价。", "Every team member must receive exactly the same evaluation.", false],
    ],
  },

  {
    courseId: "c",
    topicId: "c-0",
    note: b("编程基础包括编译执行、变量、表达式、输入输出和逐步调试。", "Programming fundamentals include compiling, variables, expressions, I/O and stepwise debugging."),
    checks: [
      ["C 源代码通常需要编译后才能执行。", "C source code is normally compiled before execution.", true],
      ["分号常用于结束 C 语句。", "A semicolon commonly terminates a C statement.", true],
      ["变量可以在声明前任意使用。", "A variable can be used freely before it is declared.", false],
      ["main 是 C 程序常见的入口函数。", "main is the usual entry function of a C program.", true],
      ["注释会作为程序指令执行。", "Comments are executed as program instructions.", false],
      ["printf 可以输出格式化文本。", "printf can produce formatted output.", true],
      ["编译错误和运行时错误是同一种错误。", "Compile errors and runtime errors are the same kind of error.", false],
      ["调试时应尽量缩小出错范围。", "Debugging should narrow down the source of a fault.", true],
      ["未初始化的局部变量总是自动为零。", "An uninitialised local variable is always automatically zero.", false],
      ["清晰的变量名可以提高代码可读性。", "Clear variable names improve readability.", true],
    ],
  },
  {
    courseId: "c",
    topicId: "c-1",
    note: b("类型决定数据表示和运算方式；函数通过参数和返回值组织计算。", "Types determine representation and operations; functions organise computation through parameters and returns."),
    checks: [
      ["7/2 在两个操作数都是 int 时结果为 3。", "7/2 evaluates to 3 when both operands are int.", true],
      ["7/2.0 的结果是 3.5。", "7/2.0 evaluates to 3.5.", true],
      ["= 用于比较两个值是否相等。", "= compares two values for equality.", false],
      ["== 用于相等比较。", "== tests equality.", true],
      ["% 运算符可以求整数余数。", "The % operator can compute an integer remainder.", true],
      ["函数原型可以告诉编译器参数和返回类型。", "A function prototype tells the compiler parameter and return types.", true],
      ["void 返回类型表示函数必须返回整数。", "A void return type means a function must return an integer.", false],
      ["%d 常用于 printf 输出 int。", "%d is commonly used to print an int.", true],
      ["类型转换永远不会损失信息。", "Type conversion can never lose information.", false],
      ["函数参数在调用时接收实参值。", "Function parameters receive argument values when called.", true],
    ],
  },
  {
    courseId: "c",
    topicId: "c-2",
    note: b("控制结构用条件和循环决定程序执行路径。", "Control structures use conditions and loops to direct program flow."),
    checks: [
      ["if 语句根据条件选择是否执行代码块。", "An if statement conditionally executes a block.", true],
      ["else 可以在 if 条件为假时执行。", "else can run when the if condition is false.", true],
      ["for(int i=0;i<5;i++) 执行 5 次。", "for(int i=0;i<5;i++) runs five times.", true],
      ["while 循环至少执行一次。", "A while loop always executes at least once.", false],
      ["do-while 循环至少执行一次。", "A do-while loop executes at least once.", true],
      ["break 可以立即退出最近的循环或 switch。", "break exits the nearest loop or switch.", true],
      ["continue 会结束整个程序。", "continue terminates the whole program.", false],
      ["switch 适合对一个离散表达式进行多分支选择。", "switch suits multi-way selection on a discrete expression.", true],
      ["无限循环永远不可能被有意使用。", "An infinite loop can never be intentional.", false],
      ["嵌套循环中内层循环会对每次外层迭代运行。", "In nested loops, the inner loop runs for each outer iteration.", true],
    ],
  },
  {
    courseId: "c",
    topicId: "c-3",
    note: b("数组使用连续元素和从零开始的下标；C 字符串以空字符结尾。", "Arrays use contiguous, zero-indexed elements; C strings end with a null character."),
    checks: [
      ["长度为 10 的数组最后一个合法下标是 9。", "The last valid index of an array of length 10 is 9.", true],
      ["访问数组下标 10 对长度 10 的数组是安全的。", "Index 10 is safe for an array of length 10.", false],
      ["C 数组下标从 0 开始。", "C array indexing starts at 0.", true],
      ["字符串以 \\0 结束。", "A C string ends with \\0.", true],
      ["strlen 会把结尾的 \\0 计入长度。", "strlen includes the terminating \\0 in its result.", false],
      ["char name[6] 可以保存 \"Frank\" 及其结尾空字符。", "char name[6] can store \"Frank\" and its null terminator.", true],
      ["数组名在许多表达式中会退化为首元素指针。", "An array name decays to a pointer to its first element in many expressions.", true],
      ["二维数组不能使用两个下标。", "A two-dimensional array cannot use two indices.", false],
      ["越界访问会导致未定义行为。", "Out-of-bounds access causes undefined behaviour.", true],
      ["strcpy 总能自动检查目标数组是否足够大。", "strcpy always checks that the destination is large enough.", false],
    ],
  },
  {
    courseId: "c",
    topicId: "c-4",
    note: b("结构体组织相关字段；文件处理需要打开、检查、读写并关闭资源。", "Structures group related fields; file processing opens, checks, reads or writes, then closes resources."),
    checks: [
      ["struct 可以组合不同类型的相关字段。", "A struct can group related fields of different types.", true],
      ["点运算符可访问普通结构体变量的成员。", "The dot operator accesses a member of a structure value.", true],
      ["结构体指针通常用 -> 访问成员。", "A pointer to a struct commonly uses -> to access members.", true],
      ["fopen 失败时可能返回 NULL。", "fopen may return NULL when it fails.", true],
      ["文件打开后不需要检查是否成功。", "There is no need to check whether a file opened successfully.", false],
      ["fclose 用于关闭打开的文件流。", "fclose closes an open file stream.", true],
      ["文本文件和二进制文件在所有平台上完全相同。", "Text and binary files are identical on every platform.", false],
      ["fprintf 可以向文件写格式化文本。", "fprintf can write formatted text to a file.", true],
      ["读取文件时永远不会到达文件末尾。", "Reading a file can never reach end-of-file.", false],
      ["结构体数组可以保存多条同类记录。", "An array of structs can store multiple records of the same kind.", true],
    ],
  },
  {
    courseId: "c",
    topicId: "c-5",
    note: b("指针保存地址；动态内存必须检查分配结果并在不用时释放。", "Pointers store addresses; dynamic allocation must be checked and released when no longer needed."),
    checks: [
      ["&x 得到变量 x 的地址。", "&x produces the address of x.", true],
      ["*p 可以解引用有效指针 p。", "*p dereferences a valid pointer p.", true],
      ["NULL 指针可以安全解引用。", "A NULL pointer can be safely dereferenced.", false],
      ["malloc 返回动态分配内存的地址或 NULL。", "malloc returns allocated memory or NULL.", true],
      ["malloc 分配的内存会自动初始化为零。", "Memory from malloc is automatically zero-initialised.", false],
      ["free 用于释放动态内存。", "free releases dynamically allocated memory.", true],
      ["释放后继续使用该指针可能导致未定义行为。", "Using a pointer after free can cause undefined behaviour.", true],
      ["指针变量本身不占用内存。", "A pointer variable itself uses no memory.", false],
      ["指针算术会按所指类型的大小移动。", "Pointer arithmetic advances in units of the pointed-to type.", true],
      ["重复 free 同一块内存是安全的。", "Freeing the same allocation twice is safe.", false],
    ],
  },
  {
    courseId: "c",
    topicId: "c-6",
    note: b("大型程序通过模块、接口、职责分离、测试和版本控制保持可维护。", "Large programs stay maintainable through modules, interfaces, separation of concerns, testing and version control."),
    checks: [
      ["头文件常用于声明共享接口。", "Header files commonly declare shared interfaces.", true],
      ["实现细节应全部暴露给每个模块。", "All implementation details should be exposed to every module.", false],
      ["一个函数只承担清晰职责通常更易测试。", "A function with one clear responsibility is usually easier to test.", true],
      ["全局变量越多，程序越容易维护。", "More global variables always make a program easier to maintain.", false],
      ["编译器可以分别编译多个源文件再链接。", "Multiple source files can be compiled separately and then linked.", true],
      ["include guard 可以避免头文件被重复包含。", "Include guards can prevent repeated header inclusion.", true],
      ["版本控制只适合个人项目，不适合团队。", "Version control suits individuals but not teams.", false],
      ["单元测试可以验证小型函数行为。", "Unit tests can verify the behaviour of small functions.", true],
      ["重构的目标是在保持行为的同时改善结构。", "Refactoring improves structure while preserving behaviour.", true],
      ["命名和文档对大型程序没有影响。", "Naming and documentation do not matter in large programs.", false],
    ],
  },
  {
    courseId: "c",
    topicId: "c-7",
    note: b("命令行参数通过 argc 和 argv 传入；程序必须验证数量、格式和范围。", "Command-line arguments arrive through argc and argv; programs must validate count, format and range."),
    checks: [
      ["argc 表示命令行参数数量。", "argc is the number of command-line arguments.", true],
      ["argv 保存参数字符串。", "argv stores argument strings.", true],
      ["argv[0] 通常是程序名。", "argv[0] is usually the program name.", true],
      ["命令行传入的数字自动成为 int。", "A number supplied on the command line automatically becomes an int.", false],
      ["字符串参数需要转换后才能用于数值运算。", "String arguments need conversion before numeric calculation.", true],
      ["使用 argv[2] 前无需检查 argc。", "There is no need to check argc before using argv[2].", false],
      ["程序可以用返回码向操作系统表示成功或失败。", "A program can use its return code to signal success or failure.", true],
      ["命令行解析不需要处理无效输入。", "Command-line parsing does not need to handle invalid input.", false],
      ["选项如 -v 常用于改变程序行为。", "Options such as -v commonly alter program behaviour.", true],
      ["argc 永远等于 0。", "argc is always 0.", false],
    ],
  },

  {
    courseId: "physics",
    topicId: "physics-0",
    note: b("一维运动学用位置、位移、速度和加速度描述沿一条直线的运动。", "One-dimensional kinematics describes motion along a line using position, displacement, velocity and acceleration."),
    checks: [
      ["位置—时间图像的斜率表示速度。", "The slope of a position–time graph is velocity.", true],
      ["速度—时间图像的斜率表示加速度。", "The slope of a velocity–time graph is acceleration.", true],
      ["速度—时间图像下的有符号面积表示位移。", "Signed area under a velocity–time graph is displacement.", true],
      ["恒定速度运动的加速度为零。", "Motion at constant velocity has zero acceleration.", true],
      ["负速度一定表示物体在减速。", "Negative velocity always means an object is slowing down.", false],
      ["若向上为正，重力加速度为负。", "If upward is positive, gravitational acceleration is negative.", true],
      ["位移与路程永远相等。", "Displacement and distance are always equal.", false],
      ["平均速度等于位移除以时间间隔。", "Average velocity is displacement divided by elapsed time.", true],
      ["加速度为负时速度大小一定减小。", "Negative acceleration always reduces speed.", false],
      ["恒加速度公式不能用于加速度变化的情况。", "Constant-acceleration equations do not apply when acceleration varies.", true],
    ],
  },
  {
    courseId: "physics",
    topicId: "physics-1",
    note: b("测量必须同时报告单位、合理有效数字和不确定度。", "A measurement should report units, sensible significant figures and uncertainty."),
    checks: [
      ["12.4±0.2 cm 中 0.2 cm 是绝对不确定度。", "In 12.4±0.2 cm, 0.2 cm is the absolute uncertainty.", true],
      ["百分不确定度等于绝对不确定度除以测量值再乘 100%。", "Percentage uncertainty is absolute uncertainty divided by the measured value, times 100%.", true],
      ["不确定度为零表示测量绝对精确。", "Zero uncertainty means a measurement is perfectly exact.", false],
      ["重复测量可以帮助估计随机不确定度。", "Repeated measurements can help estimate random uncertainty.", true],
      ["精密度和准确度是完全相同的概念。", "Precision and accuracy mean exactly the same thing.", false],
      ["结果的小数位通常应与绝对不确定度相匹配。", "A result’s decimal place should usually match its absolute uncertainty.", true],
      ["系统误差可以通过无限重复自动消除。", "Systematic error is automatically removed by unlimited repetition.", false],
      ["仪器分辨率可能限制测量精度。", "Instrument resolution can limit measurement precision.", true],
      ["单位不属于测量结果的一部分。", "Units are not part of a measurement result.", false],
      ["异常值应先调查原因，而不是自动删除。", "An outlier should be investigated rather than automatically deleted.", true],
    ],
  },
  {
    courseId: "physics",
    topicId: "physics-2",
    note: b("实验前准备应明确理论、变量、风险、步骤和预期数据处理。", "Pre-class preparation should clarify theory, variables, risks, procedure and expected data processing."),
    checks: [
      ["实验前应阅读步骤和安全要求。", "The procedure and safety requirements should be read before class.", true],
      ["预习的目的只是记住答案。", "The only purpose of preparation is to memorise answers.", false],
      ["应提前识别自变量和因变量。", "Independent and dependent variables should be identified in advance.", true],
      ["实验前预测趋势有助于发现异常结果。", "Predicting a trend before the experiment helps identify anomalous results.", true],
      ["不需要知道仪器量程。", "Instrument range does not need to be known.", false],
      ["风险评估应考虑危险、可能性和后果。", "Risk assessment considers hazards, likelihood and consequences.", true],
      ["数据表可以在实验后凭记忆补写。", "A data table can be reconstructed from memory after the experiment.", false],
      ["预先写好单位能减少记录错误。", "Preparing units in advance can reduce recording errors.", true],
      ["理解公式中的每个符号有助于正确测量。", "Understanding each symbol in a formula helps identify required measurements.", true],
      ["实验问题不需要与测量方法对应。", "The experimental question need not match the measurement method.", false],
    ],
  },
  {
    courseId: "physics",
    topicId: "physics-3",
    note: b("力学建模通过系统边界、受力图、守恒定律和假设连接现实与方程。", "Mechanics modelling links reality to equations through system boundaries, force diagrams, conservation laws and assumptions."),
    checks: [
      ["受力图只画作用在所选物体上的外力。", "A free-body diagram shows external forces acting on the chosen object.", true],
      ["合力为零意味着物体一定静止。", "Zero net force means an object must be stationary.", false],
      ["牛顿第二定律可写为 ΣF=ma。", "Newton’s second law can be written ΣF=ma.", true],
      ["质量和重量是同一个物理量。", "Mass and weight are the same physical quantity.", false],
      ["模型假设应明确写出并检查合理性。", "Model assumptions should be stated and checked for reasonableness.", true],
      ["忽略空气阻力是一种模型近似。", "Ignoring air resistance is a modelling approximation.", true],
      ["作用力与反作用力作用在同一个物体上。", "Action and reaction forces act on the same object.", false],
      ["选择坐标轴会影响分量正负号。", "Choosing coordinate axes affects component signs.", true],
      ["量纲检查可以发现某些公式错误。", "Dimensional analysis can reveal some equation errors.", true],
      ["模型越复杂就一定越准确。", "A more complex model is always more accurate.", false],
    ],
  },
  {
    courseId: "physics",
    topicId: "physics-4",
    note: b("Mastering Physics 练习应重视单位、步骤、反馈和独立重做，而不是只追答案。", "Mastering Physics practice should focus on units, working, feedback and independent retry—not just answers."),
    checks: [
      ["应通过 Canvas 进入 Mastering Physics。", "Mastering Physics should be entered through Canvas.", true],
      ["只复制最终答案也能保证理解。", "Copying only the final answer guarantees understanding.", false],
      ["提交前检查单位和有效数字很重要。", "Checking units and significant figures before submission is important.", true],
      ["错误反馈可以帮助定位概念或代数问题。", "Feedback from an incorrect answer can identify conceptual or algebraic issues.", true],
      ["看完解答后无需独立重做。", "There is no need to retry independently after reading a solution.", false],
      ["画图和列已知量可以减少代公式错误。", "A diagram and list of known quantities can reduce substitution errors.", true],
      ["符号答案永远不如小数答案。", "A symbolic answer is always worse than a decimal answer.", false],
      ["每一步保留单位有助于检查推理。", "Keeping units through the working helps check reasoning.", true],
      ["多次猜答案是最有效的学习方法。", "Repeated guessing is the most effective study method.", false],
      ["完成题目后解释答案为何合理能加强理解。", "Explaining why an answer is reasonable strengthens understanding.", true],
    ],
  },
  {
    courseId: "physics",
    topicId: "physics-5",
    note: b("实验数据分析包括图表、拟合、不确定度、残差和基于证据的结论。", "Experimental data analysis uses graphs, fitting, uncertainty, residuals and evidence-based conclusions."),
    checks: [
      ["图轴应标明变量和单位。", "Graph axes should show variables and units.", true],
      ["最佳拟合线必须穿过每一个数据点。", "A best-fit line must pass through every data point.", false],
      ["斜率的单位来自纵轴单位除以横轴单位。", "Slope units are y-axis units divided by x-axis units.", true],
      ["误差棒可以表示数据不确定度。", "Error bars can represent data uncertainty.", true],
      ["相关性自动证明因果关系。", "Correlation automatically proves causation.", false],
      ["残差图可以帮助检查模型是否合适。", "A residual plot can help assess whether a model is appropriate.", true],
      ["结论应说明数据是否支持原假设。", "A conclusion should state whether data support the hypothesis.", true],
      ["只报告平均值就不需要说明散布。", "Reporting a mean removes the need to describe spread.", false],
      ["异常点可能来自错误，也可能反映真实现象。", "An outlier may arise from error or from a real effect.", true],
      ["增加小数位数会自动提高实验准确度。", "Adding decimal places automatically improves experimental accuracy.", false],
    ],
  },
];

const pick = <T,>(items: T[], index: number) => items[index % items.length];

const rotate = <T,>(items: T[], amount: number) => {
  const shift = amount % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
};

const explainChecks = (spec: TopicSpec, checks: Check[]) => {
  const zhDetails = checks
    .map(([zh, , truth], index) =>
      `${String.fromCharCode(65 + index)}：${truth ? "正确" : "错误"}。${zh}${truth ? " 这与本知识点的定义和适用条件一致。" : " 这句话忽略了必要条件或混淆了概念，不能作为正确结论。"}`
    )
    .join("\n");
  const enDetails = checks
    .map(([, en, truth], index) =>
      `${String.fromCharCode(65 + index)}: ${truth ? "Correct" : "Incorrect"}. ${en} ${truth ? "This is consistent with the definition and its conditions." : "This drops a required condition or mixes concepts, so it cannot be accepted."}`
    )
    .join("\n");
  return b(
    `第 1 步｜识别任务\n先确认题目要找“正确项”还是“错误项”，避免知识会了却选反。\n\n第 2 步｜逐项验证\n${zhDetails}\n\n第 3 步｜回到核心规则\n${spec.note.zh}\n\n第 4 步｜形成可迁移的方法\n合上解析，尝试用自己的话解释每个选项为什么成立或不成立。能解释条件和反例，才不只是记住答案。\n\n易错提醒\n不要只记选项字母；下次选项顺序改变时，必须仍能从定义、公式或证据推出结论。`,
    `Step 1 | Identify the task\nConfirm whether the question asks for the correct or incorrect statement so you do not reverse a sound analysis.\n\nStep 2 | Test every option\n${enDetails}\n\nStep 3 | Return to the core rule\n${spec.note.en}\n\nStep 4 | Make the method transferable\nClose the explanation and justify each option in your own words. Understanding means you can state conditions and counterexamples—not merely remember an answer.\n\nCommon trap\nDo not memorise option letters. You should still derive the result when choices are reordered.`,
  );
};

const makeTrueFalse = (spec: TopicSpec, check: Check, index: number): TopicQuestion => ({
  id: `${spec.topicId}-${index}`,
  courseId: spec.courseId,
  topicId: spec.topicId,
  kind: "truefalse",
  question: b(`${check[0]}（判断正误）`, `${check[1]} True or false?`),
  options: [b("正确", "True"), b("错误", "False")],
  answer: check[2] ? 0 : 1,
  explanation: b(
    `第 1 步｜圈出关键词\n命题是：“${check[0]}”\n\n第 2 步｜调用核心规则\n${spec.note.zh}\n\n第 3 步｜比较命题与规则\n该命题${check[2] ? "符合定义及适用条件，因此成立" : "忽略必要条件或混淆概念，因此不成立"}。\n\n结论\n答案是“${check[2] ? "正确" : "错误"}”。\n\n第 4 步｜自我检验\n尝试举一个例子${check[2] ? "验证它，并说明适用条件" : "作为反例推翻它"}。\n\n易错提醒\n“一定”“所有”“只要”等绝对表达尤其需要检查。`,
    `Step 1 | Mark key wording\nThe claim is: “${check[1]}”\n\nStep 2 | Recall the core rule\n${spec.note.en}\n\nStep 3 | Compare claim with rule\nThe claim ${check[2] ? "matches the definition and its conditions, so it holds" : "drops a required condition or mixes concepts, so it fails"}.\n\nConclusion\nThe answer is ${check[2] ? "True" : "False"}.\n\nStep 4 | Self-test\nTry to give ${check[2] ? "a confirming example and its conditions" : "a counterexample that disproves it"}.\n\nCommon trap\nAbsolute words such as “always”, “every” and “only” deserve extra scrutiny.`,
  ),
});

const makeStatementQuestion = (
  spec: TopicSpec,
  id: number,
  mode: "correct" | "incorrect" | "scenario",
  seed: number,
): TopicQuestion => {
  const truths = spec.checks.filter((item) => item[2]);
  const falses = spec.checks.filter((item) => !item[2]);
  const raw =
    mode === "incorrect"
      ? [pick(falses, seed), pick(truths, seed), pick(truths, seed + 1), pick(truths, seed + 2)]
      : [pick(truths, seed), pick(falses, seed), pick(falses, seed + 1), pick(falses, seed + 2)];
  const checks = rotate(raw, seed + id);
  const wantedTruth = mode !== "incorrect";
  return {
    id: `${spec.topicId}-${id}`,
    courseId: spec.courseId,
    topicId: spec.topicId,
    kind: mode === "scenario" ? "scenario" : "single",
    question:
      mode === "correct"
        ? b("下面哪一项表述正确？", "Which statement is correct?")
        : mode === "incorrect"
          ? b("下面哪一项表述错误？", "Which statement is incorrect?")
          : b("一位同学准备把下面一条结论写进复习卡。哪一项可以保留？", "A student wants to keep one claim on a revision card. Which one should stay?"),
    options: checks.map(([zh, en]) => b(zh, en)),
    answer: checks.findIndex((item) => item[2] === wantedTruth),
    explanation: explainChecks(spec, checks),
  };
};

const makeMultiple = (spec: TopicSpec, id: number, seed: number): TopicQuestion => {
  const truths = spec.checks.filter((item) => item[2]);
  const falses = spec.checks.filter((item) => !item[2]);
  const checks = rotate(
    [pick(truths, seed), pick(falses, seed), pick(truths, seed + 1), pick(falses, seed + 1)],
    seed + 1,
  );
  return {
    id: `${spec.topicId}-${id}`,
    courseId: spec.courseId,
    topicId: spec.topicId,
    kind: "multiple",
    question: b("多选题：选择所有正确的表述。", "Multiple select: choose every correct statement."),
    options: checks.map(([zh, en]) => b(zh, en)),
    answer: checks.map((item, index) => item[2] ? index : -1).filter((index) => index >= 0),
    explanation: explainChecks(spec, checks),
  };
};

const makeCombination = (spec: TopicSpec, id: number, seed: number): TopicQuestion => {
  const truths = spec.checks.filter((item) => item[2]);
  const falses = spec.checks.filter((item) => !item[2]);
  const statements = [pick(truths, seed), pick(falses, seed), pick(truths, seed + 1)];
  return {
    id: `${spec.topicId}-${id}`,
    courseId: spec.courseId,
    topicId: spec.topicId,
    kind: "combination",
    question: b(
      `组合题：判断下面三句话，哪一组是正确的？\n① ${statements[0][0]}\n② ${statements[1][0]}\n③ ${statements[2][0]}`,
      `Combination question: which statements are correct?\n① ${statements[0][1]}\n② ${statements[1][1]}\n③ ${statements[2][1]}`,
    ),
    options: [b("只有①②", "① and ② only"), b("只有①③", "① and ③ only"), b("只有②③", "② and ③ only"), b("①②③全部", "All of ①, ② and ③")],
    answer: 1,
    explanation: b(
      `第 1 步｜先遮住组合选项\n不要一开始就在 A–D 中猜，先独立判断三句话。\n\n第 2 步｜逐句判断\n① 正确：${statements[0][0]}\n② 错误：${statements[1][0]} 这句话忽略了必要条件或混淆了概念。\n③ 正确：${statements[2][0]}\n\n第 3 步｜编码结果\n三句结果为“对、错、对”，也就是①③。\n\n第 4 步｜匹配选项\n“只有①③”对应 B。\n\n核心规则\n${spec.note.zh}\n\n易错提醒\n先判断语句、后匹配组合，可以避免被相似选项带偏。`,
      `Step 1 | Hide the combinations\nDo not guess among A–D first. Judge each statement independently.\n\nStep 2 | Judge each claim\n① Correct: ${statements[0][1]}\n② Incorrect: ${statements[1][1]} It drops a condition or mixes concepts.\n③ Correct: ${statements[2][1]}\n\nStep 3 | Encode the result\nThe pattern is true, false, true: ① and ③.\n\nStep 4 | Match a choice\n“① and ③ only” is B.\n\nCore rule\n${spec.note.en}\n\nCommon trap\nJudge statements before matching combinations to resist distractors.`,
    ),
  };
};

const generatedQuestionBank: TopicQuestion[] = specs.flatMap((spec) => [
  makeTrueFalse(spec, spec.checks[0], 1),
  makeTrueFalse(spec, spec.checks[1], 2),
  makeStatementQuestion(spec, 3, "correct", 0),
  makeStatementQuestion(spec, 4, "incorrect", 1),
  makeMultiple(spec, 5, 0),
  makeStatementQuestion(spec, 6, "scenario", 2),
  makeMultiple(spec, 7, 2),
  makeCombination(spec, 8, 1),
  makeStatementQuestion(spec, 9, "correct", 3),
  makeStatementQuestion(spec, 10, "incorrect", 4),
]);

const advancedById = new Map(advancedQuestionBank.map((question) => [question.id, question]));

export const topicQuestionBank: TopicQuestion[] = generatedQuestionBank.map(
  (question) => advancedById.get(question.id) ?? question,
);
