/**
 * Turso / LibSQL database client for Email Composer Studio.
 *
 * Set these in a .env file or your shell environment for local dev:
 *   VITE_TURSO_DATABASE_URL  — e.g. libsql://your-db.turso.io
 *   VITE_TURSO_AUTH_TOKEN    — Turso auth token
 *
 * When the URL is missing or the adapter cannot connect, the app falls back
 * to localStorage and continues normally.
 */

import { createDbIfConfigured, type DbInstance } from "@workspace/db/turso";

const url = import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined;

let instance = createDbIfConfigured({ url, authToken });
let ready = false;

export const isUsingTurso = instance !== null;

/**
 * Returns the Drizzle db instance, or null when the DB is not configured
 * or cannot be initialized. Callers must fall back gracefully.
 */
export async function getDb(): Promise<DbInstance | null> {
  if (!instance) return null;

  if (!ready) {
    try {
      await instance.ensureSchema();
      ready = true;
    } catch {
      instance = null;
      ready = false;
      return null;
    }
  }

  return instance.db;
}
