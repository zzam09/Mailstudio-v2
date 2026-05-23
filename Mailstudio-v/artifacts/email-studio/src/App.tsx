import {
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";

import { Route, Switch, Link } from "wouter";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { marked } from "marked";
import { BookOpen, Clock3, FileText, Mail, Moon, Sun } from "lucide-react";
import { getDb } from "@/lib/db";
import { insertEmailSend } from "@workspace/db/turso";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfigPanel } from "@/components/email-editor/ConfigPanel";
import { ComposePanel } from "@/components/email-editor/ComposePanel";
import { PreviewPanel } from "@/components/email-editor/PreviewPanel";
import { SendHistory } from "@/components/email-editor/SendHistory";
import { TemplatesPanel } from "@/components/email-editor/TemplatesPanel";
import {
  defaultConfig,
  type EmailConfig,
} from "@/lib/email-config";
import {
  loadPersistedConfig,
  loadPersistedDraft,
  savePersistedConfig,
  savePersistedDraft,
} from "@/lib/persistence";
import { generateEmailHtml } from "@/lib/email-template";
import {
  parseUrlParams,
  applyUrlParams,
  hasUrlParams,
} from "@/lib/url-params";

const DocsPage = lazy(() => import("@/pages/docs"));

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface ComposeState {
  to: string;
  subject: string;
  message: string;
  ctaEnabled: boolean;
  ctaLabel: string;
  ctaUrl: string;
}

const defaultCompose: ComposeState = {
  to: "",
  subject: "",
  message: "",
  ctaEnabled: false,
  ctaLabel: "Learn more",
  ctaUrl: "",
};

type Section = "compose" | "templates" | "history";

const navItems: Array<{ id: Section; label: string; icon: typeof Mail }> = [
  { id: "compose", label: "Compose", icon: Mail },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "history", label: "History", icon: Clock3 },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function ComposerLayout() {
  const { dark, toggle } = useTheme();
  const [savedConfig, setSavedConfig] = useState<EmailConfig>(defaultConfig);
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [compose, setCompose] = useState<ComposeState>(defaultCompose);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("compose");

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const [loadedConfig, loadedDraft] = await Promise.all([
        loadPersistedConfig(defaultConfig),
        loadPersistedDraft(defaultCompose),
      ]);

      if (cancelled) return;

      const params = parseUrlParams();
      const nextCompose = hasUrlParams(params)
        ? applyUrlParams(defaultCompose, params)
        : loadedDraft;

      setConfig(loadedConfig);
      setSavedConfig(loadedConfig);
      setCompose(nextCompose);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void savePersistedDraft(compose);
  }, [compose, hydrated]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const handleSaveConfig = useCallback(async () => {
    await savePersistedConfig(config);
    setSavedConfig({ ...config });
    toast.success("Configuration saved", { description: "Your settings have been saved." });
  }, [config]);

  const from =
    config.companyName && config.sendingDomain
      ? `${config.companyName} <${config.sendingDomain}>`
      : config.sendingDomain || "onboarding@resend.dev";

  const historyKey = useRef(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleSend = useCallback(
    async (overrideTo?: string) => {
      const to = overrideTo ?? compose.to;
      setSending(true);
      let status: "sent" | "failed" = "failed";
      let resendId: string | undefined;
      let errorMsg: string | undefined;

      try {
        const src = compose.message.trim();
        const messageHtml = src
          ? await marked.parse(src, { async: true, breaks: true, gfm: true })
          : undefined;

        const html = generateEmailHtml({
          logoUrl: config.logoUrl,
          companyName: config.companyName,
          companyAddress: config.companyAddress,
          sendingDomain: config.sendingDomain,
          subject: compose.subject,
          message: compose.message,
          messageHtml,
          ctaEnabled: compose.ctaEnabled,
          ctaLabel: compose.ctaLabel,
          ctaUrl: compose.ctaUrl,
        });

        const res = await fetch(`https://resend-worker.actionszam.workers.dev/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to,
            subject: compose.subject,
            html,
          }),
        });

        const body = (await res.json()) as { id?: string; error?: string; success?: boolean; data?: { id?: string } };
        if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : JSON.stringify(body.error ?? `Server returned ${res.status}`));

        status = "sent";
        resendId = body.data?.id ?? body.id;

        toast.success("Email sent", { description: `Delivered to ${to}` });
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : "Failed to send email";
        toast.error("Send failed", { description: errorMsg });
      } finally {
        try {
          const db = await getDb();
          if (!db) throw new Error("DB not configured");
          await insertEmailSend(db, {
            id: crypto.randomUUID(),
            createdAt: new Date(),
            toAddress: to,
            fromAddress: from,
            subject: compose.subject,
            status,
            resendId: resendId ?? null,
            error: errorMsg ?? null,
          });
          historyKey.current += 1;
          setHistoryRefresh(historyKey.current);
        } catch {
          // DB errors are non-fatal — don't interrupt the UX
        }
        setSending(false);
      }
    },
    [compose, config, from]
  );

  const handleTestSend = useCallback(() => {
    if (!config.sendingDomain.trim()) return;
    void handleSend(config.sendingDomain);
  }, [config.sendingDomain, handleSend]);

  const previewProps = {
    from,
    to: compose.to,
    subject: compose.subject,
    logoUrl: config.logoUrl,
    companyName: config.companyName,
    sendingDomain: config.sendingDomain,
    message: compose.message,
    ctaEnabled: compose.ctaEnabled,
    ctaLabel: compose.ctaLabel,
    ctaUrl: compose.ctaUrl,
  };

  const header = (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Email Composer</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Compose &amp; send via Resend
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/docs">
            <Button variant="ghost" size="icon" aria-label="Documentation" className="h-9 w-9">
              <BookOpen className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );

  const renderContent = () => {
    if (activeSection === "templates") {
      return <TemplatesPanel compose={compose} setCompose={setCompose} />;
    }

    if (activeSection === "history") {
      return <SendHistory key={historyRefresh} />;
    }

    return (
      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex-1 overflow-auto">
          <div className="space-y-4 p-4">
            <ComposePanel
              compose={compose}
              onComposeChange={setCompose}
              config={config}
              onSend={() => void handleSend()}
              onTestSend={handleTestSend}
              sending={sending}
            />
            <Accordion type="single" collapsible defaultValue="settings" className="w-full">
              <AccordionItem value="settings" className="border rounded-lg px-2">
                <AccordionTrigger className="text-sm font-semibold">Settings</AccordionTrigger>
                <AccordionContent>
                  <ConfigPanel config={config} onConfigChange={setConfig} isDirty={isDirty} onSave={handleSaveConfig} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        <div className="hidden lg:block w-[420px] shrink-0 border-l bg-background/50">
          <PreviewPanel {...previewProps} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}

      <div className="lg:hidden">
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
          <div className="border-t bg-zinc-950/95 px-2 py-2">
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={active ? "default" : "ghost"}
                    className={`h-12 flex-col gap-1 rounded-xl ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px]">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex" style={{ height: "calc(100dvh - 3.5rem)" }}>
        <aside className="w-20 shrink-0 border-r bg-zinc-950/95 px-2 py-4">
          <div className="flex h-full flex-col items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <Button
                  key={item.id}
                  variant={active ? "default" : "ghost"}
                  className={`h-14 w-14 rounded-2xl p-0 ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveSection(item.id)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-background">
          {renderContent()}
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/docs">
  <Suspense fallback={<div>Loading...</div>}>
    <DocsPage />
  </Suspense>
</Route>
      <Route component={ComposerLayout} />
    </Switch>
  );
}
