import { ApiError } from "../lib/api-errors.ts";
import { createId, createSecret, sha256 } from "../lib/ids.ts";
import type {
  AuthRepository,
  AuthUser,
} from "../repositories/auth-repository.ts";
import type { EmailSender } from "../services/email/email-sender.ts";

const MAGIC_LINK_MINUTES = 15;
const SESSION_DAYS = 30;

export interface AuthConfiguration {
  baseUrl: string;
  mobileAppScheme: string;
  mobileAppLinkBaseUrl?: string;
  ipHashSecret: string;
  environment: "development" | "preview" | "production" | "test";
}

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly emailSender: EmailSender;
  private readonly config: AuthConfiguration;

  constructor(
    repository: AuthRepository,
    emailSender: EmailSender,
    config: AuthConfiguration,
  ) {
    this.repository = repository;
    this.emailSender = emailSender;
    this.config = config;
  }

  async requestMagicLink(input: {
    email: string;
    intent: "sign-up" | "sign-in";
    ipAddress: string;
    language: "zh-CN" | "en";
    client?: "web" | "mobile";
    now?: Date;
  }): Promise<{ previewUrl?: string }> {
    const now = input.now ?? new Date();
    const email = input.email.trim().toLowerCase();
    const emailKey = await sha256(
      `email:${this.config.ipHashSecret}:${email}`,
    );
    const ipKey = await sha256(
      `ip:${this.config.ipHashSecret}:${input.ipAddress}`,
    );
    const [emailAllowed, ipAllowed] = await Promise.all([
      this.repository.takeRateLimit(`auth:${emailKey}`, 5, 15 * 60, now),
      this.repository.takeRateLimit(`auth:${ipKey}`, 20, 15 * 60, now),
    ]);
    if (!emailAllowed || !ipAllowed) {
      throw new ApiError(
        "AUTH_RATE_LIMITED",
        429,
        "Too many sign-in attempts. Please wait and try again.",
      );
    }

    const existing = await this.repository.findUserByEmail(email);
    if (input.intent === "sign-in" && !existing) {
      return {};
    }

    const rawToken = createSecret();
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(
      now.getTime() + MAGIC_LINK_MINUTES * 60 * 1000,
    );
    await this.repository.createMagicLink({
      id: createId("magic"),
      email,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      requestedIpHash: ipKey,
    });

    const verifyUrl =
      input.client === "mobile"
        ? this.config.mobileAppLinkBaseUrl
          ? new URL("/auth/callback", this.config.mobileAppLinkBaseUrl)
          : new URL(`${this.config.mobileAppScheme}://auth/callback`)
        : new URL("/api/auth/verify", this.config.baseUrl);
    verifyUrl.searchParams.set("token", rawToken);
    const delivery = await this.emailSender.sendMagicLink({
      to: email,
      verifyUrl: verifyUrl.toString(),
      expiresInMinutes: MAGIC_LINK_MINUTES,
      language: input.language,
    });
    return delivery;
  }

  async verifyMagicLink(
    rawToken: string,
    now = new Date(),
  ): Promise<{ user: AuthUser; sessionToken: string; expiresAt: Date }> {
    const tokenHash = await sha256(rawToken);
    const magicLink = await this.repository.consumeMagicLink(tokenHash, now);
    if (!magicLink) {
      throw new ApiError(
        "AUTH_LINK_INVALID",
        400,
        "This sign-in link is invalid or has expired.",
      );
    }

    const user = await this.repository.getOrCreateVerifiedUser({
      id: createId("user"),
      settingsId: createId("settings"),
      email: magicLink.email,
      now: now.toISOString(),
    });
    const sessionToken = createSecret();
    const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
    await this.repository.createSession({
      id: createId("session"),
      userId: user.id,
      tokenHash: await sha256(sessionToken),
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
    });
    return { user, sessionToken, expiresAt };
  }

  async currentUser(
    sessionToken: string | null,
    now = new Date(),
  ): Promise<AuthUser | null> {
    if (!sessionToken) return null;
    return this.repository.findUserBySessionHash(
      await sha256(sessionToken),
      now,
    );
  }

  async signOut(sessionToken: string | null, now = new Date()): Promise<void> {
    if (!sessionToken) return;
    await this.repository.revokeSession(await sha256(sessionToken), now);
  }
}
