import "server-only";
import { randomUUID } from "node:crypto";
import type { TransferRequest, TransferRequestStatus } from "@/data/transfer-requests";
import { mutateDb, readDb } from "./db";
import type { ValidatedTransferInput } from "./transfer-validation";

/** Keeps only the last 4 digits. The raw account number passed in is never stored or logged — it exists only
 *  for the lifetime of this call. */
function maskAccountNumber(accountNumber: string): string {
  const last4 = accountNumber.slice(-4);
  return `•••• ${last4}`;
}

const PSID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomPsidSuffix(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += PSID_ALPHABET[Math.floor(Math.random() * PSID_ALPHABET.length)];
  return s;
}

/** "TRX-YYYYMMDD-XXXXXXXX" (UTC date, matching createdAt). 8 random alphanumeric chars gives 36^8 (~2.8
 *  trillion) combinations, so a collision is already vanishingly unlikely — but every existing PSID is still
 *  checked and the draw retried on a collision, so a PSID is never reused even in principle. */
function generateUniquePsid(existing: ReadonlySet<string>): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let psid: string;
  do {
    psid = `TRX-${datePart}-${randomPsidSuffix()}`;
  } while (existing.has(psid));
  return psid;
}

export async function createTransferRequest(userId: string, value: ValidatedTransferInput, status: TransferRequestStatus): Promise<TransferRequest> {
  const { accountNumber, ...rest } = value;
  return mutateDb((db) => {
    const existingPsids = new Set((db.transferRequests ?? []).map((r) => r.psid));
    const record: TransferRequest = {
      id: randomUUID(),
      psid: generateUniquePsid(existingPsids),
      userId,
      ...rest,
      accountNumberMasked: maskAccountNumber(accountNumber),
      status,
      createdAt: new Date().toISOString(),
    };
    db.transferRequests = [...(db.transferRequests ?? []), record];
    return record;
  });
}

export async function listTransferRequests(): Promise<TransferRequest[]> {
  const db = await readDb();
  return [...(db.transferRequests ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
