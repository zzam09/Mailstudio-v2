import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const emailSends = sqliteTable("email_sends", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  toAddress: text("to_address").notNull(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject").notNull(),
  status: text("status", { enum: ["sent", "failed"] }).notNull(),
  resendId: text("resend_id"),
  error: text("error"),
});

export const appState = sqliteTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  guide: text("guide").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type InsertEmailSend = typeof emailSends.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
export type AppState = typeof appState.$inferSelect;
export type InsertAppState = typeof appState.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;
