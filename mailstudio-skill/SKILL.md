---
name: mailstudio-v2
description: >
  Full agentic skill for MailStudio-v2 — a React/TypeScript email composer PWA with Turso DB,
  Resend API, and a Cloudflare Worker backend. Use this skill whenever the user asks to fix a bug,
  add a feature, debug an error, update the worker, connect Turso, modify a component, change
  the email template, update persistence, or do anything else in this project. Also use it when
  the user pastes an error from this project, asks "why is X broken", or says "in my email app".
  Always load this skill before touching any MailStudio code.
---

# MailStudio-v2 Agentic Skill

## Project Identity

- **Owner:** Newton (beginner, non-developer, works from Linux terminal / mobile)
- **Style:** SpaceX/Apple — dark themes, gold accents, authoritative minimalism
- **Sending domain:** `noreply@spacexhqvip.com`
- **Personal email:** `actionszam@gmail.com`
- **Output rule:** Always give copy-paste-ready code. No theory. Fix the exact file.

---

## Absolute Paths (never guess these)

```
Project root:     /home/zam/Mailstudio-v2/Mailstudio-v/
Main app:         /home/zam/Mailstudio-v2/Mailstudio-v/artifacts/email-studio/
Source:           /home/zam/Mailstudio-v2/Mailstudio-v/artifacts/email-studio/src/
Shared DB lib:    /home/zam/Mailstudio-v2/Mailstudio-v/lib/db/src/
Worker project:   C:\Users\Admin\resend-worker\ (separate Windows machine)
Worker live URL:  https://resend-worker.actionszam.workers.dev/send
```

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | |
| Build | Vite | dev server at localhost:5173 |
| Routing | Wouter | `<Route>`, `<Switch>`, `<Link>` |
| Styling | Tailwind CSS + shadcn/ui | components at `@/components/ui/` |
| DB | Turso (LibSQL) via Drizzle ORM | optional — falls back to localStorage |
| Email sending | Resend API | via Cloudflare Worker |
| Worker | Cloudflare Worker | deployed, CORS-enabled |
| Markdown | marked.js | used in compose → HTML conversion |
| Toasts | Sonner | `toast.success()`, `toast.error()` |
| Package manager | pnpm workspaces | never use npm or yarn |

---

## Key File Map

```
src/App.tsx                              — root component, all state, send logic
src/lib/db.ts                            — Turso client init, getDb()
src/lib/email-config.ts                  — EmailConfig interface + defaultConfig
src/lib/email-template.ts               — generateEmailHtml() 
src/lib/email-templates.ts              — 6 preset templates
src/lib/persistence.ts                  — save/load config+draft (Turso or localStorage)
src/lib/url-params.ts                   — deep-link URL param parsing
src/lib/utils.ts                        — cn() tailwind helper
src/components/email-editor/
  ComposePanel.tsx                      — compose form
  ConfigPanel.tsx                       — settings (logo, domain, company)
  PreviewPanel.tsx                      — live email preview
  SendHistory.tsx                       — past sends from Turso
src/pages/docs.tsx                      — docs route
lib/db/src/turso/
  client.ts                             — createDbIfConfigured()
  queries.ts                            — getAppState(), upsertAppState(), insertEmailSend()
  schema.ts                             — Drizzle schema
```

---

## Core Interfaces

```typescript
// email-config.ts
interface EmailConfig {
  logoUrl: string;
  sendingDomain: string;
  companyName: string;
  companyAddress: string;
}

// App.tsx
interface ComposeState {
  to: string;
  subject: string;
  message: string;
  ctaEnabled: boolean;
  ctaLabel: string;
  ctaUrl: string;
}
```

---

## Import Rules (CRITICAL — never get these wrong)

```typescript
// Workspace shared DB — always this path
import { insertEmailSend, getAppState, upsertAppState } from "@workspace/db/turso";
import { createDbIfConfigured, type DbInstance } from "@workspace/db/turso";

// App-internal alias — maps to artifacts/email-studio/src/
import { something } from "@/lib/something";
import { Button } from "@/components/ui/button";

// Types from App.tsx
import type { ComposeState } from "@/App";
```

---

## Cloudflare Worker Schema

**Endpoint:** `POST https://resend-worker.actionszam.workers.dev/send`

```typescript
// Request
{
  from: string;        // must be verified Resend domain
  to: string | string[];
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
  reply_to?: string;
}

// Success response
{ success: true, data: { id: string } }

// Error response
{ error: string | object }
```

Worker has CORS enabled for all origins. Handles `OPTIONS` preflight.

---

## Turso DB Setup

**Env vars** (in `artifacts/email-studio/.env`):
```
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-token
```

**What gets stored:**

| Key | Contents |
|---|---|
| `email-config-v1` | EmailConfig JSON |
| `compose-draft-v1` | ComposeState JSON |
| send_history table | every send attempt via insertEmailSend() |

**Fallback:** If env vars are missing → everything uses `localStorage`. App works fine either way.

---

## Persistence Flow

```
App load
  → loadPersistedConfig(defaultConfig)   reads Turso → falls back to localStorage
  → loadPersistedDraft(defaultCompose)   reads Turso → falls back to localStorage

User changes compose
  → savePersistedDraft(compose)          auto-saves on every change

User clicks Save Config
  → savePersistedConfig(config)          saves to Turso or localStorage

After every send attempt
  → insertEmailSend(db, {...})           writes to Turso send history
```

---

## Decision Tree: Fix Any Error

```
Error received
│
├── "Cannot find module" / "does not provide export named X"
│     → Check the actual file's exports
│     → Fix the import to match what's actually exported
│     → See KNOWN BUGS section for common ones
│
├── CORS error (Access-Control-Allow-Origin)
│     → Worker needs corsHeaders + OPTIONS handler
│     → See references/worker.md for full fixed worker code
│
├── "write EOF" in wrangler dev
│     → Skip local dev, deploy directly: npx wrangler deploy
│
├── Turso / DB error
│     → Check .env has VITE_TURSO_DATABASE_URL + VITE_TURSO_AUTH_TOKEN
│     → App works without it (falls back to localStorage)
│
├── Type error in persistence.ts or db.ts
│     → Always import from @workspace/db/turso, not relative paths
│
└── Vite hot reload failed / SyntaxError
      → Check the file on the line number mentioned
      → Usually a bad import or missing export
```

---

## Decision Tree: Add a Feature

```
New feature request
│
├── New email template
│     → Edit src/lib/email-templates.ts
│     → Add to EMAIL_TEMPLATES array
│     → Follow existing template shape
│
├── New compose field
│     → Add to ComposeState interface in App.tsx
│     → Add to defaultCompose in App.tsx
│     → Update ComposePanel.tsx UI
│     → Update generateEmailHtml() in email-template.ts
│
├── New config field
│     → Add to EmailConfig interface in email-config.ts
│     → Add to defaultConfig in email-config.ts
│     → Update ConfigPanel.tsx UI
│     → Update persistence.ts load/save functions
│
├── New DB table / query
│     → Edit lib/db/src/turso/schema.ts (add table)
│     → Edit lib/db/src/turso/queries.ts (add function)
│     → Export from lib/db/src/turso/index.ts
│     → Import in app via @workspace/db/turso
│
└── Extend the worker
      → Edit C:\Users\Admin\resend-worker\src\index.js
      → Run: npx wrangler deploy
      → See references/worker.md
```

---

## Known Bugs & Fixes

| Bug | Cause | Fix |
|---|---|---|
| `loadConfig` not found in email-config.ts | Wrong export name | Use `defaultConfig` instead |
| `loadPersistedConfig` import error | File path wrong | Import from `@/lib/persistence` |
| Worker CORS blocked | Missing headers | Add corsHeaders + OPTIONS block |
| `wrangler dev` write EOF on Windows | Known wrangler 4.x Windows bug | Use `npx wrangler deploy` instead |
| `Deno.env.get()` in worker | Wrong runtime | Use `env.RESEND_API_KEY` |
| pnpm install fails | Wrong package manager | Always use pnpm, never npm/yarn |

---

## Dev Commands

```bash
# Always run from artifacts/email-studio/
pnpm dev          # localhost:5173
pnpm build
pnpm typecheck

# Worker (Windows PowerShell)
npx wrangler deploy
npx wrangler tail   # live logs

# Test worker
$body = '{"from":"noreply@spacexhqvip.com","to":"actionszam@gmail.com","subject":"Test","html":"<p>Hello</p>"}' ; Invoke-RestMethod -Uri 'https://resend-worker.actionszam.workers.dev/send' -Method POST -ContentType 'application/json' -Body $body
```

---

## Email Template Variables

Supported in message content:
- `{{year}}` → current year
- `{{company_name}}` → EmailConfig.companyName
- `{{company_address}}` → EmailConfig.companyAddress

---

## Built-in Templates

`welcome`, `announcement`, `newsletter`, `password-reset`, `invoice`, `blank`

Deep-link: `/?template=welcome&to=user@example.com`

---

## Reference Files

- `references/worker.md` — Full Cloudflare Worker code (CORS-ready)
- `references/turso-setup.md` — Step-by-step Turso connection guide
- `references/schema.md` — Full DB schema and query signatures
