interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(
    statements: D1PreparedStatement[],
  ): Promise<Array<D1Result<T>>>;
  exec(query: string): Promise<D1Result>;
  dump(): Promise<ArrayBuffer>;
}

interface R2StoredObject {
  body: ReadableStream<Uint8Array>;
  size?: number;
  httpMetadata?: { contentType?: string };
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2StoredObject | null>;
  delete(key: string): Promise<void>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    UPLOADS?: R2Bucket;
    APP_ENV?: "development" | "preview" | "production" | "test";
    APP_BASE_URL?: string;
    MOBILE_APP_SCHEME?: string;
    MOBILE_APP_LINK_BASE_URL?: string;
    EMAIL_PROVIDER?: string;
    EMAIL_API_KEY?: string;
    EMAIL_FROM?: string;
    IP_HASH_SECRET?: string;
    PERSONAL_OWNER_EMAIL?: string;
    DEEPSEEK_API_KEY?: string;
    AI_PROVIDER?: string;
    AI_API_KEY?: string;
    AI_BASE_URL?: string;
    AI_TUTOR_MODEL?: string;
    AI_EXTRACTION_MODEL?: string;
    AI_MOCK_ENABLED?: string;
    AI_INPUT_COST_PER_MILLION_MINOR_USD?: string;
    AI_OUTPUT_COST_PER_MILLION_MINOR_USD?: string;
    UPLOADS_MOCK_ENABLED?: string;
    DEVELOPMENT_FULL_ACCESS?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_FOUNDING_PASS_PRICE_ID?: string;
    STRIPE_SEMESTER_PASS_PRICE_ID?: string;
    STRIPE_EXAM_SPRINT_PRICE_ID?: string;
    PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
    PAYMENTS_MOCK_ENABLED?: string;
    FOUNDING_PASS_ACCESS_END_AT?: string;
    PUBLIC_TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    TURNSTILE_REQUIRED?: string;
    APPLE_TEAM_ID?: string;
    ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS?: string;
    [key: string]: unknown;
  };
}
