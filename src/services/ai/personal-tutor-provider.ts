export interface PersonalTutorProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PersonalTutorProviderRequest {
  model: "deepseek-v4-pro";
  messages: PersonalTutorProviderMessage[];
  thinking: { type: "enabled" };
  reasoning_effort: "high";
  max_tokens: 2200;
  temperature: 0.25;
  stream: false;
}

/**
 * Keeps the legacy owner's tutor provider contract independently testable.
 * Authentication, rate limiting, evidence sanitisation and prompt construction
 * remain in the protected route; this function only builds the outbound body.
 */
export function buildPersonalTutorProviderRequest(input: {
  system: string;
  context: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  userMessage: string;
}): PersonalTutorProviderRequest {
  return {
    model: "deepseek-v4-pro",
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.context },
      ...input.history,
      { role: "user", content: input.userMessage },
    ],
    thinking: { type: "enabled" },
    reasoning_effort: "high",
    max_tokens: 2200,
    temperature: 0.25,
    stream: false,
  };
}
