function digestBytes(input: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.digest(
    "SHA-256",
    input as Uint8Array<ArrayBuffer>,
  );
}

function hex(bytes: Uint8Array): string {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Bytes(input: Uint8Array): Promise<string> {
  return hex(new Uint8Array(await digestBytes(input)));
}

export function sha256Text(input: string): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(input));
}
