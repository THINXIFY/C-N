import "server-only";
import { defaultCustomCssSettings, type CustomCssScope, type CustomCssSettings } from "@/data/custom-css";
import { mutateDb, readDb } from "./db";

// Admin-authored CSS for user-facing pages only. Kept separate from the content-management system on
// purpose — this is presentation code, not editable wording.

export async function getCustomCssSettings(): Promise<CustomCssSettings> {
  const db = await readDb();
  return db.customCss ?? defaultCustomCssSettings;
}

/**
 * Used directly by CustomCssInjector on every user-facing page render, so it must never throw and must fail
 * safely: any read error, or anything off, simply renders no CSS rather than breaking the page.
 */
export async function getActiveCustomCss(scope: CustomCssScope): Promise<string> {
  try {
    const settings = await getCustomCssSettings();
    if (!settings.enabled || !settings.css) return "";
    const applies = settings.scopes.includes("all-user-pages") || settings.scopes.includes(scope);
    return applies ? settings.css : "";
  } catch {
    return "";
  }
}

export async function saveCustomCss(css: string, scopes: CustomCssScope[]): Promise<CustomCssSettings> {
  return mutateDb((db) => {
    const current = db.customCss ?? structuredClone(defaultCustomCssSettings);
    const next: CustomCssSettings = { ...current, css, scopes, updatedAt: new Date().toISOString() };
    db.customCss = next;
    return next;
  });
}

export async function setCustomCssEnabled(enabled: boolean): Promise<CustomCssSettings> {
  return mutateDb((db) => {
    const current = db.customCss ?? structuredClone(defaultCustomCssSettings);
    const next: CustomCssSettings = { ...current, enabled };
    db.customCss = next;
    return next;
  });
}

/** Recovery action: permanently empties the stored CSS text. Scopes and the enabled flag are left as-is. */
export async function clearCustomCss(): Promise<CustomCssSettings> {
  return mutateDb((db) => {
    const current = db.customCss ?? structuredClone(defaultCustomCssSettings);
    const next: CustomCssSettings = { ...current, css: "", updatedAt: new Date().toISOString() };
    db.customCss = next;
    return next;
  });
}
