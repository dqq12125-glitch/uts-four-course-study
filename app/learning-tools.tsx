"use client";

import { useId, useState } from "react";
import {
  QuestionVisualPanel,
  visualIsCompatible,
  type LearningVisualIntent,
} from "./question-visuals";

export type { LearningVisualIntent } from "./question-visuals";

type Lang = "zh" | "en";

const labels = {
  zh: {
    visual: "题目图像",
    visualHint: "先读图、标出变量和方向，再决定公式。",
    calculator: "学习计算器",
    calculatorHint: "用于检查你已经列出的算式，不会替你选择公式。",
    placeholder: "例如：(6+2.5*4)*4/2",
    calculate: "计算",
    clear: "清空",
    invalid: "无法计算：请检查括号、符号或函数写法。",
    result: "结果",
  },
  en: {
    visual: "Question visual",
    visualHint: "Read the diagram, label variables and directions, then choose an equation.",
    calculator: "Learning calculator",
    calculatorHint: "Use it to verify an expression you have already formed—not to choose the formula.",
    placeholder: "Example: (6+2.5*4)*4/2",
    calculate: "Calculate",
    clear: "Clear",
    invalid: "Could not calculate. Check brackets, symbols and function names.",
    result: "Result",
  },
};

const calculatorKeys = ["7", "8", "9", "÷", "sin(", "4", "5", "6", "×", "cos(", "1", "2", "3", "−", "√(", "0", ".", "π", "+", "^", "(", ")", "ANS"];

export function MathPhysicsTools({
  courseId,
  topicId,
  lang,
  visual = null,
  showCalculator = false,
}: {
  courseId: string;
  topicId?: string;
  lang: Lang;
  /**
   * A diagram is rendered only when the current question supplies an explicit,
   * semantically compatible intent. topicId is never used to guess a diagram.
   */
  visual?: LearningVisualIntent | null;
  showCalculator?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [error, setError] = useState("");
  const calculatorId = useId();
  const copy = labels[lang];
  const compatibleVisual = visualIsCompatible(courseId, visual) ? visual : null;

  function insert(key: string) {
    const value = key === "×" ? "*" : key === "÷" ? "/" : key === "−" ? "-" : key === "π" ? "pi" : key === "√(" ? "sqrt(" : key === "ANS" ? String(answer ?? "") : key;
    setExpression((current) => current + value);
    setError("");
  }

  function calculate() {
    try {
      const value = evaluateExpression(expression);
      if (!Number.isFinite(value)) throw new Error("not finite");
      setAnswer(Number(value.toPrecision(10)));
      setError("");
    } catch {
      setAnswer(null);
      setError(copy.invalid);
    }
  }

  if (!compatibleVisual && !showCalculator) return null;

  return (
    <section
      className="math-physics-tools"
      aria-label={lang === "zh" ? "题目学习工具" : "Question learning tools"}
      data-course-id={courseId}
      data-topic-id={topicId}
    >
      {compatibleVisual && <QuestionVisualPanel visual={compatibleVisual} lang={lang} />}
      {showCalculator && <button
        className="calculator-toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={calculatorId}
        style={{ minHeight: 44 }}
      >
        <span>⌗</span>
        <span><strong>{copy.calculator}</strong><small>{copy.calculatorHint}</small></span>
        <b>{open ? "−" : "+"}</b>
      </button>}
      {showCalculator && open && (
        <div className="learning-calculator" id={calculatorId}>
          <label>
            <span>{copy.calculator}</span>
            <input
              inputMode="text"
              value={expression}
              placeholder={copy.placeholder}
              onChange={(event) => { setExpression(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") calculate(); }}
              style={{ minHeight: 44 }}
            />
          </label>
          <div className="calculator-keys">
            {calculatorKeys.map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => insert(key)}
                aria-label={calculatorKeyLabel(key, lang)}
                style={{ minHeight: 44, minWidth: 44 }}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="calculator-actions">
            <button
              type="button"
              onClick={() => { setExpression(""); setAnswer(null); setError(""); }}
              style={{ minHeight: 44 }}
            >
              {copy.clear}
            </button>
            <button className="calculate" type="button" onClick={calculate} style={{ minHeight: 44 }}>
              {copy.calculate}
            </button>
          </div>
          {answer !== null && <output aria-live="polite"><span>{copy.result}</span><strong>{answer}</strong></output>}
          {error && <p className="calculator-error" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}

function calculatorKeyLabel(key: string, lang: Lang) {
  const labelsByKey: Record<string, [string, string]> = {
    "÷": ["除以", "divide"],
    "×": ["乘以", "multiply"],
    "−": ["减", "minus"],
    "√(": ["平方根，左括号", "square root, open parenthesis"],
    "sin(": ["正弦，左括号", "sine, open parenthesis"],
    "cos(": ["余弦，左括号", "cosine, open parenthesis"],
    "π": ["圆周率", "pi"],
    "^": ["次方", "power"],
    "(": ["左括号", "open parenthesis"],
    ")": ["右括号", "close parenthesis"],
    "ANS": ["上一次结果", "previous answer"],
  };
  return labelsByKey[key]?.[lang === "zh" ? 0 : 1] ?? key;
}

function evaluateExpression(raw: string) {
  let expression = raw
    .toLowerCase()
    .replace(/π/g, "pi")
    .replace(/÷/g, "/")
    .replace(/[×·]/g, "*")
    .replace(/[−–]/g, "-")
    .replace(/\^/g, "**")
    .replace(/\bln\(/g, "log(")
    .replace(/\bpi\b/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`);
  expression = expression
    .replace(/(\d|\))(?=\()/g, "$1*")
    .replace(/(\d|\))(?=(sin|cos|tan|sqrt|log|abs)\()/g, "$1*")
    .replace(/\)(?=\d)/g, ")*");
  if (!/^[0-9+\-*/().,\s_a-z]+$/.test(expression)) throw new Error("unsupported");
  const identifiers = expression.match(/[a-z_]+/g) ?? [];
  if (identifiers.some((name) => !["sin", "cos", "tan", "sqrt", "log", "abs"].includes(name))) throw new Error("unsupported");
  const js = expression
    .replace(/\bsin\(/g, "Math.sin(")
    .replace(/\bcos\(/g, "Math.cos(")
    .replace(/\btan\(/g, "Math.tan(")
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\blog\(/g, "Math.log(")
    .replace(/\babs\(/g, "Math.abs(");
  return Function(`"use strict"; return (${js});`)() as number;
}
