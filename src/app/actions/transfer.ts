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
    await createTransferRequest(user.id, result.value, status);
  } catch {
    return { ok: false, error: "Unable to submit your request. Please try again." };
  }
  return { ok: true, status };
}
