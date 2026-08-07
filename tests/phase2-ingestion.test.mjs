import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  CanvasConnector,
  ConnectorRegistry,
  DocumentIngestionPipeline,
  IngestionError,
  ManualUploadConnector,
  MockConnector,
  parseDocument,
} from "@deepstudy/ingestion";
import {
  assignmentDataSchema,
  courseSummarySchema,
  courseSyncResultSchema,
  moduleDataSchema,
  sourceReferenceSchema,
} from "@deepstudy/shared-types";

const NOW = "2026-08-03T00:00:00.000Z";

function connectorFixture() {
  return {
    courses: [
      {
        id: "course-source-1",
        name: "Circuit Analysis",
        code: "ELEC1001",
        startAt: null,
        endAt: null,
        sourceUrl: null,
        updatedAt: NOW,
      },
    ],
    assignments: [
      {
        id: "assignment-1",
        courseId: "course-source-1",
        title: "KVL worksheet",
        description: null,
        dueAt: "2026-08-10T00:00:00.000Z",
        pointsPossible: 10,
        submissionTypes: ["online_upload"],
        sourceUrl: null,
        updatedAt: NOW,
      },
    ],
    modules: [
      {
        id: "module-1",
        courseId: "course-source-1",
        title: "Week 1",
        position: 1,
        state: "active",
        items: [],
        updatedAt: NOW,
      },
    ],
    resources: [
      {
        id: "file-1",
        courseId: "course-source-1",
        fileName: "week-1.md",
        mimeType: "text/plain",
        bytes: new TextEncoder().encode("# Voltage\nPotential difference."),
        sourceUrl: null,
        updatedAt: NOW,
      },
    ],
  };
}

async function assertConnectorContract(connector) {
  const connection = await connector.connect();
  assert.equal(connection.readOnly, true);
  const courses = await connector.listCourses();
  assert.equal(courseSummarySchema.safeParse(courses[0]).success, true);
  const courseId = courses[0].id;
  const assignments = await connector.listAssignments(courseId);
  assert.equal(assignmentDataSchema.safeParse(assignments[0]).success, true);
  const modules = await connector.listModules(courseId);
  assert.equal(moduleDataSchema.safeParse(modules[0]).success, true);
  const sync = await connector.syncCourse(courseId);
  assert.equal(courseSyncResultSchema.safeParse(sync).success, true);
  const resources = await connector.listResources(courseId);
  assert.equal(resources.length, 1);
  const downloaded = await connector.downloadResource(resources[0].id);
  assert.equal(downloaded.fileName, "week-1.md");
}

test("Mock and Manual connectors satisfy the read-only LMS contract", async () => {
  await assertConnectorContract(new MockConnector(connectorFixture()));
  await assertConnectorContract(new ManualUploadConnector(connectorFixture()));
  const registry = new ConnectorRegistry();
  registry.register("mock", () => new MockConnector(connectorFixture()));
  registry.register(
    "manual-upload",
    () => new ManualUploadConnector(connectorFixture()),
  );
  assert.deepEqual(registry.list(), ["mock", "manual-upload"]);
  assert.equal(registry.create("mock").id, "mock");
  assert.throws(
    () => registry.register("mock", () => new MockConnector()),
    /already registered/,
  );
});

test("Canvas connector follows opaque pagination and performs GET-only reads", async () => {
  const requests = [];
  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input));
    requests.push({ url: url.toString(), method: init.method, headers: init.headers });
    const json = (value, headers) =>
      new Response(JSON.stringify(value), {
        status: 200,
        headers: { "content-type": "application/json", ...headers },
      });
    if (url.pathname === "/api/v1/users/self/profile") {
      return json({ id: 1, name: "Canvas Student" });
    }
    if (url.pathname === "/api/v1/courses") {
      if (url.searchParams.get("page") === "opaque-2") {
        return json([
          {
            id: 2,
            name: "Second Course",
            course_code: "TWO",
            start_at: null,
            end_at: null,
            updated_at: NOW,
            html_url: "https://canvas.example/courses/2",
          },
        ]);
      }
      return json(
        [
          {
            id: 1,
            name: "Canvas Course",
            course_code: "ONE",
            start_at: null,
            end_at: null,
            updated_at: NOW,
            html_url: "https://canvas.example/courses/1",
          },
        ],
        {
          link: '<https://canvas.example/api/v1/courses?page=opaque-2>; rel="next"',
        },
      );
    }
    if (url.pathname.endsWith("/assignments")) {
      return json([
        {
          id: 11,
          name: "Assignment",
          description: null,
          due_at: null,
          points_possible: 20,
          submission_types: ["online_upload"],
          html_url: "https://canvas.example/courses/1/assignments/11",
          updated_at: NOW,
        },
      ]);
    }
    if (url.pathname.endsWith("/modules")) {
      return json([
        {
          id: 21,
          name: "Module",
          position: 1,
          workflow_state: "active",
          updated_at: NOW,
          items: [],
        },
      ]);
    }
    if (url.pathname === "/api/v1/announcements") return json([]);
    if (url.pathname === "/api/v1/calendar_events") return json([]);
    if (url.pathname.endsWith("/files")) {
      return json([
        {
          id: 31,
          display_name: "Lecture.md",
          filename: "lecture.md",
          "content-type": "text/plain",
          size: 12,
          url: "https://canvas.example/files/31/download",
          updated_at: NOW,
          modified_at: NOW,
          locked_for_user: false,
          hidden_for_user: false,
        },
      ]);
    }
    if (url.pathname === "/files/31/download") {
      return new Response("# Lecture\nKVL", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
    throw new Error(`Unexpected Canvas request ${url}`);
  };
  const connector = new CanvasConnector({
    baseUrl: "https://canvas.example",
    accessToken: "secret-token",
    fetcher,
    now: () => new Date(NOW),
  });
  assert.equal((await connector.connect()).displayName, "Canvas Student");
  assert.equal((await connector.listCourses()).length, 2);
  const sync = await connector.syncCourse("1");
  assert.equal(sync.assignments.length, 1);
  assert.equal(sync.modules.length, 1);
  assert.equal(sync.resources.length, 1);
  const file = await connector.downloadResource("31");
  assert.equal(new TextDecoder().decode(file.bytes), "# Lecture\nKVL");
  assert.ok(requests.every((request) => request.method === "GET"));
  assert.ok(
    requests.every((request) =>
      JSON.stringify(request.headers).includes("secret-token"),
    ),
  );
});

async function pptxFixture() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
  );
  zip.file(
    "ppt/slides/slide1.xml",
    '<p:sld xmlns:p="p" xmlns:a="a"><a:t>Kirchhoff &amp; Voltage</a:t><a:t>Loop rule</a:t></p:sld>',
  );
  zip.file(
    "ppt/slides/slide2.xml",
    '<p:sld xmlns:p="p" xmlns:a="a"><a:t>Worked example</a:t></p:sld>',
  );
  return zip.generateAsync({ type: "uint8array" });
}

test("PPTX pipeline preserves slide references and validates embeddings", async () => {
  const batches = [];
  const pipeline = new DocumentIngestionPipeline({
    embeddingProvider: {
      async embed(texts) {
        batches.push([...texts]);
        return texts.map((text) => [text.length, 1, 0]);
      },
    },
    embeddingVersion: "test-embedding-v1",
  });
  const result = await pipeline.process({
    fileName: "lecture.pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    bytes: await pptxFixture(),
    resourceId: "resource_pptx_1",
    courseId: "course_pptx_1",
    sourceUrl: "https://canvas.example/files/31",
  });
  assert.equal(result.document.metadata.totalSlides, 2);
  assert.deepEqual(
    result.chunks.map((chunk) => chunk.sourceReference.slide),
    [1, 2],
  );
  assert.ok(result.chunks.every((chunk) => chunk.embedding.length === 3));
  assert.equal(result.quality.status, "passed");
  assert.equal(batches.flat().length, 2);
  for (const chunk of result.chunks) {
    assert.equal(sourceReferenceSchema.safeParse(chunk.sourceReference).success, true);
  }
});

function pdfFixture(text) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(new TextEncoder().encode(output).byteLength);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = new TextEncoder().encode(output).byteLength;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}

test("PDF and text parsers create verifiable page or section locators", async () => {
  const pdf = await parseDocument({
    fileName: "lecture.pdf",
    mimeType: "application/pdf",
    bytes: pdfFixture("Kirchhoff voltage law"),
  });
  assert.equal(pdf.units[0].page, 1);
  assert.match(pdf.units[0].content, /Kirchhoff voltage law/);
  const textDocument = await parseDocument({
    fileName: "notes.md",
    mimeType: "text/plain",
    bytes: new TextEncoder().encode("# Definition\nVoltage is potential difference."),
  });
  assert.equal(textDocument.units[0].section, "Definition");
});

test("legacy binary PowerPoint is rejected with an actionable code", async () => {
  await assert.rejects(
    parseDocument({
      fileName: "legacy.ppt",
      mimeType: "application/vnd.ms-powerpoint",
      bytes: Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0]),
    }),
    (error) =>
      error instanceof IngestionError &&
      error.code === "LEGACY_POWERPOINT_REQUIRES_CONVERSION",
  );
});
