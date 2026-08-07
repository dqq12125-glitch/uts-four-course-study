export type LessonBi = { zh: string; en: string };
export type DeepLesson = {
  duration: number;
  definition: LessonBi;
  intuition: LessonBi;
  terms: { term: string; meaning: LessonBi }[];
  formulas: { expression: string; condition: LessonBi }[];
  example: { prompt: LessonBi; steps: LessonBi[]; answer: LessonBi };
  traps: LessonBi[];
  checkpoint: { question: LessonBi; answer: LessonBi };
};

const b = (zh: string, en: string): LessonBi => ({ zh, en });

export const deepLessons: Record<string, DeepLesson> = {
  "math-0": {
    duration: 35,
    definition: b("向量不是“几个数排在一起”，而是同时包含大小和方向的量。坐标 (a₁,a₂,a₃) 表示沿三个坐标轴的分量；点积把两个向量的方向关系压缩成一个标量；投影则把一个向量分解成沿目标方向和平行方向之外的部分。", "A vector is not merely a list of numbers: it carries magnitude and direction. Coordinates are axis components; the dot product compresses a directional relationship into a scalar; projection decomposes a vector into parallel and perpendicular parts."),
    intuition: b("把向量 a 想成一束斜着照下来的光，把 b 的方向想成地面上的轨道。projᵦa 就是 a 在这条轨道上的“影子”。影子的长度取决于夹角，所以点积公式中会出现 cosθ。", "Imagine vector a casting a shadow onto a track pointing along b. projᵦa is that shadow. Its length depends on the angle, which is why cosθ appears in the dot product."),
    terms: [
      { term: "Magnitude |a|", meaning: b("向量长度；在三维中 |a|=√(a₁²+a₂²+a₃²)。", "Vector length; in 3D, |a|=√(a₁²+a₂²+a₃²).") },
      { term: "Dot product a·b", meaning: b("对应分量乘积之和，也是 |a||b|cosθ；结果是标量。", "Sum of component products, also |a||b|cosθ; the result is a scalar.") },
      { term: "Projection projᵦa", meaning: b("a 在 b 方向上的向量部分；方向跟 b 一致，长度由点积决定。", "The vector part of a along b; its direction follows b and its length comes from the dot product.") },
    ],
    formulas: [
      { expression: "a·b = a₁b₁ + a₂b₂ + a₃b₃", condition: b("已知分量时使用；结果没有方向。", "Use when components are known; the result has no direction.") },
      { expression: "cosθ = (a·b)/(|a||b|)", condition: b("两个向量都必须非零，否则分母为零且方向未定义。", "Both vectors must be non-zero; otherwise the denominator and direction are undefined.") },
      { expression: "projᵦa = [(a·b)/|b|²]b", condition: b("b 必须非零；括号内是缩放 b 的系数。", "b must be non-zero; the bracketed scalar scales b.") },
    ],
    example: {
      prompt: b("求 a=(3,4) 在 b=(2,0) 方向上的向量投影，并求垂直分量。", "Find the vector projection of a=(3,4) along b=(2,0), then the perpendicular component."),
      steps: [
        b("先算点积：a·b=3×2+4×0=6；再算 |b|²=2²+0²=4。", "Compute a·b=6 and |b|²=4."),
        b("投影系数为 6/4=1.5，所以 projᵦa=1.5(2,0)=(3,0)。", "The projection coefficient is 1.5, so projᵦa=(3,0)."),
        b("垂直分量 a⊥=a−projᵦa=(3,4)−(3,0)=(0,4)。", "The perpendicular component is a−projᵦa=(0,4)."),
        b("检查：(3,0)·(0,4)=0，说明两部分确实垂直；两部分相加回到 a。", "Check: (3,0)·(0,4)=0, and the two parts add back to a."),
      ],
      answer: b("平行分量为 (3,0)，垂直分量为 (0,4)。", "Parallel component (3,0); perpendicular component (0,4)."),
    },
    traps: [
      b("把点积 6 当成投影向量；6 只是标量，还要除以 |b|² 并乘 b。", "Treating dot product 6 as the projection vector; it is only a scalar."),
      b("用 |b| 而不是 |b|² 计算向量投影。", "Using |b| instead of |b|² in vector projection."),
      b("忽略“非零向量”条件；零向量没有可用的方向。", "Ignoring the non-zero condition; the zero vector has no usable direction."),
    ],
    checkpoint: {
      question: b("若 a·b<0，能否直接说两个向量方向相反？", "If a·b<0, can we say the vectors point exactly opposite?"),
      answer: b("不能。只能确定夹角大于 90°；只有夹角等于 180°且两向量平行时才是完全相反。", "No. It only proves an obtuse angle; exact opposition requires parallel vectors with angle 180°."),
    },
  },
  "math-1": lesson(
    b("矩阵是描述线性变换和联立方程的结构，不只是数字表格。每一列可以理解为基向量经过变换后的去向。", "A matrix describes linear transformations and simultaneous equations, not merely a number table. Its columns show where basis vectors move."),
    b("把矩阵乘向量想成把坐标网格拉伸、剪切、旋转或翻转；行列式描述面积/体积缩放及方向是否翻转。", "Matrix-vector multiplication stretches, shears, rotates or flips the grid; the determinant measures area/volume scaling and orientation."),
    [["Ax=b", b("联立方程的紧凑写法；求 x 前先判断 A 是否可逆。", "Compact simultaneous equations; check whether A is invertible.")], ["det([[a,b],[c,d]])=ad−bc", b("det=0 表示变换压扁维度，逆矩阵不存在。", "det=0 collapses a dimension, so no inverse exists.")], ["A⁻¹=(1/det A)[[d,−b],[−c,a]]", b("仅适用于 2×2 且 det A≠0。", "For 2×2 matrices only, with det A≠0.")]],
    b("解 2x+y=5，x−y=1。", "Solve 2x+y=5 and x−y=1."),
    [b("写成 Ax=b：A=[[2,1],[1,−1]]，b=[5,1]。", "Write Ax=b with A=[[2,1],[1,−1]]."), b("det A=−2−1=−3≠0，所以有唯一解。", "det A=−3≠0, so the solution is unique."), b("消元：第二式得 y=x−1，代入第一式得 3x=6。", "Eliminate: y=x−1, hence 3x=6.")],
    b("x=2，y=1；代回两式都成立。", "x=2, y=1; both equations check."),
  ),
  "math-2": lesson(
    b("导数是函数在一个点的瞬时变化率，也是该点切线斜率；它由越来越短的割线斜率的极限定义。", "A derivative is instantaneous rate of change and tangent slope, defined as the limit of shrinking secant slopes."),
    b("公式不是符号游戏：若 x 是时间、f(x) 是位置，f′(x) 就是速度；f″(x) 是速度变化率，即加速度。", "If x is time and f(x) position, f′ is velocity and f″ acceleration."),
    [["f′(x)=lim[h→0](f(x+h)−f(x))/h", b("定义要求极限存在；尖点或跳跃处可能不可导。", "The limit must exist; corners and jumps may not be differentiable.")], ["d(xⁿ)/dx=nxⁿ⁻¹", b("幂法则；与乘积、链式法则配合使用。", "Power rule; combine with product and chain rules.")], ["d f(g(x))/dx=f′(g(x))g′(x)", b("复合函数必须乘内部导数。", "A composite function requires the inner derivative.")]],
    b("储水量 V(t)=2t³−3t²+10，求 t=2 时的瞬时流入率。", "V(t)=2t³−3t²+10. Find the instantaneous inflow rate at t=2."),
    [b("题目问变化率，因此先求 V′(t)。", "A rate asks for V′(t)."), b("V′(t)=6t²−6t。", "Differentiate: V′(t)=6t²−6t."), b("代 t=2：24−12=12。", "At t=2: 24−12=12.")],
    b("瞬时流入率为 12 个体积单位/时间单位。", "The instantaneous inflow rate is 12 volume units per time unit."),
  ),
  "math-3": lesson(
    b("隐函数没有把 y 单独写成 y=f(x)，但 x 与 y 仍由方程约束。隐式求导时把 y 看作 y(x)，所以对含 y 的项求导必须带 dy/dx。", "An implicit relation does not isolate y, but y still depends on x. Differentiate y-terms using the chain rule, including dy/dx."),
    b("沿曲线移动时，x 和 y 同时变化；dy/dx 描述为了继续留在约束曲线上，y 必须以多快的速度响应 x。", "As a point moves on the curve, x and y change together; dy/dx is the response required to remain on the constraint."),
    [["d(yⁿ)/dx=nyⁿ⁻¹(dy/dx)", b("y 是 x 的函数，不能漏掉链式因子。", "y depends on x, so include the chain factor.")], ["Fₓ+Fᵧ(dy/dx)=0", b("F(x,y)=constant 且 Fᵧ≠0 时，dy/dx=−Fₓ/Fᵧ。", "For F(x,y)=constant with Fᵧ≠0.")]],
    b("对 x²+xy+y²=7 求 dy/dx。", "Find dy/dx for x²+xy+y²=7."),
    [b("逐项求导：2x + d(xy)/dx + 2y y′=0。", "Differentiate: 2x+d(xy)/dx+2yy′=0."), b("乘积法则给 d(xy)/dx=y+xy′。", "Product rule gives y+xy′."), b("收集 y′：(x+2y)y′=−(2x+y)。", "Collect y′ terms.")],
    b("dy/dx=−(2x+y)/(x+2y)，分母不为零。", "dy/dx=−(2x+y)/(x+2y), where the denominator is non-zero."),
  ),
  "math-4": lesson(
    b("积分同时表达累积量和反导数。定积分把无数个窄条的贡献相加；不定积分给出所有导数等于被积函数的函数族。", "Integration expresses accumulation and antiderivatives. A definite integral sums infinitely many thin contributions; an indefinite integral gives a family of antiderivatives."),
    b("选择方法的关键是结构：内部函数及其导数在旁边用换元；不同类型函数的乘积考虑分部积分；有理函数先化简或部分分式。", "Choose methods by structure: inner function plus its derivative suggests substitution; unlike products suggest integration by parts."),
    [["∫f′(g(x))g′(x)dx=f(g(x))+C", b("换元法，本质是反向链式法则。", "Substitution is the reverse chain rule.")], ["∫u dv=uv−∫v du", b("分部积分来自乘积法则；选择 u 使求导后更简单。", "Integration by parts comes from the product rule.")], ["∫ₐᵇf(x)dx=F(b)−F(a)", b("F′=f；定积分不需要 +C。", "F′=f; no +C in a definite integral.")]],
    b("计算 ∫₀¹ 2x e^(x²) dx。", "Evaluate ∫₀¹ 2x e^(x²) dx."),
    [b("看到 x² 和它的导数 2x，选择 u=x²。", "See x² beside 2x, so choose u=x²."), b("du=2x dx；上下限由 x=0,1 变为 u=0,1。", "du=2x dx; limits remain 0 and 1."), b("积分变成 ∫₀¹eᵘdu=[eᵘ]₀¹。", "The integral becomes [eᵘ]₀¹.")],
    b("结果为 e−1。", "The result is e−1."),
  ),
  "math-5": lesson(
    b("复数 z=a+bi 把实数轴扩展成二维平面；a 是实部，b 是虚部。极坐标形式用模 r 和辐角 θ 表示同一个点。", "A complex number z=a+bi extends the real line to a plane. Polar form describes the same point using modulus r and argument θ."),
    b("乘法在极坐标中变成“长度相乘、角度相加”，所以复数特别适合交流电、旋转和振动。", "In polar form, multiplication means multiply lengths and add angles, ideal for AC circuits, rotations and oscillations."),
    [["i²=−1", b("每两个 i 可替换为 −1。", "Every pair of i factors becomes −1.")], ["r=√(a²+b²), θ=atan2(b,a)", b("atan2 自动处理象限；不要只用 arctan(b/a)。", "atan2 handles quadrants correctly.")], ["z=r(cosθ+i sinθ)=re^(iθ)", b("直角坐标、极坐标与指数形式等价。", "Cartesian, polar and exponential forms are equivalent.")]],
    b("把 z=−1+√3 i 写成极坐标形式。", "Write z=−1+√3 i in polar form."),
    [b("模 r=√(1+3)=2。", "r=2."), b("点在第二象限，参考角为 π/3，因此 θ=2π/3。", "The point is in quadrant II, so θ=2π/3."), b("写成 2(cos(2π/3)+i sin(2π/3))。", "Write the polar form.")],
    b("z=2e^(i2π/3)。", "z=2e^(i2π/3)."),
  ),
  "math-6": lesson(
    b("常微分方程描述未知函数与其导数之间的关系；解不是一个数字，而是一族满足变化规律的函数，初始条件从中选出唯一轨迹。", "An ODE relates an unknown function to its derivatives. Its solution is a family of functions; initial conditions select a trajectory."),
    b("dy/dt=ky 表示“变化速度与当前数量成正比”：k>0 指数增长，k<0 指数衰减。", "dy/dt=ky means the rate is proportional to the current amount: exponential growth for k>0 and decay for k<0."),
    [["dy/dt=ky ⇒ y=Ce^(kt)", b("一阶指数模型；C 由初值决定。", "First-order exponential model; C comes from the initial value.")], ["y′+p(x)y=q(x)", b("一阶线性方程可用积分因子。", "A first-order linear equation can use an integrating factor.")], ["y″+ω²y=0", b("无阻尼振动，解由 sin 和 cos 组成。", "Undamped oscillation with sine/cosine solutions.")]],
    b("温差 T 满足 dT/dt=−0.2T，且 T(0)=50，求 T(5)。", "Temperature difference satisfies dT/dt=−0.2T with T(0)=50. Find T(5)."),
    [b("通解 T=Ce^(−0.2t)。", "General solution T=Ce^(−0.2t)."), b("由 T(0)=50 得 C=50。", "Initial value gives C=50."), b("T(5)=50e^(−1)。", "Substitute t=5.")],
    b("T(5)≈18.4；负号表示逐渐衰减，不会在有限时间突然变零。", "T(5)≈18.4; decay approaches zero gradually."),
  ),

  "eee-0": lesson(b("电流是电荷流率，电压是每单位电荷的能量差，功率是能量传递速率。先选择电流方向和电压极性，负号才有明确意义。", "Current is charge-flow rate, voltage energy per charge, and power energy-transfer rate. Choose references before interpreting signs."), b("把电压想成推动电荷的能量差，把电流想成流量；电阻描述元件对这种流动的比例关系。", "Think of voltage as an energy push, current as flow, and resistance as the proportional opposition."), [["V=IR", b("仅对欧姆元件；V、I 参考方向须一致。", "For ohmic elements with consistent references.")], ["p=vi=I²R=V²/R", b("后两式只适用于电阻。", "The latter forms apply to resistors.")]], b("12 V 加在 4 Ω 电阻上，求电流和功率。", "12 V is applied to 4 Ω. Find current and power."), [b("I=V/R=3 A。", "I=3 A."), b("P=VI=36 W。", "P=36 W."), b("用 I²R=9×4=36 W 复核。", "Check with I²R.")], b("I=3 A，P=36 W。", "I=3 A, P=36 W.")),
  "eee-1": lesson(b("KCL 来自电荷守恒，KVL 来自能量守恒。串联元件电流相同，并联支路电压相同。", "KCL follows charge conservation and KVL energy conservation. Series elements share current; parallel branches share voltage."), b("节点像交通路口：流入必须等于流出；回路像走一圈回到原高度：电压升降代数和为零。", "A node is a junction where inflow equals outflow; around a loop, voltage rises and drops sum to zero."), [["ΣI=0", b("先统一流入为正或流出为正。", "Choose one current sign convention.")], ["ΣV=0", b("沿选定绕行方向记录每次升压和降压。", "Record rises and drops along one loop direction.")]], b("节点有 5 A、1 A 流入，2 A 和 Ix 流出。", "5 A and 1 A enter; 2 A and Ix leave."), [b("写流入=流出：5+1=2+Ix。", "Write 5+1=2+Ix."), b("移项得 Ix=4 A。", "Solve Ix=4 A."), b("检查总流入和总流出都是 6 A。", "Check both totals are 6 A.")], b("Ix=4 A。", "Ix=4 A.")),
  "eee-2": lesson(b("节点分析以节点电压为未知量并使用 KCL；网孔分析以平面回路电流为未知量并使用 KVL。目标是用最少方程描述整个电路。", "Nodal analysis uses node voltages with KCL; mesh analysis uses loop currents with KVL. Choose the method with fewer equations."), b("节点多、支路电流多时，先求节点电压通常更直接；回路少且电压源多时，网孔法常更快。", "Nodal is often direct for many branches; mesh can be quicker for few loops and voltage sources."), [["(Vnode−Vneighbor)/R", b("从节点流向相邻节点的支路电流。", "Branch current from one node to its neighbour.")], ["ΣR·I=ΣV", b("网孔方程；共用电阻压降取决于网孔电流差。", "Mesh equation; shared resistor drop uses current difference.")]], b("节点 V 通过 2 Ω 接 10 V、通过 3 Ω 接地，求 V。", "Node V connects to 10 V through 2 Ω and ground through 3 Ω."), [b("写 KCL：(V−10)/2+V/3=0。", "KCL: (V−10)/2+V/3=0."), b("乘 6：3V−30+2V=0。", "Multiply by 6."), b("5V=30。", "Solve.")], b("V=6 V；两支路电流大小均为 2 A。", "V=6 V; branch currents are both 2 A in magnitude.")),
  "eee-3": lesson(b("线性网络可在负载端口化为戴维南电压源串联电阻，或诺顿电流源并联电阻。叠加用于分别计算独立源的贡献。", "A linear network can be reduced at a load port to a Thevenin voltage source in series with resistance or Norton current source in parallel."), b("等效不是改变负载看到的行为，而是把内部复杂性折叠起来，便于重复计算不同负载。", "Equivalence preserves what the load sees while hiding internal complexity."), [["In=Vth/Rth", b("戴维南与诺顿互换，Rth=Rn。", "Thevenin/Norton conversion with equal resistance.")], ["Pload 最大 when RL=Rth", b("纯电阻直流网络的最大功率传输条件。", "Maximum power transfer for resistive DC networks.")]], b("Vth=10 V，Rth=2 Ω，接 RL=3 Ω，求负载电流。", "Vth=10 V, Rth=2 Ω, RL=3 Ω."), [b("等效电路中两电阻串联。", "The resistors are in series."), b("总电阻 5 Ω。", "Total resistance is 5 Ω."), b("IL=10/5=2 A。", "IL=2 A.")], b("负载电流 2 A，负载电压 6 V。", "Load current 2 A and voltage 6 V.")),
  "eee-4": lesson(b("电容储存电场能量，电荷与电压满足 q=Cv。电容电压在有限电流下连续，直流稳态时理想电容相当于开路。", "A capacitor stores electric-field energy with q=Cv. Voltage is continuous for finite current; at DC steady state an ideal capacitor is open."), b("电容像需要时间充满的储能容器：电压不能凭空跳变，但电流可在开关瞬间改变。", "A capacitor is an energy store that needs time to charge: voltage cannot jump, though current can change."), [["i=C dv/dt", b("被动符号约定；电压变化越快，电流越大。", "Passive sign convention; faster voltage change needs more current.")], ["W=½Cv²", b("储存能量总是非负。", "Stored energy is non-negative.")]], b("10 μF 电容以 2 mA 恒流充电 0.1 s，电压增加多少？", "A 10 μF capacitor charges at 2 mA for 0.1 s."), [b("由 Δv=IΔt/C。", "Use Δv=IΔt/C."), b("统一单位：I=0.002 A，C=10×10⁻⁶ F。", "Convert units."), b("Δv=0.002×0.1/(10⁻⁵)=20 V。", "Calculate 20 V.")], b("电压增加 20 V。", "Voltage rises by 20 V.")),
  "eee-5": lesson(b("电感储存磁场能量，电压与电流变化率满足 v=L di/dt。有限电压下电感电流连续，直流稳态时理想电感相当于短路。", "An inductor stores magnetic-field energy with v=L di/dt. Current is continuous for finite voltage; at DC steady state it is a short."), b("电感反对电流的突然变化：不是阻止电流本身，而是要求改变电流必须施加电压。", "An inductor opposes sudden change in current, not current itself."), [["v=L di/dt", b("参考方向遵循被动符号约定。", "Uses passive sign convention.")], ["τRL=L/R", b("一阶 RL 电路的时间常数。", "Time constant of a first-order RL circuit.")]], b("0.5 H 电感两端维持 10 V，电流变化率是多少？", "10 V is maintained across a 0.5 H inductor."), [b("重排 di/dt=v/L。", "Rearrange."), b("代入 10/0.5。", "Substitute."), b("得到 20 A/s。", "Obtain 20 A/s.")], b("电流每秒增加 20 A。", "Current increases at 20 A/s.")),
  "eee-6": lesson(b("二极管主要允许单向电流。分段模型先假设导通或截止，求解后必须检查电压和电流方向是否支持这个假设。整流器利用这种单向性把交流变成脉动直流。", "A diode mainly permits one-way current. Piecewise models assume on/off, solve, then verify consistency. Rectifiers turn AC into pulsating DC."), b("把二极管看作由端电压控制的单向阀门；“先假设、再验证”比死记 0.7 V 更重要。", "Treat a diode as a voltage-controlled one-way valve; assume and verify rather than blindly applying 0.7 V."), [["VD≈0.7 V", b("硅二极管恒压降近似且处于正向导通。", "Constant-drop approximation for a conducting silicon diode.")], ["VDC≈2Vp/π", b("理想全波整流正弦的平均值。", "Average of an ideal full-wave rectified sine.")]], b("5 V 电源经 1 kΩ 电阻和正向硅二极管接地，求电流。", "A 5 V source drives a 1 kΩ resistor and forward silicon diode."), [b("假设二极管导通，VD≈0.7 V。", "Assume on."), b("电阻电压 5−0.7=4.3 V。", "Resistor drop is 4.3 V."), b("I=4.3/1000=4.3 mA，方向与正向假设一致。", "I=4.3 mA and verifies the assumption.")], b("电流约 4.3 mA。", "Current ≈4.3 mA.")),
  "eee-7": lesson(b("正弦稳态中，相量把微分方程变成复数代数。电阻、电感、电容分别用 R、jωL、1/(jωC) 表示阻抗。", "In sinusoidal steady state, phasors turn differential equations into complex algebra; impedances are R, jωL and 1/(jωC)."), b("相量保留振幅和相位，但省略共同的时间因子 e^(jωt)。它只适用于同一频率的稳态正弦量。", "A phasor keeps amplitude and phase while omitting the common time factor; it applies to same-frequency steady sinusoids."), [["ZL=jωL", b("电感电压超前电流 90°。", "Inductor voltage leads current by 90°.")], ["ZC=1/(jωC)=−j/(ωC)", b("电容电流超前电压 90°。", "Capacitor current leads voltage by 90°.")], ["V=IZ", b("交流相量形式的欧姆定律。", "Ohm's law in phasor form.")]], b("50 Hz、100 μF 电容的阻抗是多少？", "Find the impedance of 100 μF at 50 Hz."), [b("ω=2πf≈314 rad/s。", "ω≈314 rad/s."), b("C=100×10⁻⁶ F。", "Convert C."), b("ZC=−j/(314×100×10⁻⁶)≈−j31.8 Ω。", "Calculate.")], b("ZC≈−j31.8 Ω。", "ZC≈−j31.8 Ω.")),

  "c-0": lesson(b("程序由值、状态和控制流组成。变量保存状态，表达式计算新值，语句按明确顺序改变程序状态。", "Programs combine values, state and control flow. Variables hold state; expressions compute values; statements update state."), b("阅读程序时不要猜最终输出；逐行维护一张变量表。", "Do not guess output; maintain a variable table line by line."), [["name = expression;", b("赋值先计算右侧，再覆盖左侧变量。", "Evaluate the right side before overwriting the left.")], ["type name;", b("声明决定可存储的数据及其操作。", "A declaration determines the stored data and valid operations.")]], b("int x=3; x=x+2; 求 x。", "int x=3; x=x+2; find x."), [b("初始化后 x=3。", "Initially x=3."), b("右侧使用旧值：3+2=5。", "Right side uses old value."), b("把 5 写回 x。", "Store 5.")], b("x=5。", "x=5.")),
  "c-1": lesson(b("C 的类型决定内存表示、范围和运算规则。函数把输入参数、局部处理和返回值封装成可测试单元。", "C types determine representation, range and operation rules. Functions package inputs, processing and return values."), b("最常见陷阱是整数除法：两个 int 相除不会自动保留小数。", "A common trap is integer division: two ints do not preserve a fraction."), [["7/2=3", b("两个操作数为 int。", "Both operands are int.")], ["7/2.0=3.5", b("至少一个操作数为浮点类型。", "At least one operand is floating-point.")]], b("double mean(int a,int b){return (a+b)/2;} 对 2,3 返回什么？", "What does mean(2,3) return with (a+b)/2?"), [b("a+b=5，类型为 int。", "a+b is int 5."), b("5/2 执行整数除法得到 2。", "Integer division gives 2."), b("返回时再转成 double 只是 2.0。", "Conversion on return yields 2.0.")], b("返回 2.0；应把 2 改成 2.0。", "Returns 2.0; use 2.0 in the expression.")),
  "c-2": lesson(b("选择结构决定走哪条路径，循环结构重复执行。正确性取决于初始化、条件、更新三者共同保证终止和覆盖全部目标情况。", "Selection chooses a path; loops repeat. Correctness depends on initialisation, condition and update."), b("循环应像数学归纳：进入每轮前哪些条件始终成立？这个“循环不变量”帮助找边界错误。", "A loop invariant states what remains true before every iteration and exposes boundary errors."), [["for(init; condition; update)", b("先初始化，每轮先检查条件，执行后更新。", "Initialise once, test before each iteration, update afterward.")], ["i < n", b("数组长度 n 的典型边界；最后合法下标 n−1。", "Typical array bound; last valid index n−1.")]], b("sum=0; for(i=1;i<=4;i++) sum+=i; 求 sum。", "Trace sum from i=1 to 4."), [b("i 依次为 1,2,3,4。", "i takes 1,2,3,4."), b("sum 依次为 1,3,6,10。", "sum becomes 1,3,6,10."), b("i=5 时条件失败。", "At i=5 the condition fails.")], b("sum=10。", "sum=10.")),
  "c-3": lesson(b("数组在连续内存中保存同类型元素，字符串是以 '\\0' 结束的 char 数组。下标从 0 开始，程序员负责保证不越界。", "Arrays store same-type elements contiguously; a C string is a char array ending in '\\0'. Indices start at zero and bounds are manual."), b("数组名常退化为首元素地址，因此数组操作与指针密切相关，但数组本身不是可重新赋值的指针变量。", "An array name often decays to its first-element address, but the array itself is not a reassignable pointer."), [["valid index: 0…n−1", b("访问 a[n] 已越界。", "a[n] is out of bounds.")], ["strlen(s)", b("统计 '\\0' 之前字符数，不含终止符。", "Counts characters before '\\0'.")]], b("char s[4]={'c','a','t','\\0'}；strlen(s) 与 sizeof(s)？", "For char s[4]={'c','a','t','\\0'}, find strlen and sizeof."), [b("可见字符 c,a,t 共 3 个。", "Three visible characters."), b("strlen 不含 '\\0'，所以为 3。", "strlen is 3."), b("数组总共分配 4 个 char。", "The array contains four char slots.")], b("strlen(s)=3，sizeof(s)=4。", "strlen(s)=3, sizeof(s)=4.")),
  "c-4": lesson(b("结构体把不同类型字段组合成一个记录；文件把内存中的临时数据持久化。每次文件操作都应检查是否成功。", "Structs group fields of different types; files persist data. Every file operation should be checked."), b("结构体解决“这些值属于同一个对象”，文件流解决“这些字节从哪里来、到哪里去”。", "Structs model one object; streams model where bytes come from and go."), [["p.field", b("结构体变量访问成员。", "Member access on a struct value.")], ["ptr->field", b("结构体指针访问成员，等价于 (*ptr).field。", "Member access through a struct pointer.")], ["fopen(path,mode)", b("失败返回 NULL；使用后 fclose。", "Returns NULL on failure; close afterward.")]], b("Student s={\"Ana\",80}; Student *p=&s; p->mark+=5。", "Trace p->mark+=5."), [b("p 指向 s。", "p points to s."), b("p->mark 就是 s.mark。", "p->mark is s.mark."), b("80 加 5 后写回字段。", "Add and store.")], b("s.mark=85。", "s.mark=85.")),
  "c-5": lesson(b("指针保存地址，* 解引用访问该地址处的对象。动态内存来自堆，生命周期由 malloc/calloc 与 free 显式管理。", "Pointers store addresses; dereferencing accesses the object there. Heap memory is managed explicitly with allocation and free."), b("画内存图：变量盒子、地址箭头、动态数组区域。这样能区分“指针本身”和“它指向的值”。", "Draw a memory map to separate a pointer from the value it points to."), [["int *p=&x", b("p 保存 x 的地址；*p 是 x 的值。", "p stores x's address; *p is x's value.")], ["calloc(n,sizeof(T))", b("分配 n 个元素并清零；失败返回 NULL。", "Allocates and zeroes n elements; returns NULL on failure.")], ["free(p)", b("释放后不要再次解引用；可把 p 设为 NULL。", "Do not dereference after free; set p to NULL.")]], b("sizeof(int)=4，calloc(5,sizeof(int)) 分配多少字节？", "How many bytes does calloc(5,sizeof(int)) allocate if int is 4 bytes?"), [b("元素数 n=5。", "n=5."), b("每个元素 4 bytes。", "Each element is 4 bytes."), b("5×4=20，且五个元素初值为 0。", "Total 20 bytes and all are zeroed.")], b("20 bytes，p[0]…p[4] 初始为 0。", "20 bytes; p[0]…p[4] start at zero.")),
  "c-6": lesson(b("大型程序通过头文件声明接口、源文件实现功能，并用模块边界限制耦合。清晰接口让多个文件和多人协作仍可独立编译与测试。", "Large C programs separate interfaces in headers and implementations in source files, reducing coupling."), b("把模块看作黑盒：使用者只需要知道输入、输出和约定，不应依赖内部变量。", "Treat a module as a black box with inputs, outputs and contracts."), [["#include \"module.h\"", b("引入声明；头文件需要 include guard。", "Imports declarations; headers need include guards.")], ["static function", b("文件内部可见，避免泄漏实现细节。", "File-local visibility hides implementation details.")]], b("两个 .c 文件都定义同名非 static 函数会发生什么？", "What if two .c files define the same non-static function?"), [b("每个文件可单独编译。", "Each file may compile."), b("链接器发现两个外部定义。", "The linker finds duplicate external definitions."), b("违反 one-definition 要求。", "The definition is not unique.")], b("链接失败；内部辅助函数应考虑 static。", "Linking fails; internal helpers can be static.")),
  "c-7": lesson(b("命令行参数让程序从启动命令接收字符串。argc 是参数数量，argv 是字符串指针数组；argv[0] 通常是程序名。", "Command-line arguments are strings received at startup. argc is the count; argv is an array of string pointers; argv[0] is usually the program name."), b("所有参数最初都是文本，做数值运算前必须转换并验证。", "All arguments begin as text and must be converted and validated before arithmetic."), [["int main(int argc,char *argv[])", b("标准命令行入口形式。", "Standard command-line entry.")], ["argc >= required", b("访问 argv[k] 前先检查数量。", "Check the count before accessing argv[k].")]], b("运行 ./sum 4 7 时 argc 和 argv[1]？", "For ./sum 4 7, find argc and argv[1]."), [b("参数为程序名、4、7。", "Arguments are program name, 4 and 7."), b("因此 argc=3。", "argc=3."), b("argv[1] 是字符串 \"4\"。", "argv[1] is string \"4\".")], b("argc=3，argv[1]=\"4\"；转换后才是整数 4。", "argc=3 and argv[1]=\"4\"; convert before numeric use.")),

  "physics-0": lesson(b("运动学用位置 x、速度 v=dx/dt、加速度 a=dv/dt 描述运动，不讨论力的来源。正负号来自选择的坐标方向。", "Kinematics describes motion with position, velocity and acceleration without asking what force caused it. Signs come from the chosen axis."), b("位置—时间图的斜率是速度，速度—时间图的斜率是加速度，速度图下的有符号面积是位移。", "Slope of x–t is velocity; slope of v–t is acceleration; signed area under v–t is displacement."), [["v=u+at", b("仅适用于恒加速度。", "Constant acceleration only.")], ["s=ut+½at²", b("恒加速度，s 是位移不是总路程。", "Constant acceleration; s is displacement.")], ["v²=u²+2as", b("题目不含时间时常有用。", "Useful when time is absent.")]], b("u=6 m/s，a=2.5 m/s²，t=4 s，求位移。", "u=6 m/s, a=2.5 m/s², t=4 s."), [b("选正方向并列已知量。", "Choose direction and list data."), b("使用 s=ut+½at²。", "Use the displacement equation."), b("s=24+0.5×2.5×16=44 m。", "Calculate 44 m.")], b("位移 44 m；平均速度检查也得到 44 m。", "Displacement 44 m; average-velocity check agrees.")),
  "physics-1": lesson(b("测量值必须连同单位和不确定度报告。不确定度不是“错误”，而是根据仪器分辨率、重复测量和模型给出的可信范围。", "A measurement needs units and uncertainty. Uncertainty is not a mistake; it quantifies the credible range from instrument, repetition and model."), b("结果的有效数字应与不确定度匹配；写很多小数不会创造精度。", "Significant figures should match uncertainty; extra decimals do not create precision."), [["z=x±Δx", b("绝对不确定度与量相同单位。", "Absolute uncertainty has the same unit.")], ["relative=Δx/|x|", b("比较不同大小测量时使用。", "Use to compare measurements of different scale.")], ["product: % uncertainties add", b("课程常用保守近似规则。", "Common conservative course rule.")]], b("L=(12.0±0.2) cm，W=(5.0±0.1) cm，求面积不确定度。", "Find area uncertainty from L=(12.0±0.2), W=(5.0±0.1)."), [b("A=60.0 cm²。", "A=60.0 cm²."), b("相对不确定度 0.2/12+0.1/5≈0.0367。", "Relative uncertainty ≈0.0367."), b("ΔA=60×0.0367≈2.2 cm²。", "ΔA≈2.2 cm².")], b("A=(60.0±2.2) cm²，按课程规则报告。", "A=(60.0±2.2) cm² under the course rule.")),
  "physics-2": lesson(b("实验前准备不是背步骤，而是提前建立“现象—模型—变量—预测—检验”的链条，并识别安全要求和数据记录方式。", "Pre-class preparation builds a phenomenon–model–variables–prediction–test chain and identifies safety and data recording."), b("真正准备好意味着设备一到手就知道要改变什么、测量什么、画什么图以及怎样判断模型失败。", "Being prepared means knowing what to vary, measure, plot and how to detect model failure."), [["independent variable", b("主动改变或分组比较的量。", "The quantity deliberately changed.")], ["dependent variable", b("响应并被测量的量。", "The measured response.")], ["control variables", b("为公平比较而保持不变的条件。", "Conditions held fixed for a fair test.")]], b("测试摆长是否影响周期，应怎样设计变量？", "Design variables to test whether pendulum length affects period."), [b("自变量：摆长；因变量：周期。", "Independent: length; dependent: period."), b("控制摆球质量、小角度和测量方法。", "Control mass, small angle and timing method."), b("每个摆长测多次周期并取平均。", "Repeat and average at each length.")], b("画 T² 对 L 图可检验线性模型。", "Plot T² against L to test the linear model.")),
  "physics-3": lesson(b("力是相互作用，合力决定加速度而不是速度。受力图只画作用在研究对象上的外力，每个箭头要有来源和方向。", "A force is an interaction; net force determines acceleration, not velocity. A free-body diagram contains only external forces on the chosen object."), b("先隔离对象，再画重力、支持力、拉力、摩擦等；最后按坐标方向分解并写 ΣF=ma。", "Isolate the object, draw forces, resolve components, then write ΣF=ma."), [["ΣF=ma", b("矢量方程；每个坐标方向分别写。", "A vector equation written by components.")], ["fs≤μsN", b("静摩擦会适应到上限，不总等于 μsN。", "Static friction adjusts up to its maximum.")], ["fk=μkN", b("滑动摩擦近似模型。", "Kinetic-friction model.")]], b("2 kg 物块在水平面受 10 N 右拉、摩擦 4 N，求加速度。", "A 2 kg block has 10 N right and 4 N friction left."), [b("竖直方向 N 与 mg 抵消。", "Vertical forces cancel."), b("水平合力 10−4=6 N 向右。", "Net horizontal force is 6 N right."), b("a=6/2=3 m/s²。", "a=3 m/s².")], b("加速度为 3 m/s² 向右。", "Acceleration is 3 m/s² right.")),
  "physics-4": lesson(b("物理建模把现实系统简化为可计算的对象。关键是明确边界、假设、守恒量和模型有效范围，再用数据检查预测。", "Physical modelling simplifies a real system into a calculable one by declaring boundaries, assumptions, conservation laws and validity range."), b("一个结果即使计算正确，也可能因为忽略空气阻力、把物体当质点或假设恒加速度而不适用于现实。", "A calculation can be algebraically correct yet physically invalid because its assumptions fail."), [["model → prediction → data → revision", b("模型必须接受证据检验。", "A model must face evidence.")], ["dimension check", b("等式两边量纲必须一致，但一致不保证模型一定正确。", "Dimensions must agree, though agreement alone does not prove the model.")]], b("自由落体模型预测 2 s 位移 19.6 m；何时需要修正？", "A free-fall model predicts 19.6 m in 2 s. When must it be revised?"), [b("列假设：近地面、初速零、忽略空气阻力、g 恒定。", "List assumptions."), b("比较对象形状、速度和距离是否支持假设。", "Check object, speed and distance."), b("若空气阻力显著，需加入速度相关阻力。", "Add drag if it is significant.")], b("模型结果只在假设成立的范围内可信。", "The prediction is credible only within the model assumptions.")),
  "physics-5": lesson(b("实验数据分析通过图表、斜率、截距、拟合和残差判断模型。不要只看 R²；还要检查残差是否随机、单位是否正确以及异常点是否有物理原因。", "Experimental analysis uses plots, slope, intercept, fits and residuals. Do not rely on R² alone; inspect residual structure, units and outliers."), b("选坐标轴时尽量把理论关系线性化，因为直线的斜率和截距通常直接对应物理参数。", "Choose axes that linearise theory so slope and intercept map directly to physical parameters."), [["gradient=Δy/Δx", b("用拟合线上的远点，不要随意用相邻原始点。", "Use well-separated points on the fit line.")], ["residual=ydata−ymodel", b("随机散布支持模型；系统弯曲提示模型缺项。", "Random scatter supports the model; curvature suggests missing physics.")]], b("F–x 数据从 (0.02 m,0.5 N) 到 (0.08 m,2.0 N)，求弹簧常量。", "Find k from F–x points (0.02,0.5) and (0.08,2.0)."), [b("胡克定律 F=kx，纵轴 F 对横轴 x 的斜率就是 k。", "Under F=kx, slope is k."), b("ΔF=1.5 N，Δx=0.06 m。", "Compute differences."), b("k=1.5/0.06=25 N/m。", "k=25 N/m.")], b("弹簧常量 25 N/m；检查各点 F/x 接近 25。", "k=25 N/m; F/x checks the model.")),
  "physics-6": lesson(
    b("热量是因为温差而跨越系统边界传递的能量；温度反映热状态，内能是系统微观动能与势能的总和。三者不能混为一谈。", "Heat is energy transferred across a system boundary because of a temperature difference. Temperature describes thermal state; internal energy is microscopic kinetic and potential energy."),
    b("先圈出研究系统，再追踪能量从哪里来、到哪里去。理想量热器里，一个物体放出的能量等于另一个物体吸收的能量。", "Draw a boundary around the system and track where energy comes from and goes. In ideal calorimetry, energy lost by one body is gained by another."),
    [["Q=mcΔT", b("无相变、比热容在温区内近似恒定；ΔT 可用 K 或 °C 的温差。", "No phase change and approximately constant c; temperature differences may use K or °C.")], ["Q=mL", b("相变潜热；理想相变阶段温度保持不变。", "Latent heat during a phase change at constant temperature.")], ["ΔU=Q+W", b("先声明课程采用的功正号约定。", "State the course sign convention for work.")]],
    b("0.20 kg 水从 20°C 加热到 35°C，c=4180 J kg⁻¹ K⁻¹。求吸收热量。", "Heat 0.20 kg of water from 20°C to 35°C, with c=4180 J kg⁻¹ K⁻¹."),
    [b("列已知量：m=0.20 kg，ΔT=15 K。", "List m=0.20 kg and ΔT=15 K."), b("选 Q=mcΔT，因为没有相变。", "Use Q=mcΔT because there is no phase change."), b("Q=0.20×4180×15=12,540 J。", "Calculate 12,540 J.")],
    b("水吸收约 1.25×10⁴ J；正号表示能量进入所选系统。", "The water gains about 1.25×10⁴ J; the positive sign means energy enters the chosen system."),
  ),
  "physics-7": lesson(
    b("电势差是单位电荷的能量变化，电流是电荷流率。电路方程中的正负号来自你选择的电压极性和电流参考方向，而不是元件本身自带。", "Potential difference is energy change per charge; current is charge-flow rate. Signs come from chosen voltage polarities and current references."),
    b("先画节点、箭头和极性，再写守恒方程。算出负电流通常表示真实方向与参考箭头相反，并不自动意味着错误。", "Mark nodes, arrows and polarities before conservation equations. A negative result often means the actual direction opposes the reference arrow."),
    [["V=IR", b("仅用于给定工作区内的欧姆元件。", "For an ohmic element in its stated operating range.")], ["ΣI=0", b("KCL 来自电荷守恒。", "KCL follows charge conservation.")], ["P=VI=I²R=V²/R", b("后两式用于电阻；功率符号须配合被动符号约定。", "The latter forms are for resistors; interpret sign with the passive convention.")]],
    b("12 V 电源接 4 Ω 电阻，求电流与电阻功率。", "A 12 V source is across a 4 Ω resistor. Find current and resistor power."),
    [b("按电压降方向定义电流，I=V/R。", "Define current with the voltage drop and use I=V/R."), b("I=12/4=3 A。", "I=3 A."), b("P=VI=12×3=36 W，并用 V²/R 复核。", "P=36 W and V²/R confirms it.")],
    b("电流 3 A，电阻吸收功率 36 W。", "Current 3 A; the resistor absorbs 36 W."),
  ),
  "physics-8": lesson(
    b("简谐运动的回复力与位移成正比、方向相反；波把振动状态和能量传播出去，介质粒子只在平衡位置附近振动。", "In SHM, restoring force is proportional and opposite to displacement. A wave transports disturbance and energy while medium particles oscillate locally."),
    b("把单个振子随时间的正弦变化，复制到不同位置并加入相位延迟，就得到行波。频率由波源决定，波速主要由介质决定，波长负责把二者连接。", "A travelling wave is a sinusoidal oscillator copied across space with phase delay. Source sets frequency, medium largely sets speed, and wavelength connects them."),
    [["T=1/f", b("周期和频率互为倒数，单位分别为 s 和 Hz。", "Period and frequency are reciprocals, in s and Hz.")], ["v=fλ", b("适用于周期波；单位必须统一。", "For periodic waves with consistent units.")], ["a=−ω²x", b("简谐运动条件；负号表示指向平衡位置。", "SHM condition; the sign points toward equilibrium.")]],
    b("频率 5.0 Hz 的波在绳上以 12 m/s 传播，求波长。", "A 5.0 Hz wave travels at 12 m/s. Find wavelength."),
    [b("从 v=fλ 重排 λ=v/f。", "Rearrange λ=v/f."), b("代入 12 m/s ÷ 5.0 s⁻¹。", "Substitute 12/5.0."), b("λ=2.4 m。", "λ=2.4 m.")],
    b("波长 2.4 m；检查 fλ=12 m/s。", "Wavelength 2.4 m; fλ returns 12 m/s."),
  ),
  "physics-9": lesson(
    b("静止流体的压强由深度决定；流动流体还要考虑质量守恒和机械能。连续性方程连接截面积与速度，伯努利方程连接压强、速度和高度。", "Static-fluid pressure depends on depth. Flow also requires mass conservation and mechanical energy; continuity links area and speed, while Bernoulli links pressure, speed and height."),
    b("窄管段不是“把水挤慢”，而是在不可压缩稳态条件下必须让同样体积每秒通过更小面积，所以速度增加。理想伯努利再说明这种速度增加如何与压强或高度交换。", "In steady incompressible flow, the same volume per second must cross a smaller area, so speed rises. Ideal Bernoulli relates that speed change to pressure or height."),
    [["Δp=ρgΔh", b("静止、密度近似恒定的流体。", "Static fluid of approximately constant density.")], ["A₁v₁=A₂v₂", b("稳态、不可压缩的一维流动。", "Steady incompressible one-dimensional flow.")], ["p+½ρv²+ρgh=constant", b("同一流线上、稳态、不可压缩且黏性损失可忽略。", "Along a streamline for steady incompressible flow with negligible losses.")]],
    b("水平管道面积从 4.0 cm² 缩到 1.0 cm²，入口流速 0.50 m/s。求窄处流速。", "A horizontal pipe narrows from 4.0 cm² to 1.0 cm²; inlet speed is 0.50 m/s."),
    [b("使用连续性 A₁v₁=A₂v₂。", "Use continuity."), b("面积比 A₁/A₂=4。", "The area ratio is 4."), b("v₂=(A₁/A₂)v₁=4×0.50=2.0 m/s。", "v₂=2.0 m/s.")],
    b("窄处流速 2.0 m/s；面积缩小四倍，速度增大四倍。", "Narrow-section speed 2.0 m/s; one-quarter area gives four-times speed."),
  ),
};

function lesson(
  definition: LessonBi,
  intuition: LessonBi,
  formulas: Array<[string, LessonBi]>,
  prompt: LessonBi,
  steps: LessonBi[],
  answer: LessonBi,
): DeepLesson {
  return {
    duration: 30,
    definition,
    intuition,
    terms: [
      { term: "Core idea", meaning: definition },
      { term: "Model meaning", meaning: intuition },
    ],
    formulas: formulas.map(([expression, condition]) => ({ expression, condition })),
    example: { prompt, steps, answer },
    traps: [
      b("看到数字就代公式，没有先说明变量、方向、单位和适用条件。", "Substituting numbers before defining variables, directions, units and conditions."),
      b("只记最终公式，不检查结果的数量级、单位或物理/程序意义。", "Memorising a formula without checking scale, units or meaning."),
      b("看懂例题后立即认为会做，没有合上解析独立重做。", "Mistaking recognition for mastery instead of re-solving independently."),
    ],
    checkpoint: {
      question: b("你能不用看解析，说出本节公式何时不能用，并解释一个符号的含义吗？", "Can you state when a formula from this section cannot be used and explain one symbol without notes?"),
      answer: b("如果不能，请回到“定义与适用条件”，再用自己的话写一遍；能说清条件才算真正会用公式。", "If not, return to definitions and conditions and rewrite them in your own words; knowing conditions is part of knowing the formula."),
    },
  };
}
