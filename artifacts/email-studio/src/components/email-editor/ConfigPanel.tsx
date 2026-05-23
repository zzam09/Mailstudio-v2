import { useState } from "react";
import { AlertTriangle, Settings2, Globe, Building2, FileCode2, Save, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmailConfig } from "@/lib/email-config";

interface Props {
  config: EmailConfig;
  onConfigChange: (next: EmailConfig) => void;
  isDirty: boolean;
  onSave: () => void;
}

const VARIABLES = [
  { token: "{{year}}", example: String(new Date().getFullYear()), note: "Auto-filled" },
  { token: "{{company_name}}", example: "Your Company, Inc.", note: "From Company name" },
  { token: "{{company_address}}", example: "123 Main St, City", note: "From Company address" },
];

export function ConfigPanel({ config, onConfigChange, isDirty, onSave }: Props) {
  const [justSaved, setJustSaved] = useState(false);

  const setConfig = <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) =>
    onConfigChange({ ...config, [key]: value });

  const isConfigured = !!config.sendingDomain.trim();

  const handleSave = () => {
    onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Status row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={isConfigured ? "default" : "secondary"} className="text-xs">
            {isConfigured ? "Ready to send" : "Setup required"}
          </Badge>
          {isDirty && (
            <Badge variant="outline" className="border-amber-400 text-xs text-amber-600 dark:text-amber-400">
              Unsaved changes
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant={isDirty ? "default" : "outline"}
          onClick={handleSave}
          disabled={!isDirty && !justSaved}
          className="h-7 gap-1.5 px-3 text-xs"
        >
          {justSaved ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Sender identity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Sender Identity</CardTitle>
          </div>
          <CardDescription className="text-xs">
            How your emails appear to recipients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Company name">
            <Input
              value={config.companyName}
              onChange={(e) => setConfig("companyName", e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>

          <Field label="Company address">
            <Textarea
              value={config.companyAddress}
              onChange={(e) => setConfig("companyAddress", e.target.value)}
              placeholder={"123 Main Street\nSan Francisco, CA 94105\nUnited States"}
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Shown in the email footer — use{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                {"{{company_address}}"}
              </code>{" "}
              in your message to include it inline too.
            </p>
          </Field>

          <Field label="Logo URL">
            <Input
              value={config.logoUrl}
              onChange={(e) => setConfig("logoUrl", e.target.value)}
              placeholder="https://yourdomain.com/logo.png"
            />
            {config.logoUrl && (
              <div className="mt-1.5 flex items-center gap-2">
                <img
                  src={config.logoUrl}
                  alt="Logo preview"
                  className="h-6 max-w-[120px] object-contain"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Sending */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Sending</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Your verified sending address for the worker endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="From address">
            <Input
              value={config.sendingDomain}
              onChange={(e) => setConfig("sendingDomain", e.target.value)}
              placeholder="hello@yourdomain.com"
            />
            {config.sendingDomain.trim() === "" && (
              <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Using Resend test sender — add your domain to send from a custom address
                </span>
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      {/* Footer variables reference */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Template Variables</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Use these anywhere in your message or subject — they're replaced automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Variable</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                </tr>
              </thead>
              <tbody>
                {VARIABLES.map((v, i) => (
                  <tr key={v.token} className={i < VARIABLES.length - 1 ? "border-b" : ""}>
                    <td className="px-3 py-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                        {v.token}
                      </code>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {v.token === "{{company_name}}"
                        ? config.companyName || <span className="italic opacity-50">{v.example}</span>
                        : v.token === "{{company_address}}"
                        ? config.companyAddress
                          ? <span className="line-clamp-1">{config.companyAddress.split("\n")[0]}</span>
                          : <span className="italic opacity-50">{v.example}</span>
                        : <span className="font-medium">{v.example}</span>
                      }
                      {v.token === "{{year}}" && (
                        <span className="ml-1 text-[10px] text-muted-foreground/60">(auto)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Preview of from field */}
      {(config.companyName || config.sendingDomain) && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="truncate text-xs text-muted-foreground">
                Emails will show:{" "}
                <span className="font-medium text-foreground">
                  {config.companyName && config.sendingDomain
                    ? `${config.companyName} <${config.sendingDomain}>`
                    : config.sendingDomain || config.companyName}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
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
