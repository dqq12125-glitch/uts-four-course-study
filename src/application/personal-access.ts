import { getRuntimeEnvironment } from "../infrastructure/environment.ts";

function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function matchesPersonalOwner(
  signedInEmail: string,
  configuredOwnerEmail: string | undefined,
): boolean {
  const userEmail = normalizeEmail(signedInEmail);
  const ownerEmail = normalizeEmail(configuredOwnerEmail);

  return ownerEmail !== null && userEmail === ownerEmail;
}

export function isPersonalOwner(signedInEmail: string): boolean {
  return matchesPersonalOwner(
    signedInEmail,
    getRuntimeEnvironment().PERSONAL_OWNER_EMAIL,
  );
}
