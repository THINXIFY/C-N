// Global, non-CMS application settings. Currently just maintenance mode: whether the normal user-side
// application is available. This is operational state (an admin-flipped switch), not editable wording, so it
// deliberately does NOT live in the content-management system (src/data/settings.ts) — see
// src/lib/app-settings-service.ts for reads/writes and src/proxy.ts for enforcement.
/** Which outcome a submitted transfer request shows the user. There is no real payment integration yet, so
 *  neither value means money actually moved — "accepted" only means the request was received for processing. */
export type TransferResultMode = "accepted" | "unavailable";

export interface AppSettings {
  maintenanceMode: boolean;
  /** Set when maintenance mode is turned on; kept (not cleared) after it's turned off, as a simple history. */
  maintenanceEnabledAt: string | null;
  maintenanceDisabledAt: string | null;
  /** Display name of the admin who last turned it on. */
  maintenanceEnabledBy: string | null;
  /** Optional free-text note shown on the maintenance page (e.g. "Today at 6:00 PM"). Hidden when blank. */
  maintenanceEstimatedReturn: string;
  /** Whether /dashboard/transfer and its nav item are available to normal users at all. */
  transferEnabled: boolean;
  /** Which result a user sees after submitting a transfer request — admin-controlled since there is no real
   *  settlement integration yet. Never affects balances or transaction history either way. */
  transferResultMode: TransferResultMode;
}

export const defaultAppSettings: AppSettings = {
  maintenanceMode: false,
  maintenanceEnabledAt: null,
  maintenanceDisabledAt: null,
  maintenanceEnabledBy: null,
  maintenanceEstimatedReturn: "",
  transferEnabled: true,
  transferResultMode: "accepted",
};
