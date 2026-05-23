---
name: schema
description: # DB Schema & Query Reference

## Schema Location
`lib/db/src/turso/schema.ts`

## Tables

### app_state
Stores key-value pairs for config and draft persistence.

```typescript
{
  key: string;       // PRIMARY KEY — e.g. "email-config-v1"
  value: string;     // JSON stringified data
  updatedAt: Date;
}
```

### email_sends
One row per send attempt (success or failure).

```typescript
{
  id: string;          // crypto.randomUUID()
  createdAt: Date;
  toAddress: string;
  fromAddress: string;
  subject: string;
  status: "sent" | "failed";
  resendId: string | null;   // Resend message ID on success
  error: string | null;      // Error message on failure
}
```

---

## Query Signatures

All exported from `@workspace/db/turso`

```typescript
// Get a key-value entry
getAppState(db: DbInstance, key: string): Promise<{ key: string; value: string; updatedAt: Date } | null>

// Create or update a key-value entry
upsertAppState(db: DbInstance, data: {
  key: string;
  value: string;
  updatedAt: Date;
}): Promise<void>

// Insert a send history record
insertEmailSend(db: DbInstance, data: {
  id: string;
  createdAt: Date;
  toAddress: string;
  fromAddress: string;
  subject: string;
  status: "sent" | "failed";
  resendId: string | null;
  error: string | null;
}): Promise<void>

// Get DB instance (initializes schema on first call)
getDb(): Promise<DbInstance | null>

// Create DB if env vars are set
createDbIfConfigured(opts: {
  url?: string;
  authToken?: string;
}): DbInstance | null
```

---

## Usage Pattern in App

```typescript
import { getDb } from "@/lib/db";
import { insertEmailSend } from "@workspace/db/turso";

// Always check for null — DB might not be configured
const db = await getDb();
if (!db) return; // silently skip if no DB

await insertEmailSend(db, {
  id: crypto.randomUUID(),
  createdAt: new Date(),
  toAddress: to,
  fromAddress: from,
  subject: compose.subject,
  status: "sent",
  resendId: data.id ?? null,
  error: null,
});
```