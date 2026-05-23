import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, RefreshCw, Trash2, Clock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb, isUsingTurso } from "@/lib/db";
import { listEmailSends, clearEmailSends, type EmailSend } from "@workspace/db/turso";

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SendHistory() {
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      if (!db) { setSends([]); return; }
      setSends(await listEmailSends(db, 100));
    } catch {
      // ignore DB errors — history is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const db = await getDb();
      if (!db) return;
      await clearEmailSends(db);
      setSends([]);
    } finally {
      setClearing(false);
    }
  };

  /* ── Not connected ── */
  if (!isUsingTurso) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Send History</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Database className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Turso not connected</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add{" "}
              <code className="rounded bg-muted px-1">VITE_TURSO_DATABASE_URL</code> and{" "}
              <code className="rounded bg-muted px-1">VITE_TURSO_AUTH_TOKEN</code> to your env,
              then restart the dev server to enable persistent send history.
            </p>
            <a
              href="https://turso.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs underline underline-offset-2 hover:text-foreground"
            >
              Create a free Turso database →
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Send History</h2>
          <Badge variant="default" className="text-xs">Turso</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => void load()}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {sends.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => void handleClear()}
              disabled={clearing}
              title="Clear history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Send list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : sends.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No sends yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Emails you send will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sends.map((send) => (
            <SendRow key={send.id} send={send} />
          ))}
        </div>
      )}
    </div>
  );
}

function SendRow({ send }: { send: EmailSend }) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardHeader className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {send.status === "sent" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              )}
              <CardTitle className="truncate text-sm">
                {send.subject || "(no subject)"}
              </CardTitle>
            </div>
            <CardDescription className="mt-1 truncate text-xs">
              To: {send.toAddress}
            </CardDescription>
            {send.status === "failed" && send.error && (
              <p className="mt-1 truncate text-xs text-destructive">{send.error}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge
              variant={send.status === "sent" ? "default" : "destructive"}
              className="text-[10px]"
            >
              {send.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatRelative(new Date(send.createdAt))}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
