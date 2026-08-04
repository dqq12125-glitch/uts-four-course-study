import type {
  AIProvider,
  StructuredRequest,
  TextRequest,
} from "@deepstudy/shared-types";
import type { ModelPolicy } from "./model-policy.ts";
import {
  parseProviderChatResponse,
  parseProviderEmbeddingResponse,
  parseStructuredResponse,
} from "./schemas.ts";

export interface OpenAICompatibleConfiguration {
  apiKey: string;
  baseUrl: string;
  embeddingModel: string;
  modelPolicy: ModelPolicy;
  fetcher?: typeof fetch;
}

function secureBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("AI provider base URL must use HTTPS.");
  }
  return url.toString().replace(/\/$/, "");
}

export class OpenAICompatibleAIProvider implements AIProvider {
  private readonly configuration: OpenAICompatibleConfiguration;
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(configuration: OpenAICompatibleConfiguration) {
    this.configuration = configuration;
    this.baseUrl = secureBaseUrl(configuration.baseUrl);
    this.fetcher = configuration.fetcher ?? fetch;
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    const content = await this.chat({
      model: this.configuration.modelPolicy.select(request.capability),
      system: `${request.system}\nReturn one JSON object matching schema ${request.schemaName}.`,
      prompt: request.prompt,
      maxOutputTokens: request.maxOutputTokens,
      structured: true,
    });
    return parseStructuredResponse(content, request.schema);
  }

  generateText(request: TextRequest): Promise<string> {
    return this.chat({
      model: this.configuration.modelPolicy.select(request.capability),
      system: request.system,
      prompt: request.prompt,
      maxOutputTokens: request.maxOutputTokens,
      structured: false,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.fetcher(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: this.configuration.embeddingModel,
        input: texts,
      }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error("AI embedding provider request failed.");
    return parseProviderEmbeddingResponse(payload, texts.length);
  }

  private async chat(input: {
    model: string;
    system: string;
    prompt: string;
    maxOutputTokens?: number;
    structured: boolean;
  }): Promise<string> {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
        max_tokens: input.maxOutputTokens ?? 1_000,
        temperature: 0.2,
        ...(input.structured
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error("AI text provider request failed.");
    return parseProviderChatResponse(payload);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.configuration.apiKey}`,
      "Content-Type": "application/json",
    };
  }
}
