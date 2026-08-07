"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type VisualLanguage = "zh" | "en";

export type LocalizedVisualText = {
  zh: string;
  en: string;
};

/**
 * A spatial drawing is opt-in.  It is deliberately data-led: a 3D diagram is
 * rendered only when the question supplies the points or relation that the
 * learner needs to read.  This keeps a decorative "3D" view from implying
 * facts that are not in the question.
 */
type SpatialPoint = {
  label: string;
  value: [number, number, number];
  color?: string;
};

type SpatialTeachingMode =
  | "origin-vectors"
  | "box"
  | "triangle"
  | "head-to-tail"
  | "parallel"
  | "resultant"
  | "angles"
  | "projection"
  | "coordinate-projection";

type SpatialGuide = {
  /** The relation to make visible, rather than merely a choice of camera. */
  mode: SpatialTeachingMode;
  /** Actual named positions, when the question gives positions rather than vectors. */
  points?: SpatialPoint[];
  /** Plane used by an orthogonal projection. */
  plane?: "xy" | "yz" | "xz";
};

type VisualBase = {
  /**
   * Required alternative text. Describe the information conveyed by the
   * drawing, not its appearance.
   */
  alt: LocalizedVisualText;
  caption?: LocalizedVisualText;
};

export type LearningVisualIntent =
  | (VisualBase & {
      id: "vector-magnitude" | "vector-components" | "vector-projection";
      vector: [number, number];
      vectorLabel?: string;
      projectionAxis?: [number, number];
    })
  | (VisualBase & {
      id: "vector-plane";
      vectors: Array<{
        label: string;
        value: [number, number, number];
        color?: string;
      }>;
      interactive?: boolean;
      spatial?: SpatialGuide;
    })
  | (VisualBase & {
      id: "function-graph" | "motion-graph";
      points: Array<[number, number]>;
      xLabel: string;
      yLabel: string;
      seriesLabel?: string;
      shadeBetweenX?: [number, number];
    })
  | (VisualBase & {
      id: "free-body";
      bodyLabel?: string;
      forces: Array<{
        label: string;
        vector: [number, number];
        color?: string;
      }>;
    })
  | (VisualBase & {
      id: "bar-chart";
      labels: string[];
      values: number[];
      unit?: string;
      highlightIndex?: number;
    });

const visualCopy = {
  zh: {
    heading: "题目专用图",
    hint: "图形只显示本题给出的关系；先读坐标、方向和单位，再列式。",
    rotateLeft: "向左旋转空间视图",
    rotateRight: "向右旋转空间视图",
    resetView: "重置空间视图",
    viewHint: "左右拖动或使用左右方向键旋转；图中数值仍以题目为准。",
    viewReadout: "当前视角 {degrees}°。旋转只改变观看方向，不改变题目数据。",
    spatialKeyHint: "聚焦图形后：左、右方向键旋转；Home 重置视角。",
  },
  en: {
    heading: "Question-specific visual",
    hint: "This drawing shows only the relationships stated in this question. Read axes, directions and units before forming an equation.",
    rotateLeft: "Rotate spatial view left",
    rotateRight: "Rotate spatial view right",
    resetView: "Reset spatial view",
    viewHint: "Drag left or right, or use the arrow keys, to rotate. Use the values stated in the question.",
    viewReadout: "Viewpoint {degrees}°. Rotation changes only the view, not the question data.",
    spatialKeyHint: "With the diagram focused: Left/Right arrows rotate; Home resets the view.",
  },
};

export function visualIsCompatible(
  courseId: string,
  visual: LearningVisualIntent | null | undefined,
) {
  if (!visual) return false;
  if (visual.id === "bar-chart") return courseId === "math" || courseId === "physics";
  if (courseId === "math") {
    return [
      "vector-magnitude",
      "vector-components",
      "vector-projection",
      "vector-plane",
      "function-graph",
    ].includes(visual.id);
  }
  if (courseId === "physics") {
    return [
      "vector-magnitude",
      "vector-components",
      "vector-projection",
      "vector-plane",
      "motion-graph",
      "free-body",
    ].includes(visual.id);
  }
  return false;
}

export function QuestionVisualPanel({
  visual,
  lang,
}: {
  visual: LearningVisualIntent;
  lang: VisualLanguage;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionId = useId();
  const [azimuth, setAzimuth] = useState(0.55);
  const copy = visualCopy[lang];
  const alt = visual.alt[lang];
  const caption = visual.caption?.[lang] ?? alt;
  const hasSpatialControls = visual.id === "vector-plane" && visual.interactive !== false;
  const isSpatial = visual.id === "vector-plane";

  useEffect(() => {
    if (isSpatial) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawQuestionVisual(canvas, visual, azimuth);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [visual, azimuth, isSpatial]);

  const rotate = (direction: -1 | 1) => {
    setAzimuth((value) => value + direction * Math.PI / 12);
  };

  return (
    <figure className="learning-visual">
      <div className="tool-heading">
        <span>VISUAL</span>
        <div>
          <strong>{copy.heading}</strong>
          <small>{copy.hint}</small>
        </div>
      </div>
      {isSpatial ? (
        <SpatialVectorVisual
          visual={visual}
          lang={lang}
          azimuth={azimuth}
          describedBy={captionId}
          onAzimuthChange={setAzimuth}
        />
      ) : (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={alt}
          aria-describedby={captionId}
        >
          {alt}
        </canvas>
      )}
      {hasSpatialControls && (
        <div
          role="group"
          aria-label={copy.viewHint}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: "10px 12px 0",
          }}
        >
          <button
            type="button"
            aria-label={copy.rotateLeft}
            onClick={() => rotate(-1)}
            style={{ minHeight: 44 }}
          >
            ↶ {lang === "zh" ? "左转" : "Left"}
          </button>
          <button
            type="button"
            aria-label={copy.rotateRight}
            onClick={() => rotate(1)}
            style={{ minHeight: 44 }}
          >
            {lang === "zh" ? "右转" : "Right"} ↷
          </button>
          <button
            type="button"
            aria-label={copy.resetView}
            onClick={() => setAzimuth(0.55)}
            style={{ minHeight: 44, gridColumn: "1 / -1" }}
          >
            {lang === "zh" ? "重置视角" : "Reset view"}
          </button>
        </div>
      )}
      <figcaption
        id={captionId}
        style={{
          padding: "10px 14px 13px",
          color: "var(--muted)",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

type Point2 = [number, number];

const spatialColors = ["#246bfd", "#e34c5f", "#16866c", "#7755d9"];

type SpatialCopy = {
  plane: (plane: "xy" | "yz" | "xz") => string;
  headToTail: string;
  sameRay: string;
  triangle: string;
  projection: string;
};

const spatialDiagramCopy: Record<VisualLanguage, SpatialCopy> = {
  zh: {
    plane: (plane) => `${plane} 平面`,
    headToTail: "首尾相接 → 合向量",
    sameRay: "同一射线 · 正倍数",
    triangle: "同 z 值 → 同一平面；直角、边长仍需分别检验",
    projection: "正投影：把该平面缺少的坐标设为 0",
  },
  en: {
    plane: (plane) => `${plane} plane`,
    headToTail: "head → tail → resultant",
    sameRay: "same ray · positive scale",
    triangle: "common z → one plane; test angle and lengths separately",
    projection: "projection: set the plane’s missing coordinate to 0",
  },
};

function SpatialVectorVisual({
  visual,
  lang,
  azimuth,
  describedBy,
  onAzimuthChange,
}: {
  visual: Extract<LearningVisualIntent, { id: "vector-plane" }>;
  lang: VisualLanguage;
  azimuth: number;
  describedBy: string;
  onAzimuthChange: (next: number | ((current: number) => number)) => void;
}) {
  const ids = useId().replace(/:/g, "");
  const dragStart = useRef<number | null>(null);
  const mode = visual.spatial?.mode ?? "origin-vectors";
  const copy = visualCopy[lang];
  const diagramCopy = spatialDiagramCopy[lang];
  const allValues = [
    ...visual.vectors.map(({ value }) => value),
    ...(visual.spatial?.points?.map(({ value }) => value) ?? []),
  ];
  const largest = Math.max(1, ...allValues.flatMap((value) => value.map((part) => Math.abs(part))));
  const scale = 54 / largest;
  const origin: Point2 = [160, 137];
  const project = ([x, y, z]: [number, number, number]): Point2 => {
    const rotatedX = x * Math.cos(azimuth) - y * Math.sin(azimuth);
    const depth = x * Math.sin(azimuth) + y * Math.cos(azimuth);
    return [origin[0] + rotatedX * scale, origin[1] + depth * scale * 0.42 - z * scale];
  };
  const degrees = Math.round((((azimuth * 180) / Math.PI) % 360 + 360) % 360);
  const pointerStart = (event: PointerEvent<SVGSVGElement>) => {
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragStart.current === null) return;
    const movement = event.clientX - dragStart.current;
    if (Math.abs(movement) < 3) return;
    onAzimuthChange((current) => current + movement * 0.018);
    dragStart.current = event.clientX;
  };
  const pointerEnd = () => {
    dragStart.current = null;
  };
  const keyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onAzimuthChange((current) => current - Math.PI / 12);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onAzimuthChange((current) => current + Math.PI / 12);
    }
    if (event.key === "Home") {
      event.preventDefault();
      onAzimuthChange(0.55);
    }
  };
  const alt = visual.alt[lang];

  return (
    <>
      <svg
        className="spatial-vector-visual"
        viewBox="0 0 320 220"
        role="img"
        tabIndex={0}
        aria-label={`${alt} ${copy.spatialKeyHint}`}
        aria-describedby={describedBy}
        onPointerDown={pointerStart}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onKeyDown={keyDown}
      >
        <title>{alt}</title>
        <desc>{copy.spatialKeyHint}</desc>
        <defs>
          {spatialColors.map((color, index) => (
            <marker
              key={color}
              id={`${ids}-arrow-${index}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L8,4 L0,8 z" fill={color} />
            </marker>
          ))}
          <marker id={`${ids}-axis`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 z" fill="#68756e" />
          </marker>
        </defs>
        <rect x="0" y="0" width="320" height="220" fill="#fbfaf6" />
        <SpatialCoordinatePlane project={project} extent={largest * 1.15} plane={visual.spatial?.plane ?? "xy"} copy={diagramCopy} />
        <SpatialAxes project={project} extent={largest * 1.24} markerId={`${ids}-axis`} />
        {mode === "box" && <SpatialBox project={project} points={visual.spatial?.points ?? []} />}
        {mode === "triangle" && <SpatialTriangle project={project} points={visual.spatial?.points ?? []} copy={diagramCopy} />}
        {mode === "coordinate-projection" && (
          <SpatialCoordinateProjection
            project={project}
            point={visual.spatial?.points?.[0]}
            plane={visual.spatial?.plane ?? "xy"}
            copy={diagramCopy}
          />
        )}
        {mode === "head-to-tail" ? (
          <SpatialHeadToTail project={project} vectors={visual.vectors} markerIds={spatialColors.map((_, index) => `${ids}-arrow-${index}`)} copy={diagramCopy} />
        ) : mode === "triangle" || mode === "box" || mode === "coordinate-projection" ? null : (
          <SpatialVectors
            project={project}
            vectors={visual.vectors}
            mode={mode}
            markerIds={spatialColors.map((_, index) => `${ids}-arrow-${index}`)}
            copy={diagramCopy}
          />
        )}
      </svg>
      <p className="spatial-view-readout" aria-live="polite">
        {copy.viewReadout.replace("{degrees}", String(degrees))}
      </p>
    </>
  );
}

function SpatialCoordinatePlane({
  project,
  extent,
  plane,
  copy,
}: {
  project: (point: [number, number, number]) => Point2;
  extent: number;
  plane: "xy" | "yz" | "xz";
  copy: SpatialCopy;
}) {
  const coordinate = (first: number, second: number): [number, number, number] => {
    if (plane === "yz") return [0, first, second];
    if (plane === "xz") return [first, 0, second];
    return [first, second, 0];
  };
  const corners = [
    coordinate(-extent, -extent),
    coordinate(extent, -extent),
    coordinate(extent, extent),
    coordinate(-extent, extent),
  ].map(project);
  const gridValues = [-0.5, 0, 0.5].map((part) => part * extent);
  return (
    <g aria-hidden="true">
      <polygon points={corners.map((point) => point.join(",")).join(" ")} fill="#246bfd14" stroke="#9caed4" strokeWidth="1.1" />
      {gridValues.flatMap((offset) => {
        const a = project(coordinate(-extent, offset));
        const b = project(coordinate(extent, offset));
        const c = project(coordinate(offset, -extent));
        const d = project(coordinate(offset, extent));
        return [
          <line key={`a-${offset}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#bdc8d9" strokeWidth="0.75" />,
          <line key={`b-${offset}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} stroke="#bdc8d9" strokeWidth="0.75" />,
        ];
      })}
      <text x={12} y={202} className="spatial-plane-label">{copy.plane(plane)}</text>
    </g>
  );
}

function SpatialAxes({
  project,
  extent,
  markerId,
}: {
  project: (point: [number, number, number]) => Point2;
  extent: number;
  markerId: string;
}) {
  const origin = project([0, 0, 0]);
  return (
    <g aria-hidden="true">
      {(["x", "y", "z"] as const).map((axis, index) => {
        const target: [number, number, number] = index === 0 ? [extent, 0, 0] : index === 1 ? [0, extent, 0] : [0, 0, extent];
        const end = project(target);
        return (
          <g key={axis}>
            <line x1={origin[0]} y1={origin[1]} x2={end[0]} y2={end[1]} stroke="#68756e" strokeWidth="1.4" markerEnd={`url(#${markerId})`} />
            <text x={end[0] + 4} y={end[1] - 4} className="spatial-axis-label">{axis}</text>
          </g>
        );
      })}
      <circle cx={origin[0]} cy={origin[1]} r="2.6" fill="#24312a" />
      <text x={origin[0] + 5} y={origin[1] + 13} className="spatial-axis-label">O</text>
    </g>
  );
}

function SpatialArrow({
  start,
  end,
  color,
  label,
  markerId,
  dashed = false,
}: {
  start: Point2;
  end: Point2;
  color: string;
  label: string;
  markerId: string;
  dashed?: boolean;
}) {
  return (
    <g>
      <line
        x1={start[0]}
        y1={start[1]}
        x2={end[0]}
        y2={end[1]}
        stroke={color}
        strokeWidth={dashed ? "1.6" : "2.7"}
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd={dashed ? undefined : `url(#${markerId})`}
      />
      <text x={end[0] + 5} y={end[1] - 6} fill={color} className="spatial-vector-label">{label}</text>
    </g>
  );
}

function SpatialVectors({
  project,
  vectors,
  mode,
  markerIds,
  copy,
}: {
  project: (point: [number, number, number]) => Point2;
  vectors: Extract<LearningVisualIntent, { id: "vector-plane" }>["vectors"];
  mode: SpatialTeachingMode;
  markerIds: string[];
  copy: SpatialCopy;
}) {
  const origin = project([0, 0, 0]);
  const entries = vectors.map((vector, index) => ({
    ...vector,
    color: vector.color ?? spatialColors[index % spatialColors.length],
    markerId: markerIds[index % markerIds.length],
  }));
  const primary = entries[0];
  const secondary = entries[1];
  const projection = mode === "projection" && primary && secondary
    ? scaleVector(primary.value, dot(primary.value, secondary.value) / dot(primary.value, primary.value))
    : null;

  return (
    <g aria-hidden="true">
      {mode === "resultant" && entries.length >= 2 && (
        <SpatialComponentGuides project={project} vector={entries[0]} />
      )}
      {entries.map((vector) => (
        <SpatialArrow
          key={vector.label}
          start={origin}
          end={project(vector.value)}
          color={vector.color}
          label={vector.label}
          markerId={vector.markerId}
        />
      ))}
      {mode === "projection" && projection && primary && secondary && (
        <>
          <SpatialArrow
            start={origin}
            end={project(projection)}
            color="#e34c5f"
            label="proj"
            markerId={markerIds[1]}
          />
          <SpatialArrow
            start={project(projection)}
            end={project(secondary.value)}
            color="#68756e"
            label="⊥ residual"
            markerId={markerIds[3]}
            dashed
          />
        </>
      )}
      {mode === "angles" && entries.length >= 2 && (
        <SpatialAngleGuide origin={origin} first={project(entries[0].value)} second={project(entries[1].value)} />
      )}
      {mode === "parallel" && entries.length >= 2 && (
        <text x="13" y="24" className="spatial-guide-label">{copy.sameRay}</text>
      )}
    </g>
  );
}

function SpatialComponentGuides({
  project,
  vector,
}: {
  project: (point: [number, number, number]) => Point2;
  vector: { value: [number, number, number] };
}) {
  const [x, y, z] = vector.value;
  const o = project([0, 0, 0]);
  const xPoint = project([x, 0, 0]);
  const xyPoint = project([x, y, 0]);
  const end = project([x, y, z]);
  return (
    <g aria-hidden="true" stroke="#88948d" strokeWidth="1.2" strokeDasharray="4 4">
      <line x1={o[0]} y1={o[1]} x2={xPoint[0]} y2={xPoint[1]} />
      <line x1={xPoint[0]} y1={xPoint[1]} x2={xyPoint[0]} y2={xyPoint[1]} />
      <line x1={xyPoint[0]} y1={xyPoint[1]} x2={end[0]} y2={end[1]} />
    </g>
  );
}

function SpatialHeadToTail({
  project,
  vectors,
  markerIds,
  copy,
}: {
  project: (point: [number, number, number]) => Point2;
  vectors: Extract<LearningVisualIntent, { id: "vector-plane" }>["vectors"];
  markerIds: string[];
  copy: SpatialCopy;
}) {
  const first = vectors[0];
  const second = vectors[1];
  const resultant = vectors[2];
  if (!first || !second) return null;
  const origin = project([0, 0, 0]);
  const firstEnd = project(first.value);
  const secondEnd = project(addVectors(first.value, second.value));
  return (
    <g aria-hidden="true">
      <SpatialArrow start={origin} end={firstEnd} color={first.color ?? spatialColors[0]} label={first.label} markerId={markerIds[0]} />
      <SpatialArrow start={firstEnd} end={secondEnd} color={second.color ?? spatialColors[1]} label={second.label} markerId={markerIds[1]} />
      <SpatialArrow
        start={origin}
        end={resultant ? project(resultant.value) : secondEnd}
        color={resultant?.color ?? spatialColors[2]}
        label={resultant?.label ?? "resultant"}
        markerId={markerIds[2]}
      />
      <text x="13" y="24" className="spatial-guide-label">{copy.headToTail}</text>
    </g>
  );
}

function SpatialBox({
  project,
  points,
}: {
  project: (point: [number, number, number]) => Point2;
  points: SpatialPoint[];
}) {
  if (points.length < 2) return null;
  const [a, b] = points;
  const minimum: [number, number, number] = [
    Math.min(a.value[0], b.value[0]), Math.min(a.value[1], b.value[1]), Math.min(a.value[2], b.value[2]),
  ];
  const maximum: [number, number, number] = [
    Math.max(a.value[0], b.value[0]), Math.max(a.value[1], b.value[1]), Math.max(a.value[2], b.value[2]),
  ];
  const corners = ([
    [minimum[0], minimum[1], minimum[2]], [maximum[0], minimum[1], minimum[2]],
    [maximum[0], maximum[1], minimum[2]], [minimum[0], maximum[1], minimum[2]],
    [minimum[0], minimum[1], maximum[2]], [maximum[0], minimum[1], maximum[2]],
    [maximum[0], maximum[1], maximum[2]], [minimum[0], maximum[1], maximum[2]],
  ] as Array<[number, number, number]>).map(project);
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const aPoint = project(a.value);
  const bPoint = project(b.value);
  return (
    <g aria-hidden="true">
      {edges.map(([from, to]) => <line key={`${from}-${to}`} x1={corners[from][0]} y1={corners[from][1]} x2={corners[to][0]} y2={corners[to][1]} stroke="#74859c" strokeWidth="1.25" />)}
      <line x1={aPoint[0]} y1={aPoint[1]} x2={bPoint[0]} y2={bPoint[1]} stroke="#e34c5f" strokeWidth="2.7" strokeDasharray="6 3" />
      {[a, b].map((point) => {
        const location = project(point.value);
        return <g key={point.label}><circle cx={location[0]} cy={location[1]} r="4" fill={point.color ?? "#24312a"} /><text x={location[0] + 6} y={location[1] - 7} className="spatial-vector-label">{point.label}</text></g>;
      })}
      <text x="13" y="24" className="spatial-guide-label">|Δx|, |Δy|, |Δz|</text>
    </g>
  );
}

function SpatialTriangle({
  project,
  points,
  copy,
}: {
  project: (point: [number, number, number]) => Point2;
  points: SpatialPoint[];
  copy: SpatialCopy;
}) {
  if (points.length < 3) return null;
  const projected = points.map(({ value }) => project(value));
  return (
    <g aria-hidden="true">
      <polygon points={projected.map((point) => point.join(",")).join(" ")} fill="#246bfd12" stroke="#246bfd" strokeWidth="2" />
      {points.map((point, index) => <g key={point.label}><circle cx={projected[index][0]} cy={projected[index][1]} r="4" fill={point.color ?? spatialColors[index]} /><text x={projected[index][0] + 6} y={projected[index][1] - 7} className="spatial-vector-label">{point.label}</text></g>)}
      <text x="13" y="24" className="spatial-guide-label">{copy.triangle}</text>
    </g>
  );
}

function SpatialCoordinateProjection({
  project,
  point,
  plane,
  copy,
}: {
  project: (point: [number, number, number]) => Point2;
  point: SpatialPoint | undefined;
  plane: "xy" | "yz" | "xz";
  copy: SpatialCopy;
}) {
  if (!point) return null;
  const projectedValue: [number, number, number] = plane === "yz"
    ? [0, point.value[1], point.value[2]]
    : plane === "xz" ? [point.value[0], 0, point.value[2]] : [point.value[0], point.value[1], 0];
  const source = project(point.value);
  const projection = project(projectedValue);
  return (
    <g aria-hidden="true">
      <line x1={source[0]} y1={source[1]} x2={projection[0]} y2={projection[1]} stroke="#e34c5f" strokeWidth="1.7" strokeDasharray="5 4" />
      <circle cx={source[0]} cy={source[1]} r="4" fill={point.color ?? "#246bfd"} />
      <circle cx={projection[0]} cy={projection[1]} r="4" fill="#e34c5f" />
      <text x={source[0] + 6} y={source[1] - 7} className="spatial-vector-label">{point.label}</text>
      <text x={projection[0] + 6} y={projection[1] - 7} className="spatial-vector-label">proj</text>
      <text x="13" y="24" className="spatial-guide-label">{copy.projection}</text>
    </g>
  );
}

function SpatialAngleGuide({ origin, first, second }: { origin: Point2; first: Point2; second: Point2 }) {
  const firstAngle = Math.atan2(first[1] - origin[1], first[0] - origin[0]);
  const secondAngle = Math.atan2(second[1] - origin[1], second[0] - origin[0]);
  const radius = 25;
  const start: Point2 = [origin[0] + Math.cos(firstAngle) * radius, origin[1] + Math.sin(firstAngle) * radius];
  const end: Point2 = [origin[0] + Math.cos(secondAngle) * radius, origin[1] + Math.sin(secondAngle) * radius];
  const sweep = Math.abs(secondAngle - firstAngle) <= Math.PI ? 1 : 0;
  return <path d={`M ${start[0]} ${start[1]} A ${radius} ${radius} 0 0 ${sweep} ${end[0]} ${end[1]}`} fill="none" stroke="#7755d9" strokeWidth="2" />;
}

function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function scaleVector(vector: [number, number, number], factor: number): [number, number, number] {
  return [vector[0] * factor, vector[1] * factor, vector[2] * factor];
}

function addVectors(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function drawQuestionVisual(
  canvas: HTMLCanvasElement,
  visual: LearningVisualIntent,
  azimuth: number,
) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, rect.width);
  const height = 210;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fbfaf6";
  context.fillRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (
    visual.id === "vector-magnitude" ||
    visual.id === "vector-components" ||
    visual.id === "vector-projection"
  ) {
    drawVector(context, width, height, visual);
    return;
  }
  if (visual.id === "vector-plane") {
    drawVectorPlane(context, width, height, visual, azimuth);
    return;
  }
  if (visual.id === "function-graph" || visual.id === "motion-graph") {
    drawGraph(context, width, height, visual);
    return;
  }
  if (visual.id === "free-body") {
    drawFreeBody(context, width, height, visual);
    return;
  }
  if (visual.id === "bar-chart") {
    drawBarChart(context, width, height, visual);
  }
}

function drawAxes(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  xLabel: string,
  yLabel: string,
) {
  context.strokeStyle = "#aeb8b1";
  context.fillStyle = "#65706a";
  context.lineWidth = 1.25;
  context.font = "12px sans-serif";
  context.beginPath();
  context.moveTo(36, height - 30);
  context.lineTo(width - 18, height - 30);
  context.moveTo(42, height - 20);
  context.lineTo(42, 18);
  context.stroke();
  context.fillText(xLabel, width - 28, height - 11);
  context.fillText(yLabel, 16, 23);
}

function drawArrow(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label: string,
) {
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(x2 - 10 * Math.cos(angle - 0.45), y2 - 10 * Math.sin(angle - 0.45));
  context.lineTo(x2 - 10 * Math.cos(angle + 0.45), y2 - 10 * Math.sin(angle + 0.45));
  context.closePath();
  context.fill();
  if (label) {
    context.font = "700 12px sans-serif";
    context.fillText(label, x2 + 6, y2 - 5);
  }
}

function drawVector(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  visual: Extract<
    LearningVisualIntent,
    { id: "vector-magnitude" | "vector-components" | "vector-projection" }
  >,
) {
  const [vx, vy] = visual.vector;
  const maxComponent = Math.max(Math.abs(vx), Math.abs(vy), 1);
  const scale = Math.min((width - 92) / maxComponent, (height - 72) / maxComponent) * 0.82;
  const originX = vx < 0 ? width - 54 : 48;
  const originY = vy < 0 ? 32 : height - 34;
  const endX = originX + vx * scale;
  const endY = originY - vy * scale;
  const label = visual.vectorLabel ?? "v";
  drawVectorAxes(context, width, height, originX, originY);

  if (visual.id === "vector-magnitude" || visual.id === "vector-components") {
    context.save();
    context.setLineDash([5, 5]);
    context.strokeStyle = "#8a9690";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(originX, originY);
    context.lineTo(endX, originY);
    context.lineTo(endX, endY);
    context.stroke();
    context.restore();
    context.fillStyle = "#65706a";
    context.font = "700 12px sans-serif";
    context.fillText(String(vx), (originX + endX) / 2, originY + (vy >= 0 ? 17 : -8));
    context.fillText(String(vy), endX + (vx >= 0 ? 7 : -23), (originY + endY) / 2);
  }

  if (visual.id === "vector-projection") {
    const axis = visual.projectionAxis ?? [1, 0];
    const axisLength = Math.hypot(axis[0], axis[1]) || 1;
    const unitX = axis[0] / axisLength;
    const unitY = axis[1] / axisLength;
    const dot = vx * unitX + vy * unitY;
    const projectionX = originX + dot * unitX * scale;
    const projectionY = originY - dot * unitY * scale;
    drawArrow(
      context,
      originX,
      originY,
      originX + unitX * Math.min(width * 0.58, scale * maxComponent),
      originY - unitY * Math.min(width * 0.58, scale * maxComponent),
      "#8a9690",
      "axis",
    );
    drawArrow(context, originX, originY, projectionX, projectionY, "#f66b4a", `proj ${label}`);
    context.save();
    context.setLineDash([5, 5]);
    context.strokeStyle = "#f66b4a";
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(projectionX, projectionY);
    context.stroke();
    context.restore();
  }

  drawArrow(context, originX, originY, endX, endY, "#246bfd", label);
  if (visual.id === "vector-magnitude") {
    context.fillStyle = "#17211d";
    context.font = "700 13px sans-serif";
    context.fillText(`|${label}| = ?`, 56, 28);
  }
}

function drawVectorAxes(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  originX: number,
  originY: number,
) {
  context.strokeStyle = "#aeb8b1";
  context.fillStyle = "#65706a";
  context.lineWidth = 1.25;
  context.font = "12px sans-serif";
  context.beginPath();
  context.moveTo(22, originY);
  context.lineTo(width - 18, originY);
  context.moveTo(originX, height - 18);
  context.lineTo(originX, 18);
  context.stroke();
  context.fillText("x", width - 28, originY - 8);
  context.fillText("y", originX + 8, 24);
}

function drawVectorPlane(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  visual: Extract<LearningVisualIntent, { id: "vector-plane" }>,
  azimuth: number,
) {
  const origin: [number, number] = [width / 2, height * 0.62];
  const largest = Math.max(
    1,
    ...visual.vectors.flatMap(({ value }) => value.map((component) => Math.abs(component))),
  );
  const scale = Math.min(width, height) * 0.28 / largest;
  const project = ([x, y, z]: [number, number, number]): [number, number] => {
    const rotatedX = x * Math.cos(azimuth) - y * Math.sin(azimuth);
    const depth = x * Math.sin(azimuth) + y * Math.cos(azimuth);
    return [origin[0] + rotatedX * scale, origin[1] + depth * scale * 0.42 - z * scale];
  };

  const planeExtent = largest * 1.3;
  const corners = [
    project([-planeExtent, -planeExtent, 0]),
    project([planeExtent, -planeExtent, 0]),
    project([planeExtent, planeExtent, 0]),
    project([-planeExtent, planeExtent, 0]),
  ] as Array<[number, number]>;
  context.beginPath();
  corners.forEach(([x, y], index) => index === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
  context.closePath();
  context.fillStyle = "#246bfd16";
  context.fill();
  context.strokeStyle = "#91a7d8";
  context.lineWidth = 1.25;
  context.stroke();

  ([-1, 0, 1] as const).forEach((step) => {
    const offset = step * planeExtent / 2;
    const lineA = project([-planeExtent, offset, 0]);
    const lineB = project([planeExtent, offset, 0]);
    const lineC = project([offset, -planeExtent, 0]);
    const lineD = project([offset, planeExtent, 0]);
    context.beginPath();
    context.moveTo(...lineA);
    context.lineTo(...lineB);
    context.moveTo(...lineC);
    context.lineTo(...lineD);
    context.stroke();
  });

  const axisLength = planeExtent * 1.2;
  const xEnd = project([axisLength, 0, 0]);
  const yEnd = project([0, axisLength, 0]);
  const zEnd = project([0, 0, axisLength]);
  drawArrow(context, ...origin, ...xEnd, "#8a9690", "x");
  drawArrow(context, ...origin, ...yEnd, "#8a9690", "y");
  drawArrow(context, ...origin, ...zEnd, "#8a9690", "z");

  visual.vectors.forEach(({ label, value, color }, index) => {
    const end = project(value);
    drawArrow(context, ...origin, ...end, color ?? (index === 0 ? "#246bfd" : "#f66b4a"), label);
  });
}

function drawGraph(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  visual: Extract<LearningVisualIntent, { id: "function-graph" | "motion-graph" }>,
) {
  drawAxes(context, width, height, visual.xLabel, visual.yLabel);
  if (visual.points.length === 0) return;
  const xs = visual.points.map(([x]) => x);
  const ys = visual.points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  const mapPoint = ([x, y]: [number, number]): [number, number] => [
    43 + (x - minX) / xSpan * (width - 67),
    height - 31 - (y - minY) / ySpan * (height - 58),
  ];
  const plotted = visual.points.map(mapPoint);

  if (visual.shadeBetweenX) {
    const [fromX, toX] = visual.shadeBetweenX;
    const selected = visual.points
      .filter(([x]) => x >= Math.min(fromX, toX) && x <= Math.max(fromX, toX))
      .map(mapPoint);
    if (selected.length > 1) {
      context.beginPath();
      context.moveTo(selected[0][0], height - 31);
      selected.forEach(([x, y]) => context.lineTo(x, y));
      context.lineTo(selected.at(-1)![0], height - 31);
      context.closePath();
      context.fillStyle = "#246bfd24";
      context.fill();
    }
  }

  context.beginPath();
  plotted.forEach(([x, y], index) => index === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
  context.strokeStyle = visual.id === "motion-graph" ? "#7755d9" : "#246bfd";
  context.lineWidth = 3;
  context.stroke();
  if (visual.seriesLabel) {
    context.fillStyle = "#17211d";
    context.font = "700 12px sans-serif";
    context.fillText(visual.seriesLabel, 55, 25);
  }
}

function drawFreeBody(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  visual: Extract<LearningVisualIntent, { id: "free-body" }>,
) {
  const centerX = width / 2;
  const centerY = height / 2;
  context.fillStyle = "#e9e4fb";
  context.fillRect(centerX - 36, centerY - 27, 72, 54);
  context.strokeStyle = "#7755d9";
  context.lineWidth = 2;
  context.strokeRect(centerX - 36, centerY - 27, 72, 54);
  if (visual.bodyLabel) {
    context.fillStyle = "#17211d";
    context.font = "700 12px sans-serif";
    context.textAlign = "center";
    context.fillText(visual.bodyLabel, centerX, centerY + 4);
    context.textAlign = "start";
  }
  const largest = Math.max(
    1,
    ...visual.forces.map(({ vector }) => Math.hypot(vector[0], vector[1])),
  );
  visual.forces.forEach(({ label, vector, color }, index) => {
    const length = 58 + 28 * Math.hypot(vector[0], vector[1]) / largest;
    const magnitude = Math.hypot(vector[0], vector[1]) || 1;
    drawArrow(
      context,
      centerX,
      centerY,
      centerX + vector[0] / magnitude * length,
      centerY - vector[1] / magnitude * length,
      color ?? ["#246bfd", "#f66b4a", "#1c9a70", "#7755d9"][index % 4],
      label,
    );
  });
}

function drawBarChart(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  visual: Extract<LearningVisualIntent, { id: "bar-chart" }>,
) {
  drawAxes(context, width, height, "", visual.unit ?? "");
  if (visual.values.length === 0) return;
  const maxValue = Math.max(...visual.values, 1);
  const availableWidth = width - 78;
  const slotWidth = availableWidth / visual.values.length;
  const barWidth = Math.max(12, Math.min(38, slotWidth * 0.62));
  visual.values.forEach((value, index) => {
    const barHeight = Math.max(1, value / maxValue * (height - 78));
    const x = 48 + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = height - 31 - barHeight;
    context.fillStyle = index === visual.highlightIndex ? "#f66b4a" : "#7755d9";
    context.fillRect(x, y, barWidth, barHeight);
    context.fillStyle = "#65706a";
    context.font = "11px sans-serif";
    context.textAlign = "center";
    context.fillText(visual.labels[index] ?? String(index + 1), x + barWidth / 2, height - 13);
  });
  context.textAlign = "start";
}
