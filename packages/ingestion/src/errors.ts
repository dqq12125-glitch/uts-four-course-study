export class IngestionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IngestionError";
    this.code = code;
  }
}

export function ingestionFailureCode(error: unknown): string {
  return error instanceof IngestionError
    ? error.code
    : "RESOURCE_INGESTION_FAILED";
}
