import "server-only";
import { defaultAppSettings, type AppSettings } from "@/data/app-settings";
import { mutateDb, readDb } from "./db";

// Global, non-CMS application settings — currently just maintenance mode. Kept separate from the
// content-management system on purpose: this is operational state an admin flips, not editable wording.

export async function getAppSettings(): Promise<AppSettings> {
  const db = await readDb();
  return db.appSettings ?? defaultAppSettings;
}

/**
 * Used by proxy.ts on (nearly) every request, so it must never throw and must never be the reason the whole
 * app becomes unreachable: a read failure fails OPEN (treated as "not in maintenance"), never closed.
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  try {
    return (await getAppSettings()).maintenanceMode;
  } catch {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean, actingAdminName: string): Promise<AppSettings> {
  return mutateDb((db) => {
    const current = db.appSettings ?? structuredClone(defaultAppSettings);
    const now = new Date().toISOString();
    const next: AppSettings = enabled
      ? { ...current, maintenanceMode: true, maintenanceEnabledAt: now, maintenanceEnabledBy: actingAdminName, maintenanceDisabledAt: null }
      : { ...current, maintenanceMode: false, maintenanceDisabledAt: now };
    db.appSettings = next;
    return next;
  });
}

export async function setMaintenanceEstimatedReturn(text: string): Promise<AppSettings> {
  return mutateDb((db) => {
    const current = db.appSettings ?? structuredClone(defaultAppSettings);
    const next: AppSettings = { ...current, maintenanceEstimatedReturn: text };
    db.appSettings = next;
    return next;
  });
}
