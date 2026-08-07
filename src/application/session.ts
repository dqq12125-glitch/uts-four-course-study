import { cookies } from "next/headers";
import { SESSION_COOKIE, readCookie } from "@/src/lib/cookies";
import { ApiError } from "@/src/lib/api-errors";
import { getAuthService } from "@/src/application/runtime";
import type { AuthUser } from "@/src/repositories/auth-repository";

export function sessionTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
    if (
      scheme?.toLowerCase() === "bearer" &&
      token &&
      rest.length === 0 &&
      token.length <= 256
    ) {
      return token;
    }
  }
  return readCookie(request, SESSION_COOKIE);
}

export async function currentUserFromRequest(
  request: Request,
): Promise<AuthUser | null> {
  return getAuthService().currentUser(sessionTokenFromRequest(request));
}

export async function currentUserFromCookies(): Promise<AuthUser | null> {
  const store = await cookies();
  return getAuthService().currentUser(store.get(SESSION_COOKIE)?.value ?? null);
}

export async function requireUserFromRequest(
  request: Request,
): Promise<AuthUser> {
  const user = await currentUserFromRequest(request);
  if (!user) {
    throw new ApiError(
      "AUTHENTICATION_REQUIRED",
      401,
      "Please sign in to continue.",
    );
  }
  return user;
}

export async function requireAdminFromRequest(
  request: Request,
): Promise<AuthUser> {
  const user = await requireUserFromRequest(request);
  if (user.role !== "admin") {
    throw new ApiError(
      "ADMIN_REQUIRED",
      403,
      "Administrator access is required.",
    );
  }
  return user;
}
