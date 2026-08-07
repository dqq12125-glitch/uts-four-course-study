import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { D1DatabaseLike } from "@/src/repositories/types";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";

export function getD1(): D1DatabaseLike {
  const env = getRuntimeEnvironment();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Configure the `DB` binding before using database-backed routes.",
    );
  }

  return env.DB as D1DatabaseLike;
}

export function getDb() {
  return drizzle(getD1() as D1Database, { schema });
}
