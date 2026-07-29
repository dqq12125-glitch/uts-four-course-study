"use client";

import { useEffect, useRef, useState } from "react";

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
}: {
  courseId: string;
  topicId?: string;
  lang: Lang;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [error, setError] = useState("");
  const copy = labels[lang];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawTopicVisual(canvas, courseId, topicId, lang);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [courseId, topicId, lang]);

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

  return (
    <section className="math-physics-tools" aria-label={copy.visual}>
      <div className="learning-visual">
        <div className="tool-heading">
          <span>GRAPH</span>
          <div><strong>{copy.visual}</strong><small>{copy.visualHint}</small></div>
        </div>
        <canvas ref={canvasRef} aria-label={copy.visual} />
      </div>
      <button className="calculator-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>⌗</span>
        <span><strong>{copy.calculator}</strong><small>{copy.calculatorHint}</small></span>
        <b>{open ? "−" : "+"}</b>
      </button>
      {open && (
        <div className="learning-calculator">
          <label>
            <span>{copy.calculator}</span>
            <input
              inputMode="text"
              value={expression}
              placeholder={copy.placeholder}
              onChange={(event) => { setExpression(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") calculate(); }}
            />
          </label>
          <div className="calculator-keys">
            {calculatorKeys.map((key) => <button type="button" key={key} onClick={() => insert(key)}>{key}</button>)}
          </div>
          <div className="calculator-actions">
            <button type="button" onClick={() => { setExpression(""); setAnswer(null); setError(""); }}>{copy.clear}</button>
            <button className="calculate" type="button" onClick={calculate}>{copy.calculate}</button>
          </div>
          {answer !== null && <output><span>{copy.result}</span><strong>{answer}</strong></output>}
          {error && <p className="calculator-error">{error}</p>}
        </div>
      )}
    </section>
  );
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

function drawTopicVisual(canvas: HTMLCanvasElement, courseId: string, topicId: string | undefined, lang: Lang) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, rect.width);
  const height = 210;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const index = Number(topicId?.split("-").at(-1) ?? 0);
  if (courseId === "math") drawMath(ctx, width, height, index, lang);
  else drawPhysics(ctx, width, height, index, lang);
}

function axes(ctx: CanvasRenderingContext2D, width: number, height: number, xLabel: string, yLabel: string) {
  ctx.strokeStyle = "#aeb8b1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(34, height - 30);
  ctx.lineTo(width - 16, height - 30);
  ctx.moveTo(42, height - 20);
  ctx.lineTo(42, 18);
  ctx.stroke();
  ctx.fillStyle = "#65706a";
  ctx.font = "11px sans-serif";
  ctx.fillText(xLabel, width - 26, height - 12);
  ctx.fillText(yLabel, 18, 22);
}

function path(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color = "#246bfd",
  fill = false,
) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = `${color}24`;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.45), y2 - 10 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.45), y2 - 10 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.font = "700 12px sans-serif";
  ctx.fillText(label, x2 + 6, y2 - 5);
}

function drawMath(ctx: CanvasRenderingContext2D, width: number, height: number, index: number, lang: Lang) {
  const blue = "#246bfd";
  if (index === 0) {
    axes(ctx, width, height, "x", "y");
    arrow(ctx, 42, height - 30, width * 0.58, 45, blue, "a");
    arrow(ctx, 42, height - 30, width * 0.78, height - 30, "#f66b4a", "proj a");
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#f66b4a";
    ctx.beginPath(); ctx.moveTo(width * 0.58, 45); ctx.lineTo(width * 0.58, height - 30); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  if (index === 1) {
    ctx.strokeStyle = "#d5dcd7";
    for (let x = 40; x < width - 20; x += 28) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x + 30, height - 24); ctx.stroke(); }
    for (let y = 28; y < height - 20; y += 28) { ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(width - 20, y - 14); ctx.stroke(); }
    arrow(ctx, width / 2, height / 2, width / 2 + 76, height / 2 - 25, blue, "Ae₁");
    arrow(ctx, width / 2, height / 2, width / 2 + 20, height / 2 - 72, "#f66b4a", "Ae₂");
    return;
  }
  axes(ctx, width, height, "x", index === 4 ? "v" : "f(x)");
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 70; i += 1) {
    const x = 42 + i * (width - 70) / 70;
    const t = -2.7 + i * 5.4 / 70;
    const yValue = index === 3 ? Math.sqrt(Math.max(0, 4 - t * t)) : index === 5 ? Math.sin(t) : index === 6 ? Math.exp(t / 2.6) - 1 : 0.18 * t ** 3 - 0.7 * t;
    points.push([x, height - 30 - yValue * (index === 6 ? 42 : 32)]);
  }
  if (index === 4) {
    const area = [[width * 0.38, height - 30], ...points.slice(25, 52), [width * 0.72, height - 30]] as Array<[number, number]>;
    path(ctx, area, blue, true);
  }
  path(ctx, points, blue);
  ctx.fillStyle = "#17211d";
  ctx.font = "700 11px sans-serif";
  const title = index === 2 ? (lang === "zh" ? "斜率 = 变化率" : "slope = rate") :
    index === 3 ? (lang === "zh" ? "切线与隐式曲线" : "tangent & implicit curve") :
    index === 4 ? (lang === "zh" ? "曲线下面积 = 积分" : "area under curve = integral") :
    index === 5 ? (lang === "zh" ? "周期与相位" : "period & phase") :
    (lang === "zh" ? "初值决定解曲线" : "initial value selects a solution");
  ctx.fillText(title, 58, 30);
}

function drawPhysics(ctx: CanvasRenderingContext2D, width: number, height: number, index: number, lang: Lang) {
  const purple = "#7755d9";
  if (index === 1) {
    axes(ctx, width, height, "measurement", "frequency");
    const values = [22, 34, 58, 86, 58, 34, 18];
    values.forEach((value, i) => {
      ctx.fillStyle = i === 3 ? purple : "#c9bdf0";
      ctx.fillRect(55 + i * ((width - 90) / 7), height - 30 - value, 24, value);
    });
    ctx.strokeStyle = "#f66b4a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(width / 2 - 24, 30); ctx.lineTo(width / 2 - 24, height - 22); ctx.moveTo(width / 2 + 24, 30); ctx.lineTo(width / 2 + 24, height - 22); ctx.stroke();
    ctx.fillStyle = "#17211d"; ctx.font = "700 11px sans-serif";
    ctx.fillText(lang === "zh" ? "测量值 ± 不确定度" : "measurement ± uncertainty", 55, 24);
    return;
  }
  if (index === 3 || index === 4) {
    const cx = width / 2, cy = height / 2;
    ctx.fillStyle = "#e9e4fb"; ctx.fillRect(cx - 34, cy - 25, 68, 50);
    ctx.strokeStyle = purple; ctx.lineWidth = 2; ctx.strokeRect(cx - 34, cy - 25, 68, 50);
    arrow(ctx, cx, cy, cx, 25, purple, "N");
    arrow(ctx, cx, cy, cx, height - 24, "#f66b4a", "mg");
    arrow(ctx, cx, cy, width - 30, cy, "#246bfd", "F");
    arrow(ctx, cx, cy, 28, cy, "#1c9a70", "f");
    ctx.fillStyle = "#17211d"; ctx.font = "700 11px sans-serif";
    ctx.fillText(lang === "zh" ? "先画受力图，再写 ΣF=ma" : "draw forces before ΣF=ma", 22, 22);
    return;
  }
  if (index === 2) {
    const boxes = [
      [20, lang === "zh" ? "现象" : "phenomenon"],
      [width / 2 - 45, lang === "zh" ? "模型" : "model"],
      [width - 110, lang === "zh" ? "预测" : "prediction"],
    ] as Array<[number, string]>;
    boxes.forEach(([x, text], i) => {
      ctx.fillStyle = i === 1 ? "#e9e4fb" : "#f1eee7"; ctx.fillRect(x, 70, 90, 62);
      ctx.fillStyle = "#17211d"; ctx.font = "700 12px sans-serif"; ctx.fillText(text, x + 18, 105);
      if (i < 2) arrow(ctx, x + 92, 101, boxes[i + 1][0] - 5, 101, purple, "");
    });
    ctx.fillStyle = "#65706a"; ctx.font = "11px sans-serif";
    ctx.fillText(lang === "zh" ? "已知量 · 单位 · 假设 · 检验" : "knowns · units · assumptions · test", 28, 166);
    return;
  }
  axes(ctx, width, height, "t", index === 5 ? "F" : "x");
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 60; i += 1) {
    const x = 42 + i * (width - 70) / 60;
    const t = i / 60;
    const y = index === 5 ? 0.8 * t + (i % 7 - 3) * 0.012 : 0.78 * t * t + 0.08 * t;
    points.push([x, height - 30 - y * 150]);
  }
  if (index === 5) {
    points.forEach(([x, y]) => { ctx.fillStyle = "#7755d9"; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); });
    path(ctx, [[42, height - 30 - 4], [width - 28, height - 30 - 124]], "#f66b4a");
  } else path(ctx, points, purple);
  ctx.fillStyle = "#17211d"; ctx.font = "700 11px sans-serif";
  ctx.fillText(index === 5 ? (lang === "zh" ? "斜率、拟合与残差" : "slope, fit & residuals") : (lang === "zh" ? "位置—时间图：斜率是速度" : "position–time: slope is velocity"), 55, 26);
}
