# Turso Setup Guide

## Step 1 — Create database

1. Go to https://turso.tech
2. Sign up / log in
3. Click **Create Database**
4. Name it `mailstudio` → pick closest region
5. Click **Create**

## Step 2 — Get credentials

In your database dashboard:
- Click **Connect**
- Copy **Database URL** → looks like `libsql://mailstudio-yourname.turso.io`
- Click **Generate Token** → copy the token

## Step 3 — Add to project

Create `.env` file in `artifacts/email-studio/`:

```bash
# From project root
echo "VITE_TURSO_DATABASE_URL=libsql://mailstudio-yourname.turso.io" > artifacts/email-studio/.env
echo "VITE_TURSO_AUTH_TOKEN=your-token-here" >> artifacts/email-studio/.env
```

Or open it manually:
```bash
nano artifacts/email-studio/.env
```

Paste:
```
VITE_TURSO_DATABASE_URL=libsql://mailstudio-yourname.turso.io
VITE_TURSO_AUTH_TOKEN=your-token-here
```

## Step 4 — Restart dev server

```bash
cd artifacts/email-studio
pnpm dev
```

## Step 5 — Verify it's connected

In the browser console you should NOT see any DB errors. The app will now:
- Save config to Turso instead of localStorage
- Save draft to Turso instead of localStorage  
- Write send history to Turso after every send

## What gets stored

| Key / Table | Data |
|---|---|
| `email-config-v1` (app_state table) | logo, domain, company name, address |
| `compose-draft-v1` (app_state table) | to, subject, message, CTA fields |
| `email_sends` table | id, createdAt, to, from, subject, status, resendId, error |

## Fallback behavior

If `.env` is missing or credentials are wrong → app silently falls back to localStorage.
No crash. No error shown to user. Everything still works.

## Turso free tier limits

- 500 databases
- 9GB storage
- 1 billion row reads/month
- More than enough for MailStudio
