import "server-only";
import { defaultAppSettings, type AppSettings, type TransferResultMode } from "@/data/app-settings";
import { mutateDb, readDb } from "./db";

// Global, non-CMS application settings — currently just maintenance mode. Kept separate from the
// content-management system on purpose: this is operational state an admin flips, not editable wording.

/** Shallow-merges stored settings over the defaults, so a field added to AppSettings after some installs
 *  already have a stored (older-shaped) appSettings object still resolves to its default instead of
 *  `undefined` — the same backward-compatibility concern mergeUserContent handles for CMS content. */
export async function getAppSettings(): Promise<AppSettings> {
  const db = await readDb();
  return { ...defaultAppSettings, ...db.appSettings };
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

export async function setTransferEnabled(enabled: boolean): Promise<AppSettings> {
  return mutateDb((db) => {
    const current = db.appSettings ?? structuredClone(defaultAppSettings);
    const next: AppSettings = { ...current, transferEnabled: enabled };
    db.appSettings = next;
    return next;
  });
}

export async function setTransferResultMode(mode: TransferResultMode): Promise<AppSettings> {
  return mutateDb((db) => {
    const current = db.appSettings ?? structuredClone(defaultAppSettings);
    const next: AppSettings = { ...current, transferResultMode: mode };
    db.appSettings = next;
    return next;
  });
}
