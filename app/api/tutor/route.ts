type TutorMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 8;
const requestsByClient = new Map<string, { count: number; resetAt: number }>();
const HOURLY_LIMIT = 40;

function clean(value: unknown, limit = MAX_MESSAGE_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI tutor is not configured on this server." }, { status: 503 });
  }

  const clientId = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
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

  const system = `You are the AI component of a university student's Socratic Deep Tutor.
Teach in ${language}. The student is studying Mathematics 1, Introduction to Electrical and Electronic Engineering, Fundamentals of C Programming, or Physical Modelling.

Teaching contract:
- Diagnose the student's exact misunderstanding instead of repeating the question.
- When a technical term appears, give its formal definition, then a plain-language intuition.
- Explain every symbol in a formula and state the assumptions or conditions required.
- Derive conclusions step by step. Never use vague phrases such as "by the core rule" without naming and explaining the rule.
- Use a confirming example and, when useful, a counterexample showing why a condition matters.
- For mathematics and physics, check sign, units, limiting cases, and physical/geometric meaning.
- For C, trace values, types, control flow, memory, bounds, and undefined behaviour explicitly.
- For engineering design, distinguish stakeholders, needs, criteria, constraints, evidence, risk, and trade-offs.
- End with exactly one short Socratic check question tailored to the student's current gap.
- Do not praise generically. Be patient, direct, and instructional.
- Use compact headings and readable equations in plain text. Do not output JSON.
${attempted ? "The student has attempted the question, so you may discuss the correct answer and diagnose the attempt." : "The student has not committed an answer. Do not reveal the final option or answer; guide with definitions and one next step."}
${correct ? "The student's committed answer was correct. Deepen understanding and test transfer, not mere recognition." : attempted ? "The committed answer was incorrect. Explain the misconception, but make the student perform the repaired reasoning." : ""}`;

  const context = `COURSE: ${clean(body.course, 300)}
TOPIC: ${clean(body.topic, 300)}
QUESTION: ${question}
OPTIONS: ${options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n")}
CORRECT ANSWER (teacher-only context): ${clean(body.correctAnswer, 500)}
EXISTING EXPLANATION (may be incomplete): ${clean(body.explanation)}
STUDENT'S ORIGINAL REASONING: ${clean(body.originalThought) || "Not provided yet."}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: context },
          ...history,
          { role: "user", content: userMessage },
        ],
        thinking: { type: "enabled" },
        reasoning_effort: "high",
        max_tokens: 1400,
        temperature: 0.25,
        stream: false,
      }),
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
