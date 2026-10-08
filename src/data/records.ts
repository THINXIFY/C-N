// Source records for the dashboard. Everything here is an internally RECORDED value, not a verified bank figure.
// Only supplied data lives here — nothing is invented. Phase 3 replaces consumers of this file
// (see src/lib/records-service.ts) with database-backed reads.

export type TransactionType = "credit" | "debit";

export interface AccountRecord {
  holderName: string;
  businessName: string;
  recordType: string;
  status: string;
  currency: string; // ISO code used only for number formatting
  balance: number;
}

export interface TransactionRecord {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  reference: string;
  type: TransactionType;
  amount: number; // always positive; `type` carries the sign
  status: "Recorded";
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
}

export const accountSeed: AccountRecord = {
  holderName: "Richard Reitz",
  businessName: "AGRO-WIND ENERGY SOLUTIONS INC.",
  recordType: "Private Financial Record",
  status: "Active / Recorded",
  currency: "USD",
  balance: 1922550,
};

export const transactionsSeed: TransactionRecord[] = [
  { id: "tx-01", date: "2026-10-04", description: "XENAR 545", reference: "-/0000765554", type: "debit", amount: 202000, status: "Recorded" },
  { id: "tx-02", date: "2026-10-02", description: "XENAR 545", reference: "-/0000765554", type: "debit", amount: 65000, status: "Recorded" },
  { id: "tx-03", date: "2026-09-27", description: "GONAR GROUP Kits & tools /8903", reference: "-/00230098", type: "debit", amount: 97000, status: "Recorded" },
  { id: "tx-04", date: "2026-09-27", description: "GONAR GROUP Kits & tools /8903", reference: "-/766600000054", type: "debit", amount: 140000, status: "Recorded" },
  { id: "tx-05", date: "2026-08-20", description: "CRH Ireland", reference: "-/98765432/09857", type: "credit", amount: 170000, status: "Recorded" },
  { id: "tx-06", date: "2026-08-20", description: "CRH Ireland", reference: "CBS/900757573/20987", type: "credit", amount: 154000, status: "Recorded" },
  { id: "tx-07", date: "2026-02-01", description: "RF /8903", reference: "-/91235678/16164", type: "debit", amount: 75000, status: "Recorded" },
  { id: "tx-08", date: "2025-06-05", description: "Gulf coast inc.", reference: "-/90464664/43213", type: "debit", amount: 40000, status: "Recorded" },
  { id: "tx-09", date: "2025-04-08", description: "حكومة قطر/Qatar/RP-0823-22-", reference: "-/90464664/43213", type: "credit", amount: 110000, status: "Recorded" },
  { id: "tx-10", date: "2025-04-05", description: "TR-P BROTHERS", reference: "-/90464664/43213", type: "debit", amount: 340000, status: "Recorded" },
  { id: "tx-11", date: "2022-03-27", description: "GONAK CONSTRUCTIONS", reference: "-/90464664/43213", type: "debit", amount: 51450, status: "Recorded" },
];

// Internal dashboard messages only — nothing here implies a live bank connection.
export const notificationsSeed: NotificationRecord[] = [
  { id: "n1", title: "Records loaded", body: "Record dashboard loaded successfully." },
  { id: "n2", title: "Session active", body: "Your session is active." },
];
