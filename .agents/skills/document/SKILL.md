---
name: document
description: # MailStudio-v2 — Project Skill Doc
> Paste this at the top of any AI chat to get instant context. No re-explaining needed.

---

## What This Project Is

A React/TypeScript **email composer PWA** called **MailStudio**. It lets the user compose, preview, and send branded emails via a Cloudflare Worker that calls the Resend API. Send history is persisted to **Turso (LibSQL)** via Drizzle ORM. The app lives inside a pnpm monorepo.

---

## Owner Context

- Name: Newton (non-developer, beginner, works from mobile/Linux terminal)
- Style preference: SpaceX/Apple aesthetic — dark themes, gold accents, authoritative minimalism
- Sending domain: `noreply@spacexhqvip.com`
- Personal email: `actionszam@gmail.com`
- Prefers: copy-paste-ready code, minimal explanation, practical fixes only

---

## Monorepo Structure

```
/home/zam/Mailstudio-v2/Mailstudio-v/
├── package.json                          # pnpm workspace root
├── pnpm-workspace.yaml
├── artifacts/
│   └── email-studio/                     # ← MAIN APP lives here
│       ├── src/
│       │   ├── App.tsx                   # Root component + all state
│       │   ├── main.tsx
│       │   ├── index.css
│       │   ├── components/
│       │   │   └── email-editor/
│       │   │       ├── ComposePanel.tsx
│       │   │       ├── ConfigPanel.tsx
│       │   │       ├── PreviewPanel.tsx
│       │   │       └── SendHistory.tsx
│       │   ├── lib/
│       │   │   ├── db.ts                 # Turso client init
│       │   │   ├── email-config.ts       # EmailConfig interface + defaultConfig
│       │   │   ├── email-template.ts     # generateEmailHtml() function
│       │   │   ├── email-templates.ts    # 6 preset templates
│       │   │   ├── persistence.ts        # save/load config+draft (Turso or localStorage)
│       │   │   ├── url-params.ts         # deep-link URL param parsing
│       │   │   └── utils.ts              # cn() tailwind helper
│       │   └── pages/
│       │       ├── docs.tsx
│       │       └── not-found.tsx
│       ├── vite.config.ts
│       ├── wrangler.toml
│       └── package.json
└── lib/
    └── db/                               # Shared DB package
        └── src/
            ├── schema/index.ts
            └── turso/
                ├── client.ts             # createDbIfConfigured()
                ├── index.ts              # exports
                ├── queries.ts            # getAppState(), upsertAppState(), insertEmailSend()
                └── schema.ts            # Drizzle schema
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | Wouter |
| Styling | Tailwind CSS + shadcn/ui |
| DB | Turso (LibSQL) via Drizzle ORM |
| Email sending | Resend API |
| Worker | Cloudflare Worker (deployed) |
| Markdown | marked.js |
| Toasts | Sonner |
| Package manager | pnpm (workspaces) |

---

## Key Interfaces

```typescript
// src/lib/email-config.ts
interface EmailConfig {
  logoUrl: string;
  sendingDomain: string;
  companyName: string;
  companyAddress: string;
}

// src/App.tsx
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

## Cloudflare Worker

- **Live URL:** `https://resend-worker.actionszam.workers.dev/send`
- **Method:** POST
- **Location:** separate project at `C:\Users\Admin\resend-worker\` (Windows)
- **Secret:** `RESEND_API_KEY` set via `wrangler secret put`

**Request schema:**
```json
{
  "from": "noreply@spacexhqvip.com",
  "to": "recipient@gmail.com",
  "subject": "Subject here",
  "html": "<p>Body here</p>"
}
```

**Response:**
```json
{ "success": true, "data": { "id": "re_xxxxxxxxx" } }
```

---

## Database (Turso)

**Env vars needed** (in `.env` at `artifacts/email-studio/`):
```
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-token
```

**What gets persisted:**
- `email-config-v1` → EmailConfig (logo, domain, company name, address)
- `compose-draft-v1` → ComposeState (to, subject, message, cta fields)
- Email send history → `insertEmailSend()` called after every send attempt

**Fallback:** If Turso is not configured, everything falls back to `localStorage`. App works fine without it.

---

## Workspace Imports

The app uses workspace aliases — always import shared DB functions like this:
```typescript
import { insertEmailSend, getAppState, upsertAppState } from "@workspace/db/turso";
import { createDbIfConfigured } from "@workspace/db/turso";
```

App-internal alias:
```typescript
import { something } from "@/lib/something"; // maps to artifacts/email-studio/src/
```

---

## Persistence Flow

1. On app load → `loadPersistedConfig()` + `loadPersistedDraft()` from Turso (or localStorage)
2. On every compose change → `savePersistedDraft()` auto-saves
3. On config save button → `savePersistedConfig()` saves to Turso (or localStorage)
4. After every send → `insertEmailSend()` writes to Turso send history table

---

## Known Issues / History

- `persistence.ts` imports `loadConfig` — this does NOT exist. Correct exports are `loadPersistedConfig`, `loadPersistedDraft`, `savePersistedConfig`, `savePersistedDraft`
- Worker had CORS issues — fixed by adding `corsHeaders` and handling `OPTIONS` preflight
- App path is `artifacts/email-studio/src/` NOT root `src/` — common mistake
- Run commands from inside `artifacts/email-studio/` not the monorepo root

---

## Dev Commands

```bash
# From artifacts/email-studio/
pnpm dev          # start dev server at localhost:5173
pnpm build        # production build
pnpm typecheck    # type check

# From monorepo root
pnpm build        # builds everything
```

---

## Email Template Variables

Templates support these placeholders:
- `{{year}}` — current year
- `{{company_name}}` — from EmailConfig.companyName
- `{{company_address}}` — from EmailConfig.companyAddress

---

## 6 Built-in Templates

`welcome`, `announcement`, `newsletter`, `password-reset`, `invoice`, `blank`

Load via URL: `/?template=welcome&to=user@example.com`
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

Define the functionality provided by this skill, including detailed instructions and examples