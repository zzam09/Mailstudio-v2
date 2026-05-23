import { useEffect, useState } from "react";
import { marked } from "marked";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateEmailHtml, type EmailTemplateProps } from "@/lib/email-template";

interface Props extends EmailTemplateProps {
  from: string;
  to: string;
}

type ViewMode = "desktop" | "mobile";

export function PreviewPanel({ from, to, subject, ...emailProps }: Props) {
  const [html, setHtml] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const src = (emailProps.message ?? "").trim();
        const messageHtml = src
          ? await marked.parse(src, { async: true, breaks: true, gfm: true })
          : undefined;
        if (!cancelled) {
          setHtml(generateEmailHtml({ ...emailProps, subject, messageHtml }));
        }
      } catch {
        // ignore preview errors
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [from, to, subject, JSON.stringify(emailProps)]);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Preview header */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview
            </span>
            {subject && (
              <Badge variant="secondary" className="max-w-[200px] truncate text-xs font-normal">
                {subject}
              </Badge>
            )}
          </div>
          <div className="mt-1 grid grid-cols-[40px_1fr] gap-x-2 gap-y-0.5">
            <span className="text-xs text-muted-foreground">From</span>
            <span className="truncate text-xs font-medium">{from || "—"}</span>
            <span className="text-xs text-muted-foreground">To</span>
            <span className="truncate text-xs font-medium">{to || "—"}</span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="ml-3 flex shrink-0 items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={viewMode === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("desktop")}
            title="Desktop preview"
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("mobile")}
            title="Mobile preview"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Email preview */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        <div
          className="overflow-hidden rounded-lg border shadow-sm transition-all duration-300"
          style={{
            width: viewMode === "mobile" ? "375px" : "100%",
            maxWidth: viewMode === "desktop" ? "680px" : "375px",
            minWidth: viewMode === "mobile" ? "375px" : undefined,
          }}
        >
          <iframe
            title="Email preview"
            srcDoc={html || getPlaceholderHtml()}
            className="block w-full bg-white"
            style={{ height: viewMode === "mobile" ? "640px" : "600px" }}
          />
        </div>
      </div>
    </div>
  );
}

function getPlaceholderHtml() {
  return `<!DOCTYPE html><html><body style="background:#131313;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <p style="color:#555;font-size:14px;text-align:center">Start typing to see your email preview</p>
  </body></html>`;
}
