import type { AnswerWorkspaceEvidence } from "./answer-workspace";

export function evidenceIsMeaningful(evidence: AnswerWorkspaceEvidence | null | undefined) {
  if (!evidence || evidence.explanation.trim().length < 8) return false;

  const calculatorHasWork = Boolean(
    evidence.calculator?.expression.trim() && evidence.calculator?.result.trim(),
  );
  const drawings = Array.isArray(evidence.drawings)
    ? evidence.drawings
    : evidence.drawing
      ? [evidence.drawing]
      : [];
  const drawingHasWork = drawings.some(
    (drawing) => drawing.strokeCount > 0 && drawing.pointCount > 1,
  );
  const unitsHaveWork = (evidence.unitConversions ?? []).some(
    (row) =>
      row.value.trim() &&
      row.fromUnit.trim() &&
      row.factor.trim() &&
      row.toUnit.trim() &&
      row.result.trim(),
  );
  const codeHasWork = Boolean(
    evidence.code?.draft.trim() ||
      evidence.code?.testCases.some(
        (testCase) => testCase.input.trim() || testCase.expected.trim(),
      ),
  );

  return calculatorHasWork || drawingHasWork || unitsHaveWork || codeHasWork;
}

export function upsertAnswerEvidence(
  store: Record<string, AnswerWorkspaceEvidence>,
  evidence: AnswerWorkspaceEvidence,
) {
  return { ...store, [evidence.questionId]: evidence };
}

export function summarizeAnswerEvidence(
  evidence: AnswerWorkspaceEvidence | null | undefined,
) {
  if (!evidence) return "";
  return JSON.stringify({
    toolKinds: evidence.toolKinds.slice(0, 6),
    explanation: evidence.explanation.slice(0, 1200),
    calculator: evidence.calculator
      ? {
          expression: evidence.calculator.expression.slice(0, 500),
          result: evidence.calculator.result.slice(0, 200),
        }
      : undefined,
    drawings: (evidence.drawings ?? (evidence.drawing ? [evidence.drawing] : []))
      .slice(0, 3)
      .map((drawing) => ({
        mode: drawing.mode,
        strokeCount: drawing.strokeCount,
        pointCount: drawing.pointCount,
        toolsUsed: drawing.toolsUsed.slice(0, 8),
        coordinateObjects: drawing.coordinateObjects?.slice(0, 12).map((object) => ({
          kind: object.kind,
          expression: object.expression?.slice(0, 200),
          points: object.points.slice(0, 24),
        })),
        coordinateView: drawing.coordinateView,
      })),
    unitConversions: evidence.unitConversions?.slice(0, 8),
    code: evidence.code
      ? {
          draft: evidence.code.draft.slice(0, 2500),
          testCases: evidence.code.testCases.slice(0, 8),
        }
      : undefined,
  });
}
