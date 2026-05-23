import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, FileText, RefreshCw, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PreviewPanel } from "@/components/email-editor/PreviewPanel";
import { getDb } from "@/lib/db";
import { defaultConfig } from "@/lib/email-config";
import { generateEmailHtml } from "@/lib/email-template";
import { loadPersistedConfig } from "@/lib/persistence";
import type { ComposeState } from "@/App";
import { deleteTemplate, insertTemplate, listTemplates, type Template } from "@workspace/db/turso";
import { generateGuide } from "@/lib/generate-guide";

interface Props {
  compose: ComposeState;
  setCompose: React.Dispatch<React.SetStateAction<ComposeState>>;
}

type ViewMode = "use" | "create";

function formatCreatedAt(value: Date | string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function replaceFields(content: string, values: Record<string, string>) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, field: string) => values[field] ?? "");
}

export function TemplatesPanel({ compose, setCompose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(true);
  const [view, setView] = useState<ViewMode>("use");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createContent, setCreateContent] = useState(compose.message);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [sendTo, setSendTo] = useState(compose.to);
  const [sendSubject, setSendSubject] = useState(compose.subject);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewConfig, setPreviewConfig] = useState(defaultConfig);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  const detectedFields = useMemo(() => {
    const source = selectedTemplate?.content ?? createContent;
    return generateGuide(source).fields;
  }, [createContent, selectedTemplate]);

  const previewProps = {
    from:
      previewConfig.companyName && previewConfig.sendingDomain
        ? `${previewConfig.companyName} <${previewConfig.sendingDomain}>`
        : previewConfig.sendingDomain || "onboarding@resend.dev",
    to: "",
    subject: createName || "Untitled template",
    logoUrl: previewConfig.logoUrl,
    companyName: previewConfig.companyName,
    sendingDomain: previewConfig.sendingDomain,
    companyAddress: previewConfig.companyAddress,
    message: createContent,
    ctaEnabled: false,
    ctaLabel: "Learn more",
    ctaUrl: "",
  };

  const loadTemplates = useCallback(async () => {
    setLoading(true);

    try {
      const db = await getDb();
      if (!db) {
        setDbReady(false);
        setTemplates([]);
        return;
      }

      const rows = await listTemplates(db);
      setTemplates(rows);
      setDbReady(true);
    } catch {
      setDbReady(false);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    setCreateContent(compose.message);
  }, [compose.message]);

  useEffect(() => {
    setSendTo(compose.to);
    setSendSubject(compose.subject);
  }, [compose.to, compose.subject]);

  useEffect(() => {
    if (!selectedTemplate) {
      setFieldValues({});
      return;
    }

    setFieldValues((current) => {
      const nextValues: Record<string, string> = {};
      for (const field of detectedFields) {
        nextValues[field] = current[field] ?? "";
      }
      return nextValues;
    });
  }, [detectedFields, selectedTemplate]);

  const handleSaveTemplate = async () => {
    const trimmedName = createName.trim();
    const trimmedContent = createContent.trim();

    if (!trimmedName || !trimmedContent) {
      toast.error("Add a name and markdown content first.");
      return;
    }

    setSaving(true);

    try {
      const db = await getDb();
      if (!db) {
        toast.error("DB not connected", { description: "Connect Turso to save a template." });
        return;
      }

      const guide = generateGuide(trimmedContent);
      const id = crypto.randomUUID();

      await insertTemplate(db, {
        id,
        name: trimmedName,
        content: trimmedContent,
        guide: guide.guide,
        createdAt: new Date(),
      });

      setLastSavedId(id);
      setCreateName("");
      setCreateContent(compose.message);
      await loadTemplates();
      toast.success("Template saved", { description: `Template ID: ${id}` });
    } catch {
      toast.error("Save failed", { description: "Unable to save the template right now." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: Template) => {
    setDeletingId(template.id);

    try {
      const db = await getDb();
      if (!db) {
        toast.error("DB not connected", { description: "Connect Turso to delete templates." });
        return;
      }

      await deleteTemplate(db, template.id);
      await loadTemplates();
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId("");
      }
      toast.success("Template deleted", { description: template.name });
    } catch {
      toast.error("Delete failed", { description: "Unable to remove the template right now." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Select a template first.");
      return;
    }

    if (!sendTo.trim()) {
      toast.error("Add a recipient address.");
      return;
    }

    setSending(true);

    try {
      const config = await loadPersistedConfig(defaultConfig);
      const from =
        config.companyName && config.sendingDomain
          ? `${config.companyName} <${config.sendingDomain}>`
          : config.sendingDomain || "onboarding@resend.dev";

      const resolvedMessage = replaceFields(selectedTemplate.content, fieldValues);
      const html = generateEmailHtml({
        logoUrl: config.logoUrl,
        companyName: config.companyName,
        companyAddress: config.companyAddress,
        sendingDomain: config.sendingDomain,
        subject: sendSubject,
        message: resolvedMessage,
      });

      const response = await fetch("https://resend-worker.actionszam.workers.dev/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: sendTo,
          subject: sendSubject || "Untitled email",
          html,
        }),
      });

      const body = (await response.json()) as { success?: boolean; error?: string; data?: { id?: string } };

      if (!response.ok || !body.success) {
        throw new Error(typeof body.error === "string" ? body.error : "Send failed");
      }

      setCompose((current) => ({
        ...current,
        to: sendTo,
        subject: sendSubject,
        message: selectedTemplate.content,
      }));

      toast.success("Template sent", { description: `Delivered to ${sendTo}` });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to send the template right now.";
      toast.error("Send failed", { description });
    } finally {
      setSending(false);
    }
  };

  const offlineCard = (
    <Card className="border-dashed border-primary/40 bg-background">
      <CardContent className="flex flex-col items-center py-10 text-center">
        <Database className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">DB not connected</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Add <span className="rounded bg-muted px-1">VITE_TURSO_DATABASE_URL</span> and
          <span className="rounded bg-muted px-1">VITE_TURSO_AUTH_TOKEN</span> to save and reuse templates.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Templates</h2>
          <p className="text-xs text-muted-foreground">Reuse saved Markdown and personalize it quickly.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void loadTemplates()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={view === "use" ? "default" : "outline"}
          onClick={() => setView("use")}
          className="h-10"
        >
          Use template
        </Button>
        <Button
          variant={view === "create" ? "default" : "outline"}
          onClick={() => setView("create")}
          className="h-10"
        >
          Create template
        </Button>
      </div>

      {view === "use" ? (
        <div className="space-y-4">
          {!dbReady ? (
            offlineCard
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Use a saved template</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Pick a template, fill any dynamic fields, then send it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                  >
                    <option value="">Select a saved template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>

                  {selectedTemplate ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={sendTo}
                          onChange={(event) => setSendTo(event.target.value)}
                          placeholder="Recipient email"
                        />
                        <Input
                          value={sendSubject}
                          onChange={(event) => setSendSubject(event.target.value)}
                          placeholder="Subject line"
                        />
                      </div>

                      <div className="rounded-lg border border-dashed p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Detected fields</p>
                        {detectedFields.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {detectedFields.map((field) => (
                              <Badge key={field} variant="secondary" className="text-[11px]">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">No dynamic fields detected.</p>
                        )}
                      </div>

                      {detectedFields.map((field) => (
                        <div key={field} className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">{field}</label>
                          <Input
                            value={fieldValues[field] ?? ""}
                            onChange={(event) =>
                              setFieldValues((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            placeholder={`Enter ${field}`}
                          />
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Button onClick={() => void handleSendTemplate()} disabled={sending} className="flex-1">
                          <Send className="mr-2 h-4 w-4" />
                          {sending ? "Sending…" : "Send template"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCompose((current) => ({ ...current, message: selectedTemplate.content }))}
                          className="shrink-0"
                        >
                          Load into composer
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {templates.length === 0 && !loading ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center py-10 text-center">
                    <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No templates yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create your first template to start reusing it.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card key={template.id} className="transition-colors hover:bg-muted/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs">
                              {formatCreatedAt(template.createdAt)}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            Saved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <p className="text-[11px] text-muted-foreground">
                          ID: <span className="rounded bg-muted px-1 py-0.5">{template.id}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={() => setSelectedTemplateId(template.id)} className="flex-1">
                            Select
                          </Button>
                          <Button
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => void handleDelete(template)}
                            disabled={deletingId === template.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === template.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!dbReady ? (
            offlineCard
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Create a template</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Write Markdown, detect the dynamic fields, and save it for reuse.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="Template name"
                  />
                  <Textarea
                    value={createContent}
                    onChange={(event) => setCreateContent(event.target.value)}
                    placeholder="Write your Markdown template here..."
                    className="min-h-[220px]"
                  />

                  <Button
                    variant="outline"
                    onClick={() => setShowPreview((current) => !current)}
                    className="w-full"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>

                  {showPreview ? (
                    <div className="rounded-lg border border-dashed p-2">
                      <PreviewPanel {...previewProps} />
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-dashed p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Live field preview</p>
                    {detectedFields.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {detectedFields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-[11px]">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">No dynamic fields detected. Use {'{{name}}'} style placeholders.</p>
                    )}
                  </div>

                  <Button onClick={() => void handleSaveTemplate()} disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving…" : "Save template"}
                  </Button>

                  {lastSavedId && (
                    <p className="text-[11px] text-muted-foreground">
                      Saved template ID: <span className="rounded bg-muted px-1 py-0.5">{lastSavedId}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}