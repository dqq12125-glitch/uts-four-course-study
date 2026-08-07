"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { AnswerWorkspaceLanguage, DrawingEvidence } from "./answer-workspace";
import { evaluateMathExpression } from "./math-expression";
import styles from "./answer-workspace.module.css";

type CoordinateTool = "pan" | "point" | "freehand" | "line" | "vector" | "eraser";
type DrawableTool = Exclude<CoordinateTool, "pan" | "eraser">;

type WorldPoint = { x: number; y: number };
type CoordinateView = { centerX: number; centerY: number; scale: number };
type CoordinateObject = {
  id: string;
  kind: DrawableTool | "function";
  points: WorldPoint[];
  color: string;
  width: number;
  expression?: string;
};

const INITIAL_VIEW: CoordinateView = { centerX: 0, centerY: 0, scale: 34 };
const MIN_SCALE = 10;
const MAX_SCALE = 180;

function t(language: AnswerWorkspaceLanguage, zh: string, en: string) {
  if (language === "zh") return zh;
  if (language === "en") return en;
  return `${zh} / ${en}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gridStep(scale: number) {
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  return candidates.find((candidate) => candidate * scale >= 24) ?? 100;
}

function decimalPlaces(step: number) {
  if (step >= 1) return 0;
  return Math.min(3, Math.max(1, Math.ceil(-Math.log10(step))));
}

function formatCoordinate(value: number, step: number) {
  const safe = Math.abs(value) < step / 100 ? 0 : value;
  return safe.toFixed(decimalPlaces(step)).replace(/\.0+$/, "");
}

function screenPoint(
  point: WorldPoint,
  view: CoordinateView,
  width: number,
  height: number,
) {
  return {
    x: width / 2 + (point.x - view.centerX) * view.scale,
    y: height / 2 - (point.y - view.centerY) * view.scale,
  };
}

function worldPoint(
  x: number,
  y: number,
  view: CoordinateView,
  width: number,
  height: number,
) {
  return {
    x: view.centerX + (x - width / 2) / view.scale,
    y: view.centerY - (y - height / 2) / view.scale,
  };
}

function snapPoint(point: WorldPoint, step: number) {
  return {
    x: Math.round(point.x / step) * step,
    y: Math.round(point.y / step) * step,
  };
}

function drawArrowHead(
  context: CanvasRenderingContext2D,
  start: WorldPoint,
  end: WorldPoint,
  view: CoordinateView,
  width: number,
  height: number,
  size = 11,
) {
  const a = screenPoint(start, view, width, height);
  const b = screenPoint(end, view, width, height);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  context.beginPath();
  context.moveTo(b.x, b.y);
  context.lineTo(b.x - size * Math.cos(angle - Math.PI / 6), b.y - size * Math.sin(angle - Math.PI / 6));
  context.lineTo(b.x - size * Math.cos(angle + Math.PI / 6), b.y - size * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function functionPoints(expression: string, view: CoordinateView, width: number) {
  const left = view.centerX - width / (2 * view.scale);
  const right = view.centerX + width / (2 * view.scale);
  const samples: Array<WorldPoint | null> = [];
  const count = Math.max(180, Math.round(width * 1.25));
  for (let index = 0; index <= count; index += 1) {
    const x = left + ((right - left) * index) / count;
    try {
      const y = evaluateMathExpression(expression, { x });
      samples.push(Number.isFinite(y) ? { x, y } : null);
    } catch {
      samples.push(null);
    }
  }
  return samples;
}

function drawCoordinateGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: CoordinateView,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffdf8";
  context.fillRect(0, 0, width, height);

  const step = gridStep(view.scale);
  const left = view.centerX - width / (2 * view.scale);
  const right = view.centerX + width / (2 * view.scale);
  const bottom = view.centerY - height / (2 * view.scale);
  const top = view.centerY + height / (2 * view.scale);
  const firstX = Math.floor(left / step) * step;
  const firstY = Math.floor(bottom / step) * step;

  context.lineWidth = 1;
  for (let x = firstX; x <= right + step / 2; x += step) {
    const point = screenPoint({ x, y: 0 }, view, width, height);
    const major = Math.abs(Math.round(x / step)) % 5 === 0;
    context.strokeStyle = major ? "rgba(23,53,42,.14)" : "rgba(23,53,42,.065)";
    context.beginPath();
    context.moveTo(Math.round(point.x) + 0.5, 0);
    context.lineTo(Math.round(point.x) + 0.5, height);
    context.stroke();
  }
  for (let y = firstY; y <= top + step / 2; y += step) {
    const point = screenPoint({ x: 0, y }, view, width, height);
    const major = Math.abs(Math.round(y / step)) % 5 === 0;
    context.strokeStyle = major ? "rgba(23,53,42,.14)" : "rgba(23,53,42,.065)";
    context.beginPath();
    context.moveTo(0, Math.round(point.y) + 0.5);
    context.lineTo(width, Math.round(point.y) + 0.5);
    context.stroke();
  }

  const origin = screenPoint({ x: 0, y: 0 }, view, width, height);
  const axisY = clamp(origin.y, 18, height - 18);
  const axisX = clamp(origin.x, 20, width - 20);
  context.strokeStyle = "#17352a";
  context.fillStyle = "#17352a";
  context.lineWidth = 1.6;
  context.beginPath();
  context.moveTo(0, axisY);
  context.lineTo(width - 8, axisY);
  context.moveTo(axisX, height);
  context.lineTo(axisX, 8);
  context.stroke();
  drawArrowHead(context, worldPoint(width - 28, axisY, view, width, height), worldPoint(width - 8, axisY, view, width, height), view, width, height, 8);
  drawArrowHead(context, worldPoint(axisX, 28, view, width, height), worldPoint(axisX, 8, view, width, height), view, width, height, 8);

  context.font = "600 10px system-ui, sans-serif";
  context.textBaseline = "top";
  context.fillStyle = "rgba(23,53,42,.68)";
  const labelEvery = step * (step * view.scale < 40 ? 2 : 1);
  const firstLabelX = Math.ceil(left / labelEvery) * labelEvery;
  for (let x = firstLabelX; x <= right; x += labelEvery) {
    if (Math.abs(x) < labelEvery / 20) continue;
    const point = screenPoint({ x, y: 0 }, view, width, height);
    const label = formatCoordinate(x, labelEvery);
    context.fillText(label, point.x + 3, clamp(axisY + 4, 3, height - 14));
  }
  context.textAlign = "right";
  context.textBaseline = "middle";
  const firstLabelY = Math.ceil(bottom / labelEvery) * labelEvery;
  for (let y = firstLabelY; y <= top; y += labelEvery) {
    if (Math.abs(y) < labelEvery / 20) continue;
    const point = screenPoint({ x: 0, y }, view, width, height);
    context.fillText(formatCoordinate(y, labelEvery), clamp(axisX - 5, 30, width - 3), point.y);
  }
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = "700 12px system-ui, sans-serif";
  context.fillText("x", width - 17, clamp(axisY - 7, 13, height - 5));
  context.fillText("y", clamp(axisX + 7, 7, width - 12), 15);
}

function drawObject(
  context: CanvasRenderingContext2D,
  object: CoordinateObject,
  view: CoordinateView,
  width: number,
  height: number,
) {
  context.save();
  context.strokeStyle = object.color;
  context.fillStyle = object.color;
  context.lineWidth = object.width;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (object.kind === "function" && object.expression) {
    const points = functionPoints(object.expression, view, width);
    context.beginPath();
    let drawing = false;
    let previousY: number | null = null;
    for (const point of points) {
      if (!point) {
        drawing = false;
        previousY = null;
        continue;
      }
      const screen = screenPoint(point, view, width, height);
      if (screen.y < -height || screen.y > height * 2 || (previousY !== null && Math.abs(screen.y - previousY) > height * 0.7)) {
        drawing = false;
        previousY = screen.y;
        continue;
      }
      if (!drawing) context.moveTo(screen.x, screen.y);
      else context.lineTo(screen.x, screen.y);
      drawing = true;
      previousY = screen.y;
    }
    context.stroke();
    context.restore();
    return;
  }

  const points = object.points.map((point) => screenPoint(point, view, width, height));
  if (object.kind === "point" && points[0]) {
    const point = points[0];
    context.beginPath();
    context.arc(point.x, point.y, Math.max(4, object.width + 1), 0, Math.PI * 2);
    context.fill();
    context.font = "700 11px system-ui, sans-serif";
    const label = `(${formatCoordinate(object.points[0].x, 0.01)}, ${formatCoordinate(object.points[0].y, 0.01)})`;
    const labelWidth = context.measureText(label).width;
    context.fillText(
      label,
      clamp(point.x + 8, 4, width - labelWidth - 4),
      clamp(point.y - 8, 13, height - 4),
    );
    context.restore();
    return;
  }
  if (points.length < 2) {
    context.restore();
    return;
  }
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.stroke();
  if (object.kind === "vector") {
    drawArrowHead(context, object.points[0], object.points.at(-1)!, view, width, height, 12 + object.width);
    const start = object.points[0];
    const end = object.points.at(-1)!;
    context.save();
    context.setLineDash([5, 5]);
    context.strokeStyle = "rgba(36,107,253,.4)";
    context.lineWidth = 1;
    const corner = screenPoint({ x: end.x, y: start.y }, view, width, height);
    const startScreen = screenPoint(start, view, width, height);
    const endScreen = screenPoint(end, view, width, height);
    context.beginPath();
    context.moveTo(startScreen.x, startScreen.y);
    context.lineTo(corner.x, corner.y);
    context.lineTo(endScreen.x, endScreen.y);
    context.stroke();
    context.restore();
  }
  context.restore();
}

function distanceToSegment(point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const amount = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(point.x - (start.x + amount * dx), point.y - (start.y + amount * dy));
}

export function CoordinateBoard({
  language,
  onEvidenceChange,
}: {
  language: AnswerWorkspaceLanguage;
  onEvidenceChange: (evidence: DrawingEvidence) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeObject = useRef<CoordinateObject | null>(null);
  const panStart = useRef<{ x: number; y: number; view: CoordinateView } | null>(null);
  const [objects, setObjects] = useState<CoordinateObject[]>([]);
  const [view, setView] = useState<CoordinateView>(INITIAL_VIEW);
  const [tool, setTool] = useState<CoordinateTool>("point");
  const [color, setColor] = useState("#246bfd");
  const [lineWidth, setLineWidth] = useState(3);
  const [snap, setSnap] = useState(true);
  const [cursor, setCursor] = useState<WorldPoint | null>(null);
  const [expression, setExpression] = useState("x^2");
  const [plotError, setPlotError] = useState("");
  const [exactPoint, setExactPoint] = useState({ x: "", y: "" });

  const render = useCallback((preview?: CoordinateObject | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pixelWidth = Math.max(1, Math.round(rect.width * ratio));
    const pixelHeight = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawCoordinateGrid(context, rect.width, rect.height, view);
    objects.forEach((object) => drawObject(context, object, view, rect.width, rect.height));
    if (preview) drawObject(context, preview, view, rect.width, rect.height);
  }, [objects, view]);

  useEffect(() => {
    render(activeObject.current);
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => render(activeObject.current));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    onEvidenceChange({
      mode: "coordinate",
      strokeCount: objects.length,
      pointCount: objects.reduce((sum, object) => sum + Math.max(2, object.points.length), 0),
      toolsUsed: Array.from(new Set(objects.map((object) => object.kind))),
      colorsUsed: Array.from(new Set(objects.map((object) => object.color))),
      lineWidthsUsed: Array.from(new Set(objects.map((object) => object.width))),
      coordinateObjects: objects.slice(0, 30).map((object) => ({
        kind: object.kind,
        expression: object.expression,
        points: object.points.slice(0, 80).map((point) => ({
          x: Number(point.x.toFixed(4)),
          y: Number(point.y.toFixed(4)),
        })),
      })),
      coordinateView: {
        centerX: Number(view.centerX.toFixed(3)),
        centerY: Number(view.centerY.toFixed(3)),
        unitsAcross: Number((600 / view.scale).toFixed(2)),
      },
    });
  }, [objects, onEvidenceChange, view]);

  function localPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  }

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>, shouldSnap = snap) {
    const local = localPoint(event);
    const point = worldPoint(local.x, local.y, view, local.width, local.height);
    return shouldSnap ? snapPoint(point, gridStep(view.scale)) : point;
  }

  function eraseAt(event: ReactPointerEvent<HTMLCanvasElement>) {
    const local = localPoint(event);
    let nearest = -1;
    let distance = 18;
    objects.forEach((object, index) => {
      if (object.kind === "function") return;
      const points = object.points.map((point) => screenPoint(point, view, local.width, local.height));
      const candidate = object.kind === "point"
        ? Math.hypot(local.x - points[0].x, local.y - points[0].y)
        : points.slice(1).reduce(
            (best, point, pointIndex) => Math.min(best, distanceToSegment(local, points[pointIndex], point)),
            Number.POSITIVE_INFINITY,
          );
      if (candidate < distance) {
        distance = candidate;
        nearest = index;
      }
    });
    if (nearest >= 0) setObjects((items) => items.filter((_, index) => index !== nearest));
  }

  function startInteraction(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const local = localPoint(event);
    setCursor(pointFromEvent(event, false));
    if (tool === "pan") {
      panStart.current = { x: event.clientX, y: event.clientY, view };
      return;
    }
    if (tool === "eraser") {
      eraseAt(event);
      return;
    }
    const point = pointFromEvent(event);
    if (tool === "point") {
      setObjects((items) => [...items, {
        id: `point-${Date.now()}`,
        kind: "point",
        points: [point],
        color,
        width: lineWidth,
      }]);
      return;
    }
    activeObject.current = {
      id: `${tool}-${Date.now()}-${event.pointerId}`,
      kind: tool,
      points: [point],
      color,
      width: lineWidth,
    };
    render(activeObject.current);
    void local;
  }

  function continueInteraction(event: ReactPointerEvent<HTMLCanvasElement>) {
    const local = localPoint(event);
    setCursor(worldPoint(local.x, local.y, view, local.width, local.height));
    if (panStart.current && tool === "pan") {
      event.preventDefault();
      const start = panStart.current;
      setView({
        ...start.view,
        centerX: start.view.centerX - (event.clientX - start.x) / start.view.scale,
        centerY: start.view.centerY + (event.clientY - start.y) / start.view.scale,
      });
      return;
    }
    const current = activeObject.current;
    if (!current) return;
    event.preventDefault();
    const point = pointFromEvent(event, current.kind === "freehand" ? false : snap);
    current.points = current.kind === "freehand" ? [...current.points, point] : [current.points[0], point];
    render(current);
  }

  function finishInteraction(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panStart.current = null;
    const current = activeObject.current;
    if (!current) return;
    activeObject.current = null;
    if (current.points.length > 1) setObjects((items) => [...items, current]);
    else render();
  }

  function zoomAt(factor: number, anchor?: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const point = anchor ?? { x: rect.width / 2, y: rect.height / 2 };
    const before = worldPoint(point.x, point.y, view, rect.width, rect.height);
    const nextScale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
    const nextCenterX = before.x - (point.x - rect.width / 2) / nextScale;
    const nextCenterY = before.y + (point.y - rect.height / 2) / nextScale;
    setView({ centerX: nextCenterX, centerY: nextCenterY, scale: nextScale });
  }

  function handleWheel(event: ReactWheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoomAt(Math.exp(-event.deltaY * 0.0015), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function addFunction() {
    const normalized = expression.trim().replace(/^y\s*=\s*/i, "");
    try {
      evaluateMathExpression(normalized, { x: 0.371 });
      setObjects((items) => [...items, {
        id: `function-${Date.now()}`,
        kind: "function",
        points: [],
        expression: normalized,
        color,
        width: lineWidth,
      }]);
      setPlotError("");
    } catch {
      setPlotError(t(language, "无法绘制：请使用 x、数字、括号、sin/cos/tan、sqrt、ln、log。乘法要写 *。", "Could not plot. Use x, numbers, brackets, sin/cos/tan, sqrt, ln or log. Write multiplication as *."));
    }
  }

  function addExactPoint() {
    const x = Number(exactPoint.x);
    const y = Number(exactPoint.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setObjects((items) => [...items, {
      id: `point-${Date.now()}`,
      kind: "point",
      points: [{ x, y }],
      color,
      width: lineWidth,
    }]);
    setExactPoint({ x: "", y: "" });
  }

  const controls: Array<{ tool: CoordinateTool; icon: string; zh: string; en: string }> = [
    { tool: "pan", icon: "✥", zh: "平移", en: "Pan" },
    { tool: "point", icon: "●", zh: "点", en: "Point" },
    { tool: "line", icon: "╱", zh: "线段", en: "Line" },
    { tool: "vector", icon: "↗", zh: "向量", en: "Vector" },
    { tool: "freehand", icon: "✎", zh: "手绘", en: "Freehand" },
    { tool: "eraser", icon: "⌫", zh: "擦除", en: "Erase" },
  ];
  const step = gridStep(view.scale);
  const cursorLabel = cursor
    ? `x ${formatCoordinate(cursor.x, step)} · y ${formatCoordinate(cursor.y, step)}`
    : t(language, "触摸画板读取坐标", "Touch the board to read coordinates");
  const plottedFunctions = objects.filter(
    (object): object is CoordinateObject & { kind: "function"; expression: string } =>
      object.kind === "function" && Boolean(object.expression),
  );

  return (
    <div className={styles.coordinateBoardTool}>
      <div className={styles.toolHeading}>
        <div>
          <h3>{t(language, "高级坐标画板", "Advanced coordinate board")}</h3>
          <p>{t(language, "可平移缩放、吸附网格、画向量、输入精确坐标并绘制函数。", "Pan, zoom, snap to grid, draw vectors, enter exact points and plot functions.")}</p>
        </div>
        <span className={styles.toolMark} aria-hidden="true">⌗</span>
      </div>

      <div className={styles.coordinateToolbar} role="toolbar" aria-label={t(language, "坐标画板工具", "Coordinate board tools")}>
        {controls.map((control) => (
          <button
            key={control.tool}
            type="button"
            aria-pressed={tool === control.tool}
            className={tool === control.tool ? styles.controlActive : undefined}
            onClick={() => setTool(control.tool)}
          >
            <span aria-hidden="true">{control.icon}</span>
            {t(language, control.zh, control.en)}
          </button>
        ))}
      </div>

      <div className={styles.coordinateViewport} data-tool={tool}>
        <canvas
          ref={canvasRef}
          className={styles.coordinateCanvas}
          aria-label={t(language, "高级坐标画板，可触控作图、平移和缩放", "Advanced coordinate board with touch drawing, panning and zooming")}
          onPointerDown={startInteraction}
          onPointerMove={continueInteraction}
          onPointerUp={finishInteraction}
          onPointerCancel={finishInteraction}
          onPointerLeave={() => setCursor(null)}
          onWheel={handleWheel}
        />
        <output className={styles.coordinateReadout} aria-live="polite">{cursorLabel}</output>
        <div className={styles.coordinateZoom} aria-label={t(language, "缩放与复位", "Zoom and reset")}>
          <button type="button" onClick={() => zoomAt(1.28)} aria-label={t(language, "放大", "Zoom in")}>+</button>
          <button type="button" onClick={() => zoomAt(1 / 1.28)} aria-label={t(language, "缩小", "Zoom out")}>−</button>
          <button type="button" onClick={() => setView(INITIAL_VIEW)} aria-label={t(language, "坐标归零", "Reset view")}>⌂</button>
        </div>
      </div>

      <div className={styles.coordinateStatus}>
        <button type="button" className={snap ? styles.snapActive : undefined} aria-pressed={snap} onClick={() => setSnap((value) => !value)}>
          <span aria-hidden="true">⌁</span>
          {snap ? t(language, "已吸附网格", "Grid snap on") : t(language, "自由坐标", "Free coordinates")}
        </button>
        <span>{t(language, `每小格 ${formatCoordinate(step, step)}`, `${formatCoordinate(step, step)} per minor grid`)}</span>
        <span>{t(language, `${objects.length} 个对象`, `${objects.length} objects`)}</span>
      </div>

      {plottedFunctions.length > 0 && (
        <div className={styles.plottedFunctions} aria-label={t(language, "已绘制函数", "Plotted functions")}>
          {plottedFunctions.map((object) => (
            <div key={object.id}>
              <span style={{ backgroundColor: object.color }} aria-hidden="true" />
              <code>y = {object.expression}</code>
              <button
                type="button"
                aria-label={t(language, `删除函数 y=${object.expression}`, `Remove function y=${object.expression}`)}
                onClick={() => setObjects((items) => items.filter((item) => item.id !== object.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.coordinateInputs}>
        <label className={styles.functionInput}>
          <span>{t(language, "函数", "Function")}</span>
          <span className={styles.inputWithPrefix}><b>y =</b><input value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="sin(x) + 0.5*x" /></span>
        </label>
        <button type="button" onClick={addFunction}>{t(language, "绘制函数", "Plot function")}</button>
        <div className={styles.exactPointInputs}>
          <label><span>x</span><input inputMode="decimal" value={exactPoint.x} onChange={(event) => setExactPoint((point) => ({ ...point, x: event.target.value }))} /></label>
          <label><span>y</span><input inputMode="decimal" value={exactPoint.y} onChange={(event) => setExactPoint((point) => ({ ...point, y: event.target.value }))} /></label>
        </div>
        <button type="button" disabled={!exactPoint.x.trim() || !exactPoint.y.trim()} onClick={addExactPoint}>{t(language, "添加精确点", "Add exact point")}</button>
      </div>
      {plotError && <p className={styles.error} role="alert">{plotError}</p>}

      <div className={styles.boardOptions}>
        <label>
          <span>{t(language, "颜色", "Colour")}</span>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label={t(language, "选择线条颜色", "Choose line colour")} />
        </label>
        <label>
          <span>{t(language, "线宽", "Width")}: {lineWidth}</span>
          <input type="range" min="2" max="8" value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))} aria-label={t(language, "选择线宽", "Choose line width")} />
        </label>
        <div className={styles.secondaryActions}>
          <button type="button" disabled={objects.length === 0} onClick={() => setObjects((items) => items.slice(0, -1))}>{t(language, "撤销", "Undo")}</button>
          <button type="button" disabled={objects.length === 0} onClick={() => setObjects([])}>{t(language, "清空", "Clear")}</button>
        </div>
      </div>
    </div>
  );
}
