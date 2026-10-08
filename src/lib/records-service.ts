import "server-only";
import {
  accountSeed,
  notificationsSeed,
  transactionsSeed,
  type NotificationRecord,
  type TransactionRecord,
} from "@/data/records";
import { DEFAULT_SUBTITLE, type DbUser, type UserSettings } from "@/data/users";
import { sortTransactions, summarize, type TransactionSummary } from "./transactions";
import { getContentSettings, getFinancialOwnerId, getUserSettings } from "./users-service";

// Data access seam.
//  • FINANCIAL data (balance, transactions, totals) comes from src/data/records.ts and is READ-ONLY.
//    It belongs to one record owner; other accounts see no financial record. There are intentionally no
//    create/update/delete functions for it anywhere in the app.
//  • PRESENTATION (names, status, labels, support text, display preferences) comes from the user store
//    (users, user_settings, content_settings), which the admin panel may edit.

export interface Presentation {
  holderName: string;
  businessName: string;
  photoPath: string | null;
  recordType: string;
  status: string;
  greeting: string;
  subtitle: string;
  balanceHiddenDefault: boolean;
  showRecordInfo: boolean;
  showQuickActions: boolean;
}

export function toPresentation(user: Pick<DbUser, "displayName" | "businessName" | "profilePhotoPath">, s: UserSettings): Presentation {
  return {
    holderName: user.displayName,
    businessName: user.businessName,
    photoPath: user.profilePhotoPath ?? null,
    recordType: s.recordType,
    status: s.recordStatus,
    greeting: s.dashboardGreeting,
    subtitle: s.dashboardSubtitle || DEFAULT_SUBTITLE,
    balanceHiddenDefault: s.balanceHiddenDefault,
    showRecordInfo: s.showRecordInfo,
    showQuickActions: s.showQuickActions,
  };
}

export async function getAccount(user: Pick<DbUser, "id" | "displayName" | "businessName" | "profilePhotoPath">): Promise<Presentation> {
  return toPresentation(user, await getUserSettings(user.id));
}

export async function getContent() {
  return getContentSettings();
}

export async function getNotifications(): Promise<NotificationRecord[]> {
  return notificationsSeed;
}

// ---------- financial record (read-only) ----------

export interface FinancialRecord {
  balance: number;
  currency: string;
  transactions: TransactionRecord[]; // newest first
  recent: TransactionRecord[];
  summary: TransactionSummary;
}

/** The read-only financial record. Admins may view it; users only see it if it is linked to their account. */
export async function getFinancialSnapshot(): Promise<FinancialRecord> {
  const transactions = sortTransactions(transactionsSeed, "newest");
  return {
    balance: accountSeed.balance,
    currency: accountSeed.currency,
    transactions,
    recent: transactions.slice(0, 5),
    summary: summarize(transactionsSeed),
  };
}

export async function getFinancialForUser(userId: string): Promise<FinancialRecord | null> {
  return (await getFinancialOwnerId()) === userId ? getFinancialSnapshot() : null;
}

/** Helper accessors, kept for callers that want a single value. */
export async function getTransactions(): Promise<TransactionRecord[]> {
  return (await getFinancialSnapshot()).transactions;
}
export async function getRecentTransactions(limit = 5): Promise<TransactionRecord[]> {
  return (await getTransactions()).slice(0, limit);
}
export async function getTransactionById(id: string): Promise<TransactionRecord | null> {
  return transactionsSeed.find((t) => t.id === id) ?? null;
}
export async function getTotalCredits(): Promise<number> {
  return summarize(transactionsSeed).totalCredits;
}
export async function getTotalDebits(): Promise<number> {
  return summarize(transactionsSeed).totalDebits;
}
export async function getTransactionCount(): Promise<number> {
  return transactionsSeed.length;
}
export async function getSummary(): Promise<TransactionSummary> {
  return summarize(transactionsSeed);
}
