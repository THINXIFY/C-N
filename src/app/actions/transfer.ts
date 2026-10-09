"use server";

import { getAppSettings } from "@/lib/app-settings-service";
import { getCurrentUser } from "@/lib/auth";
import { createTransferRequest } from "@/lib/transfer-requests-service";
import { validateTransferRequest, type TransferFieldErrors, type TransferFormInput } from "@/lib/transfer-validation";

// The only user-facing (non-admin) mutation in the app. Submitting a transfer request never touches financial
// balances or transaction history (src/data/records.ts) — it only logs the request itself, with the account
// number masked before it's ever written to disk. There is no payment integration: the "accepted"/"unavailable"
// result is an admin-controlled display choice (src/data/app-settings.ts), never a real settlement outcome.

async function requireUserCaller() {
  const user = await getCurrentUser();
  return user?.role === "user" ? user : null;
}

export interface SubmitTransferResult {
  ok: boolean;
  error?: string;
  fieldErrors?: TransferFieldErrors;
  status?: "submitted" | "unavailable";
  /** The request's permanent, server-generated reference ("TRX-YYYYMMDD-XXXXXXXX") and timestamp — set only
   *  when a request record was actually created (never fabricated client-side, never regenerated on refresh). */
  psid?: string;
  createdAt?: string;
}

export async function submitTransferRequestAction(input: TransferFormInput): Promise<SubmitTransferResult> {
  const user = await requireUserCaller();
  if (!user) return { ok: false, error: "You don’t have permission to do that." };

  const settings = await getAppSettings();
  if (!settings.transferEnabled) return { ok: false, error: "Transfer requests are currently unavailable." };

  const result = validateTransferRequest(input);
  if (!result.ok) return { ok: false, fieldErrors: result.errors };

  const status = settings.transferResultMode === "accepted" ? "submitted" : "unavailable";
  try {
    const record = await createTransferRequest(user.id, result.value, status);
    return { ok: true, status, psid: record.psid, createdAt: record.createdAt };
  } catch {
    return { ok: false, error: "Unable to submit your request. Please try again." };
  }
}
