/**
 * URL parameter support for Email Composer Studio.
 *
 * Any page can deep-link into the composer with pre-filled values:
 *
 *   https://your-domain.com/?to=user@example.com&subject=Hello&template=welcome
 *
 * Individual params always override template defaults.
 */

import type { ComposeState } from "@/App";
import { getTemplate } from "./email-templates";

export interface UrlParams {
  /** Load a named template first, then apply any other params on top */
  template?: string;
  to?: string;
  subject?: string;
  message?: string;
  ctaEnabled?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

/** Parse URL search params into a typed object */
export function parseUrlParams(search: string = window.location.search): UrlParams {
  const p = new URLSearchParams(search);
  const result: UrlParams = {};

  if (p.has("template")) result.template = p.get("template")!;
  if (p.has("to")) result.to = p.get("to")!;
  if (p.has("subject")) result.subject = p.get("subject")!;
  if (p.has("message")) result.message = p.get("message")!;
  if (p.has("ctaEnabled")) result.ctaEnabled = p.get("ctaEnabled") === "true";
  if (p.has("ctaLabel")) result.ctaLabel = p.get("ctaLabel")!;
  if (p.has("ctaUrl")) result.ctaUrl = p.get("ctaUrl")!;

  return result;
}

/** Merge URL params onto a base ComposeState. Template loads first, then individual params win. */
export function applyUrlParams(base: ComposeState, params: UrlParams): ComposeState {
  let result = { ...base };

  // 1. Load template defaults first
  if (params.template) {
    const tpl = getTemplate(params.template);
    if (tpl) {
      result = { ...result, ...tpl.compose };
    }
  }

  // 2. Individual params always win over template
  if (params.to !== undefined) result.to = params.to;
  if (params.subject !== undefined) result.subject = params.subject;
  if (params.message !== undefined) result.message = params.message;
  if (params.ctaEnabled !== undefined) result.ctaEnabled = params.ctaEnabled;
  if (params.ctaLabel !== undefined) result.ctaLabel = params.ctaLabel;
  if (params.ctaUrl !== undefined) result.ctaUrl = params.ctaUrl;

  return result;
}

/** Check whether any URL params that affect compose are present */
export function hasUrlParams(params: UrlParams): boolean {
  return Object.keys(params).length > 0;
}

/** Build a shareable URL for the current compose state */
export function buildShareUrl(compose: Partial<ComposeState>, templateId?: string): string {
  const url = new URL(window.location.href.split("?")[0]);

  if (templateId && templateId !== "blank") url.searchParams.set("template", templateId);
  if (compose.to) url.searchParams.set("to", compose.to);
  if (compose.subject) url.searchParams.set("subject", compose.subject);
  if (compose.message) url.searchParams.set("message", compose.message);
  if (compose.ctaEnabled) {
    url.searchParams.set("ctaEnabled", "true");
    if (compose.ctaLabel) url.searchParams.set("ctaLabel", compose.ctaLabel);
    if (compose.ctaUrl) url.searchParams.set("ctaUrl", compose.ctaUrl);
  }

  return url.toString();
}
