import JSZip from "jszip";
import { IngestionError } from "./errors.ts";

export const PARSER_VERSION = "document-parser-v1";
export const MAX_PARSED_CHARACTERS = 2_000_000;

export interface ParsedDocumentUnit {
  content: string;
  page?: number;
  slide?: number;
  section?: string;
}

export interface ParsedDocument {
  kind:
    | "pdf"
    | "presentation"
    | "document"
    | "spreadsheet"
    | "notebook"
    | "text"
    | "image";
  units: ParsedDocumentUnit[];
  metadata: Record<string, string | number | boolean | null>;
  warnings: string[];
}

export interface DocumentParseInput {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
      String.fromCodePoint(Number.parseInt(String(hex), 16)),
    )
    .replace(/&#(\d+);/g, (_match, decimal) =>
      String.fromCodePoint(Number.parseInt(String(decimal), 10)),
    )
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function xmlText(xml: string, tag: string): string[] {
  const expression = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return [...xml.matchAll(expression)]
    .map((match) => decodeXml(match[1] ?? "").trim())
    .filter(Boolean);
}

function assertParsedSize(units: ParsedDocumentUnit[]): void {
  const size = units.reduce((total, unit) => total + unit.content.length, 0);
  if (size > MAX_PARSED_CHARACTERS) {
    throw new IngestionError(
      "PARSED_TEXT_LIMIT_EXCEEDED",
      "The parsed document contains more than 2,000,000 characters.",
    );
  }
}

function parseText(bytes: Uint8Array, kind: ParsedDocument["kind"] = "text"): ParsedDocument {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new IngestionError(
      "TEXT_ENCODING_INVALID",
      "Text resources must use UTF-8 encoding.",
    );
  }
  const units: ParsedDocumentUnit[] = [];
  let section = "Document";
  let buffer: string[] = [];
  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) units.push({ content, section });
    buffer = [];
  };
  for (const line of text.replaceAll("\r\n", "\n").split("\n")) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/);
    if (heading?.[1]) {
      flush();
      section = heading[1].trim().slice(0, 500);
    } else {
      buffer.push(line);
    }
  }
  flush();
  if (units.length === 0 && text.trim()) {
    units.push({ content: text.trim(), section: "Document" });
  }
  assertParsedSize(units);
  return { kind, units, metadata: {}, warnings: [] };
}

function stripHtml(input: string): string {
  return decodeXml(
    input
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

async function parsePdf(bytes: Uint8Array): Promise<ParsedDocument> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  try {
    if (pdf.numPages > 250) {
      throw new IngestionError(
        "PDF_PAGE_LIMIT_EXCEEDED",
        "PDF files may contain at most 250 pages.",
      );
    }
    const result = await extractText(pdf, { mergePages: false });
    const units = result.text
      .map((content, index) => ({ content: content.trim(), page: index + 1 }))
      .filter((unit) => unit.content.length > 0);
    assertParsedSize(units);
    return {
      kind: "pdf",
      units,
      metadata: { totalPages: result.totalPages },
      warnings: units.length === 0 ? ["PDF_TEXT_LAYER_EMPTY"] : [],
    };
  } finally {
    await (pdf as unknown as { destroy?: () => Promise<void> }).destroy?.();
  }
}

async function loadOfficeZip(bytes: Uint8Array): Promise<JSZip> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    if (Object.keys(zip.files).length > 5_000) {
      throw new IngestionError(
        "OFFICE_ENTRY_LIMIT_EXCEEDED",
        "The Office document contains too many archive entries.",
      );
    }
    return zip;
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(
      "OFFICE_ARCHIVE_INVALID",
      "The Office document is not a valid Open XML archive.",
    );
  }
}

async function parsePptx(bytes: Uint8Array): Promise<ParsedDocument> {
  const zip = await loadOfficeZip(bytes);
  const slides = Object.keys(zip.files)
    .map((name) => ({ name, match: name.match(/^ppt\/slides\/slide(\d+)\.xml$/i) }))
    .filter((item): item is { name: string; match: RegExpMatchArray } => Boolean(item.match))
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  if (slides.length === 0) {
    throw new IngestionError(
      "POWERPOINT_SLIDES_MISSING",
      "The PowerPoint archive contains no slides.",
    );
  }
  const units: ParsedDocumentUnit[] = [];
  for (const slide of slides) {
    const xml = await zip.file(slide.name)!.async("string");
    const content = xmlText(xml, "a:t").join("\n").trim();
    if (content) units.push({ content, slide: Number(slide.match[1]) });
  }
  assertParsedSize(units);
  return {
    kind: "presentation",
    units,
    metadata: { totalSlides: slides.length },
    warnings: units.length === 0 ? ["POWERPOINT_TEXT_EMPTY"] : [],
  };
}

async function parseDocx(bytes: Uint8Array): Promise<ParsedDocument> {
  const zip = await loadOfficeZip(bytes);
  const document = zip.file("word/document.xml");
  if (!document) {
    throw new IngestionError("WORD_DOCUMENT_MISSING", "The Word document body is missing.");
  }
  const xml = await document.async("string");
  const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/gi)]
    .map((match) => xmlText(match[1] ?? "", "w:t").join(""))
    .map((value) => value.trim())
    .filter(Boolean);
  const units = paragraphs.length
    ? [{ content: paragraphs.join("\n\n"), section: "Document" }]
    : [];
  assertParsedSize(units);
  return {
    kind: "document",
    units,
    metadata: {},
    warnings: units.length === 0 ? ["WORD_TEXT_EMPTY"] : [],
  };
}

async function parseXlsx(bytes: Uint8Array): Promise<ParsedDocument> {
  const zip = await loadOfficeZip(bytes);
  const sharedFile = zip.file("xl/sharedStrings.xml");
  const shared = sharedFile
    ? xmlText(await sharedFile.async("string"), "t")
    : [];
  const sheets = Object.keys(zip.files)
    .map((name) => ({ name, match: name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/i) }))
    .filter((item): item is { name: string; match: RegExpMatchArray } => Boolean(item.match))
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  const units: ParsedDocumentUnit[] = [];
  for (const sheet of sheets) {
    const xml = await zip.file(sheet.name)!.async("string");
    const rows: string[] = [];
    for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/gi)) {
      const cells: string[] = [];
      for (const cellMatch of (rowMatch[1] ?? "").matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/gi)) {
        const attributes = cellMatch[1] ?? "";
        const body = cellMatch[2] ?? "";
        const raw = xmlText(body, "v")[0] ?? xmlText(body, "t")[0] ?? "";
        const value = /\bt="s"/i.test(attributes)
          ? shared[Number.parseInt(raw, 10)] ?? ""
          : raw;
        cells.push(value);
      }
      if (cells.some(Boolean)) rows.push(cells.join("\t"));
    }
    if (rows.length) {
      units.push({
        content: rows.join("\n"),
        section: `Sheet ${Number(sheet.match[1])}`,
      });
    }
  }
  assertParsedSize(units);
  return {
    kind: "spreadsheet",
    units,
    metadata: { totalSheets: sheets.length },
    warnings: units.length === 0 ? ["SPREADSHEET_TEXT_EMPTY"] : [],
  };
}

function parseNotebook(bytes: Uint8Array): ParsedDocument {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new IngestionError("NOTEBOOK_JSON_INVALID", "The notebook JSON is invalid.");
  }
  if (!value || typeof value !== "object" || !("cells" in value) || !Array.isArray(value.cells)) {
    throw new IngestionError("NOTEBOOK_STRUCTURE_INVALID", "The notebook has no cells array.");
  }
  const notebookCells = value.cells as unknown[];
  const units: ParsedDocumentUnit[] = [];
  for (const [index, cell] of notebookCells.entries()) {
    if (!cell || typeof cell !== "object" || !("source" in cell)) continue;
    const source = Array.isArray(cell.source)
      ? cell.source.filter((item): item is string => typeof item === "string").join("")
      : typeof cell.source === "string"
        ? cell.source
        : "";
    if (!source.trim()) continue;
    const cellType = "cell_type" in cell && typeof cell.cell_type === "string"
      ? cell.cell_type
      : "unknown";
    units.push({ content: source.trim(), section: `Cell ${index + 1} (${cellType})` });
  }
  assertParsedSize(units);
  return { kind: "notebook", units, metadata: { totalCells: notebookCells.length }, warnings: [] };
}

function lowerExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

export async function parseDocument(input: DocumentParseInput): Promise<ParsedDocument> {
  const mime = input.mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  const extension = lowerExtension(input.fileName);
  if (mime === "application/pdf" || extension === ".pdf") return parsePdf(input.bytes);
  if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === ".pptx"
  ) return parsePptx(input.bytes);
  if (mime === "application/vnd.ms-powerpoint" || extension === ".ppt") {
    throw new IngestionError(
      "LEGACY_POWERPOINT_REQUIRES_CONVERSION",
      "Legacy .ppt files must be converted to .pptx before processing.",
    );
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) return parseDocx(input.bytes);
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    extension === ".xlsx"
  ) return parseXlsx(input.bytes);
  if (mime === "application/x-ipynb+json" || extension === ".ipynb") {
    return parseNotebook(input.bytes);
  }
  if (mime === "text/html" || extension === ".html" || extension === ".htm") {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    return parseText(new TextEncoder().encode(stripHtml(decoded)));
  }
  if (mime.startsWith("image/")) {
    return {
      kind: "image",
      units: [],
      metadata: {},
      warnings: ["IMAGE_OCR_NOT_CONFIGURED"],
    };
  }
  if (
    mime.startsWith("text/") ||
    [".txt", ".md", ".csv", ".json", ".ts", ".tsx", ".js", ".jsx", ".py", ".m", ".sql", ".c", ".cpp", ".h", ".java"].includes(extension)
  ) return parseText(input.bytes);
  throw new IngestionError(
    "DOCUMENT_TYPE_UNSUPPORTED",
    `No parser is registered for ${mime || extension || "this file type"}.`,
  );
}
