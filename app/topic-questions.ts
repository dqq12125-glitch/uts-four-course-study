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
    note: b(
      "向量既有大小也有方向。向量 a=(a₁,a₂,…,aₙ) 与 b=(b₁,b₂,…,bₙ) 的点积定义为 a·b=a₁b₁+a₂b₂+…+aₙbₙ；几何上同一个量等于 |a||b|cosθ，其中 |a|、|b| 是长度，θ 是两向量夹角。若 a、b 都不是零向量，则 |a||b|≠0；所以 a·b=0 迫使 cosθ=0，也就是 θ=90°。非零条件不可省略：零向量与任何向量点积都是零，但零向量没有确定方向，不能据此称为垂直。",
      "A vector has both magnitude and direction. For a=(a₁,a₂,…,aₙ) and b=(b₁,b₂,…,bₙ), the dot product is defined algebraically by a·b=a₁b₁+a₂b₂+…+aₙbₙ. Geometrically, the same scalar equals |a||b|cosθ, where |a| and |b| are magnitudes and θ is the angle between the vectors. If both vectors are non-zero, |a||b|≠0; therefore a·b=0 forces cosθ=0 and hence θ=90°. The non-zero condition matters: the zero vector has dot product zero with every vector but has no defined direction, so perpendicularity cannot be concluded from it.",
    ),
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
    courseId: "eee",
    topicId: "eee-0",
    note: b("电流是电荷流率 I=dq/dt，电压是单位电荷的能量差，欧姆元件满足 V=IR；功率 p=vi，正负号由被动符号约定决定。", "Current is charge flow rate I=dq/dt, voltage is energy per charge, an ohmic element obeys V=IR, and p=vi with sign set by the passive sign convention."),
    checks: [
      ["1 A 表示每秒通过 1 C 电荷。", "1 A means 1 C of charge per second.", true],
      ["1 V 等于 1 J/C。", "1 V equals 1 J/C.", true],
      ["12 V 加在 6 Ω 电阻上产生 2 A。", "12 V across 6 Ω produces 2 A.", true],
      ["电阻单位是安培。", "Resistance is measured in amperes.", false],
      ["电阻吸收功率可写成 I²R。", "Power absorbed by a resistor can be I²R.", true],
      ["电压没有参考极性也能确定正负。", "Voltage has a definite sign without a reference polarity.", false],
      ["若电流进入标注正电压端，p=vi>0 表示吸收功率。", "If current enters the positive-voltage terminal, p=vi>0 means absorbed power.", true],
      ["任何元件在任何工作区都严格满足 V=IR。", "Every element obeys V=IR in every operating region.", false],
      ["功率单位 W 等于 J/s。", "The watt equals J/s.", true],
      ["负电流一定意味着计算错误。", "A negative current always means a calculation error.", false],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-1",
    note: b("KCL 来自电荷守恒：节点电流代数和为零；KVL 来自能量守恒：闭合回路电压代数和为零。串联共享电流，并联共享电压。", "KCL follows charge conservation: the algebraic current sum at a node is zero. KVL follows energy conservation: the algebraic voltage sum around a loop is zero. Series elements share current; parallel elements share voltage."),
    checks: [
      ["流入节点 5 A、流出 2 A 和 3 A 满足 KCL。", "5 A entering and 2 A plus 3 A leaving satisfies KCL.", true],
      ["KVL 要求每个元件电压都为零。", "KVL requires every element voltage to be zero.", false],
      ["串联电阻的等效值等于各电阻相加。", "Series resistances add.", true],
      ["并联等效电阻一定大于最大支路电阻。", "A parallel equivalent is always above the largest branch resistance.", false],
      ["并联支路两端电压相同。", "Parallel branches have the same voltage.", true],
      ["串联元件通过的电流相同。", "Series elements carry the same current.", true],
      ["KCL 写法可以全部流入为正，只要保持一致。", "KCL may take all entering currents positive if used consistently.", true],
      ["两个 3 Ω 电阻并联等于 6 Ω。", "Two 3 Ω resistors in parallel equal 6 Ω.", false],
      ["回路方向选择不同会改变最终物理结果。", "Choosing the opposite loop direction changes the physical result.", false],
      ["电压分配公式只适用于适当的串联网络。", "The voltage-divider rule requires an appropriate series network.", true],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-2",
    note: b("节点电压法对非参考节点写 KCL；网孔电流法对平面电路独立网孔写 KVL。共享元件的支路电流是相邻网孔电流的代数差。", "Nodal analysis writes KCL at non-reference nodes; mesh analysis writes KVL for independent meshes of a planar circuit. A shared-branch current is the algebraic difference of adjacent mesh currents."),
    checks: [
      ["节点电压均相对于选定参考节点定义。", "Node voltages are defined relative to a chosen reference node.", true],
      ["参考节点通常取 0 V。", "The reference node is usually assigned 0 V.", true],
      ["节点电压法的基本方程来自 KVL。", "Nodal-analysis equations fundamentally come from KVL.", false],
      ["网孔电流法通常用于平面电路。", "Mesh-current analysis is normally used for planar circuits.", true],
      ["共享电阻电流必然等于两个网孔电流之和。", "Current in a shared resistor must equal the sum of two mesh currents.", false],
      ["独立电流源可能形成超网孔或直接给出网孔约束。", "A current source may create a supermesh or directly constrain mesh current.", true],
      ["理想电压源连接两个非参考节点时可使用超节点。", "An ideal voltage source between two non-reference nodes may require a supernode.", true],
      ["方程数应与未知节点电压或网孔电流数匹配。", "The equation count should match the unknown node voltages or mesh currents.", true],
      ["解得负网孔电流说明实际方向与假设相反。", "A negative mesh current means the actual direction opposes the reference.", true],
      ["求解后无需代回 KCL 或 KVL 检查。", "No KCL or KVL check is needed after solving.", false],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-3",
    note: b("线性电路可用叠加原理分解独立源；戴维南等效为 Vth 串联 Rth，诺顿等效为 In 并联 Rn，且 Vth=InRth。", "Linear circuits permit superposition. Thevenin is Vth in series with Rth; Norton is In in parallel with Rn, with Vth=InRth."),
    checks: [
      ["叠加时独立电压源置零要用短路替代。", "Zeroing an independent voltage source means replacing it by a short circuit.", true],
      ["叠加时独立电流源置零要用开路替代。", "Zeroing an independent current source means replacing it by an open circuit.", true],
      ["受控源在叠加或求等效电阻时总要关闭。", "Dependent sources are always turned off in superposition or resistance calculations.", false],
      ["叠加原理可以直接对功率进行相加。", "Superposition applies directly to power.", false],
      ["Vth 是端口开路电压。", "Vth is the open-circuit port voltage.", true],
      ["In 是端口短路电流。", "In is the short-circuit port current.", true],
      ["线性网络的戴维南电阻与诺顿电阻相同。", "A linear network has the same Thevenin and Norton resistance.", true],
      ["源变换会改变负载看到的端口行为。", "A source transformation changes the terminal behaviour seen by the load.", false],
      ["最大功率传输在纯电阻情况下要求 RL=Rth。", "For resistive circuits, maximum power transfer requires RL=Rth.", true],
      ["戴维南等效保留内部每条支路电流。", "A Thevenin equivalent preserves every internal branch current.", false],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-4",
    note: b("电容满足 q=Cv、i=C dv/dt，储能 W=½Cv²。理想有限电流下电容电压连续；并联电容相加，串联电容按倒数相加。", "A capacitor obeys q=Cv and i=C dv/dt, storing W=½Cv². With finite current its voltage is continuous; parallel capacitances add and series capacitances combine reciprocally."),
    checks: [
      ["电容单位是法拉。", "Capacitance is measured in farads.", true],
      ["恒定电容两端电压不变时电流为零。", "A constant capacitor with unchanging voltage carries zero current.", true],
      ["有限电流可以使理想电容电压瞬间跳变。", "Finite current can make ideal capacitor voltage jump instantly.", false],
      ["两个电容并联时等效电容相加。", "Parallel capacitances add.", true],
      ["电容串联等效值大于最大的单个电容。", "A series capacitor equivalent exceeds the largest capacitor.", false],
      ["电容储能与电压平方成正比。", "Capacitor energy is proportional to voltage squared.", true],
      ["直流稳态下理想电容等效为开路。", "An ideal capacitor is an open circuit at DC steady state.", true],
      ["电容电流可以瞬间改变。", "Capacitor current can change instantaneously.", true],
      ["增大 C 会在同一 dv/dt 下减小电流。", "Increasing C reduces current for the same dv/dt.", false],
      ["无源 RC 电路时间常数为 τ=RC。", "A passive RC time constant is τ=RC.", true],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-5",
    note: b("电感满足 v=L di/dt，储能 W=½Li²。理想有限电压下电感电流连续；直流稳态理想电感等效短路，RL 时间常数 τ=L/R。", "An inductor obeys v=L di/dt and stores W=½Li². With finite voltage its current is continuous; at DC steady state an ideal inductor is a short circuit, with RL time constant τ=L/R."),
    checks: [
      ["电感单位是亨利。", "Inductance is measured in henries.", true],
      ["恒定电感电流不变时电感电压为零。", "An ideal inductor with constant current has zero voltage.", true],
      ["有限电压能让理想电感电流瞬间跳变。", "Finite voltage can make ideal inductor current jump instantly.", false],
      ["电感储能与电流平方成正比。", "Inductor energy is proportional to current squared.", true],
      ["直流稳态下理想电感等效开路。", "At DC steady state an ideal inductor is an open circuit.", false],
      ["电感电压可以瞬间改变。", "Inductor voltage can change instantaneously.", true],
      ["两个无耦合电感串联时电感量相加。", "Uncoupled series inductances add.", true],
      ["RL 时间常数为 R/L。", "The RL time constant is R/L.", false],
      ["断开电感电流可能产生较大感应电压。", "Interrupting inductor current can produce a large induced voltage.", true],
      ["稳态电感永远不储存能量。", "A steady-state inductor never stores energy.", false],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-6",
    note: b("二极管模型必须先假设导通或截止，再求解并检查自洽性。半波整流只保留一个极性的半周，全波整流把两个半周变成同极性输出。", "For a diode, assume ON or OFF, solve, then verify consistency. Half-wave rectification keeps one polarity of half-cycle; full-wave rectification makes both half-cycles the same output polarity."),
    checks: [
      ["理想二极管导通时可视为短路。", "An ideal conducting diode is a short circuit.", true],
      ["理想二极管截止时可视为开路。", "An ideal off diode is an open circuit.", true],
      ["硅二极管恒压降模型常取约 0.7 V。", "A silicon constant-drop model commonly uses about 0.7 V.", true],
      ["假设二极管导通后不需要检查电流方向。", "An assumed ON diode needs no current-direction check.", false],
      ["半波整流的纹波频率通常等于输入频率。", "A half-wave rectifier ripple frequency normally equals the input frequency.", true],
      ["全波整流的纹波频率通常是输入频率一半。", "A full-wave rectifier ripple frequency is normally half the input frequency.", false],
      ["桥式整流每条导通路径通常经过两个二极管。", "A bridge-rectifier conduction path normally includes two diodes.", true],
      ["反向偏置二极管在简单模型中导通大电流。", "A reverse-biased diode conducts a large current in the simple model.", false],
      ["滤波电容可以减小整流输出纹波。", "A filter capacitor can reduce rectifier ripple.", true],
      ["二极管是线性双向元件。", "A diode is a linear bidirectional element.", false],
    ],
  },
  {
    courseId: "eee",
    topicId: "eee-7",
    note: b("正弦稳态可用相量表示。ZR=R，ZL=jωL，ZC=1/(jωC)；RMS 值用于平均功率，复功率 S=P+jQ。", "Sinusoidal steady state uses phasors: ZR=R, ZL=jωL, ZC=1/(jωC). RMS values are used for average power, and complex power is S=P+jQ."),
    checks: [
      ["正弦波 Vrms=Vp/√2。", "For a sinusoid, Vrms=Vp/√2.", true],
      ["频率 f 与角频率满足 ω=2πf。", "Frequency and angular frequency satisfy ω=2πf.", true],
      ["电感阻抗的虚部为正。", "Inductor impedance has positive imaginary part.", true],
      ["电容阻抗幅值随频率升高而增大。", "Capacitor impedance magnitude increases with frequency.", false],
      ["纯电阻中电压与电流同相。", "Voltage and current are in phase in a pure resistor.", true],
      ["纯电感中电流超前电压 90°。", "Current leads voltage by 90° in a pure inductor.", false],
      ["纯电容中电流超前电压 90°。", "Current leads voltage by 90° in a pure capacitor.", true],
      ["相量法把微分方程转化为复数代数。", "Phasors turn differential equations into complex algebra.", true],
      ["复功率实部 P 表示平均有功功率。", "The real part P of complex power is average real power.", true],
      ["功率因数永远等于 1。", "Power factor is always 1.", false],
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
