// Editable, NON-FINANCIAL user-facing content ("content_settings") and its defaults.
// Covers everything an ordinary signed-in USER sees across /login, /dashboard and its subpages, plus the
// shared sidebar/topbar/mobile nav. Per-user presentation (greeting override, display name, etc.) stays in
// user_settings (see src/data/users.ts) and is never duplicated here. Admin-side PAGE copy is never sourced
// from this file and stays hardcoded in the admin components, by design — the one exception is the `notices`
// section below, because those five notices render on admin surfaces too via the same shared components.
//
// `notices` holds the safety/positioning notices and is deliberately NOT like the other sections: admins may
// reword and retone each one, but not blank it or remove its core meaning (private/internal record, not an
// official bank-verified statement) — enforced in settings-validation.ts via a required-phrase check and a
// false-claim blocklist, never by a toggle that could switch a notice off. See NoticesContent below.
// Financial transaction data, credentials, session/role logic and validation/security behavior are also
// out of scope for this file — see src/data/records.ts and src/app/actions/auth.ts instead.

export const STATUS_OPTIONS = ["Active / Recorded", "Inactive"] as const;
export const SUPPORT_TOPIC_COUNT = 3;

export interface LoginContent {
  headline1: string;
  headline2: string;
  tagline: string;
  trustPoint1: string;
  trustPoint2: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMeLabel: string;
  continueButton: string;
  securityTitle: string;
  securitySubtitle: string;
  accessCodeLabel: string;
  accessCodePlaceholder: string;
  verifyButton: string;
  backButton: string;
  helpText: string;
}

export interface NavigationContent {
  overview: string;
  transactions: string;
  account: string;
  support: string;
  logout: string;
}

export interface DashboardContent {
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  subtitle: string;
  balanceLabel: string;
  creditsLabel: string;
  creditsDescription: string;
  debitsLabel: string;
  debitsDescription: string;
  transactionsLabel: string;
  transactionsDescription: string;
  latestActivityLabel: string;
  latestActivityDescription: string;
  recentHeading: string;
  viewAllText: string;
  quickActionsHeading: string;
  quickAction1Label: string;
  quickAction1Hint: string;
  quickAction2Label: string;
  quickAction2Hint: string;
  quickAction3Label: string;
  quickAction3Hint: string;
  recordInfoHeading: string;
  detailsLinkText: string;
  recordInfoHolderLabel: string;
  recordInfoBusinessLabel: string;
  recordInfoTypeLabel: string;
  recordInfoStatusLabel: string;
  noRecordTitle: string;
  noRecordDescription: string;
  noRecordDescriptionCompact: string;
}

export interface TransactionsContent {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  filterTypeLabel: string;
  typeAllLabel: string;
  typeCreditsLabel: string;
  typeDebitsLabel: string;
  filterDateLabel: string;
  dateAllTimeLabel: string;
  filterAmountLabel: string;
  amountAllLabel: string;
  amountUnder100Label: string;
  amount100to199Label: string;
  amount200plusLabel: string;
  filterSortLabel: string;
  sortNewestLabel: string;
  sortOldestLabel: string;
  sortHighestLabel: string;
  sortLowestLabel: string;
  clearFiltersText: string;
  /** Supports the tokens {shown} and {total}; both are substituted, nothing else in the string is interpreted. */
  resultCountTemplate: string;
  emptyTitle: string;
  emptyDescription: string;
  tableDate: string;
  tableDescription: string;
  tableReference: string;
  tableType: string;
  tableAmount: string;
  detailTitle: string;
  detailDescriptionLabel: string;
  detailAmountLabel: string;
  detailTypeLabel: string;
  detailDateLabel: string;
  detailReferenceLabel: string;
  detailStatusLabel: string;
  copyReferenceButton: string;
  copiedText: string;
  referenceCopiedToast: string;
  copyFailedToast: string;
  creditLabel: string;
  debitLabel: string;
}

export interface AccountContent {
  title: string;
  accountIntro: string;
  accountHolderSectionTitle: string;
  businessSectionTitle: string;
  balanceSectionTitle: string;
  recordDetailsSectionTitle: string;
  nameLabel: string;
  balanceLabel: string;
  recordsInHistoryLabel: string;
  latestActivityLabel: string;
  recordStatusLabel: string;
  recordTypeLabel: string;
  noRecordLabel: string;
  noRecordText: string;
}

export interface SupportTopic {
  title: string;
  body: string;
}

export interface SupportContent {
  title: string;
  supportIntro: string;
  contactTitle: string;
  contactButtonText: string;
  contactToast: string;
  footerNote: string;
  topics: SupportTopic[];
  adminInstructions: string;
}

export interface MessagesContent {
  signedInToast: string;
  signedOutToast: string;
}

/**
 * The small set of safety/positioning notices shown to users (and, for the two app-wide ones, to admins too —
 * the same shared components render on both sides). Unlike every other section, these five are "core
 * notices": admins may reword and retone them, but each must keep communicating that this is a private/
 * internal record rather than an official, bank-verified statement. Enforced in settings-validation.ts via a
 * required-phrase check plus a false-claim blocklist — never by a toggle that could switch the notice off.
 */
export interface NoticesContent {
  loginFooterNotice: string;
  dashboardInfoStrip: string;
  balanceCardHelperText: string;
  accountBalanceHelperText: string;
  transactionDetailHelperText: string;
}

export interface UserContent {
  login: LoginContent;
  navigation: NavigationContent;
  dashboard: DashboardContent;
  transactions: TransactionsContent;
  account: AccountContent;
  support: SupportContent;
  messages: MessagesContent;
  notices: NoticesContent;
}

export interface ContentSettings extends UserContent {
  /** Real timestamp of the last admin save, or null if nothing has been saved yet. */
  updatedAt: string | null;
}

export const defaultUserContent: UserContent = {
  login: {
    headline1: "Financial clarity,",
    headline2: "all in one place.",
    tagline: "A private record dashboard designed to keep your financial activity organized, accessible and easy to understand.",
    trustPoint1: "Recorded history",
    trustPoint2: "Private access",
    welcomeTitle: "Welcome back",
    welcomeSubtitle: "Sign in to access your account dashboard.",
    usernameLabel: "Username",
    usernamePlaceholder: "Enter your username",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMeLabel: "Remember me on this device",
    continueButton: "Continue",
    securityTitle: "Security Verification",
    securitySubtitle: "Enter your private access code to continue.",
    accessCodeLabel: "Private access code",
    accessCodePlaceholder: "Enter your access code",
    verifyButton: "Verify & Sign In",
    backButton: "Back",
    helpText: "Need help? Contact your account administrator.",
  },
  navigation: {
    overview: "Overview",
    transactions: "Transactions",
    account: "Account",
    support: "Support",
    logout: "Sign out",
  },
  dashboard: {
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    subtitle: "Here’s your latest account overview.",
    balanceLabel: "Recorded Balance",
    creditsLabel: "Total Credits",
    creditsDescription: "recorded credits",
    debitsLabel: "Total Debits",
    debitsDescription: "recorded debits",
    transactionsLabel: "Transactions",
    transactionsDescription: "Records in history",
    latestActivityLabel: "Latest Activity",
    latestActivityDescription: "Most recent record",
    recentHeading: "Recent Transactions",
    viewAllText: "View all",
    quickActionsHeading: "Quick actions",
    quickAction1Label: "View Transactions",
    quickAction1Hint: "Full recorded history",
    quickAction2Label: "Account Details",
    quickAction2Hint: "Holder and business info",
    quickAction3Label: "Contact Support",
    quickAction3Hint: "Reach your administrator",
    recordInfoHeading: "Record information",
    detailsLinkText: "Details",
    recordInfoHolderLabel: "Account holder",
    recordInfoBusinessLabel: "Business",
    recordInfoTypeLabel: "Record type",
    recordInfoStatusLabel: "Record status",
    noRecordTitle: "No financial record linked",
    noRecordDescription: "This account doesn’t have a financial record attached. Contact your administrator if you expected to see one.",
    noRecordDescriptionCompact: "This account has no recorded balance or transactions.",
  },
  transactions: {
    title: "Transactions",
    subtitle: "Review and filter your recorded account activity.",
    searchPlaceholder: "Search transactions",
    filterTypeLabel: "Type",
    typeAllLabel: "All",
    typeCreditsLabel: "Credits",
    typeDebitsLabel: "Debits",
    filterDateLabel: "Date",
    dateAllTimeLabel: "All time",
    filterAmountLabel: "Amount",
    amountAllLabel: "All amounts",
    amountUnder100Label: "Under $100,000",
    amount100to199Label: "$100,000–$199,999",
    amount200plusLabel: "$200,000+",
    filterSortLabel: "Sort by",
    sortNewestLabel: "Newest first",
    sortOldestLabel: "Oldest first",
    sortHighestLabel: "Highest amount",
    sortLowestLabel: "Lowest amount",
    clearFiltersText: "Clear filters",
    resultCountTemplate: "Showing {shown} of {total} records",
    emptyTitle: "No matching transactions",
    emptyDescription: "We couldn’t find any records matching your current filters.",
    tableDate: "Date",
    tableDescription: "Description",
    tableReference: "Reference",
    tableType: "Type",
    tableAmount: "Amount",
    detailTitle: "Transaction details",
    detailDescriptionLabel: "Description",
    detailAmountLabel: "Amount",
    detailTypeLabel: "Type",
    detailDateLabel: "Date",
    detailReferenceLabel: "Reference",
    detailStatusLabel: "Status",
    copyReferenceButton: "Copy Reference",
    copiedText: "Copied",
    referenceCopiedToast: "Reference copied",
    copyFailedToast: "Couldn’t copy — select the reference and copy manually",
    creditLabel: "Credit",
    debitLabel: "Debit",
  },
  account: {
    title: "Account",
    accountIntro: "Review the information associated with this private record.",
    accountHolderSectionTitle: "Account Holder",
    businessSectionTitle: "Business / Organization",
    balanceSectionTitle: "Recorded Balance",
    recordDetailsSectionTitle: "Record Details",
    nameLabel: "Name",
    balanceLabel: "Recorded Balance",
    recordsInHistoryLabel: "Records in history",
    latestActivityLabel: "Latest activity",
    recordStatusLabel: "Record status",
    recordTypeLabel: "Record type",
    noRecordLabel: "Financial record",
    noRecordText: "No financial record is linked to this account.",
  },
  support: {
    title: "Support",
    supportIntro: "Need help? This dashboard is intended for private financial record viewing.",
    contactTitle: "Contact Administrator",
    contactButtonText: "Contact Administrator",
    contactToast: "Please contact your dashboard administrator directly",
    footerNote: "Passwords and access codes are never displayed in this dashboard. Sign out on shared devices.",
    topics: [
      {
        title: "Access issues",
        body: "Trouble signing in or a session that ended early? Your administrator can confirm your access.",
      },
      {
        title: "Dashboard questions",
        body: "Not sure what a figure, label or filter means? Ask for a walkthrough of how the records are presented.",
      },
      {
        title: "Record corrections",
        body: "If a recorded entry looks incorrect, tell your administrator which record. Financial entries are maintained separately from this dashboard.",
      },
    ],
    adminInstructions: "Contact your dashboard administrator.",
  },
  messages: {
    signedInToast: "Signed in successfully",
    signedOutToast: "Signed out successfully",
  },
  notices: {
    loginFooterNotice: "Private record access · Not an official banking portal",
    dashboardInfoStrip: "Private record dashboard. Financial values are internally maintained and are not bank-verified.",
    balanceCardHelperText: "Internal record · Not bank-verified",
    accountBalanceHelperText: "Internal record · Not bank-verified",
    transactionDetailHelperText: "Internal record · Not bank-verified",
  },
};

export const defaultContentSettings: ContentSettings = { ...defaultUserContent, updatedAt: null };

/**
 * Fills in any missing field from the defaults, one level deep per section (plus per-topic for support.topics).
 * Never shows blank text: a stored value that's missing, old-shaped, or simply absent falls back to the
 * approved default wording rather than rendering empty.
 */
export function mergeUserContent(stored: Partial<ContentSettings> | null | undefined): ContentSettings {
  const d = defaultUserContent;
  const s = stored ?? {};
  const topics = Array.from({ length: SUPPORT_TOPIC_COUNT }, (_, i) => ({
    ...d.support.topics[i],
    ...(s.support?.topics?.[i] ?? {}),
  }));
  return {
    login: { ...d.login, ...s.login },
    navigation: { ...d.navigation, ...s.navigation },
    dashboard: { ...d.dashboard, ...s.dashboard },
    transactions: { ...d.transactions, ...s.transactions },
    account: { ...d.account, ...s.account },
    support: { ...d.support, ...s.support, topics },
    messages: { ...d.messages, ...s.messages },
    notices: { ...d.notices, ...s.notices },
    updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : null,
  };
}
