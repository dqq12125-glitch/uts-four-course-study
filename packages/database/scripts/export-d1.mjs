import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildMigrationManifest,
  legacyTableNames,
} from "../src/migration-manifest.ts";

function argumentsByName(values) {
  return Object.fromEntries(
    values
      .filter((value) => value.startsWith("--"))
      .map((value) => {
        const [name, ...rest] = value.slice(2).split("=");
        return [name, rest.length ? rest.join("=") : true];
      }),
  );
}

function execute(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`Wrangler D1 export failed with code ${code}: ${stderr.trim()}`));
    });
  });
}

function unwrapRows(value, table) {
  const executions = Array.isArray(value) ? value : [value];
  const result = executions.find(
    (entry) => entry && typeof entry === "object" && Array.isArray(entry.results),
  );
  if (!result || result.success === false) {
    throw new Error(`D1 returned an invalid result for ${table}.`);
  }
  return result.results
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .sort((left, right) =>
      String(left.id ?? left.key ?? "").localeCompare(
        String(right.id ?? right.key ?? ""),
      ),
    );
}

const args = argumentsByName(process.argv.slice(2));
if (args.help) {
  process.stdout.write(
    "Usage: npm run db:export:d1 -- --database=DB --output=./snapshot.json (--local|--remote) [--config=wrangler.jsonc]\n",
  );
  process.exit(0);
}
if (typeof args.database !== "string" || typeof args.output !== "string") {
  throw new Error("--database and --output are required.");
}
if (Boolean(args.local) === Boolean(args.remote)) {
  throw new Error("Choose exactly one of --local or --remote.");
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const exports = [];
for (const table of legacyTableNames) {
  const wranglerArguments = [
    "wrangler",
    "d1",
    "execute",
    args.database,
    args.local ? "--local" : "--remote",
    "--json",
    "--command",
    `SELECT * FROM "${table}"`,
  ];
  if (typeof args.config === "string") {
    wranglerArguments.push("--config", args.config);
  }
  const stdout = await execute(npx, wranglerArguments);
  exports.push({ table, rows: unwrapRows(JSON.parse(stdout), table) });
}

const exportedAt = new Date().toISOString();
const manifest = await buildMigrationManifest(exports, exportedAt);
const snapshot = { version: 1, exportedAt, manifest, tables: exports };
const output = resolve(args.output);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx",
});
process.stdout.write(
  `Exported ${manifest.totalRows} rows from ${manifest.tables.length} tables to ${output}.\n`,
);
