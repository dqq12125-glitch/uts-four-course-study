/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  setRuntimeEnvironment,
  type RuntimeEnvironment,
} from "../src/infrastructure/environment";
import { getScheduledJobService } from "../src/application/runtime";

interface Env extends RuntimeEnvironment {
  ASSETS: Fetcher;
  DB?: D1Database;
  UPLOADS?: import("../src/services/storage/private-object-storage").R2BucketLike;
  APP_ENV?: "development" | "preview" | "production" | "test";
  APP_BASE_URL?: string;
  MOBILE_APP_SCHEME?: string;
  MOBILE_APP_LINK_BASE_URL?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  UNSUBSCRIBE_TOKEN_SECRET?: string;
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
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const MOBILE_BUNDLE_ID = "com.deepstudy.student";

function wellKnownResponse(pathname: string, env: Env): Response | null {
  const headers = {
    "Cache-Control": "public, max-age=3600",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
  if (pathname === "/.well-known/apple-app-site-association") {
    const teamId = env.APPLE_TEAM_ID?.trim();
    return Response.json(
      {
        applinks: {
          apps: [],
          details: teamId
            ? [
                {
                  appID: `${teamId}.${MOBILE_BUNDLE_ID}`,
                  paths: ["/auth/callback"],
                },
              ]
            : [],
        },
      },
      { headers },
    );
  }
  if (pathname === "/.well-known/assetlinks.json") {
    const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i;
    const fingerprints = (
      env.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS ?? ""
    )
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value) => fingerprintPattern.test(value));
    return Response.json(
      fingerprints.length
        ? [
            {
              relation: ["delegate_permission/common.handle_all_urls"],
              target: {
                namespace: "android_app",
                package_name: MOBILE_BUNDLE_ID,
                sha256_cert_fingerprints: fingerprints,
              },
            },
          ]
        : [],
      { headers },
    );
  }
  return null;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setRuntimeEnvironment(env);
    const url = new URL(request.url);
    const association = wellKnownResponse(url.pathname, env);
    if (association) return association;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async scheduled(
    event: { scheduledTime: number; cron: string },
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    setRuntimeEnvironment(env);
    ctx.waitUntil(
      getScheduledJobService().run(event.scheduledTime).then(() => undefined),
    );
  },
};

export default worker;
