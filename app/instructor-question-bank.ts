import type { AnswerToolKind } from "./answer-workspace";
import type { LearningVisualIntent } from "./question-visuals";
import type { LocalizedText, TopicQuestion } from "./topic-questions";

const b = (zh: string, en: string): LocalizedText => ({ zh, en });

export type InstructorResponseMode =
  | "single-choice"
  | "multi-select"
  | "worked-response"
  | "proof"
  | "error-analysis";

export type InstructorQuestion = TopicQuestion & {
  difficulty: "instructor";
  responseMode: InstructorResponseMode;
  cognitiveRole:
    | "multi-step-calculation"
    | "representation"
    | "geometric-reasoning"
    | "definition-boundary"
    | "error-analysis"
    | "proof"
    | "transfer";
  estimatedMinutes: number;
  answerTools: AnswerToolKind[];
  rubric: {
    zh: string[];
    en: string[];
  };
  /**
   * This is deliberately explicit rather than inferred from topicId. A
   * question receives a drawing only when the drawing represents its data.
   */
  learningVisual?: LearningVisualIntent;
};

/**
 * Evidence extracted from "Practice questions on vectors and 3D space.pdf".
 * These observations describe the assessment style; the questions below are
 * newly authored and do not reproduce the worksheet wording or values.
 */
export const instructorDifficultyProfile = {
  sourceDocument: "Practice questions on vectors and 3D space.pdf",
  observedNumberedQuestions: 45,
  observedPagesWithContent: 12,
  progression: [
    b(
      "坐标、投影和坐标平面 → 空间曲面与区域 → 向量运算与作图 → 点积、夹角、正交与投影。",
      "Coordinates, projections and coordinate planes → spatial surfaces and regions → vector operations and sketches → dot products, angles, orthogonality and projections.",
    ),
  ],
  assessmentTraits: [
    b(
      "一个题号常含多个相互依赖的小问，后一步需要使用前一步的结果。",
      "A numbered problem often contains dependent subparts whose later steps use earlier results.",
    ),
    b(
      "不仅求数值，还要求画图、选择正确三维图、用文字描述集合，或说明分类理由。",
      "Students must do more than calculate: sketch, identify a 3D view, describe a set in words, or justify a classification.",
    ),
    b(
      "常见陷阱包括把有向分量当距离、混淆轴与平面、忽略向量/标量类型，以及漏掉含参数方程的多个解。",
      "Common traps include treating signed components as distances, confusing axes with planes, mixing vector and scalar types, and missing roots in parameter equations.",
    ),
    b(
      "图形和符号信息是题目条件的一部分，必须从图中读取方向、角度、端点或相等长度。",
      "Diagrams and notation carry givens: direction, angle, endpoints and equal-length markings must be read from the figure.",
    ),
  ],
} as const;

export const instructorVectorQuestionBank: InstructorQuestion[] = [
  {
    id: "math-0-instructor-01",
    courseId: "math",
    topicId: "math-0",
    kind: "calculation",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 7,
    answerTools: ["scientific-calculator", "diagram-board"],
    question: b(
      "长方体的各面与坐标平面平行，A=(-2,1,3) 与 B=(4,5,-1) 是一对相对顶点。哪一组同时正确给出三条边长、空间对角线长度和 AB 中点？",
      "A rectangular box has faces parallel to the coordinate planes. A=(-2,1,3) and B=(4,5,-1) are opposite vertices. Which set correctly gives the three side lengths, the space diagonal and the midpoint of AB?",
    ),
    options: [
      b("边长 6,4,4；对角线 2√17；中点 (1,3,1)", "Sides 6,4,4; diagonal 2√17; midpoint (1,3,1)"),
      b("边长 2,6,2；对角线 2√11；中点 (2,4,2)", "Sides 2,6,2; diagonal 2√11; midpoint (2,4,2)"),
      b("边长 6,4,-4；对角线 6；中点 (1,3,1)", "Sides 6,4,-4; diagonal 6; midpoint (1,3,1)"),
      b("边长 6,4,4；对角线 14；中点 (1,3,-2)", "Sides 6,4,4; diagonal 14; midpoint (1,3,-2)"),
    ],
    answer: 0,
    visual: {
      kind: "table",
      title: b("相对顶点坐标", "Opposite-vertex coordinates"),
      columns: [b("点", "Point"), b("x", "x"), b("y", "y"), b("z", "z")],
      rows: [["A", "-2", "1", "3"], ["B", "4", "5", "-1"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "三维坐标中 A 到 B 的位移向量为 (6,4,-4)，各分量对应长方体三条互相垂直的边。",
        "In 3D coordinates, the displacement from A to B is (6,4,-4); its components correspond to three mutually perpendicular box edges.",
      ),
      caption: b(
        "旋转视图辨认三个坐标方向；边长取分量的绝对值。",
        "Rotate the view to identify all three coordinate directions; side lengths are absolute component differences.",
      ),
      vectors: [
        { label: "A", value: [-2, 1, 3], color: "#64748b" },
        { label: "B", value: [4, 5, -1], color: "#2563eb" },
        { label: "AB", value: [6, 4, -4], color: "#e11d48" },
      ],
      spatial: {
        mode: "box",
        points: [
          { label: "A", value: [-2, 1, 3], color: "#64748b" },
          { label: "B", value: [4, 5, -1], color: "#2563eb" },
        ],
      },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜把“相对顶点”翻译成位移\n从 A 到 B 的位移为 B-A=(4-(-2),5-1,-1-3)=(6,4,-4)。\n\n第 2 步｜区分分量与长度\n长方体边长不能为负，所以三条边长是 |6|、|4|、|-4|，即 6,4,4。负号只表示 z 方向向下。\n\n第 3 步｜求空间对角线\n对角线就是向量 AB 的长度：|AB|=√(6²+4²+(-4)²)=√68=2√17。\n\n第 4 步｜求中点\n逐坐标取平均：M=((-2+4)/2,(1+5)/2,(3+(-1))/2)=(1,3,1)。\n\n第 5 步｜交叉检查\n对角线应大于最长边 6，又小于三边和 14；2√17≈8.25，合理。\n\n结论\n选 A。完整得分需要同时写出位移、绝对值边长、三维勾股计算和中点。",
      "Step 1 | Translate opposite vertices into a displacement\nAB=B-A=(4-(-2),5-1,-1-3)=(6,4,-4).\n\nStep 2 | Separate components from lengths\nA box edge cannot have negative length. The sides are |6|, |4| and |-4|: 6,4,4. The minus sign only indicates decreasing z.\n\nStep 3 | Find the space diagonal\nThe diagonal is |AB|=√(6²+4²+(-4)²)=√68=2√17.\n\nStep 4 | Find the midpoint\nAverage corresponding coordinates: M=((-2+4)/2,(1+5)/2,(3+(-1))/2)=(1,3,1).\n\nStep 5 | Cross-check\nThe diagonal should exceed the longest side 6 but be below 6+4+4=14. Since 2√17≈8.25, it is plausible.\n\nConclusion\nChoose A. Full credit requires the displacement, absolute side lengths, 3D Pythagoras and midpoint.",
    ),
    rubric: {
      zh: ["1 分：正确求 B-A", "1 分：边长取绝对值", "2 分：对角线计算与化简", "1 分：中点", "1 分：合理性检查"],
      en: ["1: correct B-A", "1: absolute side lengths", "2: diagonal calculation and simplification", "1: midpoint", "1: reasonableness check"],
    },
  },
  {
    id: "math-0-instructor-02",
    courseId: "math",
    topicId: "math-0",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "representation",
    estimatedMinutes: 6,
    answerTools: ["scientific-calculator", "diagram-board"],
    question: b(
      "区域 S 由 x²+z²≤25 且 -1≤y≤3 定义。多选：哪些描述正确？",
      "The region S is defined by x²+z²≤25 and -1≤y≤3. Select every correct description.",
    ),
    options: [
      b("S 中的点到 y 轴的距离不超过 5", "Every point in S is at distance at most 5 from the y-axis"),
      b("S 是以 z 轴为轴、半径 5 的无限圆柱", "S is an infinite cylinder of radius 5 around the z-axis"),
      b("S 的体积是 100π", "The volume of S is 100π"),
      b("平面 y=-1 与 y=3 上的端面不属于 S", "The end faces in y=-1 and y=3 are excluded from S"),
    ],
    answer: [0, 2],
    visual: {
      kind: "table",
      title: b("约束与几何含义", "Constraints and geometric clues"),
      columns: [b("约束", "Constraint"), b("需要识别的量", "Quantity to identify")],
      rows: [["x²+z²≤25", "distance from y-axis"], ["-1≤y≤3", "extent along y"]],
    },
    explanation: b(
      "第 1 步｜识别缺少哪个坐标\nx²+z² 中没有 y，所以截面会沿 y 方向延伸；圆柱轴是 y 轴，不是 z 轴。\n\n第 2 步｜把平方和解释成距离\n点 (x,y,z) 到 y 轴的最短距离是 √(x²+z²)。因此 x²+z²≤25 等价于距离 y 轴不超过 5，A 正确。\n\n第 3 步｜使用第二个约束截断圆柱\n-1≤y≤3 把无限圆柱截成高度 3-(-1)=4 的实心圆柱，所以 B 错误。\n\n第 4 步｜计算体积\n底面积为 πr²=25π，高为 4，体积 V=25π×4=100π，C 正确。\n\n第 5 步｜检查边界符号\n≤ 表示边界包含在内，所以两个端面都属于 S，D 错误。\n\n结论\n选择 A、C。易错点是看到 x²+z² 就误以为轴是 z；真正的轴对应“没有出现”的坐标。",
      "Step 1 | Identify the missing coordinate\nThe expression x²+z² omits y, so the cross-section extends along y. The axis is the y-axis, not the z-axis.\n\nStep 2 | Interpret the sum of squares as distance\nDistance from (x,y,z) to the y-axis is √(x²+z²). Thus x²+z²≤25 means distance at most 5, so A is correct.\n\nStep 3 | Use the second constraint to cap the cylinder\n-1≤y≤3 cuts the infinite cylinder to height 3-(-1)=4, so B is false.\n\nStep 4 | Calculate volume\nBase area is πr²=25π and height is 4, hence V=100π. C is correct.\n\nStep 5 | Read the boundary symbols\nThe ≤ signs include both end faces, so D is false.\n\nConclusion\nSelect A and C. A common trap is to call z the axis because z appears; the axis is the omitted coordinate.",
    ),
    rubric: {
      zh: ["1 分：识别 y 轴", "1 分：说明距离公式", "1 分：高度为 4", "1 分：体积", "1 分：解释闭边界"],
      en: ["1: y-axis identified", "1: distance formula explained", "1: height 4", "1: volume", "1: closed boundaries explained"],
    },
  },
  {
    id: "math-0-instructor-03",
    courseId: "math",
    topicId: "math-0",
    kind: "calculation",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 7,
    answerTools: ["scientific-calculator", "diagram-board"],
    question: b(
      "球心为 C=(2,-1,4)，且球面经过 A=(-1,3,4)。哪一项同时给出正确的标准方程与展开方程？",
      "A sphere has centre C=(2,-1,4) and passes through A=(-1,3,4). Which option gives both the correct standard and expanded equations?",
    ),
    options: [
      b("(x+2)²+(y-1)²+(z+4)²=25；x²+y²+z²+4x-2y+8z-4=0", "(x+2)²+(y-1)²+(z+4)²=25; x²+y²+z²+4x-2y+8z-4=0"),
      b("(x-2)²+(y+1)²+(z-4)²=25；x²+y²+z²-4x+2y-8z-4=0", "(x-2)²+(y+1)²+(z-4)²=25; x²+y²+z²-4x+2y-8z-4=0"),
      b("(x-2)²+(y+1)²+(z-4)²=5；x²+y²+z²-4x+2y-8z+16=0", "(x-2)²+(y+1)²+(z-4)²=5; x²+y²+z²-4x+2y-8z+16=0"),
      b("(x-2)²+(y-1)²+(z-4)²=25；x²+y²+z²-4x-2y-8z-4=0", "(x-2)²+(y-1)²+(z-4)²=25; x²+y²+z²-4x-2y-8z-4=0"),
    ],
    answer: 1,
    visual: {
      kind: "table",
      title: b("球的已知数据", "Sphere data"),
      columns: [b("角色", "Role"), b("点", "Point")],
      rows: [["centre C", "(2,-1,4)"], ["point A on sphere", "(-1,3,4)"]],
    },
    explanation: b(
      "第 1 步｜由球心和球面点求半径\nCA=A-C=(-3,4,0)，所以 r=|CA|=√(9+16)=5，方程右侧要写 r²=25，而不是 5。\n\n第 2 步｜写标准形式\n球心 (h,k,l) 的方程是 (x-h)²+(y-k)²+(z-l)²=r²。代入 C=(2,-1,4)：(x-2)²+(y+1)²+(z-4)²=25。\n\n第 3 步｜逐项展开\n(x-2)²=x²-4x+4；(y+1)²=y²+2y+1；(z-4)²=z²-8z+16。\n\n第 4 步｜合并常数\n左侧常数为 4+1+16=21。移去右侧 25 后得到 21-25=-4，因此 x²+y²+z²-4x+2y-8z-4=0。\n\n第 5 步｜代点验证\n把球心代入标准式左侧得到 0；把 A 代入得到 9+16+0=25。两项检查都通过。\n\n结论\n选 B。最常见错误是球心符号写反或把半径 r 写在右侧而不是 r²。",
      "Step 1 | Find the radius from the centre and a surface point\nCA=A-C=(-3,4,0), so r=√(9+16)=5. The equation uses r²=25, not 5.\n\nStep 2 | Write standard form\nA sphere centred at (h,k,l) satisfies (x-h)²+(y-k)²+(z-l)²=r². Thus (x-2)²+(y+1)²+(z-4)²=25.\n\nStep 3 | Expand each square\n(x-2)²=x²-4x+4, (y+1)²=y²+2y+1 and (z-4)²=z²-8z+16.\n\nStep 4 | Combine constants\nThe left constants total 21. Moving 25 left gives 21-25=-4, hence x²+y²+z²-4x+2y-8z-4=0.\n\nStep 5 | Verify with the data\nThe centre makes the standard-form left side zero. Point A gives 9+16+0=25.\n\nConclusion\nChoose B. The usual traps are reversing centre signs and putting r rather than r² on the right.",
    ),
    rubric: {
      zh: ["2 分：半径", "2 分：标准式及符号", "2 分：正确展开", "1 分：代点验证"],
      en: ["2: radius", "2: standard form and signs", "2: correct expansion", "1: point substitution check"],
    },
  },
  {
    id: "math-0-instructor-04",
    courseId: "math",
    topicId: "math-0",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "proof",
    cognitiveRole: "geometric-reasoning",
    estimatedMinutes: 8,
    answerTools: ["scientific-calculator", "coordinate-board"],
    question: b(
      "给定 P=(1,-1,2)、Q=(5,2,2)、R=(-2,3,2)。哪一项对三角形 PQR 的分类和理由都正确？",
      "Let P=(1,-1,2), Q=(5,2,2) and R=(-2,3,2). Which classification of triangle PQR is supported by a correct justification?",
    ),
    options: [
      b("Q 处为等腰直角三角形，因为 |QR|=|PQ|=5", "Right isosceles at Q because |QR|=|PQ|=5"),
      b("等边三角形，因为三点的 z 坐标相同", "Equilateral because all three points have the same z-coordinate"),
      b("P 处为等腰直角三角形，因为 PQ·PR=0 且 |PQ|=|PR|=5", "Right isosceles at P because PQ·PR=0 and |PQ|=|PR|=5"),
      b("不能分类，因为三维中的点积不能判断直角", "It cannot be classified because dot products cannot identify right angles in 3D"),
    ],
    answer: 2,
    visual: {
      kind: "table",
      title: b("顶点坐标", "Vertex coordinates"),
      columns: [b("点", "Point"), b("x", "x"), b("y", "y"), b("z", "z")],
      rows: [["P", "1", "-1", "2"], ["Q", "5", "2", "2"], ["R", "-2", "3", "2"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "从 P 发出的 PQ=(4,3,0) 与 PR=(-3,4,0) 长度相等且互相垂直，QR=(-7,1,0) 为斜边。",
        "From P, PQ=(4,3,0) and PR=(-3,4,0) have equal length and are perpendicular; QR=(-7,1,0) is the hypotenuse.",
      ),
      caption: b(
        "同一 z 坐标只说明三点共面；直角和等腰仍需分别验证。",
        "A common z-coordinate only proves coplanarity; right angle and equal sides still require separate checks.",
      ),
      vectors: [
        { label: "PQ", value: [4, 3, 0], color: "#2563eb" },
        { label: "PR", value: [-3, 4, 0], color: "#e11d48" },
        { label: "QR", value: [-7, 1, 0], color: "#059669" },
      ],
      spatial: {
        mode: "triangle",
        points: [
          { label: "P", value: [1, -1, 2], color: "#2563eb" },
          { label: "Q", value: [5, 2, 2], color: "#e11d48" },
          { label: "R", value: [-2, 3, 2], color: "#059669" },
        ],
      },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜统一起点\n要判断 P 处的夹角，必须使用都从 P 出发的向量：PQ=Q-P=(4,3,0)，PR=R-P=(-3,4,0)。\n\n第 2 步｜判断直角\nPQ·PR=4(-3)+3(4)+0=0。两个向量都非零，所以 P 处夹角为 90°。\n\n第 3 步｜判断等腰\n|PQ|=√(4²+3²)=5；|PR|=√((-3)²+4²)=5。因此与直角相邻的两边相等。\n\n第 4 步｜用第三边检查\nQR=R-Q=(-7,1,0)，|QR|=√50=5√2。这也满足直角等腰三角形的斜边关系 5√2。\n\n第 5 步｜排除干扰理由\n三个 z 坐标相等只表示三角形位于平面 z=2，并不能推出三边相等。\n\n结论\n选 C：P 处的等腰直角三角形。分类题必须把“直角证据”和“等边证据”分别写出。",
      "Step 1 | Use a common initial point\nTo test the angle at P, use vectors starting at P: PQ=(4,3,0) and PR=(-3,4,0).\n\nStep 2 | Test the right angle\nPQ·PR=4(-3)+3(4)+0=0. Both are non-zero, so the angle at P is 90°.\n\nStep 3 | Test equal sides\n|PQ|=√(4²+3²)=5 and |PR|=√((-3)²+4²)=5. The two legs adjacent to the right angle are equal.\n\nStep 4 | Check the third side\nQR=(-7,1,0), so |QR|=√50=5√2, matching the hypotenuse of a right isosceles triangle with legs 5.\n\nStep 5 | Reject the distractor reasoning\nEqual z-coordinates only place the triangle in z=2; they do not make its sides equal.\n\nConclusion\nChoose C: right isosceles at P. A complete classification needs separate evidence for the right angle and equal sides.",
    ),
    rubric: {
      zh: ["1 分：同起点向量", "2 分：点积为零", "2 分：两边长度", "1 分：第三边复核", "1 分：完整分类"],
      en: ["1: common-origin vectors", "2: zero dot product", "2: side lengths", "1: third-side check", "1: complete classification"],
    },
  },
  {
    id: "math-0-instructor-05",
    courseId: "math",
    topicId: "math-0",
    kind: "calculation",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "representation",
    estimatedMinutes: 6,
    answerTools: ["scientific-calculator", "diagram-board"],
    question: b(
      "点 X=(-4,6,-3)。哪一组依次正确给出：X 在 yz 平面的正投影、X 到 x 轴的距离、离 X 最近的坐标平面？",
      "For X=(-4,6,-3), which option correctly gives, in order: the orthogonal projection onto the yz-plane, the distance to the x-axis, and the nearest coordinate plane?",
    ),
    options: [
      b("(-4,0,-3)；4；yz 平面", "(-4,0,-3); 4; the yz-plane"),
      b("(0,6,-3)；√61；xz 平面", "(0,6,-3); √61; the xz-plane"),
      b("(-4,6,0)；5；xy 平面", "(-4,6,0); 5; the xy-plane"),
      b("(0,6,-3)；3√5；xy 平面", "(0,6,-3); 3√5; the xy-plane"),
    ],
    answer: 3,
    visual: {
      kind: "table",
      title: b("坐标平面与缺失坐标", "Coordinate planes and omitted coordinates"),
      columns: [b("平面", "Plane"), b("方程", "Equation"), b("点到平面的距离", "Point-to-plane distance")],
      rows: [["xy", "z=0", "|z|"], ["yz", "x=0", "|x|"], ["xz", "y=0", "|y|"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "点 X=(-4,6,-3) 沿 x 方向垂直投到 yz 平面，投影为 (0,6,-3)。虚线只改变 x 坐标，y、z 保持不变。",
        "Point X=(-4,6,-3) projects perpendicularly along the x direction onto the yz-plane at (0,6,-3). The dashed segment changes only x; y and z stay fixed.",
      ),
      caption: b(
        "投影到 yz 平面：令 x=0。不要把“到 x 轴的距离”误读为 |x|；它要由 y、z 两个分量组成直角三角形。",
        "Projection onto the yz-plane means set x=0. Do not confuse this with distance to the x-axis, which uses the y and z components as perpendicular legs.",
      ),
      vectors: [{ label: "X", value: [-4, 6, -3], color: "#2563eb" }],
      spatial: {
        mode: "coordinate-projection",
        plane: "yz",
        points: [{ label: "X", value: [-4, 6, -3], color: "#2563eb" }],
      },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜投影到 yz 平面\n在 yz 平面上必须 x=0；正投影保留 y、z，所以得到 (0,6,-3)。\n\n第 2 步｜距离到 x 轴\nx 轴上的点形如 (t,0,0)。到 x 轴的垂直距离只由 y、z 决定：d=√(y²+z²)=√(6²+(-3)²)=√45=3√5。\n\n第 3 步｜比较到三个坐标平面的距离\n到 yz、xz、xy 平面的距离分别为 |x|=4、|y|=6、|z|=3。最小值是 3，所以最近的是 xy 平面。\n\n第 4 步｜概念检查\n“投影到 yz 平面”是把 x 变成 0；“到 x 轴距离”却要删除 x 分量后求剩余分量的长度。两种操作相关但答案形式不同。\n\n结论\n选 D。",
      "Step 1 | Project onto the yz-plane\nThe yz-plane requires x=0. Orthogonal projection retains y and z, giving (0,6,-3).\n\nStep 2 | Find distance to the x-axis\nA point on the x-axis has form (t,0,0). Perpendicular distance depends only on y and z: d=√(6²+(-3)²)=√45=3√5.\n\nStep 3 | Compare distances to coordinate planes\nDistances to the yz-, xz- and xy-planes are |x|=4, |y|=6 and |z|=3. The smallest is 3, so the xy-plane is nearest.\n\nStep 4 | Concept check\nProjection onto the yz-plane sets x to zero. Distance to the x-axis removes the x component and takes the magnitude of the remaining components. They are related operations but produce different forms of answer.\n\nConclusion\nChoose D.",
    ),
    rubric: {
      zh: ["1 分：投影", "2 分：轴距离公式", "1 分：三个平面距离", "1 分：最近平面"],
      en: ["1: projection", "2: axis-distance formula", "1: three plane distances", "1: nearest plane"],
    },
  },
  {
    id: "math-0-instructor-06",
    courseId: "math",
    topicId: "math-0",
    kind: "calculation",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 6,
    answerTools: ["scientific-calculator", "coordinate-board"],
    question: b(
      "a=(2,-1,2)，b=(1,-6,4)。求一个与 2a-b 同方向、长度为 10 的向量 v。",
      "Let a=(2,-1,2) and b=(1,-6,4). Find a vector v in the same direction as 2a-b with magnitude 10.",
    ),
    options: [
      b("v=(3,4,0)", "v=(3,4,0)"),
      b("v=(6,8,0)", "v=(6,8,0)"),
      b("v=(-6,-8,0)", "v=(-6,-8,0)"),
      b("v=(5,5,0)", "v=(5,5,0)"),
    ],
    answer: 1,
    visual: {
      kind: "table",
      title: b("输入向量", "Input vectors"),
      columns: [b("向量", "Vector"), b("x", "x"), b("y", "y"), b("z", "z")],
      rows: [["a", "2", "-1", "2"], ["b", "1", "-6", "4"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "2a-b=(3,4,0) 与目标向量 (6,8,0) 共线且同向，目标向量长度为原向量的两倍。",
        "2a-b=(3,4,0) and the target (6,8,0) are collinear in the same direction; the target has twice the magnitude.",
      ),
      vectors: [
        { label: "2a-b", value: [3, 4, 0], color: "#2563eb" },
        { label: "v", value: [6, 8, 0], color: "#e11d48" },
      ],
      spatial: { mode: "parallel" },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜先完成向量运算\n2a=(4,-2,4)，所以 2a-b=(4-1,-2-(-6),4-4)=(3,4,0)。\n\n第 2 步｜求当前长度\n|2a-b|=√(3²+4²)=5。\n\n第 3 步｜先归一化再缩放\n同方向单位向量为 u=(3,4,0)/5=(3/5,4/5,0)。长度为 10 的目标向量 v=10u=(6,8,0)。\n\n第 4 步｜验证两个条件\n长度：√(6²+8²)=10。方向：(6,8,0)=2(3,4,0)，倍数为正，所以同方向。\n\n易错点\n(3,4,0) 方向正确但长度仍是 5；(-6,-8,0) 长度正确但方向相反。\n\n结论\n选 B。",
      "Step 1 | Complete the vector operation\n2a=(4,-2,4), so 2a-b=(4-1,-2-(-6),4-4)=(3,4,0).\n\nStep 2 | Find its present magnitude\n|2a-b|=√(3²+4²)=5.\n\nStep 3 | Normalise, then scale\nThe unit direction is u=(3/5,4/5,0). The required vector is v=10u=(6,8,0).\n\nStep 4 | Verify both requirements\nMagnitude: √(6²+8²)=10. Direction: (6,8,0)=2(3,4,0), and the multiplier is positive, so the direction is the same.\n\nCommon traps\n(3,4,0) has the right direction but magnitude 5. (-6,-8,0) has the right magnitude but the opposite direction.\n\nConclusion\nChoose B.",
    ),
    rubric: {
      zh: ["2 分：2a-b", "1 分：长度", "2 分：单位向量与缩放", "1 分：双重验证"],
      en: ["2: 2a-b", "1: magnitude", "2: unit vector and scaling", "1: both checks"],
    },
  },
  {
    id: "math-0-instructor-07",
    courseId: "math",
    topicId: "math-0",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "transfer",
    estimatedMinutes: 7,
    answerTools: ["scientific-calculator", "coordinate-board"],
    question: b(
      "图中 F₁=100 N，与 +x 轴成 60°；F₂=50 N，沿 -x 轴。合力的大小和方向是什么？",
      "In the diagram, F₁=100 N at 60° above +x, while F₂=50 N points along -x. What are the magnitude and direction of the resultant?",
    ),
    options: [
      b("150 N，沿 +x 轴", "150 N along +x"),
      b("50 N，沿 60°", "50 N at 60°"),
      b("50√3 N，沿 +y 轴（90°）", "50√3 N along +y (90°)"),
      b("100 N，沿 30°", "100 N at 30°"),
    ],
    answer: 2,
    visual: {
      kind: "table",
      title: b("力的大小与方向", "Force magnitudes and directions"),
      columns: [b("力", "Force"), b("大小", "Magnitude"), b("从 +x 轴量起", "Measured from +x")],
      rows: [["F₁", "100 N", "60°"], ["F₂", "50 N", "180°"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "F₁ 的分量为 (50,50√3)，F₂ 为 (-50,0)，两者 x 分量抵消，合力竖直向上。",
        "F₁ has components (50,50√3) and F₂ is (-50,0); their x-components cancel, leaving a vertical upward resultant.",
      ),
      caption: b(
        "先把每个向量分解到同一坐标轴，再逐分量相加。",
        "Resolve every vector onto the same axes before adding components.",
      ),
      vectors: [
        { label: "F₁", value: [50, 86.6025, 0], color: "#e11d48" },
        { label: "F₂", value: [-50, 0, 0], color: "#2563eb" },
        { label: "R", value: [0, 86.6025, 0], color: "#059669" },
      ],
      spatial: { mode: "resultant" },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜建立分量符号\n+x 向右、+y 向上。F₂ 沿 -x，所以它的 x 分量必须为负。\n\n第 2 步｜分解 F₁\nF₁x=100cos60°=50 N；F₁y=100sin60°=50√3 N。\n\n第 3 步｜写 F₂\nF₂=(-50,0) N。\n\n第 4 步｜逐分量相加\nR=(50-50,50√3+0)=(0,50√3) N。横向分量完全抵消。\n\n第 5 步｜由分量读大小与方向\n|R|=√(0²+(50√3)²)=50√3 N≈86.6 N。x 分量为 0、y 分量为正，所以方向是 +y，即从 +x 轴逆时针 90°。\n\n易错点\n不能把大小直接做 100-50，因为两力不共线；必须先比较同方向的分量。\n\n结论\n选 C。",
      "Step 1 | Set component signs\nTake +x right and +y up. Because F₂ points along -x, its x-component is negative.\n\nStep 2 | Resolve F₁\nF₁x=100cos60°=50 N and F₁y=100sin60°=50√3 N.\n\nStep 3 | Write F₂ in components\nF₂=(-50,0) N.\n\nStep 4 | Add component by component\nR=(50-50,50√3)=(0,50√3) N. The horizontal components cancel exactly.\n\nStep 5 | Read magnitude and direction\n|R|=50√3 N≈86.6 N. With zero x-component and positive y-component, the direction is +y, or 90° counter-clockwise from +x.\n\nCommon trap\nDo not subtract magnitudes as 100-50 because the forces are not collinear; resolve comparable components first.\n\nConclusion\nChoose C.",
    ),
    rubric: {
      zh: ["1 分：方向符号", "2 分：F₁ 分量", "1 分：F₂ 分量", "1 分：合力", "1 分：大小与方向"],
      en: ["1: direction signs", "2: F₁ components", "1: F₂ components", "1: resultant", "1: magnitude and direction"],
    },
  },
  {
    id: "math-0-instructor-08",
    courseId: "math",
    topicId: "math-0",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 6,
    answerTools: ["diagram-board"],
    question: b(
      "设 a、b、c∈R³，且 |a| 表示 a 的长度。多选：哪些表达式在通常的向量代数定义下有意义，并且结果类型描述正确？",
      "Let a,b,c∈R³ and let |a| be the magnitude of a. Select every expression that is meaningful under standard vector algebra and whose result type is stated correctly.",
    ),
    options: [
      b("(a·b)·c：有意义，结果是标量", "(a·b)·c: meaningful, with a scalar result"),
      b("(a·b)c：有意义，结果是向量", "(a·b)c: meaningful, with a vector result"),
      b("a+(b·c)：有意义，结果是向量", "a+(b·c): meaningful, with a vector result"),
      b("|a|(b·c)：有意义，结果是标量", "|a|(b·c): meaningful, with a scalar result"),
    ],
    answer: [1, 3],
    visual: {
      kind: "table",
      title: b("运算的输入与输出类型", "Input and output types"),
      columns: [b("运算", "Operation"), b("输入", "Inputs"), b("输出", "Output")],
      rows: [["dot product ·", "vector, vector", "scalar"], ["scalar multiplication", "scalar, vector", "vector"], ["magnitude |·|", "vector", "scalar"]],
    },
    explanation: b(
      "第 1 步｜像检查程序类型一样逐层检查\n点积需要两个向量作为输入，输出一个标量；标量乘向量输出向量；两个标量普通相乘输出标量。\n\n第 2 步｜检查 A\n括号内 a·b 已经是标量，外层却要求把这个标量与向量 c 做点积。点积没有“标量·向量”这种输入，所以 A 无意义。\n\n第 3 步｜检查 B\n先算 a·b 得标量，再用该标量乘 c，得到向量。B 有意义且类型正确。\n\n第 4 步｜检查 C\nb·c 是标量，而 a 是向量。标准向量加法不能直接把向量和标量相加，所以 C 无意义。\n\n第 5 步｜检查 D\n|a| 是标量，b·c 也是标量；二者普通相乘仍是标量。D 正确。\n\n结论\n选择 B、D。不要只看符号长得像公式；每一层运算都要检查输入和输出类型。",
      "Step 1 | Type-check each layer as if it were code\nA dot product accepts two vectors and returns a scalar. Scalar multiplication accepts a scalar and vector and returns a vector. Ordinary multiplication of two scalars returns a scalar.\n\nStep 2 | Check A\nThe inner a·b is already a scalar, but the outer dot asks for that scalar dotted with vector c. A dot product does not accept scalar·vector, so A is meaningless.\n\nStep 3 | Check B\nFirst a·b is a scalar; multiplying c by it gives a vector. B is meaningful and correctly typed.\n\nStep 4 | Check C\nb·c is a scalar, whereas a is a vector. Standard vector addition cannot add a vector directly to a scalar, so C is meaningless.\n\nStep 5 | Check D\n|a| is a scalar and b·c is a scalar. Their ordinary product is a scalar. D is correct.\n\nConclusion\nSelect B and D. Do not trust formula-like appearance; type-check the input and output of every operation.",
    ),
    rubric: {
      zh: ["2 分：点积类型", "1 分：A", "1 分：B", "1 分：C", "1 分：D"],
      en: ["2: dot-product type", "1: A", "1: B", "1: C", "1: D"],
    },
  },
  {
    id: "math-0-instructor-09",
    courseId: "math",
    topicId: "math-0",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "geometric-reasoning",
    estimatedMinutes: 6,
    answerTools: ["scientific-calculator", "coordinate-board"],
    question: b(
      "图中 u、v、w 都是单位向量，方向分别为 0°、60°、120°。哪一组依次给出 u·v、v·w、u·w？",
      "In the diagram, u, v and w are unit vectors at directions 0°, 60° and 120°. Which ordered triple gives u·v, v·w and u·w?",
    ),
    options: [
      b("(√3/2, √3/2, 1/2)", "(√3/2, √3/2, 1/2)"),
      b("(1/2, -1/2, 1/2)", "(1/2, -1/2, 1/2)"),
      b("(60, 60, 120)", "(60, 60, 120)"),
      b("(1/2, 1/2, -1/2)", "(1/2, 1/2, -1/2)"),
    ],
    answer: 3,
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "三个单位向量从同一原点出发：u 沿 0 度，v 沿 60 度，w 沿 120 度；相邻向量夹角 60 度，u 与 w 夹角 120 度。",
        "Three unit vectors share an origin: u is at 0 degrees, v at 60 degrees and w at 120 degrees. Adjacent vectors differ by 60 degrees, while u and w differ by 120 degrees.",
      ),
      vectors: [
        { label: "u", value: [1, 0, 0], color: "#2563eb" },
        { label: "v", value: [0.5, 0.866, 0], color: "#059669" },
        { label: "w", value: [-0.5, 0.866, 0], color: "#e11d48" },
      ],
      spatial: { mode: "angles" },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜写几何点积\n对单位向量 p、q，p·q=|p||q|cosθ=cosθ，因为两者长度都为 1。\n\n第 2 步｜读取每一对的最小夹角\nu 与 v 相差 60°；v 与 w 也相差 60°；u 与 w 相差 120°。\n\n第 3 步｜计算\nu·v=cos60°=1/2；v·w=cos60°=1/2；u·w=cos120°=-1/2。\n\n第 4 步｜用符号检查方向\n前两对夹角小于 90°，点积应为正；最后一对夹角大于 90°，点积应为负。答案符号吻合。\n\n易错点\n点积不是角度本身；即使都是单位向量，点积也等于角的余弦而不是角。\n\n结论\n选 D。",
      "Step 1 | Use the geometric dot product\nFor unit vectors p and q, p·q=|p||q|cosθ=cosθ.\n\nStep 2 | Read the smaller angle for each pair\nu and v differ by 60°, v and w differ by 60°, and u and w differ by 120°.\n\nStep 3 | Calculate\nu·v=cos60°=1/2, v·w=cos60°=1/2, and u·w=cos120°=-1/2.\n\nStep 4 | Check signs geometrically\nThe first two angles are acute, so their dot products are positive. The final angle is obtuse, so its dot product is negative.\n\nCommon trap\nThe dot product is not the angle. For unit vectors it equals the cosine of the angle.\n\nConclusion\nChoose D.",
    ),
    rubric: {
      zh: ["1 分：单位向量点积公式", "2 分：三个夹角", "2 分：余弦值", "1 分：符号检查"],
      en: ["1: unit-vector dot formula", "2: three angles", "2: cosine values", "1: sign check"],
    },
  },
  {
    id: "math-0-instructor-10",
    courseId: "math",
    topicId: "math-0",
    kind: "calculation",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 8,
    answerTools: ["scientific-calculator"],
    question: b(
      "对哪些实数 t，向量 u=(1,t,t²) 与 v=(6,-5,t-2) 正交？必须找出全部解。",
      "For which real values of t are u=(1,t,t²) and v=(6,-5,t-2) orthogonal? Find every solution.",
    ),
    options: [
      b("t=1, 3", "t=1, 3"),
      b("t=-2, 1, 3", "t=-2, 1, 3"),
      b("t=-3, -1, 2", "t=-3, -1, 2"),
      b("t=0", "t=0"),
    ],
    answer: 1,
    visual: {
      kind: "table",
      title: b("含参数向量", "Parameter-dependent vectors"),
      columns: [b("向量", "Vector"), b("第一分量", "First"), b("第二分量", "Second"), b("第三分量", "Third")],
      rows: [["u", "1", "t", "t²"], ["v", "6", "-5", "t-2"]],
    },
    explanation: b(
      "第 1 步｜把正交转成方程\n两个非零向量正交当且仅当点积为 0：u·v=0。\n\n第 2 步｜逐分量计算点积\nu·v=1·6+t(-5)+t²(t-2)=6-5t+t³-2t²。\n因此要解 t³-2t²-5t+6=0。\n\n第 3 步｜寻找一个有理根\n尝试常数 6 的因数。代 t=1：1-2-5+6=0，所以 (t-1) 是因式。\n\n第 4 步｜继续因式分解，不能找到一个根就停止\nt³-2t²-5t+6=(t-1)(t²-t-6)=(t-1)(t-3)(t+2)。\n\n第 5 步｜列出并验证全部解\nt=1、3、-2。逐个代入因式积都为 0。\n\n第 6 步｜检查非零条件\n在这三个 t 值下 u 的第一分量始终为 1，因此 u 非零；v 的第一分量始终为 6，因此 v 也非零，正交结论有效。\n\n结论\n选 B。题目特别强调“全部解”，只报最先找到的两个根会丢分。",
      "Step 1 | Convert orthogonality into an equation\nTwo non-zero vectors are orthogonal exactly when u·v=0.\n\nStep 2 | Compute the dot product component by component\nu·v=6-5t+t²(t-2)=t³-2t²-5t+6. Solve t³-2t²-5t+6=0.\n\nStep 3 | Find one rational root\nTest factors of 6. At t=1, 1-2-5+6=0, so (t-1) is a factor.\n\nStep 4 | Continue factoring; do not stop after one root\nt³-2t²-5t+6=(t-1)(t²-t-6)=(t-1)(t-3)(t+2).\n\nStep 5 | List and verify every solution\nt=1, 3 and -2. Each makes the factored product zero.\n\nStep 6 | Check the non-zero condition\nFor all three values, u has first component 1 and v has first component 6, so neither vector is zero and orthogonality is valid.\n\nConclusion\nChoose B. Because the prompt asks for every solution, stopping after one or two roots loses credit.",
    ),
    rubric: {
      zh: ["1 分：正交方程", "2 分：点积多项式", "2 分：完整因式分解", "1 分：全部三解", "1 分：非零检查"],
      en: ["1: orthogonality equation", "2: dot-product polynomial", "2: complete factorisation", "1: all three roots", "1: non-zero check"],
    },
  },
  {
    id: "math-0-instructor-11",
    courseId: "math",
    topicId: "math-0",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 7,
    answerTools: ["scientific-calculator", "diagram-board"],
    question: b(
      "a=(2,1,-2)，b=(-1,4,2)。一位同学写道：“a·b=2，所以 b 在 a 上的标量投影是 2/3，向量投影是 (2/3)a。”多选：哪些纠正是正确的？",
      "Let a=(2,1,-2) and b=(-1,4,2). A student writes: “a·b=2, so the scalar projection of b onto a is 2/3 and the vector projection is (2/3)a.” Select every valid correction.",
    ),
    options: [
      b("点积符号算错；a·b=-2，所以标量投影为 -2/3", "The dot-product sign is wrong; a·b=-2, so the scalar projection is -2/3"),
      b("向量投影的系数应除以 |a|²；正确结果为 (-4/9,-2/9,4/9)", "The vector-projection coefficient uses |a|²; the result is (-4/9,-2/9,4/9)"),
      b("向量投影必须与 a 垂直", "A vector projection must be perpendicular to a"),
      b("负的标量投影表示 a 与 b 正交", "A negative scalar projection means a and b are orthogonal"),
    ],
    answer: [0, 1],
    visual: {
      kind: "table",
      title: b("待检查的分量乘积", "Component products to audit"),
      columns: [b("分量", "Component"), b("乘积", "Product")],
      rows: [["x", "2(-1)=-2"], ["y", "1(4)=4"], ["z", "(-2)(2)=-4"]],
    },
    learningVisual: {
      id: "vector-plane",
      alt: b(
        "三维向量 b 在 a 方向上的投影为 (-4/9,-2/9,4/9)，它与 a 反向共线，因为 a·b 为负。",
        "In 3D, the projection of b along a is (-4/9,-2/9,4/9). It is collinear but opposite a because a·b is negative.",
      ),
      vectors: [
        { label: "a", value: [2, 1, -2], color: "#2563eb" },
        { label: "b", value: [-1, 4, 2], color: "#64748b" },
        { label: "projₐb", value: [-0.4444, -0.2222, 0.4444], color: "#e11d48" },
      ],
      spatial: { mode: "projection" },
      interactive: true,
    },
    explanation: b(
      "第 1 步｜定位最早出现的错误\n逐项相乘：a·b=2(-1)+1(4)+(-2)(2)=-2+4-4=-2。学生把结果的负号丢了。\n\n第 2 步｜标量投影公式\ncompₐb=(a·b)/|a|。|a|=√(4+1+4)=3，所以 compₐb=-2/3。负号表示 b 在 a 方向上的分量指向 a 的反方向，不表示正交。\n\n第 3 步｜向量投影公式\nprojₐb=((a·b)/|a|²)a=(-2/9)(2,1,-2)=(-4/9,-2/9,4/9)。学生把标量投影系数直接乘 a，多了一个 |a| 因子。\n\n第 4 步｜几何检查\n向量投影必须与 a 平行或反平行，而不是垂直。真正与 a 垂直的是剩余向量 b-projₐb。\n\n第 5 步｜检查正交条件\n正交需要 a·b=0；这里点积为负，说明夹角为钝角。\n\n结论\n选择 A、B。",
      "Step 1 | Locate the earliest error\nCompute component products: a·b=2(-1)+1(4)+(-2)(2)=-2+4-4=-2. The student lost the negative sign.\n\nStep 2 | Scalar projection\ncompₐb=(a·b)/|a|. Since |a|=√(4+1+4)=3, compₐb=-2/3. The negative sign means the component points opposite a; it does not mean orthogonal.\n\nStep 3 | Vector projection\nprojₐb=((a·b)/|a|²)a=(-2/9)(2,1,-2)=(-4/9,-2/9,4/9). The student multiplied a by the scalar-projection value, introducing an extra factor of |a|.\n\nStep 4 | Geometric check\nThe projection vector is parallel or anti-parallel to a, not perpendicular. The residual b-projₐb is perpendicular to a.\n\nStep 5 | Check orthogonality\nOrthogonality requires a·b=0. A negative dot product instead indicates an obtuse angle.\n\nConclusion\nSelect A and B.",
    ),
    rubric: {
      zh: ["1 分：点积纠错", "2 分：标量投影", "2 分：向量投影", "1 分：平行性", "1 分：负号含义"],
      en: ["1: dot-product correction", "2: scalar projection", "2: vector projection", "1: parallel relationship", "1: meaning of the sign"],
    },
  },
  {
    id: "math-0-instructor-12",
    courseId: "math",
    topicId: "math-0",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "proof",
    cognitiveRole: "proof",
    estimatedMinutes: 8,
    answerTools: ["diagram-board"],
    question: b(
      "对非零向量 u、v，命题“u⊥v 当且仅当 |u+v|=|u-v|”的哪一个证明是完整且正确的？",
      "For non-zero vectors u and v, which proof of “u⊥v if and only if |u+v|=|u-v|” is complete and correct?",
    ),
    options: [
      b(
        "因为加法和减法互相抵消，所以 |u+v| 与 |u-v| 对所有向量都相等",
        "Addition and subtraction cancel, so |u+v| and |u-v| are equal for all vectors",
      ),
      b(
        "由三角不等式，两边都小于 |u|+|v|，因此两边相等",
        "By the triangle inequality both sides are below |u|+|v|, hence they are equal",
      ),
      b(
        "平方两边并展开：|u+v|²-|u-v|²=4u·v，所以两长度相等 ⇔ u·v=0 ⇔ u⊥v",
        "Square and expand: |u+v|²-|u-v|²=4u·v, so equal lengths ⇔ u·v=0 ⇔ u⊥v",
      ),
      b(
        "只验证 u=(1,0)、v=(0,1) 时成立，就证明了所有非零向量",
        "Checking u=(1,0), v=(0,1) proves the claim for every non-zero pair",
      ),
    ],
    answer: 2,
    visual: {
      kind: "table",
      title: b("需要比较的平方长度", "Squared magnitudes to compare"),
      columns: [b("量", "Quantity"), b("点积展开", "Dot-product expansion")],
      rows: [
        ["|u+v|²", "|u|²+2u·v+|v|²"],
        ["|u-v|²", "|u|²-2u·v+|v|²"],
      ],
    },
    explanation: b(
      "第 1 步｜为什么可以平方\n长度都非负，所以 |u+v|=|u-v| 与两边平方相等完全等价，不会引入正负号伪解。\n\n第 2 步｜展开第一边\n|u+v|²=(u+v)·(u+v)=|u|²+2u·v+|v|²。\n\n第 3 步｜展开第二边\n|u-v|²=(u-v)·(u-v)=|u|²-2u·v+|v|²。\n\n第 4 步｜比较\n两式之差为 4u·v。因此两长度相等当且仅当 4u·v=0，也就是 u·v=0。\n\n第 5 步｜连接几何定义\n因为 u、v 非零，u·v=|u||v|cosθ=0 等价于 cosθ=0，即 θ=90°，所以 u⊥v。反方向也由同一串等价关系成立。\n\n第 6 步｜说明非零条件\n若允许零向量，长度等式仍可能成立，但零向量没有确定方向，不能据此谈 90° 夹角。因此题目的非零条件有意义。\n\n结论\n选 C。A 把向量长度误当普通代数，B 从共同上界推不出相等，D 只给出例子而不是一般证明。",
      "Step 1 | Why squaring is valid\nMagnitudes are non-negative, so equality of the magnitudes is equivalent to equality of their squares without introducing a sign ambiguity.\n\nStep 2 | Expand the first side\n|u+v|²=(u+v)·(u+v)=|u|²+2u·v+|v|².\n\nStep 3 | Expand the second side\n|u-v|²=(u-v)·(u-v)=|u|²-2u·v+|v|².\n\nStep 4 | Compare\nThe difference is 4u·v. Thus the lengths are equal exactly when 4u·v=0, or u·v=0.\n\nStep 5 | Connect to geometry\nBecause u and v are non-zero, u·v=|u||v|cosθ=0 is equivalent to cosθ=0 and θ=90°, so u⊥v. The reverse implication follows through the same equivalences.\n\nStep 6 | Explain the non-zero condition\nIf a zero vector were allowed, the length equality could hold, but the zero vector has no defined direction and hence no 90° angle. The stated condition matters.\n\nConclusion\nChoose C. A treats vector magnitudes like ordinary cancellation, B cannot infer equality from a shared upper bound, and D is one example rather than a general proof.",
    ),
    rubric: {
      zh: ["1 分：平方等价性", "2 分：两式展开", "1 分：差为 4u·v", "2 分：双向逻辑", "1 分：非零条件"],
      en: ["1: equivalence after squaring", "2: both expansions", "1: difference 4u·v", "2: both directions", "1: non-zero condition"],
    },
  },
];
