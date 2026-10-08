import "server-only";
import { randomUUID } from "node:crypto";
import { defaultGlobalReplaceState, GLOBAL_REPLACE_HISTORY_LIMIT, type GlobalReplaceState, type ReplacementHistoryEntry } from "@/data/global-replace";
import { mergeUserContent, type ContentSettings, type UserContent } from "@/data/settings";
import type { DbUser } from "@/data/users";
import { mutateDb, readDb } from "./db";
import { applyUndoSnapshot, buildReplacementPlan, findMatches, type GlobalReplaceMatch, type ReplaceOptions } from "./global-replace";
import { validateContent } from "./settings-validation";

function stripTimestamp(settings: ContentSettings): UserContent {
  const { updatedAt, ...rest } = settings;
  void updatedAt;
  return rest;
}

export interface PublicGlobalReplaceState {
  history: ReplacementHistoryEntry[];
  canUndo: boolean;
}

function toPublic(state: GlobalReplaceState): PublicGlobalReplaceState {
  return { history: state.history, canUndo: state.lastUndo !== null };
}

export async function getPublicGlobalReplaceState(): Promise<PublicGlobalReplaceState> {
  const db = await readDb();
  return toPublic(db.globalReplace ?? defaultGlobalReplaceState);
}

/** Read-only preview against the current saved content — never mutates anything. */
export async function previewGlobalReplace(existingText: string, options: ReplaceOptions): Promise<GlobalReplaceMatch[]> {
  const db = await readDb();
  const content = stripTimestamp(mergeUserContent(db.contentSettings));
  return findMatches(content, existingText, options);
}

export type ApplyReplaceOutcome =
  | { ok: true; matchCount: number; settings: ContentSettings; state: PublicGlobalReplaceState }
  | { ok: false; error: string };

export async function applyGlobalReplace(existingText: string, newText: string, options: ReplaceOptions, admin: DbUser): Promise<ApplyReplaceOutcome> {
  return mutateDb((db) => {
    const current = stripTimestamp(mergeUserContent(db.contentSettings));
    const { next, changed } = buildReplacementPlan(current, existingText, newText, options);

    if (changed.length === 0) return { ok: false, error: "No matching user-facing content found." };

    const validated = validateContent(next);
    if (!validated.ok) {
      const blockedByNotice = Object.keys(validated.errors).some((k) => k.startsWith("notices."));
      return {
        ok: false,
        error: blockedByNotice ? "Replacement blocked because it would invalidate a required notice." : "Replacement blocked — the resulting text failed validation.",
      };
    }

    const nowIso = new Date().toISOString();
    db.contentSettings = { ...validated.value, updatedAt: nowIso };

    const entry: ReplacementHistoryEntry = {
      id: randomUUID(),
      existingText,
      newText,
      matchCount: changed.length,
      caseInsensitive: options.caseInsensitive,
      partial: options.partial,
      undone: false,
      at: nowIso,
      adminId: admin.id,
      adminName: admin.displayName,
    };
    const state: GlobalReplaceState = structuredClone(db.globalReplace ?? defaultGlobalReplaceState);
    state.history = [entry, ...state.history].slice(0, GLOBAL_REPLACE_HISTORY_LIMIT);
    state.lastUndo = { replacementId: entry.id, entries: changed.map((c) => ({ path: c.path, value: c.before })) };
    db.globalReplace = state;

    return { ok: true, matchCount: changed.length, settings: db.contentSettings, state: toPublic(state) };
  });
}

export type UndoReplaceOutcome = { ok: true; settings: ContentSettings; state: PublicGlobalReplaceState } | { ok: false; error: string };

export async function undoLastReplacement(): Promise<UndoReplaceOutcome> {
  return mutateDb((db) => {
    const state: GlobalReplaceState = structuredClone(db.globalReplace ?? defaultGlobalReplaceState);
    const snapshot = state.lastUndo;
    if (!snapshot) return { ok: false, error: "Nothing to undo." };

    const current = stripTimestamp(mergeUserContent(db.contentSettings));
    const reverted = applyUndoSnapshot(current, snapshot.entries);

    const validated = validateContent(reverted);
    if (!validated.ok) return { ok: false, error: "Undo blocked — the restored text failed validation." };

    const nowIso = new Date().toISOString();
    db.contentSettings = { ...validated.value, updatedAt: nowIso };

    state.history = state.history.map((h) => (h.id === snapshot.replacementId ? { ...h, undone: true } : h));
    state.lastUndo = null;
    db.globalReplace = state;

    return { ok: true, settings: db.contentSettings, state: toPublic(state) };
  });
}
