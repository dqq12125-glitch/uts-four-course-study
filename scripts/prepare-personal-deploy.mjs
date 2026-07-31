import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const configUrl = new URL("../dist/server/wrangler.json", import.meta.url);
const configPath = fileURLToPath(configUrl);
const config = JSON.parse(await readFile(configPath, "utf8"));

config.d1_databases = [];
config.triggers = {};
config.vars = {
  ...(config.vars ?? {}),
  PERSONAL_DEPLOYMENT: "true",
};

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
