import { getDb } from "@/lib/db";
import { getAppState, upsertAppState } from "@workspace/db/turso";
import type { EmailConfig } from "@/lib/email-config";
import type { ComposeState } from "@/App";

const CONFIG_KEY = "email-config-v1";
const DRAFT_KEY = "compose-draft-v1";
const LOCAL_CONFIG_KEY = "email-editor-config-v1";
const LOCAL_DRAFT_KEY = "email-editor-draft-v1";

function loadLocalConfig(): EmailConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EmailConfig>;
    return {
      logoUrl: parsed.logoUrl ?? "",
      sendingDomain: parsed.sendingDomain ?? "",
      companyName: parsed.companyName ?? "",
      companyAddress: parsed.companyAddress ?? "",
    };
  } catch {
    return null;
  }
}

function saveLocalConfig(config: EmailConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

function loadLocalDraft(): ComposeState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ComposeState>;
    return {
      to: parsed.to ?? "",
      subject: parsed.subject ?? "",
      message: parsed.message ?? "",
      ctaEnabled: parsed.ctaEnabled ?? false,
      ctaLabel: parsed.ctaLabel ?? "Learn more",
      ctaUrl: parsed.ctaUrl ?? "",
    };
  } catch {
    return null;
  }
}

function saveLocalDraft(compose: ComposeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(compose));
}

function normalizeConfig(saved: Partial<EmailConfig> | undefined, defaultConfig: EmailConfig): EmailConfig {
  return {
    logoUrl: saved?.logoUrl ?? defaultConfig.logoUrl,
    sendingDomain: saved?.sendingDomain ?? defaultConfig.sendingDomain,
    companyName: saved?.companyName ?? defaultConfig.companyName,
    companyAddress: saved?.companyAddress ?? defaultConfig.companyAddress,
  };
}

function normalizeDraft(saved: Partial<ComposeState> | undefined, defaultCompose: ComposeState): ComposeState {
  return {
    to: saved?.to ?? defaultCompose.to,
    subject: saved?.subject ?? defaultCompose.subject,
    message: saved?.message ?? defaultCompose.message,
    ctaEnabled: saved?.ctaEnabled ?? defaultCompose.ctaEnabled,
    ctaLabel: saved?.ctaLabel ?? defaultCompose.ctaLabel,
    ctaUrl: saved?.ctaUrl ?? defaultCompose.ctaUrl,
  };
}

async function persistConfigToDb(config: EmailConfig): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await upsertAppState(db, {
      key: CONFIG_KEY,
      value: JSON.stringify(config),
      updatedAt: new Date(),
    });
    return true;
  } catch {
    return false;
  }
}

async function persistDraftToDb(compose: ComposeState): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await upsertAppState(db, {
      key: DRAFT_KEY,
      value: JSON.stringify(compose),
      updatedAt: new Date(),
    });
    return true;
  } catch {
    return false;
  }
}

async function loadConfigFromDb(defaultConfig: EmailConfig): Promise<EmailConfig | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const saved = await getAppState(db, CONFIG_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved.value) as Partial<EmailConfig>;
    return normalizeConfig(parsed, defaultConfig);
  } catch {
    return null;
  }
}

async function loadDraftFromDb(defaultCompose: ComposeState): Promise<ComposeState | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const saved = await getAppState(db, DRAFT_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved.value) as Partial<ComposeState>;
    return normalizeDraft(parsed, defaultCompose);
  } catch {
    return null;
  }
}

export async function loadPersistedConfig(defaultConfig: EmailConfig): Promise<EmailConfig> {
  const dbConfig = await loadConfigFromDb(defaultConfig);
  if (dbConfig) return dbConfig;

  const localConfig = loadLocalConfig();
  if (localConfig) {
    void persistConfigToDb(localConfig);
    return localConfig;
  }

  return defaultConfig;
}

export async function savePersistedConfig(config: EmailConfig): Promise<void> {
  if (await persistConfigToDb(config)) return;
  saveLocalConfig(config);
}

export async function loadPersistedDraft(defaultCompose: ComposeState): Promise<ComposeState> {
  const dbDraft = await loadDraftFromDb(defaultCompose);
  if (dbDraft) return dbDraft;

  const localDraft = loadLocalDraft();
  if (localDraft) {
    void persistDraftToDb(localDraft);
    return localDraft;
  }

  return defaultCompose;
}

export async function savePersistedDraft(compose: ComposeState): Promise<void> {
  if (await persistDraftToDb(compose)) return;
  saveLocalDraft(compose);
}
