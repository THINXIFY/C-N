// Admin-authored CSS injected into user-facing pages only — never into /admin or /admin/login (see
// src/components/shared/CustomCssInjector.tsx, which is only ever placed on user-facing pages). This is
// presentation-only operational state, not wording, so it deliberately lives outside the content-management
// system in src/data/settings.ts, the same way src/data/app-settings.ts does for maintenance mode.

export const CUSTOM_CSS_SCOPES = ["all-user-pages", "login", "dashboard", "transactions", "account", "support", "maintenance"] as const;
export type CustomCssScope = (typeof CUSTOM_CSS_SCOPES)[number];

export const CUSTOM_CSS_SCOPE_LABELS: Record<CustomCssScope, string> = {
  "all-user-pages": "All User Pages",
  login: "Login Only",
  dashboard: "Dashboard Page",
  transactions: "Transactions Page",
  account: "Account Page",
  support: "Support Page",
  maintenance: "Maintenance Page",
};

/** Where "Open User Preview" sends the admin for a given scope. */
export const CUSTOM_CSS_SCOPE_PREVIEW_URL: Record<CustomCssScope, string> = {
  "all-user-pages": "/dashboard",
  login: "/login",
  dashboard: "/dashboard",
  transactions: "/dashboard/transactions",
  account: "/dashboard/account",
  support: "/dashboard/support",
  maintenance: "/maintenance",
};

export interface CustomCssSettings {
  enabled: boolean;
  css: string;
  scopes: CustomCssScope[];
  updatedAt: string | null;
}

export const defaultCustomCssSettings: CustomCssSettings = {
  enabled: false,
  css: "",
  scopes: ["all-user-pages"],
  updatedAt: null,
};

/** 50 KB, measured in bytes (not characters) so multi-byte text can't sneak past a character-count limit. */
export const CUSTOM_CSS_MAX_BYTES = 50 * 1024;
