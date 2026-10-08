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

export async function createTransferRequest(userId: string, value: ValidatedTransferInput, status: TransferRequestStatus): Promise<TransferRequest> {
  const { accountNumber, ...rest } = value;
  const record: TransferRequest = {
    id: randomUUID(),
    userId,
    ...rest,
    accountNumberMasked: maskAccountNumber(accountNumber),
    status,
    createdAt: new Date().toISOString(),
  };
  return mutateDb((db) => {
    db.transferRequests = [...(db.transferRequests ?? []), record];
    return record;
  });
}

export async function listTransferRequests(): Promise<TransferRequest[]> {
  const db = await readDb();
  return [...(db.transferRequests ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
