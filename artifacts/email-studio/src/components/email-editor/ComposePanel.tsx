import { useState } from "react";
import {
  Loader2,
  Send,
  FlaskConical,
  Mail,
  MousePointerClick,
  LayoutTemplate,
  Share2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { buildShareUrl } from "@/lib/url-params";
import type { EmailConfig } from "@/lib/email-config";
import type { ComposeState } from "@/App";

interface Props {
  compose: ComposeState;
  onComposeChange: (next: ComposeState) => void;
  config: EmailConfig;
  onSend: () => void;
  onTestSend: () => void;
  sending: boolean;
}

export function ComposePanel({
  compose,
  onComposeChange,
  config,
  onSend,
  onTestSend,
  sending,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof ComposeState>(key: K, value: ComposeState[K]) =>
    onComposeChange({ ...compose, [key]: value });

  const handleTemplateLoad = (templateId: string) => {
    if (!templateId) return;
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    onComposeChange({ ...compose, ...tpl.compose });
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl(compose, selectedTemplate || undefined);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSend =
    !!compose.to.trim() &&
    !!compose.subject.trim() &&
    !!compose.message.trim() &&
    !!config.sendingDomain.trim() &&
    !sending;

  const canTest = !!config.sendingDomain.trim() && !sending;
  const charCount = compose.message.length;

  return (
    <div className="space-y-4 p-4">
      {/* Template loader */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Template</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Start from a pre-built template or keep your current draft
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedTemplate} onValueChange={handleTemplateLoad}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Templates</SelectLabel>
                {EMAIL_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    <div className="flex flex-col gap-0.5">
                      <span>{tpl.name}</span>
                      <span className="text-xs text-muted-foreground">{tpl.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Copy shareable link */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void handleCopyLink()}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-3.5 w-3.5 text-green-500" />
                Link copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-3.5 w-3.5" />
                Copy shareable link
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Share this link to open the composer pre-filled with the current template and content.
          </p>
        </CardContent>
      </Card>

      {/* Recipient */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Recipient</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="To">
            <Input
              type="email"
              value={compose.to}
              onChange={(e) => set("to", e.target.value)}
              placeholder="recipient@example.com"
            />
          </Field>
          <Field label="Subject">
            <Input
              value={compose.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Quick note from us"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Message</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">
              Markdown
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Supports **bold**, *italic*, [links](url), and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={compose.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder={"Write your message here...\n\nSupports **bold**, *italic*, and [links](https://example.com)"}
            rows={8}
            className="resize-y font-mono text-sm"
          />
          <p className="mt-1.5 text-right text-xs text-muted-foreground">
            {charCount} {charCount === 1 ? "character" : "characters"}
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Call to Action</CardTitle>
            </div>
            <Switch
              id="cta-toggle"
              checked={compose.ctaEnabled}
              onCheckedChange={(v) => set("ctaEnabled", v)}
            />
          </div>
          <CardDescription className="text-xs">
            Add a button at the bottom of the email
          </CardDescription>
        </CardHeader>
        {compose.ctaEnabled && (
          <CardContent className="space-y-3 pt-1">
            <Field label="Button label">
              <Input
                value={compose.ctaLabel}
                onChange={(e) => set("ctaLabel", e.target.value)}
                placeholder="Learn more"
              />
            </Field>
            <Field label="Button URL">
              <Input
                type="url"
                value={compose.ctaUrl}
                onChange={(e) => set("ctaUrl", e.target.value)}
                placeholder="https://yourdomain.com"
              />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Send actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Button onClick={onSend} disabled={!canSend} className="w-full" size="lg">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onTestSend}
              disabled={!canTest}
              className="w-full"
              title="Send a test email to your own sending address"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Send Test to My Address
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
