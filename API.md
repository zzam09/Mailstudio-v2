```markdown
# MailStudio API — How to Send Emails from Any App

## Your Worker URL
https://resend-worker.actionszam.workers.dev

---

## Endpoint 1 — Direct Email
Send a raw HTML email directly.

**POST** `/send`

```json
{
  "from": "noreply@spacexhqvip.com",
  "to": "recipient@gmail.com",
  "subject": "Your subject here",
  "html": "<p>Your email body</p>"
}
```

---

## Endpoint 2 — Template Email
Send a saved template by ID with dynamic fields filled automatically.
Branding, logo, and sending domain come from your MailStudio config automatically.

**POST** `/send-template`

```json
{
  "templateId": "YOUR-TEMPLATE-ID-HERE",
  "to": "recipient@gmail.com",
  "subject": "Optional subject — uses template name if empty",
  "fields": {
    "name": "John",
    "company": "Acme Inc",
    "reset_link": "https://yourapp.com/reset?token=xyz"
  }
}
```

**Response:**
```json
{ "success": true, "data": { "id": "re_xxxxxxxxx" } }
```

---

## How to Get a Template ID

1. Open MailStudio
2. Go to **Templates** → **Create template**
3. Write your Markdown content using `{{field}}` placeholders
4. Click **Save template**
5. Copy the ID shown after saving

---

## Dynamic Fields

Use `{{field_name}}` anywhere in your template content.

**Template content:**
```
Hello {{name}},

Your account at {{company}} is ready.
Click here to get started: {{link}}
```

**Send request fields:**
```json
{
  "fields": {
    "name": "John",
    "company": "Acme Inc",
    "link": "https://yourapp.com/start"
  }
}
```

---

## Code Examples

### JavaScript / Node.js
```javascript
await fetch("https://resend-worker.actionszam.workers.dev/send-template", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    templateId: "YOUR-TEMPLATE-ID",
    to: "user@gmail.com",
    subject: "Welcome",
    fields: { name: "John" }
  })
});
```

### Python
```python
import requests

requests.post(
  "https://resend-worker.actionszam.workers.dev/send-template",
  json={
    "templateId": "YOUR-TEMPLATE-ID",
    "to": "user@gmail.com",
    "subject": "Welcome",
    "fields": { "name": "John" }
  }
)
```

### PHP
```php
file_get_contents(
  "https://resend-worker.actionszam.workers.dev/send-template",
  false,
  stream_context_create([
    "http" => [
      "method" => "POST",
      "header" => "Content-Type: application/json",
      "content" => json_encode([
        "templateId" => "YOUR-TEMPLATE-ID",
        "to" => "user@gmail.com",
        "subject" => "Welcome",
        "fields" => ["name" => "John"]
      ])
    ]
  ])
);
```

### PowerShell (Windows)
```powershell
$body = '{"templateId":"YOUR-TEMPLATE-ID","to":"user@gmail.com","subject":"Welcome","fields":{"name":"John"}}' 
Invoke-RestMethod -Uri 'https://resend-worker.actionszam.workers.dev/send-template' -Method POST -ContentType 'application/json' -Body $body
```

### cURL
```bash
curl -X POST https://resend-worker.actionszam.workers.dev/send-template \
  -H "Content-Type: application/json" \
  -d '{"templateId":"YOUR-TEMPLATE-ID","to":"user@gmail.com","subject":"Welcome","fields":{"name":"John"}}'
```

---

## Common Use Cases

| Use case | Template fields needed |
|---|---|
| Welcome email | `name` |
| Password reset | `name`, `reset_link` |
| Order confirmation | `name`, `order_id`, `amount` |
| Invoice | `name`, `invoice_id`, `amount`, `due_date` |
| Appointment reminder | `name`, `date`, `time`, `location` |

---

## Notes

- `fields` is optional — skip it if your template has no `{{placeholders}}`
- `subject` is optional — falls back to the template name
- Branding, logo, and footer come from your MailStudio config automatically
- No API key needed — the worker handles everything
```

Save this to your project:

```bash
cd ~/Mailstudio-v2/Mailstudio-v
nano API.md
```

Paste it, save, push:

```bash
git add API.md && git commit -m "add api usage doc" && git push
```
