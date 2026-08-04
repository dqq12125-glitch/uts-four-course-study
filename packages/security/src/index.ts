import { z } from "zod";

export const encryptedSecretSchema = z.object({
  version: z.literal(1),
  keyId: z.string().min(1).max(120),
  nonce: z.string().min(1),
  ciphertext: z.string().min(1),
});

export type EncryptedSecret = z.infer<typeof encryptedSecretSchema>;

export interface SecretCipher {
  encrypt(plaintext: string, context: string): Promise<EncryptedSecret>;
  decrypt(secret: EncryptedSecret, context: string): Promise<string>;
}

export interface SecretKeyringConfiguration {
  activeKeyId: string;
  keys: Readonly<Record<string, Uint8Array>>;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export class AesGcmSecretCipher implements SecretCipher {
  private readonly configuration: SecretKeyringConfiguration;

  constructor(configuration: SecretKeyringConfiguration) {
    const activeKey = configuration.keys[configuration.activeKeyId];
    if (!activeKey || activeKey.byteLength !== 32) {
      throw new Error("The active connector-token key must contain 32 bytes.");
    }
    for (const key of Object.values(configuration.keys)) {
      if (key.byteLength !== 32) {
        throw new Error("Every connector-token key must contain 32 bytes.");
      }
    }
    this.configuration = configuration;
  }

  async encrypt(plaintext: string, context: string): Promise<EncryptedSecret> {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.importKey(
      this.configuration.keys[this.configuration.activeKeyId]!,
    );
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: new TextEncoder().encode(context),
      },
      key,
      new TextEncoder().encode(plaintext),
    );
    return {
      version: 1,
      keyId: this.configuration.activeKeyId,
      nonce: bytesToBase64Url(nonce),
      ciphertext: bytesToBase64Url(new Uint8Array(encrypted)),
    };
  }

  async decrypt(secret: EncryptedSecret, context: string): Promise<string> {
    const parsed = encryptedSecretSchema.parse(secret);
    const rawKey = this.configuration.keys[parsed.keyId];
    if (!rawKey) throw new Error(`Unknown connector-token key ${parsed.keyId}.`);
    const key = await this.importKey(rawKey);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64UrlToBytes(parsed.nonce),
        additionalData: new TextEncoder().encode(context),
      },
      key,
      base64UrlToBytes(parsed.ciphertext),
    );
    return new TextDecoder().decode(decrypted);
  }

  private importKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      rawKey as Uint8Array<ArrayBuffer>,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );
  }
}
