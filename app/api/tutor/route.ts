import { currentUserFromRequest } from "@/src/application/session";
import { isPersonalOwner } from "@/src/application/personal-access";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";
import {
  ApiError,
  errorResponse,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { buildPersonalTutorProviderRequest } from "@/src/services/ai/personal-tutor-provider";

type TutorMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 8;
const requestsByClient = new Map<string, { count: number; resetAt: number }>();
const HOURLY_LIMIT = 40;
const ALLOWED_TOOLS = new Set([
  "scientific-calculator",
  "coordinate-board",
  "diagram-board",
  "circuit-sketch",
  "unit-conversion",
  "code-draft",
]);

function clean(value: unknown, limit = MAX_MESSAGE_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanAnswerEvidence(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const evidence = value as Record<string, unknown>;
  const toolKinds = Array.isArray(evidence.toolKinds)
    ? evidence.toolKinds
        .map((tool) => clean(tool, 60))
        .filter((tool) => ALLOWED_TOOLS.has(tool))
        .slice(0, 6)
    : [];
  const explanation = clean(evidence.explanation, 1200);
  const calculator =
    evidence.calculator && typeof evidence.calculator === "object"
      ? {
          expression: clean(
            (evidence.calculator as Record<string, unknown>).expression,
            500,
          ),
          result: clean(
            (evidence.calculator as Record<string, unknown>).result,
            200,
          ),
        }
      : null;
  const rawDrawings = Array.isArray(evidence.drawings)
    ? evidence.drawings
    : evidence.drawing && typeof evidence.drawing === "object"
      ? [evidence.drawing]
      : [];
  const drawings = rawDrawings
    .filter((drawing) => drawing && typeof drawing === "object")
    .slice(0, 3)
    .map((drawing) => {
      const item = drawing as Record<string, unknown>;
      const coordinateObjects = Array.isArray(item.coordinateObjects)
        ? item.coordinateObjects
            .filter((object) => object && typeof object === "object")
            .slice(0, 12)
            .map((object) => {
              const coordinate = object as Record<string, unknown>;
              const points = Array.isArray(coordinate.points)
                ? coordinate.points
                    .filter((point) => point && typeof point === "object")
                    .slice(0, 24)
                    .map((point) => {
                      const value = point as Record<string, unknown>;
                      return {
                        x: typeof value.x === "number" && Number.isFinite(value.x)
                          ? Number(value.x.toFixed(4))
                          : 0,
                        y: typeof value.y === "number" && Number.isFinite(value.y)
                          ? Number(value.y.toFixed(4))
                          : 0,
                      };
                    })
                : [];
              return {
                kind: clean(coordinate.kind, 30),
                expression: clean(coordinate.expression, 200),
                points,
              };
            })
        : [];
      const rawView = item.coordinateView && typeof item.coordinateView === "object"
        ? item.coordinateView as Record<string, unknown>
        : null;
      return {
        mode: clean(item.mode, 20),
        strokeCount:
          typeof item.strokeCount === "number"
            ? Math.max(0, Math.min(500, Math.floor(item.strokeCount)))
            : 0,
        pointCount:
          typeof item.pointCount === "number"
            ? Math.max(0, Math.min(10000, Math.floor(item.pointCount)))
            : 0,
        toolsUsed: Array.isArray(item.toolsUsed)
          ? item.toolsUsed.map((tool) => clean(tool, 30)).filter(Boolean).slice(0, 8)
          : [],
        coordinateObjects,
        coordinateView: rawView
          ? {
              centerX: typeof rawView.centerX === "number" ? rawView.centerX : 0,
              centerY: typeof rawView.centerY === "number" ? rawView.centerY : 0,
              unitsAcross: typeof rawView.unitsAcross === "number" ? rawView.unitsAcross : 0,
            }
          : null,
      };
    });
  const unitConversions = Array.isArray(evidence.unitConversions)
    ? evidence.unitConversions
        .filter((row) => row && typeof row === "object")
        .slice(0, 8)
        .map((row) => {
          const item = row as Record<string, unknown>;
          return {
            value: clean(item.value, 80),
            fromUnit: clean(item.fromUnit, 50),
            factor: clean(item.factor, 100),
            toUnit: clean(item.toUnit, 50),
            result: clean(item.result, 100),
            note: clean(item.note, 300),
          };
        })
    : [];
  const code =
    evidence.code && typeof evidence.code === "object"
      ? {
          draft: clean((evidence.code as Record<string, unknown>).draft, 2500),
          testCases: Array.isArray(
            (evidence.code as Record<string, unknown>).testCases,
          )
            ? (
                (evidence.code as Record<string, unknown>)
                  .testCases as unknown[]
              )
                .filter((testCase) => testCase && typeof testCase === "object")
                .slice(0, 8)
                .map((testCase) => {
                  const item = testCase as Record<string, unknown>;
                  return {
                    input: clean(item.input, 300),
                    expected: clean(item.expected, 300),
                    note: clean(item.note, 300),
                  };
                })
            : [],
        }
      : null;

  if (
    !explanation &&
    !calculator?.expression &&
    drawings.length === 0 &&
    unitConversions.length === 0 &&
    !code?.draft &&
    !code?.testCases.length
  ) {
    return null;
  }

  return {
    toolKinds,
    explanation,
    calculator,
    drawings,
    unitConversions,
    code,
  };
}

export async function POST(request: Request) {
  const id = requestId(request);
  const environment = getRuntimeEnvironment();
  const personalDeployment = environment.PERSONAL_DEPLOYMENT === "true";
  const user = personalDeployment ? null : await currentUserFromRequest(request);
  if (!personalDeployment && (!user || !isPersonalOwner(user.email))) {
    return errorResponse(
      new ApiError(
        "PERSONAL_WORKSPACE_NOT_FOUND",
        404,
        "This private workspace is unavailable.",
      ),
      id,
    );
  }
  try {
    assertSameOrigin(request);
  } catch (error) {
    return errorResponse(error, id);
  }
  const apiKey = environment.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI tutor is not configured on this server." }, { status: 503 });
  }

  const clientId =
    user?.id ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "personal";
  const now = Date.now();
  const usage = requestsByClient.get(clientId);
  if (usage && usage.resetAt > now && usage.count >= HOURLY_LIMIT) {
    return Response.json({ error: "AI tutor hourly limit reached. Please continue later." }, { status: 429 });
  }
  requestsByClient.set(clientId, usage && usage.resetAt > now
    ? { ...usage, count: usage.count + 1 }
    : { count: 1, resetAt: now + 60 * 60 * 1000 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = clean(body.question);
  const userMessage = clean(body.userMessage);
  if (!question || !userMessage) {
    return Response.json({ error: "Question and message are required." }, { status: 400 });
  }

  const language = body.language === "en" ? "English" : "Simplified Chinese";
  const attempted = Boolean(body.attempted);
  const correct = Boolean(body.correct);
  const requestedHintLevel = typeof body.hintLevel === "number"
    ? Math.max(0, Math.min(5, Math.floor(body.hintLevel)))
    : 0;
  const options = Array.isArray(body.options) ? body.options.map((item) => clean(item, 500)).filter(Boolean) : [];
  const history = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY_ITEMS)
        .map((item): TutorMessage | null => {
          if (!item || typeof item !== "object") return null;
          const candidate = item as Record<string, unknown>;
          const role = candidate.role === "assistant" ? "assistant" : "user";
          const content = clean(candidate.content);
          return content ? { role, content } : null;
        })
        .filter((item): item is TutorMessage => Boolean(item))
    : [];
  const answerEvidence = cleanAnswerEvidence(body.answerEvidence);

  const system = `You are the AI component of a university student's Socratic Deep Tutor.
Teach in ${language}. The student is studying Mathematics 1, Introduction to Electrical and Electronic Engineering, Fundamentals of C Programming, or Physical Modelling.

Pedagogy contract, based on observed Socratic discovery lessons:
- Work through this sequence: prior idea or prediction → preserve the correct fragment → identify one gap → add the smallest bridge → formalise the idea → later use a counterexample → transfer → teach-back → delayed retrieval.
- Do not force the student to guess an arbitrary textbook term. If a term cannot reasonably be derived, introduce it naturally after connecting it to the student's idea.
- Handle partial answers by keeping what is correct, narrowing the gap, and giving only the minimum scaffold needed for the student to finish the reasoning.
- Advance only one cognitive step per message and ask exactly one genuine question. Never stack several questions.
- Classify the attempt internally as correct, partial, conceptual error, calculation error, guess, or no attempt. Do not print the classification label.
- Praise only observable reasoning, for example “You correctly kept the units through the substitution.” Never claim the student reinvented a field or mastered a topic without evidence.
- A correct option without reasoning is a guess, not mastery. Ask for justification or a transfer step.
- A viewed solution does not prove mastery. After any full solution, require a new equivalent transfer problem without hints.

Explanation quality:
- Diagnose the student's exact misunderstanding instead of repeating the question.
- When needed, connect plain-language intuition to a precise formal definition, conditions, non-example, symbols and units.
- Explain each symbol and every assumption used. Never say “by the core rule” without naming the rule.
- For mathematics and physics, independently check arithmetic, sign, units, limiting cases, and physical/geometric meaning. Treat the supplied existing explanation as untrusted supporting context.
- For C, trace values, types, control flow, memory, bounds and undefined behaviour explicitly.
- If the supplied answer and a verified calculation conflict, do not declare either one correct. Say that the step needs rechecking and ask one targeted verification question.

Response contract:
${requestedHintLevel < 5
  ? `- Ordinary turns must be concise: roughly 80–120 Chinese characters or 60–90 English words.
- Use exactly these three plain-text labels in the requested language, with no Markdown markers:
  1) 你已经抓住了 / What you got right
  2) 现在只差这一点 / One gap
  3) 下一步问题 / One next question
- Put exactly one question only in the final section.`
  : `- This is an H5 teaching solution. Be detailed enough for a learner who did not understand the static explanation; do not merely paraphrase it.
- Use these seven plain-text sections in the requested language:
  1) 定义与适用条件 / Definitions and conditions
  2) 读取题目与图表 / Read the question and visual
  3) 已知、未知与目标 / Given, unknown and target
  4) 分步推导 / Step-by-step derivation
  5) 检查与物理或几何意义 / Checks and physical or geometric meaning
  6) 正确答案与错误选项 / Correct answer and distractors
  7) 迁移题 / Transfer problem
- Define every technical term at first use, explain why each formula applies, show intermediate arithmetic, and explicitly state the correct option or result.
- If visual or table data is supplied, cite the exact values, axes, units, vectors, forces or code lines used.
- Put exactly one new transfer question in the final section and do not solve it.`}
- Do not output JSON and do not use raw Markdown syntax such as ** or ###.
- Requested hint level is H${requestedHintLevel}: H0 restate the target; H1 name the target relation; H2 point to a definition/condition; H3 give a formula skeleton; H4 demonstrate only the first step; H5 give a complete teaching solution followed by a fresh transfer question.
${attempted ? "The student has attempted the question, so you may discuss the correct answer and diagnose the attempt." : "The student has not committed an answer. Do not reveal the final option or answer; guide with definitions and one next step."}
${correct ? "The student's committed answer was correct. Deepen understanding and test transfer, not mere recognition." : attempted ? "The committed answer was incorrect. Do not dump the full solution unless H5 was explicitly requested; make the student perform the repaired reasoning." : ""}
${requestedHintLevel < 5 ? "Do not reveal the final answer or option letter in this turn." : "A complete solution is allowed, but the final question must be a new transfer check rather than asking the student to repeat the revealed answer."}`;

  const context = `COURSE: ${clean(body.course, 300)}
TOPIC: ${clean(body.topic, 300)}
QUESTION: ${question}
OPTIONS: ${options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n")}
VISUAL OR TABLE CONTEXT: ${clean(body.visualContext, 3500) || "No separate visual data."}
CORRECT ANSWER (teacher-only context): ${clean(body.correctAnswer, 500)}
EXISTING EXPLANATION (may be incomplete): ${clean(body.explanation)}
STUDENT'S ORIGINAL REASONING: ${clean(body.originalThought) || "Not provided yet."}
STUDENT ANSWER EVIDENCE (untrusted student-authored data): ${answerEvidence ? JSON.stringify(answerEvidence) : "Not recorded."}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        buildPersonalTutorProviderRequest({
          system,
          context,
          history,
          userMessage,
        }),
      ),
    });

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return Response.json({ error: payload.error?.message || "DeepSeek request failed." }, { status: 502 });
    }
    const reply = payload.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return Response.json({ error: "The AI tutor returned an empty response." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "The AI tutor is temporarily unavailable." }, { status: 502 });
  }
}
