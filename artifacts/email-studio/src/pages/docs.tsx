import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "") || "";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Param({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{name}</code>
        <Badge variant="secondary" className="text-xs font-normal">
          {type}
        </Badge>
        {required && (
          <Badge variant="destructive" className="text-xs font-normal">
            required
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function DocsPage() {
  const origin = typeof window !== "undefined" ? window.location.origin + BASE : "https://your-domain.com";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Documentation</h1>
            <p className="text-xs text-muted-foreground">Email Composer Studio</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        {/* Intro */}
        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Email Composer Studio</h2>
          <p className="text-muted-foreground">
            A standalone email composition tool. Write in Markdown, preview live, and send via{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              Resend <ExternalLink className="h-3 w-3" />
            </a>
            . You can also deep-link from your own app to pre-fill the composer automatically.
          </p>
        </section>

        {/* URL params */}
        <section>
          <h3 className="mb-1 text-lg font-semibold">URL Parameters</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Append these to the composer URL to pre-fill fields automatically. Any parameter
            can be combined with a <code className="text-xs">template</code> — individual params
            always override template defaults.
          </p>

          <Card className="mb-4">
            <CardContent className="pt-2 pb-0">
              <Param
                name="template"
                type="string"
                description="Load a named template first. Valid values: welcome, announcement, newsletter, password-reset, invoice, blank."
              />
              <Param
                name="to"
                type="string"
                description="Pre-fill the recipient email address."
              />
              <Param
                name="subject"
                type="string"
                description="Pre-fill the email subject line."
              />
              <Param
                name="message"
                type="string"
                description="Pre-fill the message body. Supports Markdown. Remember to URL-encode the value."
              />
              <Param
                name="ctaEnabled"
                type="boolean"
                description='Show the CTA button section. Set to "true" to enable.'
              />
              <Param
                name="ctaLabel"
                type="string"
                description="Label text for the CTA button."
              />
              <Param
                name="ctaUrl"
                type="string"
                description="Destination URL for the CTA button."
              />
            </CardContent>
          </Card>

          <h4 className="mb-2 text-sm font-semibold">Examples</h4>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Load the welcome template:</p>
              <CodeBlock>{`${origin}/?template=welcome`}</CodeBlock>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Load a template and override the recipient:
              </p>
              <CodeBlock>{`${origin}/?template=welcome&to=user@example.com`}</CodeBlock>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Fully custom — no template needed:
              </p>
              <CodeBlock>{`${origin}/?to=user@example.com&subject=Hello%20World&message=**Hi%20there**%2C%20welcome!&ctaEnabled=true&ctaLabel=Get%20started&ctaUrl=https%3A%2F%2Fyourdomain.com`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Using from your app */}
        <section>
          <h3 className="mb-1 text-lg font-semibold">Using from Your App</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Link to the composer from anywhere — a button, an admin panel, a Slack command, or a
            script. The composer opens with everything pre-filled and ready to review before
            sending.
          </p>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm font-medium">React / TypeScript</p>
              <CodeBlock>{`function EmailUserButton({ userEmail }: { userEmail: string }) {
  const params = new URLSearchParams({
    template: "welcome",
    to: userEmail,
  });

  return (
    <a
      href={\`${origin}/?\${params}\`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Send welcome email
    </a>
  );
}`}</CodeBlock>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Plain JavaScript</p>
              <CodeBlock>{`function openComposer({ to, subject, message }) {
  const params = new URLSearchParams({ to, subject, message });
  window.open(\`${origin}/?\${params}\`, "_blank");
}`}</CodeBlock>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Python (e.g. Django / Flask admin action)</p>
              <CodeBlock>{`from urllib.parse import urlencode

def get_composer_url(to_email, template="welcome"):
    params = urlencode({"template": template, "to": to_email})
    return f"${origin}/?{params}"`}</CodeBlock>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">cURL — build and print a link</p>
              <CodeBlock>{`python3 -c "
from urllib.parse import urlencode
p = urlencode({'template': 'welcome', 'to': 'user@example.com'})
print('${origin}/?' + p)
"`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Available templates */}
        <section>
          <h3 className="mb-1 text-lg font-semibold">Available Templates</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Use the <code className="text-xs">template</code> URL param with any of these IDs, or
            load them from the dropdown in the Compose tab.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {EMAIL_TEMPLATES.filter((t) => t.id !== "blank").map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{t.name}</CardTitle>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.id}</code>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <a
                    href={`${BASE}/?template=${t.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-foreground"
                  >
                    Try it <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Email template theming */}
        <section>
          <h3 className="mb-1 text-lg font-semibold">Customising the Email Theme</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            The HTML and inline CSS for every sent email lives in one file:
          </p>
          <CodeBlock>{`artifacts/email-studio/src/lib/email-template.ts`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Edit the CSS variables at the top of <code className="text-xs">generateEmailHtml()</code> to
            change colors, fonts, button styles, and layout. Because it's pure TypeScript (no
            server-side JSX), it runs in the browser and on Cloudflare Workers without any
            extra compilation.
          </p>
        </section>

        {/* Adding your own templates */}
        <section>
          <h3 className="mb-1 text-lg font-semibold">Adding Your Own Templates</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Open{" "}
            <code className="text-xs">artifacts/email-studio/src/lib/email-templates.ts</code> and
            add an object to the <code className="text-xs">EMAIL_TEMPLATES</code> array:
          </p>
          <CodeBlock>{`{
  id: "my-template",          // used in URL ?template=my-template
  name: "My Template",        // shown in the dropdown
  description: "Short description",
  compose: {
    subject: "Your subject",
    message: "**Bold**, *italic*, [links](https://example.com)",
    ctaEnabled: true,
    ctaLabel: "Click here",
    ctaUrl: "https://yourdomain.com",
  },
},`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            It will instantly appear in the Compose tab dropdown and be available via the{" "}
            <code className="text-xs">?template=my-template</code> URL param.
          </p>
        </section>

        {/* Deployment */}
        <section className="pb-8">
          <h3 className="mb-1 text-lg font-semibold">Deploying to Cloudflare Pages</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            The email request is sent directly to the hosted worker endpoint, so the browser only
            sends the composed payload and never stores any API key locally.
          </p>
          <CodeBlock>{`# From the workspace root
pnpm --filter @workspace/email-studio run build

# Deploy
cd artifacts/email-studio
npx wrangler pages deploy dist/public --project-name email-composer-studio`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Or connect <code className="text-xs">artifacts/email-studio</code> to a Cloudflare Pages
            project via the dashboard for automatic Git deploys on every push.
          </p>
        </section>
      </main>
    </div>
  );
}
