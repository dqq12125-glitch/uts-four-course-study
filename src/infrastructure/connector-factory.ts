import {
  CanvasConnector,
  MockConnector,
} from "@deepstudy/ingestion";
import {
  AesGcmSecretCipher,
  encryptedSecretSchema,
} from "@deepstudy/security";
import type { LMSConnector } from "@deepstudy/shared-types";
import { z } from "zod";
import type { CourseConnectorRecord } from "../repositories/connector-sync-repository.ts";
import { getRuntimeEnvironment } from "./environment.ts";

const credentialPayloadSchema = z.object({
  accessToken: z.string().trim().min(1).max(20_000),
});

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function connectorCipher(): AesGcmSecretCipher {
  const environment = getRuntimeEnvironment();
  const activeKeyId = environment.CONNECTOR_TOKEN_ACTIVE_KEY_ID?.trim();
  if (!activeKeyId || !environment.CONNECTOR_TOKEN_KEYS) {
    throw new Error("Connector credential encryption is not configured.");
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(environment.CONNECTOR_TOKEN_KEYS);
  } catch {
    throw new Error("CONNECTOR_TOKEN_KEYS must be a JSON object.");
  }
  const keyValues = z.record(z.string(), z.string().min(1)).parse(decoded);
  const keys = Object.fromEntries(
    Object.entries(keyValues).map(([keyId, value]) => [
      keyId,
      decodeBase64(value),
    ]),
  );
  return new AesGcmSecretCipher({ activeKeyId, keys });
}

export async function createCourseConnector(
  connection: CourseConnectorRecord,
): Promise<LMSConnector> {
  const environment = getRuntimeEnvironment();
  if (connection.connectorId === "mock") {
    if (environment.APP_ENV === "production") {
      throw new Error("The mock LMS connector is disabled in production.");
    }
    return new MockConnector({ displayName: connection.displayName });
  }
  if (!connection.baseUrl || !connection.encryptedCredentialsJson) {
    throw new Error("Canvas connection metadata is incomplete.");
  }
  let encrypted: unknown;
  try {
    encrypted = JSON.parse(connection.encryptedCredentialsJson);
  } catch {
    throw new Error("Canvas credentials are not a valid encrypted envelope.");
  }
  const secret = encryptedSecretSchema.parse(encrypted);
  const plaintext = await connectorCipher().decrypt(
    secret,
    `lms:${connection.userId}:${connection.connectionId}`,
  );
  const credentials = credentialPayloadSchema.parse(JSON.parse(plaintext));
  return new CanvasConnector({
    baseUrl: connection.baseUrl,
    accessToken: credentials.accessToken,
  });
}
