const encoder = new TextEncoder();

interface UnsubscribePayload {
  version: 1;
  userId: string;
  expiresAt: number;
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(
      value.replaceAll("-", "+").replaceAll("_", "/") + padding,
    );
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function createUnsubscribeToken(input: {
  userId: string;
  secret: string;
  now?: Date;
  expiresInDays?: number;
}): Promise<string> {
  const now = input.now ?? new Date();
  const payload: UnsubscribePayload = {
    version: 1,
    userId: input.userId,
    expiresAt:
      now.getTime() +
      (input.expiresInDays ?? 180) * 24 * 60 * 60 * 1_000,
  };
  const encodedPayload = encodeBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const signature = encodeBase64Url(
    await hmac(encodedPayload, input.secret),
  );
  return `${encodedPayload}.${signature}`;
}

export async function verifyUnsubscribeToken(input: {
  token: string;
  secret: string;
  now?: Date;
}): Promise<string | null> {
  const [encodedPayload, encodedSignature, extra] =
    input.token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;
  const signature = decodeBase64Url(encodedSignature);
  const payloadBytes = decodeBase64Url(encodedPayload);
  if (!signature || !payloadBytes) return null;
  const expected = await hmac(encodedPayload, input.secret);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes),
    ) as Partial<UnsubscribePayload>;
    const now = input.now ?? new Date();
    if (
      payload.version !== 1 ||
      typeof payload.userId !== "string" ||
      !/^[A-Za-z0-9_-]{3,128}$/u.test(payload.userId) ||
      typeof payload.expiresAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= now.getTime()
    ) {
      return null;
    }
    return payload.userId;
  } catch {
    return null;
  }
}
