import type { AIProvider } from "@deepstudy/shared-types";
import { chunkDocument, type IngestionChunk } from "./chunking.ts";
import { sha256Bytes, sha256Text } from "./hash.ts";
import { parseDocument, PARSER_VERSION, type ParsedDocument } from "./parsers.ts";

export interface IngestionQualityReport {
  status: "passed" | "warning" | "failed";
  issues: string[];
  unitCount: number;
  chunkCount: number;
  embeddedChunkCount: number;
}

export interface DocumentIngestionResult {
  fileHash: string;
  contentHash: string;
  parserVersion: string;
  embeddingVersion: string | null;
  document: ParsedDocument;
  chunks: IngestionChunk[];
  reusedChunkCount: number;
  extractedText: string | null;
  quality: IngestionQualityReport;
}

export interface DocumentIngestionPipelineConfiguration {
  embeddingProvider?: Pick<AIProvider, "embed">;
  embeddingVersion?: string;
  embeddingBatchSize?: number;
}

function validateEmbeddingBatch(vectors: number[][], expected: number): void {
  if (vectors.length !== expected) {
    throw new Error("Embedding provider returned an unexpected vector count.");
  }
  const dimensions = vectors[0]?.length ?? 0;
  if (
    dimensions < 1 ||
    vectors.some(
      (vector) =>
        vector.length !== dimensions || vector.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new Error("Embedding provider returned invalid vectors.");
  }
}

export class DocumentIngestionPipeline {
  private readonly configuration: DocumentIngestionPipelineConfiguration;

  constructor(configuration: DocumentIngestionPipelineConfiguration = {}) {
    this.configuration = configuration;
  }

  async process(input: {
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
    resourceId: string;
    courseId: string;
    sourceUrl?: string | null;
    reusableChunks?: Array<{
      id: string;
      contentHash: string;
      page: number | null;
      slide: number | null;
      section: string | null;
      embedding: number[];
      embeddingVersion: string;
    }>;
  }): Promise<DocumentIngestionResult> {
    const fileHash = await sha256Bytes(input.bytes);
    const document = await parseDocument(input);
    const chunks = await chunkDocument({
      document,
      resourceId: input.resourceId,
      courseId: input.courseId,
      sourceUrl: input.sourceUrl,
    });
    const canonicalContent = document.units
      .map((unit) =>
        `${unit.page ?? ""}|${unit.slide ?? ""}|${unit.section ?? ""}\n${unit.content.trim()}`,
      )
      .join("\n\n---\n\n");
    const contentHash = await sha256Text(canonicalContent);
    const issues = [...document.warnings];
    const provider = this.configuration.embeddingProvider;
    const expectedEmbeddingVersion = this.configuration.embeddingVersion;
    const reusable = new Map(
      (input.reusableChunks ?? [])
        .filter(
          (item) =>
            !expectedEmbeddingVersion ||
            item.embeddingVersion === expectedEmbeddingVersion,
        )
        .map((item) => [
          `${item.contentHash}|${item.page ?? ""}|${item.slide ?? ""}|${item.section ?? ""}`,
          item,
        ]),
    );
    for (const chunk of chunks) {
      const reference = chunk.sourceReference;
      const match = reusable.get(
        `${chunk.contentHash}|${reference.page ?? ""}|${reference.slide ?? ""}|${reference.section ?? ""}`,
      );
      if (!match) continue;
      chunk.embedding = [...match.embedding];
      chunk.reusedFromChunkId = match.id;
    }
    const missingEmbeddings = chunks.filter((chunk) => !chunk.embedding);
    if (missingEmbeddings.length > 0 && provider) {
      const batchSize = Math.max(1, this.configuration.embeddingBatchSize ?? 32);
      for (let offset = 0; offset < missingEmbeddings.length; offset += batchSize) {
        const batch = missingEmbeddings.slice(offset, offset + batchSize);
        const vectors = await provider.embed(batch.map((chunk) => chunk.content));
        validateEmbeddingBatch(vectors, batch.length);
        vectors.forEach((vector, index) => {
          batch[index]!.embedding = vector;
        });
      }
    } else if (missingEmbeddings.length > 0) {
      issues.push("EMBEDDING_PROVIDER_NOT_CONFIGURED");
    }
    if (document.units.length === 0) issues.push("NO_TEXT_UNITS_EXTRACTED");
    if (chunks.length === 0) issues.push("NO_SEARCHABLE_CHUNKS_CREATED");
    const embeddedChunkCount = chunks.filter((chunk) => chunk.embedding).length;
    return {
      fileHash,
      contentHash,
      parserVersion: PARSER_VERSION,
      embeddingVersion:
        embeddedChunkCount > 0
          ? this.configuration.embeddingVersion ?? "configured-provider"
          : null,
      document,
      chunks,
      reusedChunkCount: chunks.filter((chunk) => chunk.reusedFromChunkId).length,
      extractedText: document.units.length
        ? document.units
            .map((unit) => unit.content.trim())
            .filter(Boolean)
            .join("\n\n")
            .slice(0, 200_000)
        : null,
      quality: {
        status: issues.length > 0 ? "warning" : "passed",
        issues: [...new Set(issues)],
        unitCount: document.units.length,
        chunkCount: chunks.length,
        embeddedChunkCount,
      },
    };
  }
}
