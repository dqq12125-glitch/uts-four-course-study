import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("native release config has stable identifiers, icons, and verified-link declarations", async () => {
  const [appJson, easJson, icon] = await Promise.all([
    readFile(new URL("../app.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../eas.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../assets/icon.png", import.meta.url)),
  ]);
  assert.equal(appJson.expo.ios.bundleIdentifier, "com.deepstudy.student");
  assert.equal(appJson.expo.android.package, "com.deepstudy.student");
  assert.equal(appJson.expo.scheme, "deepstudy");
  assert.match(
    appJson.expo.ios.associatedDomains[0],
    /^applinks:/,
  );
  assert.equal(
    appJson.expo.android.intentFilters[0].data[0].pathPrefix,
    "/auth/callback",
  );
  assert.equal(appJson.expo.icon, "./assets/icon.png");
  assert.ok(
    appJson.expo.plugins.some(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker",
    ),
  );
  assert.ok(icon.byteLength > 10_000);
  assert.deepEqual([...icon.subarray(0, 8)], [
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  assert.equal(easJson.build.production.autoIncrement, true);
  assert.deepEqual(easJson.submit.production, {});
});
