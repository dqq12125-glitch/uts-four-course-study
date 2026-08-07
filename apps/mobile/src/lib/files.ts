const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  md: "text/plain",
  ics: "text/calendar",
};

export function supportedMimeType(
  fileName: string,
  reportedMimeType?: string | null,
): string | null {
  const normalized = reportedMimeType?.trim().toLowerCase();
  if (
    normalized &&
    Object.values(MIME_BY_EXTENSION).includes(normalized)
  ) {
    return normalized;
  }
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? null;
}
