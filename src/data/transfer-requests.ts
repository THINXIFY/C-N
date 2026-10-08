// A log of submitted transfer-request FORMS only — there is no payment integration behind this. Submitting
// one never touches financial balances or transaction history (see src/data/records.ts, untouched by this
// file). The raw bank account number is never stored, only a masked version (see transfer-requests-service.ts).

export const TRANSFER_CURRENCIES = ["CAD", "USD", "EUR", "GBP"] as const;
export type TransferCurrency = (typeof TRANSFER_CURRENCIES)[number];

export const TRANSFER_TYPES = ["domestic", "international"] as const;
export type TransferType = (typeof TRANSFER_TYPES)[number];

/** User-facing labels only — never exposed as the SWIFT charge-bearer codes they conceptually map to
 *  (sender → OUR, recipient → BEN, shared → SHA). */
export const FEE_RESPONSIBILITIES = ["sender", "recipient", "shared"] as const;
export type FeeResponsibility = (typeof FEE_RESPONSIBILITIES)[number];

/** "submitted" / "unavailable" reflect only which result panel the user was shown (admin-controlled, see
 *  src/data/app-settings.ts's transferResultMode) — never "completed" / "settled" / "paid", since no real
 *  settlement has occurred either way. */
export const TRANSFER_REQUEST_STATUSES = ["submitted", "unavailable"] as const;
export type TransferRequestStatus = (typeof TRANSFER_REQUEST_STATUSES)[number];

export interface TransferRequest {
  id: string;
  userId: string;
  amount: number;
  currency: TransferCurrency;
  transferType: TransferType;
  reference: string;
  purpose: string;

  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientProvince: string;
  recipientPostalCode: string;
  recipientCountry: string;

  bankName: string;
  branchName: string;
  bankAddress: string;
  bankCity: string;
  bankProvince: string;
  bankPostalCode: string;
  institutionNumber: string;
  transitNumber: string;
  /** Masked except the last 4 digits (e.g. "•••• 4321"). The raw account number is never stored. */
  accountNumberMasked: string;
  swiftBic: string;
  iban: string;
  routingSortCode: string;
  intermediaryBank: string;

  feeResponsibility: FeeResponsibility;
  status: TransferRequestStatus;
  createdAt: string;
}
