export { createDb, createDbIfConfigured, type DbConfig, type DbInstance } from "./client";
export {
  insertEmailSend,
  listEmailSends,
  getEmailSend,
  clearEmailSends,
  insertTemplate,
  listTemplates,
  deleteTemplate,
  getTemplate,
  getAppState,
  upsertAppState,
} from "./queries";
export {
  emailSends,
  appState,
  templates,
  type InsertEmailSend,
  type EmailSend,
  type AppState,
  type InsertAppState,
  type Template,
  type InsertTemplate,
} from "./schema";
