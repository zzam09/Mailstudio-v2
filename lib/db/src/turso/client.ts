import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export interface DbConfig {
  /** libsql://your-db.turso.io or file://... — the app will fall back gracefully when unavailable */
  url: string;
  /** Optional auth token for remote LibSQL providers */
  authToken?: string;
}

function normalizeUrl(url: string) {
  return url.trim();
}

function isSupportedDbUrl(url: string) {
  const normalized = normalizeUrl(url);
  return (
    normalized.startsWith("libsql://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("ws://") ||
    normalized.startsWith("wss://") ||
    normalized.startsWith("file://")
  );
}

/**
 * Creates a Drizzle + LibSQL client configured for Turso or another LibSQL-compatible endpoint.
 * The browser client expects a remote URL, so invalid or unavailable configs are handled by callers.
 */
export function createDb(config: DbConfig) {
  const libsqlClient = createClient({
    url: normalizeUrl(config.url),
    authToken: config.authToken,
  });

  const db = drizzle(libsqlClient, { schema });

  const ensureSchema = async () => {
    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS email_sends (
        id          TEXT    PRIMARY KEY,
        created_at  INTEGER NOT NULL,
        to_address  TEXT    NOT NULL,
        from_address TEXT   NOT NULL,
        subject     TEXT    NOT NULL,
        status      TEXT    NOT NULL,
        resend_id   TEXT,
        error       TEXT
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        key         TEXT PRIMARY KEY,
        value       TEXT NOT NULL,
        updated_at  INTEGER NOT NULL
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS templates (
        id          TEXT    PRIMARY KEY,
        name        TEXT    NOT NULL,
        content     TEXT    NOT NULL,
        guide       TEXT    NOT NULL,
        created_at  INTEGER NOT NULL
      )
    `);

    try {
      const info = await libsqlClient.execute("PRAGMA table_info(templates)");
      const hasGuide = Array.isArray((info as { rows?: Array<{ name?: string }> }).rows)
        ? (info.rows as Array<{ name?: string }>).some((row) => row.name === "guide")
        : false;

      if (!hasGuide) {
        await libsqlClient.execute("ALTER TABLE templates ADD COLUMN guide TEXT NOT NULL DEFAULT ''");
      }
    } catch {
      // Older SQLite builds or already-migrated tables will be handled by the preserved schema.
    }
  };

  return { db, libsqlClient, ensureSchema };
}

/** Returns null when the URL is missing or the adapter cannot be initialized. */
export function createDbIfConfigured(config: Partial<DbConfig>) {
  const url = config.url?.trim();
  if (!url || !isSupportedDbUrl(url)) return null;

  try {
    return createDb({ url, authToken: config.authToken });
  } catch {
    return null;
  }
}

export type DbInstance = ReturnType<typeof createDb>["db"];
