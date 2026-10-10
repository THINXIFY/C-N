// Shared find/validate rules for the transfer-request form — imported by both the client form (instant
// per-field feedback, mirroring settings-validation.ts's pattern for the content editor) and the server action
// (authoritative; the client's validation is never trusted on its own). No I/O here.
import {
  ACCOUNT_TYPES,
  FEE_RESPONSIBILITIES,
  TRANSFER_CURRENCIES,
  TRANSFER_TYPES,
  type AccountType,
  type FeeResponsibility,
  type TransferCurrency,
  type TransferType,
} from "@/data/transfer-requests";

export const TRANSFER_MAX_AMOUNT = 10_000_000;
/** Deliberately not a strict 8/11-character SWIFT/BIC format check — banks quote this field inconsistently
 *  (with branch codes, spacing, etc.), so this only guards against abuse/garbage input, not format. */
export const SWIFT_BIC_MAX = 50;

export interface TransferFormInput {
  amount: string;
  currency: string;
  transferType: string;
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
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  swiftBic: string;
  iban: string;
  routingSortCode: string;
  intermediaryBank: string;

  feeResponsibility: string;
}

/** `accountNumber` here is the RAW number — the only place it may legally exist outside a form field. The
 *  caller (transfer-requests-service.ts) must mask it immediately and must never persist or log this value. */
export interface ValidatedTransferInput {
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
  /** Legacy Canadian-wire fields — never collected by the current form for any transfer type (replaced by
   *  routingNumber for Domestic Wire / ACH). Always "" for new requests; kept only so the stored shape still
   *  matches pre-existing records. */
  institutionNumber: string;
  transitNumber: string;
  /** ABA / ACH routing number — Domestic Wire and ACH Transfer only. */
  routingNumber: string;
  accountNumber: string;
  /** ACH Transfer only; "" otherwise. */
  accountType: AccountType | "";
  swiftBic: string;
  iban: string;
  routingSortCode: string;
  intermediaryBank: string;

  feeResponsibility: FeeResponsibility;
}

export type TransferFieldErrors = Record<string, string>;
export type TransferValidationResult = { ok: true; value: ValidatedTransferInput } | { ok: false; errors: TransferFieldErrors };

const hasMarkup = (s: string) => /[<>]/.test(s);
const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

function field(errors: TransferFieldErrors, key: string, raw: unknown, label: string, max: number, required: boolean): string {
  const value = clean(raw);
  if (required && !value) {
    errors[key] = `${label} is required.`;
    return value;
  }
  if (value.length > max) {
    errors[key] = `${label} must be ${max} characters or fewer.`;
    return value;
  }
  if (hasMarkup(value)) {
    errors[key] = `${label} can’t contain < or >.`;
  }
  return value;
}

export function validateTransferRequest(input: TransferFormInput): TransferValidationResult {
  const errors: TransferFieldErrors = {};

  const currency = clean(input.currency);
  if (!TRANSFER_CURRENCIES.includes(currency as TransferCurrency)) errors.currency = "Select a valid currency.";

  const transferType = clean(input.transferType);
  if (!TRANSFER_TYPES.includes(transferType as TransferType)) errors.transferType = "Select a valid transfer type.";

  const isDomestic = transferType === "domestic";
  const isAch = transferType === "ach";
  const isInternational = transferType === "international";
  const isIntraBank = transferType === "intrabank";
  const hasExternalBank = isDomestic || isAch || isInternational;
  const hasFullAddress = isDomestic || isInternational; // city/state/zip relevant beyond the street line
  const feeApplicable = isDomestic || isInternational;

  // Amount: strip grouping commas before anything else, so "700,000" parses as 700000, never as a rejected
  // or truncated value. The client already strips commas as the admin/user types; this is defense in depth
  // for any caller that doesn't go through the form (the server never trusts client-side parsing alone).
  const amountRaw = clean(input.amount).replace(/,/g, "");
  let amount = 0;
  if (!amountRaw) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) {
    errors.amount = "Enter a valid amount — digits only, with at most 2 decimal places.";
  } else {
    amount = Number(amountRaw);
    if (!(amount > 0)) errors.amount = "Amount must be greater than 0.";
    else if (amount > TRANSFER_MAX_AMOUNT) errors.amount = `Amount must be ${TRANSFER_MAX_AMOUNT.toLocaleString()} or less.`;
  }

  const reference = field(errors, "reference", input.reference, "Reference", 200, false);
  const purpose = field(errors, "purpose", input.purpose, "Purpose of transfer", 500, false);

  const recipientName = field(errors, "recipientName", input.recipientName, "Recipient name", 150, true);
  const recipientAddress = field(errors, "recipientAddress", input.recipientAddress, "Recipient address", 250, !isIntraBank);
  const recipientCity = field(errors, "recipientCity", input.recipientCity, "City", 100, isDomestic);
  const recipientProvince = field(errors, "recipientProvince", input.recipientProvince, "State / Province", 100, isDomestic);
  const recipientPostalCode = field(errors, "recipientPostalCode", input.recipientPostalCode, "ZIP / Postal code", 20, isDomestic);
  const recipientCountry = field(errors, "recipientCountry", input.recipientCountry, "Country", 100, isDomestic || isInternational);

  const bankName = field(errors, "bankName", input.bankName, "Bank name", 150, hasExternalBank);
  const branchName = field(errors, "branchName", input.branchName, "Branch name", 150, false);
  const bankAddress = field(errors, "bankAddress", input.bankAddress, "Bank / branch address", 250, hasFullAddress);
  const bankCity = field(errors, "bankCity", input.bankCity, "Bank city", 100, isDomestic);
  const bankProvince = field(errors, "bankProvince", input.bankProvince, "Bank state / province", 100, isDomestic);
  const bankPostalCode = field(errors, "bankPostalCode", input.bankPostalCode, "Bank ZIP / postal code", 20, isDomestic);

  const routingNumber = clean(input.routingNumber);
  if ((isDomestic || isAch) && !routingNumber) errors.routingNumber = "Routing / ABA number is required.";
  else if (routingNumber && !/^\d{9}$/.test(routingNumber)) errors.routingNumber = "Routing / ABA number must be exactly 9 digits.";

  const accountNumber = clean(input.accountNumber);
  if (!accountNumber) errors.accountNumber = "Account number is required.";
  else if (!/^\d{4,20}$/.test(accountNumber)) errors.accountNumber = "Account number must be 4–20 digits.";

  const accountTypeRaw = clean(input.accountType);
  if (accountTypeRaw && !ACCOUNT_TYPES.includes(accountTypeRaw as AccountType)) errors.accountType = "Select a valid account type.";
  const accountType: AccountType | "" = isAch && ACCOUNT_TYPES.includes(accountTypeRaw as AccountType) ? (accountTypeRaw as AccountType) : "";

  // SWIFT/BIC and IBAN are deliberately both optional, with no cross-field "one of them is required" rule.
  // Different destination countries/banking systems have different requirements (some use IBAN, some use
  // local routing schemes, some need neither for a given correspondent relationship) — a single global
  // either/or rule would be wrong for a meaningful fraction of real destinations. Each field is still
  // format-checked WHEN a value is actually provided: SWIFT/BIC against a permissive charset (banks quote
  // this field inconsistently — no exact 8/11-char check, just enough to block garbage/abuse), IBAN against
  // a generous length cap via field(). This is intentional, not an oversight — do not add a required-one-of
  // rule here without a specific, country-aware reason to do so.
  const swiftBic = clean(input.swiftBic);
  if (swiftBic.length > SWIFT_BIC_MAX) errors.swiftBic = `SWIFT / BIC must be ${SWIFT_BIC_MAX} characters or fewer.`;
  else if (swiftBic && !/^[A-Za-z0-9 -]+$/.test(swiftBic)) errors.swiftBic = "SWIFT / BIC can only contain letters, numbers, spaces and hyphens.";

  const iban = field(errors, "iban", input.iban, "IBAN", 34, false);
  const routingSortCode = field(errors, "routingSortCode", input.routingSortCode, "Routing / sort code", 20, false);
  const intermediaryBank = field(errors, "intermediaryBank", input.intermediaryBank, "Intermediary bank", 200, false);

  const feeResponsibilityRaw = clean(input.feeResponsibility);
  if (feeApplicable && !FEE_RESPONSIBILITIES.includes(feeResponsibilityRaw as FeeResponsibility)) errors.feeResponsibility = "Select who pays the transfer fees.";
  const feeResponsibility: FeeResponsibility = FEE_RESPONSIBILITIES.includes(feeResponsibilityRaw as FeeResponsibility) ? (feeResponsibilityRaw as FeeResponsibility) : "shared";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      amount,
      currency: currency as TransferCurrency,
      transferType: transferType as TransferType,
      reference,
      purpose,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientProvince,
      recipientPostalCode,
      recipientCountry,
      bankName,
      branchName,
      bankAddress,
      bankCity,
      bankProvince,
      bankPostalCode,
      institutionNumber: "",
      transitNumber: "",
      routingNumber,
      accountNumber,
      accountType,
      swiftBic,
      iban,
      routingSortCode,
      intermediaryBank,
      feeResponsibility,
    },
  };
}
