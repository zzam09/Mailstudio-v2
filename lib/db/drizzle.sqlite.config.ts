import { defineConfig } from "drizzle-kit";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL must be set.\n" +
    "Export it before running: export TURSO_DATABASE_URL=libsql://your-db.turso.io"
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/turso/schema.ts"),
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
  out: "./drizzle/sqlite",
});
