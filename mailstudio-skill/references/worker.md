# Cloudflare Worker — Full Code Reference

## Live URL
`https://resend-worker.actionszam.workers.dev/send`

## Full Worker Code (CORS-ready, production)

```javascript
// src/index.js
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/send" || request.method !== "POST") {
      return new Response("Worker ready.", { status: 200, headers: corsHeaders });
    }

    const { from, to, subject, html } = await request.json();
    const resend = new Resend(env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: from || "noreply@spacexhqvip.com",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};
```

## wrangler.toml

```toml
name = "resend-worker"
main = "src/index.js"
compatibility_date = "2025-05-01"
compatibility_flags = ["nodejs_compat"]
```

## Deploy Commands (Windows PowerShell)

```powershell
# Set secret
npx wrangler secret put RESEND_API_KEY

# Deploy
npx wrangler deploy

# Watch live logs
npx wrangler tail

# Test
$body = '{"from":"noreply@spacexhqvip.com","to":"actionszam@gmail.com","subject":"Test","html":"<p>Hello</p>"}' ; Invoke-RestMethod -Uri 'https://resend-worker.actionszam.workers.dev/send' -Method POST -ContentType 'application/json' -Body $body
```

## Update worker file (PowerShell one-liner)

```powershell
# Edit file
notepad src\index.js

# Then redeploy
npx wrangler deploy
```
