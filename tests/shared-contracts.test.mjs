import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  apiErrorBodySchema,
  courseSchema,
  coursesResponseSchema,
  mobileExchangeResponseSchema,
  sourceReferenceSchema,
} from "@deepstudy/shared-types";
import {
  courseContractFixture,
  mobileExchangeContractFixture,
  sourceReferenceContractFixture,
} from "@deepstudy/testkit";
import {
  DeepStudyApi,
  DeepStudyApiError,
  buildApiUrl,
} from "../apps/mobile/src/api/client.ts";
import {
  localeFromAcceptLanguage,
  normalizePublicLocale,
  resolvePublicLocale,
} from "../src/lib/public-locale.ts";

test("public locale follows system preference until the user explicitly switches", () => {
  assert.equal(localeFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.7"), "zh-CN");
  assert.equal(localeFromAcceptLanguage("en-AU,en;q=0.9,zh;q=0.4"), "en");
  assert.equal(localeFromAcceptLanguage("en;q=0.7,zh-HK;q=0.9"), "zh-CN");
  assert.equal(localeFromAcceptLanguage("fr-FR,fr;q=0.9"), "en");
  assert.equal(resolvePublicLocale({
    cookieLocale: "en",
    acceptLanguage: "zh-CN,zh;q=0.9",
  }), "en");
  assert.equal(resolvePublicLocale({
    cookieLocale: "zh-CN",
    acceptLanguage: "en-AU,en;q=0.9",
  }), "zh-CN");
});

test("public locale rejects unsupported persisted values", () => {
  assert.equal(normalizePublicLocale("zh-CN"), "zh-CN");
  assert.equal(normalizePublicLocale("en"), "en");
  assert.equal(normalizePublicLocale("en-US"), null);
  assert.equal(normalizePublicLocale("javascript:alert(1)"), null);
  assert.equal(normalizePublicLocale(undefined), null);
});

test("personal workspace follows the system language and uses the quiet mobile shell", async () => {
  const [source, menuSource, styles] = await Promise.all([
    readFile(new URL("../app/personal/four-course-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/personal/personal-module-menu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/personal/personal-redesign.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /window\.navigator\.languages/);
  assert.match(source, /deepstudy_locale=/);
  assert.match(source, /className="app-shell personal-workspace"/);
  assert.match(source, /<select/);
  assert.doesNotMatch(source, /<p className="eyebrow">GUIDED MASTERY<\/p>/);
  assert.doesNotMatch(source, /<p className="eyebrow">ACTIVE RECALL<\/p>/);
  assert.match(menuSource, /PersonalNavigationIcon/);
  assert.match(styles, /\.personal-workspace \.bottom-nav/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
});

test("shared contracts accept the last released mobile response shapes", () => {
  assert.deepEqual(courseSchema.parse(courseContractFixture), courseContractFixture);
  assert.deepEqual(
    mobileExchangeResponseSchema.parse(mobileExchangeContractFixture),
    mobileExchangeContractFixture,
  );
  assert.deepEqual(
    coursesResponseSchema.parse({ courses: [courseContractFixture] }),
    { courses: [courseContractFixture] },
  );
});

test("source references enforce locators and ordered timestamps", () => {
  assert.deepEqual(
    sourceReferenceSchema.parse(sourceReferenceContractFixture),
    sourceReferenceContractFixture,
  );
  assert.equal(
    sourceReferenceSchema.safeParse({
      ...sourceReferenceContractFixture,
      timestampStart: 20,
      timestampEnd: 10,
    }).success,
    false,
  );
  assert.equal(
    sourceReferenceSchema.safeParse({
      resourceId: "resource_missing_locator",
      courseId: "course_missing_locator",
    }).success,
    false,
  );
});

test("mobile API inherits the shared transport without changing auth behavior", async () => {
  let receivedUrl = "";
  let receivedAuthorization = "";
  const api = new DeepStudyApi(
    "https://deepstudy.example/api/..",
    async (input, init) => {
      receivedUrl = String(input);
      receivedAuthorization = new Headers(init?.headers).get("Authorization") ?? "";
      return Response.json({ courses: [courseContractFixture] });
    },
  );
  api.setSessionToken("native-session-token");

  const response = await api.courses();

  assert.equal(receivedUrl, "https://deepstudy.example/api/courses");
  assert.equal(receivedAuthorization, "Bearer native-session-token");
  assert.deepEqual(response.courses, [courseContractFixture]);
  assert.equal(
    buildApiUrl("https://deepstudy.example/", "api/courses"),
    "https://deepstudy.example/api/courses",
  );
});

test("shared API error parsing preserves code, status, and request id", async () => {
  const payload = {
    error: {
      code: "COURSE_NOT_FOUND",
      message: "Course not found.",
      requestId: "req_contract_1",
    },
  };
  assert.deepEqual(apiErrorBodySchema.parse(payload), payload);

  const api = new DeepStudyApi("https://deepstudy.example", async () =>
    Response.json(payload, { status: 404 }),
  );
  api.setSessionToken("native-session-token");

  await assert.rejects(api.courses(), (error) => {
    assert.ok(error instanceof DeepStudyApiError);
    assert.equal(error.code, "COURSE_NOT_FOUND");
    assert.equal(error.status, 404);
    assert.equal(error.requestId, "req_contract_1");
    return true;
  });
});

test("shared success schemas reject contract drift before it reaches native UI", async () => {
  const api = new DeepStudyApi("https://deepstudy.example", async () =>
    Response.json({ courses: [{ id: "course_without_required_fields" }] }),
  );
  api.setSessionToken("native-session-token");
  await assert.rejects(api.courses(), (error) => {
    assert.ok(error instanceof DeepStudyApiError);
    assert.equal(error.code, "NETWORK_RESPONSE_INVALID");
    return true;
  });
});
