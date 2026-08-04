import { z } from "zod";
import type { RuntimeEnvironment } from "./environment.ts";

const productionConfigurationSchema = z
  .object({
    APP_ENV: z.literal("production"),
    APP_BASE_URL: z
      .url()
      .refine((value) => new URL(value).protocol === "https:", {
        message: "APP_BASE_URL must use HTTPS in production.",
      }),
    DB: z.custom<D1Database>((value) => Boolean(value)),
    UPLOADS: z.custom<NonNullable<RuntimeEnvironment["UPLOADS"]>>((value) =>
      Boolean(value),
    ),
    EMAIL_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(3),
    UNSUBSCRIBE_TOKEN_SECRET: z.string().min(32),
    IP_HASH_SECRET: z.string().min(32),
    AI_MOCK_ENABLED: z.enum(["false"]).optional(),
    UPLOADS_MOCK_ENABLED: z.enum(["false"]).optional(),
    PAYMENTS_MOCK_ENABLED: z.enum(["false"]).optional(),
    DEVELOPMENT_FULL_ACCESS: z.enum(["false"]).optional(),
    TURNSTILE_REQUIRED: z.enum(["true", "false"]).optional(),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.TURNSTILE_REQUIRED === "true" &&
      (!value.TURNSTILE_SECRET_KEY || !value.PUBLIC_TURNSTILE_SITE_KEY)
    ) {
      context.addIssue({
        code: "custom",
        path: ["TURNSTILE_SECRET_KEY"],
        message:
          "Both Turnstile keys are required when TURNSTILE_REQUIRED is true.",
      });
    }
  });

export function validateProductionConfiguration(
  environment: RuntimeEnvironment,
): void {
  if (
    environment.APP_ENV !== "production" ||
    environment.PERSONAL_DEPLOYMENT === "true"
  ) {
    return;
  }
  const parsed = productionConfigurationSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))]
      .map(String)
      .sort()
      .join(", ");
    throw new Error(`Invalid production configuration: ${fields}.`);
  }
}
