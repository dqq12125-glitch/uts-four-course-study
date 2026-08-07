"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CoordinateBoard } from "./coordinate-board";
import { evaluateMathExpression } from "./math-expression";
import styles from "./answer-workspace.module.css";

export type AnswerWorkspaceLanguage = "zh" | "en" | "both";

export type AnswerToolKind =
  | "scientific-calculator"
  | "coordinate-board"
  | "diagram-board"
  | "circuit-sketch"
  | "unit-conversion"
  | "code-draft";

export interface DrawingEvidence {
  mode: "coordinate" | "diagram" | "circuit";
  strokeCount: number;
  pointCount: number;
  toolsUsed: string[];
  colorsUsed: string[];
  lineWidthsUsed: number[];
  coordinateObjects?: Array<{
    kind: string;
    expression?: string;
    points: Array<{ x: number; y: number }>;
  }>;
  coordinateView?: {
    centerX: number;
    centerY: number;
    unitsAcross: number;
  };
}

export interface UnitConversionEvidence {
  id: string;
  value: string;
  fromUnit: string;
  factor: string;
  toUnit: string;
  result: string;
  note: string;
}

export interface CodeTestCaseEvidence {
  id: string;
  input: string;
  expected: string;
  note: string;
}

export interface AnswerWorkspaceEvidence {
  version: 1;
  courseId: string;
  topicId?: string;
  questionId: string;
  questionText: string;
  toolKinds: AnswerToolKind[];
  explanation: string;
  calculator?: {
    expression: string;
    result: string;
  };
  drawing?: DrawingEvidence;
  drawings?: DrawingEvidence[];
  unitConversions?: UnitConversionEvidence[];
  code?: {
    draft: string;
    testCases: CodeTestCaseEvidence[];
  };
  recordedAt: string;
}

export interface AnswerWorkspaceProps {
  courseId: string;
  topicId?: string;
  questionId: string;
  questionText: string;
  toolKind?: AnswerToolKind | AnswerToolKind[] | null;
  language: AnswerWorkspaceLanguage;
  onEvidenceChange: (evidence: AnswerWorkspaceEvidence) => void | Promise<void>;
}

type DrawingMode = DrawingEvidence["mode"];
type DrawingTool = "pen" | "line" | "arrow" | "wire" | "resistor" | "battery" | "lamp";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  kind: DrawingTool;
  points: Point[];
  color: string;
  width: number;
};

const toolOrder: AnswerToolKind[] = [
  "scientific-calculator",
  "coordinate-board",
  "diagram-board",
  "circuit-sketch",
  "unit-conversion",
  "code-draft",
];

const toolIcons: Record<AnswerToolKind, string> = {
  "scientific-calculator": "∑",
  "coordinate-board": "⌗",
  "diagram-board": "✎",
  "circuit-sketch": "⌁",
  "unit-conversion": "↔",
  "code-draft": "</>",
};

function t(language: AnswerWorkspaceLanguage, zh: string, en: string) {
  if (language === "zh") return zh;
  if (language === "en") return en;
  return `${zh} / ${en}`;
}

function toolLabel(kind: AnswerToolKind, language: AnswerWorkspaceLanguage) {
  const labels: Record<AnswerToolKind, [string, string]> = {
    "scientific-calculator": ["科学计算器", "Scientific calculator"],
    "coordinate-board": ["坐标画板", "Coordinate board"],
    "diagram-board": ["图形画板", "Diagram board"],
    "circuit-sketch": ["电路草图", "Circuit sketch"],
    "unit-conversion": ["单位换算记录", "Unit conversion log"],
    "code-draft": ["代码与测试草稿", "Code and test draft"],
  };
  return t(language, ...labels[kind]);
}

function normalizeToolKinds(toolKind: AnswerWorkspaceProps["toolKind"]) {
  if (!toolKind) return [];
  const requested = Array.isArray(toolKind) ? toolKind : [toolKind];
  return toolOrder.filter((kind) => requested.includes(kind));
}

function isDrawingToolKind(
  kind: AnswerToolKind,
): kind is "coordinate-board" | "diagram-board" | "circuit-sketch" {
  return (
    kind === "coordinate-board"
    || kind === "diagram-board"
    || kind === "circuit-sketch"
  );
}

function drawingEvidenceEqual(left: DrawingEvidence, right: DrawingEvidence) {
  return (
    left.mode === right.mode
    && left.strokeCount === right.strokeCount
    && left.pointCount === right.pointCount
    && left.toolsUsed.join("|") === right.toolsUsed.join("|")
    && left.colorsUsed.join("|") === right.colorsUsed.join("|")
    && left.lineWidthsUsed.join("|") === right.lineWidthsUsed.join("|")
  );
}

function isValidUnitConversion(item: UnitConversionEvidence) {
  return (
    item.value.trim().length > 0
    && item.fromUnit.trim().length > 0
    && item.factor.trim().length > 0
    && item.toUnit.trim().length > 0
    && item.result.trim().length > 0
  );
}

function isValidTestCase(item: CodeTestCaseEvidence) {
  return item.input.trim().length > 0 && item.expected.trim().length > 0;
}

export function AnswerWorkspace(props: AnswerWorkspaceProps) {
  const tools = useMemo(() => normalizeToolKinds(props.toolKind), [props.toolKind]);

  if (tools.length === 0) return null;

  return (
    <AnswerWorkspaceSession
      key={`${props.questionId}:${tools.join(",")}`}
      {...props}
      tools={tools}
    />
  );
}

function AnswerWorkspaceSession({
  courseId,
  topicId,
  questionId,
  questionText,
  language,
  onEvidenceChange,
  tools,
}: AnswerWorkspaceProps & { tools: AnswerToolKind[] }) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<AnswerToolKind>(tools[0]);
  const [explanation, setExplanation] = useState("");
  const [calculator, setCalculator] = useState({ expression: "", result: "" });
  const [drawingsByMode, setDrawingsByMode] = useState<
    Partial<Record<DrawingMode, DrawingEvidence>>
  >({});
  const [unitConversions, setUnitConversions] = useState<UnitConversionEvidence[]>([]);
  const [codeDraft, setCodeDraft] = useState("");
  const [testCases, setTestCases] = useState<CodeTestCaseEvidence[]>([]);
  const [recordedSignature, setRecordedSignature] = useState("");
  const [failureSignature, setFailureSignature] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const statusId = useId();
  const drawingTools = tools.filter(isDrawingToolKind);
  const drawings = Object.values(drawingsByMode).filter(
    (item): item is DrawingEvidence => Boolean(item && item.strokeCount > 0),
  );
  const validUnitConversions = unitConversions.filter(isValidUnitConversion);
  const validTestCases = testCases.filter(isValidTestCase);
  const hasCalculatorEvidence =
    tools.includes("scientific-calculator")
    && calculator.expression.trim().length > 0
    && calculator.result.trim().length > 0;
  const hasDrawingEvidence = drawings.length > 0;
  const hasUnitEvidence =
    tools.includes("unit-conversion") && validUnitConversions.length > 0;
  const hasCodeEvidence =
    tools.includes("code-draft")
    && (codeDraft.trim().length > 0 || validTestCases.length > 0);
  const hasToolEvidence =
    hasCalculatorEvidence || hasDrawingEvidence || hasUnitEvidence || hasCodeEvidence;
  const hasExplanation = explanation.trim().length >= 8;
  const canRecord = hasExplanation && hasToolEvidence;
  const evidenceSignature = JSON.stringify({
    calculator,
    codeDraft,
    drawingsByMode,
    explanation,
    testCases,
    unitConversions,
  });
  const recorded = recordedSignature !== "" && recordedSignature === evidenceSignature;
  const failed = failureSignature !== "" && failureSignature === evidenceSignature;

  const updateDrawingEvidence = useCallback((evidence: DrawingEvidence) => {
    setDrawingsByMode((current) => {
      const previous = current[evidence.mode];
      if (previous && drawingEvidenceEqual(previous, evidence)) return current;
      return { ...current, [evidence.mode]: evidence };
    });
  }, []);

  const recordEvidence = useCallback(async () => {
    if (!canRecord || isRecording) return;
    setIsRecording(true);
    setFailureSignature("");
    try {
      await onEvidenceChange({
        version: 1,
        courseId,
        topicId,
        questionId,
        questionText,
        toolKinds: tools,
        explanation: explanation.trim(),
        calculator: hasCalculatorEvidence ? calculator : undefined,
        drawing: drawings[0],
        drawings: drawingTools.length > 1 ? drawings : undefined,
        unitConversions: tools.includes("unit-conversion")
          ? validUnitConversions
          : undefined,
        code: tools.includes("code-draft")
          ? { draft: codeDraft.trim(), testCases: validTestCases }
          : undefined,
        recordedAt: new Date().toISOString(),
      });
      setRecordedSignature(evidenceSignature);
    } catch {
      setFailureSignature(evidenceSignature);
    } finally {
      setIsRecording(false);
    }
  }, [
    calculator,
    canRecord,
    codeDraft,
    courseId,
    drawingTools.length,
    drawings,
    explanation,
    evidenceSignature,
    hasCalculatorEvidence,
    isRecording,
    onEvidenceChange,
    questionId,
    questionText,
    tools,
    topicId,
    validTestCases,
    validUnitConversions,
  ]);

  const recordState =
    isRecording ? "loading"
      : failed ? "error"
        : recorded ? "success"
          : canRecord ? "ready"
            : "disabled";

  return (
    <section
      className={styles.workspace}
      aria-label={t(language, "本题作答工具", "Answer tools for this question")}
      data-course-id={courseId}
      data-topic-id={topicId}
      data-question-id={questionId}
    >
      <button
        type="button"
        className={styles.workspaceToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={styles.workspaceIcon} aria-hidden="true">✦</span>
        <span className={styles.workspaceToggleCopy}>
          <strong>{t(language, "作答工具", "Answer tools")}</strong>
          <small>
            {tools.map((kind) => toolLabel(kind, language)).join(" · ")}
          </small>
        </span>
        <span className={styles.disclosureIcon} aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className={styles.workspaceBody} id={panelId}>
          {tools.length > 1 && (
            <div
              className={styles.toolPicker}
              role="tablist"
              aria-label={t(language, "选择作答工具", "Choose an answer tool")}
            >
              {tools.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="tab"
                  aria-selected={activeTool === kind}
                  className={activeTool === kind ? styles.toolTabActive : styles.toolTab}
                  onClick={() => setActiveTool(kind)}
                >
                  <span aria-hidden="true">{toolIcons[kind]}</span>
                  {toolLabel(kind, language)}
                </button>
              ))}
            </div>
          )}

          <div className={styles.toolPanel}>
            {tools.map((kind) => (
              <div
                key={kind}
                role="tabpanel"
                hidden={activeTool !== kind}
                aria-label={toolLabel(kind, language)}
              >
                {kind === "scientific-calculator" && (
                  <ScientificCalculator
                    language={language}
                    value={calculator}
                    onChange={setCalculator}
                  />
                )}
                {kind === "coordinate-board" && (
                  <CoordinateBoard
                    language={language}
                    onEvidenceChange={updateDrawingEvidence}
                  />
                )}
                {kind === "diagram-board" && (
                  <DrawingBoard
                    mode="diagram"
                    language={language}
                    onEvidenceChange={updateDrawingEvidence}
                  />
                )}
                {kind === "circuit-sketch" && (
                  <DrawingBoard
                    mode="circuit"
                    language={language}
                    onEvidenceChange={updateDrawingEvidence}
                  />
                )}
                {kind === "unit-conversion" && (
                  <UnitConversionLog
                    language={language}
                    items={unitConversions}
                    onChange={setUnitConversions}
                  />
                )}
                {kind === "code-draft" && (
                  <CodeDraft
                    language={language}
                    code={codeDraft}
                    onCodeChange={setCodeDraft}
                    testCases={testCases}
                    onTestCasesChange={setTestCases}
                  />
                )}
              </div>
            ))}
          </div>

          <label className={styles.explanationField}>
            <span>
              {t(
                language,
                "用一句话解释你的图、计算步骤或代码思路",
                "Explain your diagram, steps, or code idea in one sentence",
              )}
            </span>
            <textarea
              value={explanation}
              rows={3}
              aria-describedby={statusId}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder={t(
                language,
                "例如：我先把速度分解到 x、y 方向，再分别使用运动方程。",
                "Example: I split velocity into x and y components, then used a motion equation on each axis.",
              )}
            />
          </label>

          <div
            className={styles.recordFeedback}
            data-state={recordState}
            id={statusId}
            aria-live="polite"
          >
            {recordState === "loading" && (
              <BilingualStatus
                zh="正在整理并记录你的作答证据。"
                en="Organising and recording your answer evidence."
              />
            )}
            {recordState === "error" && (
              <BilingualStatus
                zh="记录失败，内容仍保留。请检查网络后重试。"
                en="Recording failed, but your work is safe. Check the connection and retry."
              />
            )}
            {recordState === "success" && (
              <BilingualStatus
                zh="已记录：本题的说明和工具证据已更新。"
                en="Recorded: the explanation and tool evidence are up to date."
              />
            )}
            {(recordState === "disabled" || recordState === "ready") && (
              <>
                {!hasExplanation && (
                  <BilingualStatus
                    zh={`还需：用至少 8 个字符解释你的步骤（当前 ${explanation.trim().length}/8）。`}
                    en={`Needed: explain your step in at least 8 characters (${explanation.trim().length}/8 now).`}
                  />
                )}
                {!hasToolEvidence && (
                  <BilingualStatus
                    zh="还需：完成至少一项真实工具内容，例如算出结果、画一笔、保存完整换算，或写代码/测试用例。"
                    en="Needed: complete real tool work—calculate a result, draw a stroke, save a complete conversion, or add code/test data."
                  />
                )}
                {recordState === "ready" && (
                  <BilingualStatus
                    zh="可以记录：说明和工具证据均已达到要求。"
                    en="Ready: both the explanation and tool evidence meet the requirements."
                  />
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.recordButton}
            data-state={recordState}
            disabled={!canRecord || isRecording}
            aria-describedby={statusId}
            onClick={recordEvidence}
          >
            <span
              className={recordState === "loading" ? styles.loadingSpinner : undefined}
              aria-hidden="true"
            >
              {recordState === "loading" ? "" : recordState === "success" ? "✓" : recordState === "error" ? "!" : "→"}
            </span>
            {recordState === "loading"
              ? t(language, "正在记录…", "Recording…")
              : recordState === "success"
                ? t(language, "已记录", "Recorded")
                : recordState === "error"
                  ? t(language, "重试", "Retry")
                  : recordState === "disabled"
                    ? t(language, "先完成要求", "Complete requirements")
                    : t(language, "记录这一步", "Record work")}
          </button>
        </div>
      )}
    </section>
  );
}

function BilingualStatus({ zh, en }: { zh: string; en: string }) {
  return (
    <p>
      <span lang="zh-CN">{zh}</span>
      <span lang="en">{en}</span>
    </p>
  );
}

function ScientificCalculator({
  language,
  value,
  onChange,
}: {
  language: AnswerWorkspaceLanguage;
  value: { expression: string; result: string };
  onChange: (value: { expression: string; result: string }) => void;
}) {
  const [error, setError] = useState("");
  const keys = ["7", "8", "9", "÷", "sin(", "4", "5", "6", "×", "cos(", "1", "2", "3", "−", "√(", "0", ".", "π", "+", "^", "(", ")", "ANS"];

  function insert(key: string) {
    const normalized =
      key === "ANS" ? value.result
        : key === "√(" ? "sqrt("
          : key === "π" ? "pi"
            : key;
    onChange({ expression: value.expression + normalized, result: "" });
    setError("");
  }

  function calculate() {
    try {
      const result = evaluateMathExpression(value.expression);
      onChange({ ...value, result: String(Number(result.toPrecision(12))) });
      setError("");
    } catch {
      setError(
        t(
          language,
          "无法计算。请检查括号、运算符和函数写法。",
          "Could not calculate. Check brackets, operators, and function names.",
        ),
      );
    }
  }

  return (
    <div className={styles.calculator}>
      <div className={styles.toolHeading}>
        <div>
          <h3>{toolLabel("scientific-calculator", language)}</h3>
          <p>
            {t(
              language,
              "先列式，再用计算器核对；三角函数使用弧度。",
              "Form the expression first, then verify it here. Trig functions use radians.",
            )}
          </p>
        </div>
        <span className={styles.toolMark} aria-hidden="true">∑</span>
      </div>
      <label className={styles.inputLabel}>
        <span>{t(language, "算式", "Expression")}</span>
        <input
          value={value.expression}
          inputMode="text"
          autoComplete="off"
          onChange={(event) => {
            onChange({ expression: event.target.value, result: "" });
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") calculate();
          }}
          placeholder="sqrt(3^2 + 4^2)"
        />
      </label>
      <div className={styles.calculatorKeys}>
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => insert(key)}
            aria-label={calculatorKeyLabel(key, language)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className={styles.secondaryActions}>
        <button
          type="button"
          onClick={() => {
            onChange({ expression: "", result: "" });
            setError("");
          }}
        >
          {t(language, "清空", "Clear")}
        </button>
        <button type="button" onClick={calculate}>
          {t(language, "计算", "Calculate")}
        </button>
      </div>
      {value.result && (
        <output className={styles.calculatorResult} aria-live="polite">
          <span>{t(language, "结果", "Result")}</span>
          <strong>{value.result}</strong>
        </output>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

function DrawingBoard({
  mode,
  language,
  onEvidenceChange,
}: {
  mode: DrawingMode;
  language: AnswerWorkspaceLanguage;
  onEvidenceChange: (evidence: DrawingEvidence) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<DrawingTool>(mode === "circuit" ? "wire" : "pen");
  const [color, setColor] = useState("#17352a");
  const [lineWidth, setLineWidth] = useState(3);

  const availableTools: DrawingTool[] =
    mode === "circuit"
      ? ["wire", "resistor", "battery", "lamp", "pen"]
      : ["pen", "line", "arrow"];

  const render = useCallback(
    (preview?: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const pixelWidth = Math.max(1, Math.round(rect.width * scale));
      const pixelHeight = Math.max(1, Math.round(rect.height * scale));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      drawBoardBackground(context, rect.width, rect.height, mode);
      for (const stroke of strokes) drawStroke(context, stroke, rect.width, rect.height);
      if (preview) drawStroke(context, preview, rect.width, rect.height);
    },
    [mode, strokes],
  );

  useEffect(() => {
    render();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => render(activeStroke.current));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    onEvidenceChange({
      mode,
      strokeCount: strokes.length,
      pointCount: strokes.reduce((sum, stroke) => sum + stroke.points.length, 0),
      toolsUsed: Array.from(new Set(strokes.map((stroke) => stroke.kind))),
      colorsUsed: Array.from(new Set(strokes.map((stroke) => stroke.color))),
      lineWidthsUsed: Array.from(new Set(strokes.map((stroke) => stroke.width))),
    });
  }, [mode, onEvidenceChange, strokes]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }

  function startStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    activeStroke.current = {
      id: `${Date.now()}-${event.pointerId}`,
      kind: tool,
      points: [point],
      color,
      width: lineWidth,
    };
    render(activeStroke.current);
  }

  function continueStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    const current = activeStroke.current;
    if (!current) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    current.points =
      current.kind === "pen"
        ? [...current.points, point]
        : [current.points[0], point];
    render(current);
  }

  function finishStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    const current = activeStroke.current;
    if (!current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeStroke.current = null;
    const completed =
      current.points.length === 1
        ? { ...current, points: [current.points[0], { x: current.points[0].x + 0.001, y: current.points[0].y + 0.001 }] }
        : current;
    setStrokes((items) => [...items, completed]);
  }

  const heading =
    mode === "coordinate"
      ? toolLabel("coordinate-board", language)
      : mode === "circuit"
        ? toolLabel("circuit-sketch", language)
        : toolLabel("diagram-board", language);

  return (
    <div className={styles.boardTool}>
      <div className={styles.toolHeading}>
        <div>
          <h3>{heading}</h3>
          <p>
            {t(
              language,
              "只在画布内拖动时绘图；请从画布外侧上下滑动页面。",
              "Drag inside the canvas to draw; swipe outside it to scroll the page.",
            )}
          </p>
        </div>
        <span className={styles.toolMark} aria-hidden="true">
          {mode === "circuit" ? "⌁" : "✎"}
        </span>
      </div>

      <div className={styles.boardControls} aria-label={t(language, "画板工具", "Drawing tools")}>
        {availableTools.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tool === item}
            className={tool === item ? styles.controlActive : undefined}
            onClick={() => setTool(item)}
          >
            <span aria-hidden="true">{drawingToolIcon(item)}</span>
            {drawingToolLabel(item, language)}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className={styles.drawingCanvas}
        aria-label={t(language, `${heading}，可触控绘制`, `${heading}, touch-enabled drawing area`)}
        onPointerDown={startStroke}
        onPointerMove={continueStroke}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />

      <div className={styles.boardOptions}>
        <label>
          <span>{t(language, "颜色", "Colour")}</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-label={t(language, "选择线条颜色", "Choose line colour")}
          />
        </label>
        <label>
          <span>{t(language, "线宽", "Width")}: {lineWidth}</span>
          <input
            type="range"
            min="2"
            max="8"
            value={lineWidth}
            onChange={(event) => setLineWidth(Number(event.target.value))}
            aria-label={t(language, "选择线宽", "Choose line width")}
          />
        </label>
        <div className={styles.secondaryActions}>
          <button type="button" disabled={strokes.length === 0} onClick={() => setStrokes((items) => items.slice(0, -1))}>
            {t(language, "撤销", "Undo")}
          </button>
          <button type="button" disabled={strokes.length === 0} onClick={() => setStrokes([])}>
            {t(language, "清空", "Clear")}
          </button>
        </div>
      </div>
      <p className={styles.evidenceCount} aria-live="polite">
        {t(language, `已记录 ${strokes.length} 笔`, `${strokes.length} stroke${strokes.length === 1 ? "" : "s"} recorded`)}
      </p>
    </div>
  );
}

function UnitConversionLog({
  language,
  items,
  onChange,
}: {
  language: AnswerWorkspaceLanguage;
  items: UnitConversionEvidence[];
  onChange: (items: UnitConversionEvidence[]) => void;
}) {
  const emptyDraft = { value: "", fromUnit: "", factor: "", toUnit: "", result: "", note: "" };
  const [draft, setDraft] = useState(emptyDraft);
  const canAdd = isValidUnitConversion({ ...draft, id: "draft" });

  function addItem() {
    if (!canAdd) return;
    onChange([...items, { ...draft, id: `${Date.now()}` }]);
    setDraft(emptyDraft);
  }

  return (
    <div>
      <div className={styles.toolHeading}>
        <div>
          <h3>{toolLabel("unit-conversion", language)}</h3>
          <p>
            {t(
              language,
              "写出换算因子，让 AI 能检查量纲而不只是最终数字。",
              "Record the conversion factor so the AI can check dimensions, not only the final number.",
            )}
          </p>
        </div>
        <span className={styles.toolMark} aria-hidden="true">↔</span>
      </div>
      <div className={styles.unitGrid}>
        <label className={styles.inputLabel}>
          <span>{t(language, "原数值", "Value")}</span>
          <input
            inputMode="decimal"
            value={draft.value}
            onChange={(event) => setDraft({ ...draft, value: event.target.value })}
            placeholder="250"
          />
        </label>
        <label className={styles.inputLabel}>
          <span>{t(language, "原单位", "From unit")}</span>
          <input
            value={draft.fromUnit}
            onChange={(event) => setDraft({ ...draft, fromUnit: event.target.value })}
            placeholder="mA"
          />
        </label>
        <label className={styles.inputLabel}>
          <span>{t(language, "换算因子", "Factor")}</span>
          <input
            inputMode="text"
            value={draft.factor}
            onChange={(event) => setDraft({ ...draft, factor: event.target.value })}
            placeholder="× 10^-3"
          />
        </label>
        <label className={styles.inputLabel}>
          <span>{t(language, "目标单位", "To unit")}</span>
          <input
            value={draft.toUnit}
            onChange={(event) => setDraft({ ...draft, toUnit: event.target.value })}
            placeholder="A"
          />
        </label>
        <label className={styles.inputLabel}>
          <span>{t(language, "结果", "Result")}</span>
          <input
            inputMode="decimal"
            value={draft.result}
            onChange={(event) => setDraft({ ...draft, result: event.target.value })}
            placeholder="0.25"
          />
        </label>
        <label className={`${styles.inputLabel} ${styles.fullWidth}`}>
          <span>{t(language, "量纲或前缀说明", "Dimension or prefix note")}</span>
          <input
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder={t(language, "m 表示 10^-3", "m means 10^-3")}
          />
        </label>
      </div>
      {!canAdd && (
        <p className={styles.fieldHint}>
          {t(
            language,
            "填写原数值、原单位、换算因子、目标单位和结果后才能加入。",
            "Enter the value, both units, conversion factor, and result before adding.",
          )}
        </p>
      )}
      <button
        type="button"
        className={styles.addRecordButton}
        disabled={!canAdd}
        onClick={addItem}
      >
        + {t(language, "加入换算记录", "Add conversion")}
      </button>
      {items.length > 0 && (
        <ol className={styles.recordList}>
          {items.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.value || "?"} {item.fromUnit}</strong>
                {" × "}{item.factor || "?"}{" = "}
                <strong>{item.result || "?"} {item.toUnit}</strong>
                {item.note && <small>{item.note}</small>}
              </span>
              <button
                type="button"
                aria-label={t(language, "删除这条换算", "Delete this conversion")}
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CodeDraft({
  language,
  code,
  onCodeChange,
  testCases,
  onTestCasesChange,
}: {
  language: AnswerWorkspaceLanguage;
  code: string;
  onCodeChange: (value: string) => void;
  testCases: CodeTestCaseEvidence[];
  onTestCasesChange: (value: CodeTestCaseEvidence[]) => void;
}) {
  const [draftCase, setDraftCase] = useState({ input: "", expected: "", note: "" });
  const canAddTestCase = isValidTestCase({ ...draftCase, id: "draft" });

  function addTestCase() {
    if (!canAddTestCase) return;
    onTestCasesChange([...testCases, { ...draftCase, id: `${Date.now()}` }]);
    setDraftCase({ input: "", expected: "", note: "" });
  }

  return (
    <div>
      <div className={styles.toolHeading}>
        <div>
          <h3>{toolLabel("code-draft", language)}</h3>
          <p>
            {t(
              language,
              "这里只记录思路，不会运行代码。先写正常、边界和异常输入。",
              "This records reasoning only; it never runs code. Add normal, boundary, and invalid inputs.",
            )}
          </p>
        </div>
        <span className={styles.toolMark} aria-hidden="true">C</span>
      </div>
      <label className={styles.codeField}>
        <span>{t(language, "C 代码草稿", "C code draft")}</span>
        <textarea
          value={code}
          rows={10}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder={"#include <stdio.h>\n\nint main(void) {\n  // plan first\n  return 0;\n}"}
        />
      </label>
      <fieldset className={styles.testCaseDraft}>
        <legend>{t(language, "新增测试用例", "Add a test case")}</legend>
        <label className={styles.inputLabel}>
          <span>{t(language, "输入", "Input")}</span>
          <input
            value={draftCase.input}
            onChange={(event) => setDraftCase({ ...draftCase, input: event.target.value })}
            placeholder="0"
          />
        </label>
        <label className={styles.inputLabel}>
          <span>{t(language, "期望输出", "Expected output")}</span>
          <input
            value={draftCase.expected}
            onChange={(event) => setDraftCase({ ...draftCase, expected: event.target.value })}
            placeholder="0"
          />
        </label>
        <label className={`${styles.inputLabel} ${styles.fullWidth}`}>
          <span>{t(language, "为什么要测它", "Why this case matters")}</span>
          <input
            value={draftCase.note}
            onChange={(event) => setDraftCase({ ...draftCase, note: event.target.value })}
            placeholder={t(language, "边界值：循环不应执行", "Boundary: the loop should not run")}
          />
        </label>
      </fieldset>
      {!canAddTestCase && (
        <p className={styles.fieldHint}>
          {t(
            language,
            "填写输入和期望输出后才能加入；无输入时请明确写“无”。",
            "Enter both input and expected output; write “none” explicitly when there is no input.",
          )}
        </p>
      )}
      <button
        type="button"
        className={styles.addRecordButton}
        disabled={!canAddTestCase}
        onClick={addTestCase}
      >
        + {t(language, "加入测试用例", "Add test case")}
      </button>
      {testCases.length > 0 && (
        <ol className={styles.recordList}>
          {testCases.map((testCase) => (
            <li key={testCase.id}>
              <span>
                <strong>{t(language, "输入", "In")}: {testCase.input || "—"}</strong>
                {" → "}
                <strong>{t(language, "预期", "Expected")}: {testCase.expected || "—"}</strong>
                {testCase.note && <small>{testCase.note}</small>}
              </span>
              <button
                type="button"
                aria-label={t(language, "删除这个测试用例", "Delete this test case")}
                onClick={() => onTestCasesChange(testCases.filter((entry) => entry.id !== testCase.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function drawingToolLabel(tool: DrawingTool, language: AnswerWorkspaceLanguage) {
  const labels: Record<DrawingTool, [string, string]> = {
    pen: ["画笔", "Pen"],
    line: ["直线", "Line"],
    arrow: ["箭头", "Arrow"],
    wire: ["导线", "Wire"],
    resistor: ["电阻", "Resistor"],
    battery: ["电源", "Source"],
    lamp: ["灯泡", "Lamp"],
  };
  return t(language, ...labels[tool]);
}

function drawingToolIcon(tool: DrawingTool) {
  const icons: Record<DrawingTool, string> = {
    pen: "✎",
    line: "╱",
    arrow: "↗",
    wire: "━",
    resistor: "〰",
    battery: "⊣",
    lamp: "⊗",
  };
  return icons[tool];
}

function drawBoardBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: DrawingMode,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffefa";
  context.fillRect(0, 0, width, height);

  if (mode === "diagram") return;

  context.save();
  if (mode === "coordinate") {
    const step = Math.max(24, Math.min(38, width / 10));
    context.strokeStyle = "#e7e9e4";
    context.lineWidth = 1;
    for (let x = width / 2; x <= width; x += step) drawSimpleLine(context, x, 0, x, height);
    for (let x = width / 2 - step; x >= 0; x -= step) drawSimpleLine(context, x, 0, x, height);
    for (let y = height / 2; y <= height; y += step) drawSimpleLine(context, 0, y, width, y);
    for (let y = height / 2 - step; y >= 0; y -= step) drawSimpleLine(context, 0, y, width, y);
    context.strokeStyle = "#8e9992";
    context.lineWidth = 1.6;
    drawSimpleLine(context, 0, height / 2, width, height / 2);
    drawSimpleLine(context, width / 2, 0, width / 2, height);
    context.fillStyle = "#5f6a63";
    context.font = "600 12px system-ui";
    context.fillText("x", width - 16, height / 2 - 9);
    context.fillText("y", width / 2 + 9, 15);
    context.fillText("0", width / 2 + 7, height / 2 + 15);
  } else {
    context.fillStyle = "#d8ddd8";
    const step = 24;
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        context.beginPath();
        context.arc(x, y, 1.2, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  context.restore();
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
) {
  if (stroke.points.length === 0) return;
  const points = stroke.points.map((point) => ({ x: point.x * width, y: point.y * height }));
  context.save();
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (stroke.kind === "pen") {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    return;
  }

  const start = points[0];
  const end = points.at(-1) ?? start;
  if (stroke.kind === "line" || stroke.kind === "wire" || stroke.kind === "arrow") {
    drawSimpleLine(context, start.x, start.y, end.x, end.y);
    if (stroke.kind === "arrow") drawArrowHead(context, start, end, stroke.width);
  } else if (stroke.kind === "resistor") {
    drawResistor(context, start, end);
  } else if (stroke.kind === "battery") {
    drawBattery(context, start, end);
  } else if (stroke.kind === "lamp") {
    drawLamp(context, start, end);
  }
  context.restore();
}

function drawSimpleLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function drawArrowHead(context: CanvasRenderingContext2D, start: Point, end: Point, width: number) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = Math.max(10, width * 3.5);
  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - length * Math.cos(angle - Math.PI / 6), end.y - length * Math.sin(angle - Math.PI / 6));
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - length * Math.cos(angle + Math.PI / 6), end.y - length * Math.sin(angle + Math.PI / 6));
  context.stroke();
}

function drawResistor(context: CanvasRenderingContext2D, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  context.beginPath();
  context.moveTo(start.x, start.y);
  for (let index = 1; index < 9; index += 1) {
    const progress = index / 9;
    const amplitude = index % 2 === 0 ? -8 : 8;
    context.lineTo(start.x + dx * progress + nx * amplitude, start.y + dy * progress + ny * amplitude);
  }
  context.lineTo(end.x, end.y);
  context.stroke();
}

function drawBattery(context: CanvasRenderingContext2D, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const gap = 7;
  drawSimpleLine(context, start.x, start.y, middle.x - ux * gap, middle.y - uy * gap);
  drawSimpleLine(context, middle.x + ux * gap, middle.y + uy * gap, end.x, end.y);
  drawSimpleLine(context, middle.x - nx * 16, middle.y - ny * 16, middle.x + nx * 16, middle.y + ny * 16);
  const second = { x: middle.x + ux * 10, y: middle.y + uy * 10 };
  drawSimpleLine(context, second.x - nx * 9, second.y - ny * 9, second.x + nx * 9, second.y + ny * 9);
}

function drawLamp(context: CanvasRenderingContext2D, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const radius = Math.max(12, Math.min(30, length * 0.22));
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  drawSimpleLine(context, start.x, start.y, middle.x - ux * radius, middle.y - uy * radius);
  drawSimpleLine(context, middle.x + ux * radius, middle.y + uy * radius, end.x, end.y);
  context.beginPath();
  context.arc(middle.x, middle.y, radius, 0, Math.PI * 2);
  context.stroke();
  drawSimpleLine(context, middle.x - ux * radius * 0.65 - nx * radius * 0.65, middle.y - uy * radius * 0.65 - ny * radius * 0.65, middle.x + ux * radius * 0.65 + nx * radius * 0.65, middle.y + uy * radius * 0.65 + ny * radius * 0.65);
  drawSimpleLine(context, middle.x - ux * radius * 0.65 + nx * radius * 0.65, middle.y - uy * radius * 0.65 + ny * radius * 0.65, middle.x + ux * radius * 0.65 - nx * radius * 0.65, middle.y + uy * radius * 0.65 - ny * radius * 0.65);
}

function calculatorKeyLabel(key: string, language: AnswerWorkspaceLanguage) {
  const labels: Record<string, [string, string]> = {
    "÷": ["除以", "Divide"],
    "×": ["乘以", "Multiply"],
    "−": ["减", "Minus"],
    "√(": ["平方根", "Square root"],
    "sin(": ["正弦", "Sine"],
    "cos(": ["余弦", "Cosine"],
    "π": ["圆周率", "Pi"],
    "^": ["次方", "Power"],
    "(": ["左括号", "Open parenthesis"],
    ")": ["右括号", "Close parenthesis"],
    ANS: ["上次结果", "Previous result"],
  };
  const value = labels[key];
  return value ? t(language, ...value) : key;
}
