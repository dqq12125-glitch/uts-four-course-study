import type { SourceReference } from "@deepstudy/shared-types";
import { sha256Text } from "./hash.ts";
import type { ParsedDocument, ParsedDocumentUnit } from "./parsers.ts";

export interface IngestionChunk {
  sequenceNumber: number;
  content: string;
  contentHash: string;
  sourceReference: SourceReference;
  embedding: number[] | null;
  reusedFromChunkId?: string;
}

function paragraphs(content: string): string[] {
  return content
    .replaceAll("\r\n", "\n")
    .split(/\n\s*\n|(?<=[.!?。！？])\s+(?=[A-Z\p{L}\p{N}])/u)
    .map((value) => value.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

function splitLong(value: string, limit: number): string[] {
  if (value.length <= limit) return [value];
  const output: string[] = [];
  let rest = value;
  while (rest.length > limit) {
    const preferred = Math.max(
      rest.lastIndexOf(" ", limit),
      rest.lastIndexOf("\n", limit),
    );
    const cut = preferred > limit * 0.6 ? preferred : limit;
    output.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) output.push(rest);
  return output;
}

function locator(unit: ParsedDocumentUnit): Pick<SourceReference, "page" | "slide" | "section"> {
  if (unit.page) return { page: unit.page };
  if (unit.slide) return { slide: unit.slide };
  return { section: unit.section ?? "Document" };
}

export async function chunkDocument(input: {
  document: ParsedDocument;
  resourceId: string;
  courseId: string;
  sourceUrl?: string | null;
  maxCharacters?: number;
}): Promise<IngestionChunk[]> {
  const limit = input.maxCharacters ?? 1_800;
  if (limit < 200) throw new Error("Chunk size must be at least 200 characters.");
  const chunks: Array<{ content: string; unit: ParsedDocumentUnit }> = [];
  for (const unit of input.document.units) {
    let current = "";
    for (const part of paragraphs(unit.content).flatMap((item) => splitLong(item, limit))) {
      if (current && current.length + part.length + 2 > limit) {
        chunks.push({ content: current, unit });
        current = part;
      } else {
        current = current ? `${current}\n\n${part}` : part;
      }
    }
    if (current) chunks.push({ content: current, unit });
  }
  return Promise.all(
    chunks.map(async (chunk, index) => ({
      sequenceNumber: index,
      content: chunk.content,
      contentHash: await sha256Text(chunk.content),
      sourceReference: {
        resourceId: input.resourceId,
        courseId: input.courseId,
        ...locator(chunk.unit),
        ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
      },
      embedding: null,
    })),
  );
}
