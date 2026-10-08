// Pure validation + field metadata for admin-editable user-facing content. Shared by the admin editor (instant
// feedback + field labels/helpers) and the server actions (authoritative). One FIELD_SPECS entry per editable
// string field drives both, so adding a field means adding one spec line rather than writing bespoke JSX and a
// bespoke validator call.
import { SUPPORT_TOPIC_COUNT, type UserContent } from "@/data/settings";

export type FieldErrors = Record<string, string>;
export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
export const cleanMultiline = (v: unknown) => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "");
const hasMarkup = (s: string) => /[<>]/.test(s);

export function text(errors: FieldErrors, key: string, raw: unknown, label: string, max: number, opts: { required?: boolean; multiline?: boolean } = {}): string {
  const value = opts.multiline ? cleanMultiline(raw) : clean(raw);
  if (opts.required !== false && !value) errors[key] = `${label} is required.`;
  else if (value.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
  else if (hasMarkup(value)) errors[key] = `${label} can’t contain < or >.`;
  return value;
}

export interface FieldSpec {
  key: string;
  label: string;
  helper: string;
  max: number;
  multiline?: boolean;
}

// ---------- field specs, grouped by admin-editor tab ----------

export const LOGIN_FIELDS: FieldSpec[] = [
  { key: "headline1", label: "Headline — line 1", helper: "Large marketing headline on the login screen (desktop left panel).", max: 100 },
  { key: "headline2", label: "Headline — line 2", helper: "Second line of the login headline.", max: 100 },
  { key: "tagline", label: "Tagline", helper: "Supporting sentence under the headline.", max: 250 },
  { key: "trustPoint1", label: "Trust point 1", helper: "First short badge under the login buttons (with an icon).", max: 40 },
  { key: "trustPoint2", label: "Trust point 2", helper: "Second short badge under the login buttons.", max: 40 },
  { key: "welcomeTitle", label: "Sign-in title", helper: "Heading above the username/password form.", max: 100 },
  { key: "welcomeSubtitle", label: "Sign-in subtitle", helper: "Line under the sign-in title.", max: 250 },
  { key: "usernameLabel", label: "Username field label", helper: "Label above the username input.", max: 40 },
  { key: "usernamePlaceholder", label: "Username placeholder", helper: "Placeholder text inside the username input.", max: 60 },
  { key: "passwordLabel", label: "Password field label", helper: "Label above the password input.", max: 40 },
  { key: "passwordPlaceholder", label: "Password placeholder", helper: "Placeholder text inside the password input.", max: 60 },
  { key: "rememberMeLabel", label: "“Remember me” text", helper: "Text next to the remember-me checkbox.", max: 60 },
  { key: "continueButton", label: "Continue button", helper: "Step 1 submit button label.", max: 40 },
  { key: "securityTitle", label: "Security step title", helper: "Heading shown on step 2 (access code).", max: 100 },
  { key: "securitySubtitle", label: "Security step subtitle", helper: "Line under the step-2 title.", max: 250 },
  { key: "accessCodeLabel", label: "Access code field label", helper: "Label above the access-code input.", max: 40 },
  { key: "accessCodePlaceholder", label: "Access code placeholder", helper: "Placeholder text inside the access-code input.", max: 60 },
  { key: "verifyButton", label: "Verify button", helper: "Step 2 submit button label.", max: 40 },
  { key: "backButton", label: "Back button", helper: "Returns from step 2 to step 1.", max: 40 },
  { key: "helpText", label: "Help line", helper: "Shown under the form on both login steps.", max: 150 },
];

export const NAVIGATION_FIELDS: FieldSpec[] = [
  { key: "overview", label: "Overview", helper: "Sidebar, topbar and mobile menu label. Links to /dashboard.", max: 40 },
  { key: "transactions", label: "Transactions", helper: "Links to /dashboard/transactions.", max: 40 },
  { key: "account", label: "Account", helper: "Links to /dashboard/account.", max: 40 },
  { key: "support", label: "Support", helper: "Links to /dashboard/support.", max: 40 },
  { key: "logout", label: "Sign out", helper: "Sidebar sign-out button and the topbar profile menu.", max: 40 },
];

export const DASHBOARD_FIELDS: FieldSpec[] = [
  { key: "goodMorning", label: "Morning greeting", helper: "Used before noon when no custom greeting is set for the user.", max: 30 },
  { key: "goodAfternoon", label: "Afternoon greeting", helper: "Used from noon to 6pm.", max: 30 },
  { key: "goodEvening", label: "Evening greeting", helper: "Used after 6pm.", max: 30 },
  { key: "subtitle", label: "Default subtitle", helper: "Shown under the greeting when a user has no custom subtitle.", max: 250 },
  { key: "balanceLabel", label: "Balance card title", helper: "Heading on the dark balance card.", max: 60 },
  { key: "creditsLabel", label: "Credits card label", helper: "Summary card title.", max: 40 },
  { key: "creditsDescription", label: "Credits card description", helper: "Shown as “{count} …” under the credits total.", max: 60 },
  { key: "debitsLabel", label: "Debits card label", helper: "Summary card title.", max: 40 },
  { key: "debitsDescription", label: "Debits card description", helper: "Shown as “{count} …” under the debits total.", max: 60 },
  { key: "transactionsLabel", label: "Transactions card label", helper: "Summary card title.", max: 40 },
  { key: "transactionsDescription", label: "Transactions card description", helper: "Shown under the transaction count.", max: 60 },
  { key: "latestActivityLabel", label: "Latest Activity card label", helper: "Summary card title.", max: 40 },
  { key: "latestActivityDescription", label: "Latest Activity card description", helper: "Shown under the latest date.", max: 60 },
  { key: "recentHeading", label: "Recent transactions heading", helper: "Displayed above the recent activity table on the dashboard.", max: 100 },
  { key: "viewAllText", label: "“View all” link", helper: "Links to the full transactions page.", max: 40 },
  { key: "quickActionsHeading", label: "Quick actions heading", helper: "Title of the quick-actions card.", max: 100 },
  { key: "quickAction1Label", label: "Quick action 1 — label", helper: "Links to the transactions page.", max: 60 },
  { key: "quickAction1Hint", label: "Quick action 1 — hint", helper: "Small description under the label.", max: 100 },
  { key: "quickAction2Label", label: "Quick action 2 — label", helper: "Links to the account page.", max: 60 },
  { key: "quickAction2Hint", label: "Quick action 2 — hint", helper: "Small description under the label.", max: 100 },
  { key: "quickAction3Label", label: "Quick action 3 — label", helper: "Links to the support page.", max: 60 },
  { key: "quickAction3Hint", label: "Quick action 3 — hint", helper: "Small description under the label.", max: 100 },
  { key: "recordInfoHeading", label: "Record information heading", helper: "Title of the holder/business summary card.", max: 100 },
  { key: "detailsLinkText", label: "“Details” link", helper: "Links to the account page from the record-information card.", max: 40 },
  { key: "recordInfoHolderLabel", label: "“Account holder” field label", helper: "Field label in the record-information card.", max: 40 },
  { key: "recordInfoBusinessLabel", label: "“Business” field label", helper: "Field label in the record-information card.", max: 40 },
  { key: "recordInfoTypeLabel", label: "“Record type” field label", helper: "Field label in the record-information card.", max: 40 },
  { key: "recordInfoStatusLabel", label: "“Record status” field label", helper: "Field label in the record-information card.", max: 40 },
  { key: "noRecordTitle", label: "No-record title", helper: "Shown when an account has no linked financial record.", max: 100 },
  { key: "noRecordDescription", label: "No-record description", helper: "Full wording on the dashboard overview.", max: 300, multiline: true },
  { key: "noRecordDescriptionCompact", label: "No-record description (compact)", helper: "Shorter wording used on the transactions page.", max: 300, multiline: true },
];

export const TRANSACTIONS_FIELDS: FieldSpec[] = [
  { key: "title", label: "Page title", helper: "Heading at the top of /dashboard/transactions.", max: 100 },
  { key: "subtitle", label: "Page subtitle", helper: "Line under the page title.", max: 250 },
  { key: "searchPlaceholder", label: "Search placeholder", helper: "Placeholder text in the search field.", max: 60 },
  { key: "filterTypeLabel", label: "“Type” filter group label", helper: "Heading above the All/Credits/Debits toggle.", max: 30 },
  { key: "typeAllLabel", label: "“All” filter", helper: "Type filter: shows every record.", max: 30 },
  { key: "typeCreditsLabel", label: "“Credits” filter", helper: "Type filter.", max: 30 },
  { key: "typeDebitsLabel", label: "“Debits” filter", helper: "Type filter.", max: 30 },
  { key: "filterDateLabel", label: "“Date” filter label", helper: "Label above the date dropdown.", max: 30 },
  { key: "dateAllTimeLabel", label: "“All time” date option", helper: "Default date-filter option.", max: 30 },
  { key: "filterAmountLabel", label: "“Amount” filter label", helper: "Label above the amount dropdown.", max: 30 },
  { key: "amountAllLabel", label: "“All amounts” option", helper: "Default amount-filter option.", max: 40 },
  { key: "amountUnder100Label", label: "Amount filter — under $100k", helper: "Describes amounts below $100,000.", max: 40 },
  { key: "amount100to199Label", label: "Amount filter — $100k–$199k", helper: "Describes amounts in that range.", max: 40 },
  { key: "amount200plusLabel", label: "Amount filter — $200k+", helper: "Describes amounts at or above $200,000.", max: 40 },
  { key: "filterSortLabel", label: "“Sort by” filter label", helper: "Label above the sort dropdown.", max: 30 },
  { key: "sortNewestLabel", label: "Sort — newest first", helper: "Default sort option.", max: 40 },
  { key: "sortOldestLabel", label: "Sort — oldest first", helper: "", max: 40 },
  { key: "sortHighestLabel", label: "Sort — highest amount", helper: "", max: 40 },
  { key: "sortLowestLabel", label: "Sort — lowest amount", helper: "", max: 40 },
  { key: "clearFiltersText", label: "“Clear filters” button", helper: "Shown once any filter or search is active.", max: 40 },
  { key: "resultCountTemplate", label: "Result-count text", helper: "Use {shown} and {total} where the numbers should appear.", max: 100 },
  { key: "emptyTitle", label: "Empty-results title", helper: "Shown when no transactions match the current filters.", max: 100 },
  { key: "emptyDescription", label: "Empty-results description", helper: "", max: 250 },
  { key: "tableDate", label: "Column — Date", helper: "Desktop table header.", max: 30 },
  { key: "tableDescription", label: "Column — Description", helper: "Desktop table header.", max: 30 },
  { key: "tableReference", label: "Column — Reference", helper: "Desktop table header.", max: 30 },
  { key: "tableType", label: "Column — Type", helper: "Desktop table header.", max: 30 },
  { key: "tableAmount", label: "Column — Amount", helper: "Desktop table header.", max: 30 },
  { key: "detailTitle", label: "Detail panel title", helper: "Title of the transaction-details drawer.", max: 100 },
  { key: "detailDescriptionLabel", label: "Detail — Description label", helper: "", max: 40 },
  { key: "detailAmountLabel", label: "Detail — Amount label", helper: "", max: 40 },
  { key: "detailTypeLabel", label: "Detail — Type label", helper: "", max: 40 },
  { key: "detailDateLabel", label: "Detail — Date label", helper: "", max: 40 },
  { key: "detailReferenceLabel", label: "Detail — Reference label", helper: "", max: 40 },
  { key: "detailStatusLabel", label: "Detail — Status label", helper: "", max: 40 },
  { key: "copyReferenceButton", label: "Copy Reference button", helper: "", max: 40 },
  { key: "copiedText", label: "Copied button state", helper: "Briefly replaces the Copy Reference button after copying.", max: 40 },
  { key: "referenceCopiedToast", label: "“Reference copied” toast", helper: "", max: 100 },
  { key: "copyFailedToast", label: "Copy-failed toast", helper: "Shown if the browser blocks clipboard access.", max: 150 },
  { key: "creditLabel", label: "“Credit” badge text", helper: "Shown on credit transactions throughout the dashboard.", max: 30 },
  { key: "debitLabel", label: "“Debit” badge text", helper: "Shown on debit transactions throughout the dashboard.", max: 30 },
];

export const ACCOUNT_FIELDS: FieldSpec[] = [
  { key: "title", label: "Page title", helper: "Heading at the top of /dashboard/account.", max: 100 },
  { key: "accountIntro", label: "Page subtitle", helper: "Line under the page title.", max: 250 },
  { key: "accountHolderSectionTitle", label: "“Account Holder” section title", helper: "", max: 60 },
  { key: "businessSectionTitle", label: "“Business / Organization” section title", helper: "", max: 60 },
  { key: "balanceSectionTitle", label: "“Recorded Balance” section title", helper: "", max: 60 },
  { key: "recordDetailsSectionTitle", label: "“Record Details” section title", helper: "", max: 60 },
  { key: "nameLabel", label: "“Name” field label", helper: "Used in the Account Holder and Business sections.", max: 40 },
  { key: "balanceLabel", label: "Recorded Balance field label", helper: "", max: 60 },
  { key: "recordsInHistoryLabel", label: "“Records in history” label", helper: "", max: 60 },
  { key: "latestActivityLabel", label: "“Latest activity” label", helper: "", max: 60 },
  { key: "recordStatusLabel", label: "“Record status” label", helper: "", max: 40 },
  { key: "recordTypeLabel", label: "“Record type” label", helper: "", max: 40 },
  { key: "noRecordLabel", label: "No-record field label", helper: "", max: 40 },
  { key: "noRecordText", label: "No-record text", helper: "Shown when the account has no linked financial record.", max: 200 },
];

export const SUPPORT_FIELDS: FieldSpec[] = [
  { key: "title", label: "Page title", helper: "Heading at the top of /dashboard/support.", max: 100 },
  { key: "supportIntro", label: "Page subtitle", helper: "Line under the page title.", max: 250 },
  { key: "contactTitle", label: "Contact card title", helper: "Heading on the “Contact Administrator” card.", max: 60 },
  { key: "contactButtonText", label: "Contact button", helper: "", max: 40 },
  { key: "contactToast", label: "Contact toast", helper: "Shown after the Contact Administrator button is pressed.", max: 150 },
  { key: "footerNote", label: "Footer note", helper: "Small print at the bottom of the support page.", max: 250 },
  { key: "adminInstructions", label: "Administrator contact instructions", helper: "Shown in the “Contact Administrator” card. Only add contact details you want the user to see.", max: 400, multiline: true },
];

export const MESSAGES_FIELDS: FieldSpec[] = [
  { key: "signedInToast", label: "Signed-in toast", helper: "Shown right after a successful sign-in.", max: 100 },
  { key: "signedOutToast", label: "Signed-out toast", helper: "Shown right after signing out.", max: 100 },
];

// "Core" notices: admins may reword/retone these, but a required phrase must survive (normalized for
// hyphen/space differences) and none of the false-claim phrases below may appear. There is no toggle that
// turns a core notice off — the check runs on every save, including a save that would otherwise be valid text.
export const NOTICES_FIELDS: FieldSpec[] = [
  { key: "loginFooterNotice", label: "Login Footer Notice", helper: "Displayed underneath the sign-in form, on both the user and administrator sign-in pages.", max: 160 },
  { key: "dashboardInfoStrip", label: "Dashboard Notice", helper: "Displayed near the top of every page, for normal users and administrators alike.", max: 220 },
  { key: "balanceCardHelperText", label: "Balance Helper", helper: "Displayed directly underneath the balance value on the dashboard overview.", max: 120 },
  { key: "accountBalanceHelperText", label: "Account Balance Helper", helper: "Displayed underneath the recorded balance on the Account page.", max: 120 },
  { key: "transactionDetailHelperText", label: "Transaction Detail Helper", helper: "Displayed at the bottom of the transaction-detail panel.", max: 120 },
];

export const CORE_REQUIRED_PHRASE: Record<string, string> = {
  loginFooterNotice: "not an official bank",
  dashboardInfoStrip: "not bank-verified",
  balanceCardHelperText: "not bank-verified",
  accountBalanceHelperText: "not bank-verified",
  transactionDetailHelperText: "not bank-verified",
};

const BANNED_CLAIM_PHRASES = [
  "official bank statement",
  "bank issued",
  "bank-issued",
  "verified bank balance",
  "verified financial institution",
  "bank certified",
  "bank-certified",
  "fdic insured",
  "officially verified",
  "member fdic",
];

const normalize = (s: string) => s.toLowerCase().replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();

/** Runs in addition to the ordinary text() checks — never instead of them. `fieldKey` is the bare key
 *  (e.g. "balanceCardHelperText", for the CORE_REQUIRED_PHRASE lookup); `errorKey` is the prefixed one
 *  (e.g. "notices.balanceCardHelperText", for the errors map). */
function checkCoreNotice(errors: FieldErrors, errorKey: string, fieldKey: string, value: string, label: string): void {
  if (errors[errorKey] || !value) return; // already flagged required/length/markup, or already empty
  const norm = normalize(value);
  const required = CORE_REQUIRED_PHRASE[fieldKey];
  if (required && !norm.includes(normalize(required))) {
    errors[errorKey] = `${label} must keep the core meaning — include a phrase like “${required}”.`;
    return;
  }
  const banned = BANNED_CLAIM_PHRASES.find((p) => norm.includes(p));
  if (banned) errors[errorKey] = `${label} can’t claim “${banned}” — this is a private record, not an official bank-verified statement.`;
}

export const limits = {
  topicTitle: 60,
  topicBody: 280,
} as const;

function validateGroup(errors: FieldErrors, prefix: string, raw: object | undefined, specs: FieldSpec[]): Record<string, string> {
  const r = raw as Record<string, unknown> | undefined;
  const out: Record<string, string> = {};
  for (const spec of specs) {
    out[spec.key] = text(errors, `${prefix}.${spec.key}`, r?.[spec.key], spec.label, spec.max, { multiline: spec.multiline });
  }
  return out;
}

export function validateContent(input: Partial<UserContent>): Validated<UserContent> {
  const errors: FieldErrors = {};

  const login = validateGroup(errors, "login", input.login, LOGIN_FIELDS) as unknown as UserContent["login"];
  const navigation = validateGroup(errors, "navigation", input.navigation, NAVIGATION_FIELDS) as unknown as UserContent["navigation"];
  const dashboard = validateGroup(errors, "dashboard", input.dashboard, DASHBOARD_FIELDS) as unknown as UserContent["dashboard"];
  const transactions = validateGroup(errors, "transactions", input.transactions, TRANSACTIONS_FIELDS) as unknown as UserContent["transactions"];
  const account = validateGroup(errors, "account", input.account, ACCOUNT_FIELDS) as unknown as UserContent["account"];
  const messages = validateGroup(errors, "messages", input.messages, MESSAGES_FIELDS) as unknown as UserContent["messages"];

  const supportFields = validateGroup(errors, "support", input.support, SUPPORT_FIELDS);
  const topics = Array.from({ length: SUPPORT_TOPIC_COUNT }, (_, i) => ({
    title: text(errors, `support.topics.${i}.title`, input.support?.topics?.[i]?.title, "Topic title", limits.topicTitle),
    body: text(errors, `support.topics.${i}.body`, input.support?.topics?.[i]?.body, "Topic text", limits.topicBody, { multiline: true }),
  }));
  const support = { ...supportFields, topics } as unknown as UserContent["support"];

  const notices = validateGroup(errors, "notices", input.notices, NOTICES_FIELDS);
  for (const spec of NOTICES_FIELDS) checkCoreNotice(errors, `notices.${spec.key}`, spec.key, notices[spec.key], spec.label);

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { login, navigation, dashboard, transactions, account, support, messages, notices: notices as unknown as UserContent["notices"] } };
}
