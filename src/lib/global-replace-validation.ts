// Validates the admin's raw "Existing Text" / "New Text" / option inputs for Global Text Replacement, before
// any matching or persistence happens. Mirrors the plain-text-only rule already enforced by settings-validation
// .ts's text() helper (no < or >) — this tool must never become a way to sneak markup past that rule via a
// field that happens to contain it after a replace (the resulting content is re-validated separately, see
// global-replace-service.ts).
import { GLOBAL_REPLACE_EXISTING_MAX, GLOBAL_REPLACE_NEW_MAX } from "@/data/global-replace";

const hasMarkup = (s: string) => /[<>]/.test(s);

export interface ValidReplaceInput {
  ok: true;
  existingText: string;
  newText: string;
  caseInsensitive: boolean;
  partial: boolean;
}

export type ReplaceInputResult = ValidReplaceInput | { ok: false; error: string };

export function validateReplaceInput(rawExisting: unknown, rawNew: unknown, rawCaseInsensitive: unknown, rawPartial: unknown): ReplaceInputResult {
  const existingText = typeof rawExisting === "string" ? rawExisting.trim() : "";
  const newText = typeof rawNew === "string" ? rawNew.trim() : "";
  const caseInsensitive = rawCaseInsensitive === true;
  const partial = rawPartial === true;

  if (!existingText) return { ok: false, error: "Enter the existing text to search for." };
  if (existingText.length > GLOBAL_REPLACE_EXISTING_MAX) return { ok: false, error: `Existing text must be ${GLOBAL_REPLACE_EXISTING_MAX} characters or fewer.` };
  if (hasMarkup(existingText)) return { ok: false, error: "Existing text can’t contain < or >." };

  if (!newText) return { ok: false, error: "Enter the replacement text — it can’t be blank (this prevents accidental bulk deletion)." };
  if (newText.length > GLOBAL_REPLACE_NEW_MAX) return { ok: false, error: `New text must be ${GLOBAL_REPLACE_NEW_MAX} characters or fewer.` };
  if (hasMarkup(newText)) return { ok: false, error: "New text can’t contain < or >." };

  return { ok: true, existingText, newText, caseInsensitive, partial };
}
