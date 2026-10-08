// Pure find/replace engine for admin-editable user-facing content (UserContent). No I/O here — the service
// layer (global-replace-service.ts) reads/writes .data/db.json and calls into these functions with a plain
// UserContent object. Traversal is generic/recursive so any future string field or array-of-text-objects
// added to UserContent is picked up automatically, without this file needing to know the section shapes.
import {
  ACCOUNT_FIELDS,
  DASHBOARD_FIELDS,
  LOGIN_FIELDS,
  MAINTENANCE_FIELDS,
  MESSAGES_FIELDS,
  NAVIGATION_FIELDS,
  NOTICES_FIELDS,
  SUPPORT_FIELDS,
  TRANSACTIONS_FIELDS,
  type FieldSpec,
} from "./settings-validation";
import type { UserContent } from "@/data/settings";

export interface ReplaceOptions {
  caseInsensitive: boolean;
  partial: boolean;
}

export interface GlobalReplaceMatch {
  path: string;
  sectionLabel: string;
  fieldLabel: string;
  currentText: string;
}

export interface ReplacedField {
  path: string;
  sectionLabel: string;
  fieldLabel: string;
  before: string;
  after: string;
}

const SECTION_LABELS: Record<string, string> = {
  login: "Login",
  navigation: "Navigation",
  dashboard: "Dashboard",
  transactions: "Transactions",
  account: "Account",
  support: "Support",
  messages: "Messages",
  notices: "Disclaimers & Notices",
  maintenance: "Maintenance",
};

const SECTION_SPECS: Record<string, FieldSpec[]> = {
  login: LOGIN_FIELDS,
  navigation: NAVIGATION_FIELDS,
  dashboard: DASHBOARD_FIELDS,
  transactions: TRANSACTIONS_FIELDS,
  account: ACCOUNT_FIELDS,
  support: SUPPORT_FIELDS,
  messages: MESSAGES_FIELDS,
  notices: NOTICES_FIELDS,
  maintenance: MAINTENANCE_FIELDS,
};

function prettifyKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function sectionLabelFor(section: string): string {
  return SECTION_LABELS[section] ?? prettifyKey(section);
}

/** Human label for a field path (e.g. "dashboard.recentHeading" → "Recent transactions heading", or
 *  "support.topics.0.title" → "Support topic 1 — Title"). Known fields use the same labels shown in the
 *  regular content editor; anything not in a FieldSpec list (a future field) falls back to a prettified
 *  version of its key path, so new CMS fields are still searchable with a reasonable label. */
function fieldLabelFor(section: string, restPath: string): string {
  const specs = SECTION_SPECS[section];
  const known = specs?.find((s) => s.key === restPath);
  if (known) return known.label;

  const parts = restPath.split(".");
  if (section === "support" && parts[0] === "topics" && parts.length === 3) {
    const index = Number(parts[1]);
    const sub = parts[2] === "title" ? "Title" : parts[2] === "body" ? "Text" : prettifyKey(parts[2]);
    return `Support topic ${index + 1} — ${sub}`;
  }
  return parts.map((p) => (/^\d+$/.test(p) ? `#${Number(p) + 1}` : prettifyKey(p))).join(" ");
}

interface FlatField {
  path: string; // e.g. "dashboard.recentHeading" or "support.topics.0.title"
  section: string;
  value: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function walk(node: unknown, path: string, section: string, out: FlatField[]): void {
  if (typeof node === "string") {
    out.push({ path, section, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}.${i}`, section, out));
    return;
  }
  if (isPlainObject(node)) {
    for (const key of Object.keys(node)) walk(node[key], path ? `${path}.${key}` : key, section, out);
  }
  // numbers, booleans, null, undefined — never editable text, always ignored.
}

/** Flattens every string value in UserContent into {path, section, value}. `path` is dot-separated, rooted at
 *  the section key (e.g. "login.headline1"), and is exactly what setByPath/getByPath below expect. */
export function collectStringFields(content: UserContent): FlatField[] {
  const out: FlatField[] = [];
  for (const section of Object.keys(content) as (keyof UserContent)[]) {
    walk(content[section], section, section, out);
  }
  return out;
}

function pathSegments(path: string): (string | number)[] {
  return path.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

export function getByPath(obj: unknown, path: string): string {
  let cur: unknown = obj;
  for (const seg of pathSegments(path)) {
    if (cur == null) return "";
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return typeof cur === "string" ? cur : "";
}

function setByPath(obj: unknown, path: string, value: string): void {
  const segs = pathSegments(path);
  let cur = obj as Record<string | number, unknown>;
  for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]] as Record<string | number, unknown>;
  cur[segs[segs.length - 1]] = value;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldMatches(value: string, existingText: string, opts: ReplaceOptions): boolean {
  if (opts.partial) {
    return opts.caseInsensitive ? value.toLowerCase().includes(existingText.toLowerCase()) : value.includes(existingText);
  }
  return opts.caseInsensitive ? value.toLowerCase() === existingText.toLowerCase() : value === existingText;
}

function replaceValue(value: string, existingText: string, newText: string, opts: ReplaceOptions): string {
  if (!opts.partial) return newText;
  const flags = opts.caseInsensitive ? "gi" : "g";
  return value.replace(new RegExp(escapeRegExp(existingText), flags), newText);
}

/** Read-only: finds every field whose text matches `existingText` under the given options. Never mutates. */
export function findMatches(content: UserContent, existingText: string, opts: ReplaceOptions): GlobalReplaceMatch[] {
  if (!existingText) return [];
  return collectStringFields(content)
    .filter((f) => fieldMatches(f.value, existingText, opts))
    .map((f) => {
      const restPath = f.path.slice(f.section.length + 1);
      return { path: f.path, sectionLabel: sectionLabelFor(f.section), fieldLabel: fieldLabelFor(f.section, restPath), currentText: f.value };
    });
}

/** Builds the post-replacement content (a deep clone — `content` is never mutated) plus the list of fields
 *  that actually changed, each with its before/after text for an undo snapshot. */
export function buildReplacementPlan(
  content: UserContent,
  existingText: string,
  newText: string,
  opts: ReplaceOptions,
): { next: UserContent; changed: ReplacedField[] } {
  const next = structuredClone(content);
  const changed: ReplacedField[] = [];
  for (const f of collectStringFields(content)) {
    if (!fieldMatches(f.value, existingText, opts)) continue;
    const after = replaceValue(f.value, existingText, newText, opts);
    if (after === f.value) continue;
    setByPath(next, f.path, after);
    const restPath = f.path.slice(f.section.length + 1);
    changed.push({ path: f.path, sectionLabel: sectionLabelFor(f.section), fieldLabel: fieldLabelFor(f.section, restPath), before: f.value, after });
  }
  return { next, changed };
}

/** Applies a stored undo snapshot's {path, value} pairs onto `content`, returning a new object. */
export function applyUndoSnapshot(content: UserContent, entries: { path: string; value: string }[]): UserContent {
  const next = structuredClone(content);
  for (const e of entries) setByPath(next, e.path, e.value);
  return next;
}
