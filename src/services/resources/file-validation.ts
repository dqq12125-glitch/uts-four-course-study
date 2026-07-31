import { ApiError } from "../../lib/api-errors.ts";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/calendar",
]);

const EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "text/plain": [".txt", ".md"],
  "text/calendar": [".ics"],
};

function startsWith(bytes: Uint8Array, expected: number[]): boolean {
  return expected.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return new TextDecoder("ascii").decode(bytes.slice(start, end));
}

export function safeFileName(value: string): string {
  const leaf = value.replaceAll("\\", "/").split("/").at(-1) ?? "upload";
  const cleaned = leaf
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "upload";
}

function validUtf8(bytes: Uint8Array): boolean {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return !text.includes("\u0000");
  } catch {
    return false;
  }
}

export function validatePrivateUpload(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}): { fileName: string; mimeType: string } {
  const mimeType = input.mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!SUPPORTED_TYPES.has(mimeType)) {
    throw new ApiError(
      "UPLOAD_TYPE_NOT_ALLOWED",
      415,
      "Upload a PDF, JPEG, PNG, WebP, text, Markdown, or ICS file.",
    );
  }
  if (
    input.bytes.byteLength < 1 ||
    input.bytes.byteLength > MAX_UPLOAD_BYTES
  ) {
    throw new ApiError(
      "UPLOAD_SIZE_INVALID",
      413,
      "Files must be between 1 byte and 10 MB.",
    );
  }
  const fileName = safeFileName(input.fileName);
  const lowerName = fileName.toLowerCase();
  if (
    !(EXTENSIONS[mimeType] ?? []).some((extension) =>
      lowerName.endsWith(extension),
    )
  ) {
    throw new ApiError(
      "UPLOAD_EXTENSION_MISMATCH",
      415,
      "The file extension does not match the selected file type.",
    );
  }

  const signatureMatches =
    (mimeType === "application/pdf" &&
      ascii(input.bytes, 0, 5) === "%PDF-") ||
    (mimeType === "image/jpeg" &&
      startsWith(input.bytes, [0xff, 0xd8, 0xff])) ||
    (mimeType === "image/png" &&
      startsWith(input.bytes, [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ])) ||
    (mimeType === "image/webp" &&
      ascii(input.bytes, 0, 4) === "RIFF" &&
      ascii(input.bytes, 8, 12) === "WEBP") ||
    ((mimeType === "text/plain" || mimeType === "text/calendar") &&
      validUtf8(input.bytes));
  if (!signatureMatches) {
    throw new ApiError(
      "UPLOAD_CONTENT_MISMATCH",
      415,
      "The file content does not match its declared type.",
    );
  }
  if (
    mimeType === "text/calendar" &&
    !new TextDecoder().decode(input.bytes.slice(0, 2_000)).includes(
      "BEGIN:VCALENDAR",
    )
  ) {
    throw new ApiError(
      "ICS_CONTENT_INVALID",
      422,
      "The calendar file is not a valid ICS calendar.",
    );
  }
  return { fileName, mimeType };
}
