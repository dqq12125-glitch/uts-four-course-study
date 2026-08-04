import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/src/schema.ts",
  out: "./packages/database/migrations",
  dbCredentials: {
    url:
      process.env.POSTGRES_URL ??
      "postgresql://deepstudy:deepstudy@127.0.0.1:5432/deepstudy",
  },
  strict: true,
  verbose: true,
});
