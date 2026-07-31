import { getAccountRepository } from "@/src/application/runtime";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";
import { verifyUnsubscribeToken } from "@/src/services/email/unsubscribe-token";

function html(body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email reminders · DeepStudy</title><style>body{font-family:system-ui,sans-serif;background:#f4f1e8;color:#17211b;margin:0;padding:32px}main{max-width:520px;margin:10vh auto;background:#fff;padding:32px;border-radius:20px;box-shadow:0 12px 40px #17211b18}button{font:inherit;min-height:44px;border:0;border-radius:12px;background:#215b45;color:#fff;padding:0 20px;cursor:pointer}p{line-height:1.6;color:#536057}</style></head><body><main>${body}</main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      },
    },
  );
}

async function userIdFromRequest(request: Request): Promise<string | null> {
  const secret = getRuntimeEnvironment().UNSUBSCRIBE_TOKEN_SECRET?.trim();
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!secret || !token) return null;
  return verifyUnsubscribeToken({ token, secret });
}

export async function GET(request: Request): Promise<Response> {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return html(
      "<h1>This unsubscribe link is invalid or expired.</h1><p>Sign in to DeepStudy to manage reminder settings.</p>",
      400,
    );
  }
  const token = encodeURIComponent(
    new URL(request.url).searchParams.get("token") ?? "",
  );
  return html(
    `<h1>Stop reminder emails?</h1><p>In-app reminders will stay available. You can turn email reminders back on from DeepStudy settings.</p><form method="post" action="/api/notifications/unsubscribe?token=${token}"><button type="submit">Unsubscribe from emails</button></form>`,
  );
}

export async function POST(request: Request): Promise<Response> {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return html(
      "<h1>This unsubscribe link is invalid or expired.</h1><p>No settings were changed.</p>",
      400,
    );
  }
  const updated = await getAccountRepository().unsubscribeEmailReminders(
    userId,
    new Date().toISOString(),
  );
  if (!updated) {
    return html(
      "<h1>Email reminders are already unavailable.</h1><p>The account may have been removed or suspended.</p>",
      404,
    );
  }
  return html(
    "<h1>Email reminders are off.</h1><p>In-app reminders remain available. You can opt back in from notification settings.</p>",
  );
}
