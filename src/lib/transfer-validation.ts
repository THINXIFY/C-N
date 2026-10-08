// Shared find/validate rules for the transfer-request form — imported by both the client form (instant
// per-field feedback, mirroring settings-validation.ts's pattern for the content editor) and the server action
// (authoritative; the client's validation is never trusted on its own). No I/O here.
import { FEE_RESPONSIBILITIES, TRANSFER_CURRENCIES, TRANSFER_TYPES, type FeeResponsibility, type TransferCurrency, type TransferType } from "@/data/transfer-requests";

export const TRANSFER_MAX_AMOUNT = 10_000_000;

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
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
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
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
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

  const amountRaw = clean(input.amount);
  let amount = 0;
  if (!amountRaw) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) {
    errors.amount = "Enter a valid amount with at most 2 decimal places.";
  } else {
    amount = Number(amountRaw);
    if (!(amount > 0)) errors.amount = "Amount must be greater than 0.";
    else if (amount > TRANSFER_MAX_AMOUNT) errors.amount = `Amount must be ${TRANSFER_MAX_AMOUNT.toLocaleString()} or less.`;
  }

  const reference = field(errors, "reference", input.reference, "Reference", 200, false);
  const purpose = field(errors, "purpose", input.purpose, "Purpose of transfer", 500, false);

  const recipientName = field(errors, "recipientName", input.recipientName, "Recipient name", 150, true);
  const recipientAddress = field(errors, "recipientAddress", input.recipientAddress, "Recipient address", 250, true);
  const recipientCity = field(errors, "recipientCity", input.recipientCity, "City", 100, true);
  const recipientProvince = field(errors, "recipientProvince", input.recipientProvince, "Province / State", 100, isDomestic);
  const recipientPostalCode = field(errors, "recipientPostalCode", input.recipientPostalCode, "Postal / ZIP code", 20, true);
  const recipientCountry = field(errors, "recipientCountry", input.recipientCountry, "Country", 100, true);

  const bankName = field(errors, "bankName", input.bankName, "Bank name", 150, true);
  const branchName = field(errors, "branchName", input.branchName, "Branch name", 150, false);
  const bankAddress = field(errors, "bankAddress", input.bankAddress, "Bank / branch address", 250, true);
  const bankCity = field(errors, "bankCity", input.bankCity, "Bank city", 100, true);
  const bankProvince = field(errors, "bankProvince", input.bankProvince, "Bank province", 100, isDomestic);
  const bankPostalCode = field(errors, "bankPostalCode", input.bankPostalCode, "Bank postal code", 20, isDomestic);

  const institutionNumber = clean(input.institutionNumber);
  if (isDomestic && !institutionNumber) errors.institutionNumber = "Institution number is required.";
  else if (institutionNumber && !/^\d{3}$/.test(institutionNumber)) errors.institutionNumber = "Institution number must be exactly 3 digits.";

  const transitNumber = clean(input.transitNumber);
  if (isDomestic && !transitNumber) errors.transitNumber = "Transit number is required.";
  else if (transitNumber && !/^\d{5}$/.test(transitNumber)) errors.transitNumber = "Transit number must be exactly 5 digits.";

  const accountNumber = clean(input.accountNumber);
  if (!accountNumber) errors.accountNumber = "Account number is required.";
  else if (!/^\d{4,20}$/.test(accountNumber)) errors.accountNumber = "Account number must be 4–20 digits.";

  const swiftBic = clean(input.swiftBic).toUpperCase();
  if (swiftBic && !/^[A-Z0-9]{8}$|^[A-Z0-9]{11}$/.test(swiftBic)) errors.swiftBic = "SWIFT / BIC must be 8 or 11 alphanumeric characters.";

  const iban = field(errors, "iban", input.iban, "IBAN", 34, false);
  const routingSortCode = field(errors, "routingSortCode", input.routingSortCode, "Routing / sort code", 20, false);
  const intermediaryBank = field(errors, "intermediaryBank", input.intermediaryBank, "Intermediary bank", 200, false);

  const feeResponsibility = clean(input.feeResponsibility);
  if (!FEE_RESPONSIBILITIES.includes(feeResponsibility as FeeResponsibility)) errors.feeResponsibility = "Select who pays the transfer fees.";

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
      institutionNumber,
      transitNumber,
      accountNumber,
      swiftBic,
      iban,
      routingSortCode,
      intermediaryBank,
      feeResponsibility: feeResponsibility as FeeResponsibility,
    },
  };
}
