// Operational state for the admin "Global Text Replacement" tool (/admin/content → Global Replace). This is
// NOT part of the CMS content itself (UserContent/ContentSettings in settings.ts) — it only records what the
// tool has done (a short history) and a one-step undo snapshot. The tool always mutates contentSettings
// through the same validated save path as a manual edit; nothing here is rendered on any user-facing page.

export const GLOBAL_REPLACE_EXISTING_MAX = 500;
export const GLOBAL_REPLACE_NEW_MAX = 1000;
export const GLOBAL_REPLACE_HISTORY_LIMIT = 20;

export interface ReplacementHistoryEntry {
  id: string;
  existingText: string;
  newText: string;
  matchCount: number;
  caseInsensitive: boolean;
  partial: boolean;
  undone: boolean;
  at: string;
  adminId: string;
  adminName: string;
}

/** A snapshot of only the exact fields a replacement touched (path → pre-replacement value), so "Undo Last
 *  Replacement" can restore them without keeping a full database snapshot. Single-slot: a new replacement
 *  overwrites it, so only the most recent replacement is ever undoable. */
export interface GlobalReplaceUndoSnapshot {
  replacementId: string;
  entries: { path: string; value: string }[];
}

export interface GlobalReplaceState {
  history: ReplacementHistoryEntry[];
  lastUndo: GlobalReplaceUndoSnapshot | null;
}

export const defaultGlobalReplaceState: GlobalReplaceState = { history: [], lastUndo: null };
