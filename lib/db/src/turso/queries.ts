import { desc, eq } from "drizzle-orm";
import { appState, emailSends, templates, type AppState, type InsertAppState, type InsertEmailSend, type EmailSend, type InsertTemplate, type Template } from "./schema";
import type { DbInstance } from "./client";

// These queries stay thin so persistence.ts can handle DB availability and fallback behavior.

export async function insertEmailSend(
  db: DbInstance,
  data: InsertEmailSend
): Promise<void> {
  await db.insert(emailSends).values(data);
}

export async function listEmailSends(
  db: DbInstance,
  limit = 50
): Promise<EmailSend[]> {
  return db
    .select()
    .from(emailSends)
    .orderBy(desc(emailSends.createdAt))
    .limit(limit);
}

export async function getEmailSend(
  db: DbInstance,
  id: string
): Promise<EmailSend | undefined> {
  const rows = await db
    .select()
    .from(emailSends)
    .where(eq(emailSends.id, id))
    .limit(1);
  return rows[0];
}

export async function clearEmailSends(db: DbInstance): Promise<void> {
  await db.delete(emailSends);
}

export async function insertTemplate(
  db: DbInstance,
  data: InsertTemplate
): Promise<void> {
  await db.insert(templates).values(data);
}

export async function listTemplates(db: DbInstance): Promise<Template[]> {
  return db
    .select()
    .from(templates)
    .orderBy(desc(templates.createdAt));
}

export async function deleteTemplate(db: DbInstance, id: string): Promise<void> {
  await db.delete(templates).where(eq(templates.id, id));
}

export async function getTemplate(
  db: DbInstance,
  id: string
): Promise<Template | undefined> {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);
  return rows[0];
}

export async function getAppState(
  db: DbInstance,
  key: string
): Promise<AppState | undefined> {
  const rows = await db
    .select()
    .from(appState)
    .where(eq(appState.key, key))
    .limit(1);
  return rows[0];
}

export async function upsertAppState(
  db: DbInstance,
  data: InsertAppState
): Promise<void> {
  await db
    .insert(appState)
    .values(data)
    .onConflictDoUpdate({
      target: appState.key,
      set: {
        value: data.value,
        updatedAt: data.updatedAt,
      },
    });
}
