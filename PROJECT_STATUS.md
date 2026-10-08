# Financial Dashboard

**Product:** Ledgerline — Private Financial Record Dashboard.
Not an official bank statement, online banking portal, or proof-of-funds tool. All values are internally *recorded* values. No transfers, payments, withdrawals, deposits or statement verification — by design.

## Phase 1 — Foundation & Dashboard

- [x] Project setup (Next.js App Router, TypeScript, Tailwind v4, Framer Motion, Lucide)
- [x] Design system (tokens in `globals.css`, Inter, shared UI components)
- [x] User login (`/login`)
- [x] Admin login (`/admin/login`)
- [x] Role protection (`src/proxy.ts` + `requireRole()` in layouts)
- [x] Mandatory record-notice shown on every screen
- [x] Dashboard shell (sidebar, topbar, profile + notification menus)
- [x] Balance card (show/hide)
- [x] Summary cards
- [x] Recent activity + transaction detail panel
- [x] Transactions, Account, Support pages
- [x] Responsive sidebar (full / icon rail / drawer)
- [x] Mobile navigation
- [x] Skeletons + empty state
- [x] Admin shell
- [x] Responsive testing
- [x] Production build

## Pre-Phase-3 Data & Authentication Finalization

- [x] Complete supplied record data (holder, business, recorded balance $1,922,550.00)
- [x] Exact 11 transaction records (credits $434,000.00 / 3, debits $1,010,450.00 / 8, latest Oct 4, 2026)
- [x] No external bank website, phone or email added; Ledgerline stays independent of any institution
- [x] User username configured (`rickandwind0853` via `USER_USERNAME`)
- [x] Two-step user login: username + password → private access code (`USER_ACCESS_CODE`)
- [x] Session created only after both steps pass (step 1 issues only a 5-minute signed, typed "pending" token that cannot be used as a session)
- [x] Access code required on every fresh login; "Remember me" only extends session duration
- [x] Password and access code are server-side env only (checked: not in page source, client bundles, console or server log)
- [x] Account page unchanged (no credentials shown)
- [x] Dashboard values verified, transaction search/filters/sort re-tested (including RF, Gulf, Qatar, TR-P, GONAK, 98765432, 766600000054)
- [x] Build / lint / typecheck
- [x] Authentication tests (28 checks) + data/filter/responsive tests (75 checks)

Phase 3 has **not** been started.

## Phase 2 — User Dashboard Completion

- [x] Remove invented placeholder data (email, phone, masked ID, sample transactions, fake timestamps)
- [x] Add all supplied transaction records (11)
- [x] Dynamic summary calculations (`summarize()` in `src/lib/transactions.ts`)
- [x] Improve recent transactions (latest 5, newest first)
- [x] Improve transaction detail drawer (status, Copy Reference + toast)
- [x] Transaction search (description + reference, case-insensitive, clear button)
- [x] Type filters
- [x] Date filters (year, derived from records)
- [x] Amount filters
- [x] Sorting (newest / oldest / highest / lowest)
- [x] Result count ("Showing X of Y records")
- [x] Desktop transactions table
- [x] Mobile transaction cards
- [x] Empty filter state with Clear filters
- [x] Account page improvement
- [x] Support page improvement
- [x] Date/currency utilities (`src/lib/format.ts`)
- [x] Loading skeletons (Dashboard, Transactions, Account)
- [x] Mobile drawer close button + closes on navigation
- [x] Responsive QA (1440 / 1280 / 1024 / 768 / 430 / 390)
- [x] Visual QA
- [x] Build / lint / typecheck

Deferred (not required in Phase 2): pagination (seam left in `TransactionsExplorer`), export, notification centre, idle sign-out.

## Phase 3 — Admin Management (non-financial) & Persistence

**Scope decision:** the financial record is **read-only everywhere**. The admin panel cannot create, edit, delete or override the recorded balance, transactions, amounts, dates, references or credit/debit types, and no code path for doing so exists (no server action, no API route). The admin manages presentation and content only.

- [x] Lightweight persistence for editable non-financial settings (`.data/settings.json`, atomic writes, gitignored; defaults when absent)
- [x] Records service split: financial data from source (read-only) + presentation from settings store
- [x] Admin overview (record status, holder, organization; balance / credits / debits / count / latest activity shown read-only; real last-updated timestamp)
- [x] Account editor: holder display name, business/organization, record status, record type
- [x] Recorded balance shown read-only with explanatory text (no input)
- [x] Transactions: read-only browser (search, credit/debit filter, sort, details drawer) — no add/edit/delete
- [x] Content editor: dashboard greeting (blank = automatic), subtitle, section headings, account/support intros
- [x] Support content: three help topics, administrator contact instructions, Q&A list
- [x] Display preferences: balance hidden by default, show/hide record-info and quick-actions cards
- [x] Settings page (system info, appearance, sign out)
- [x] User dashboard / account / support reflect admin changes immediately (dynamic rendering + `revalidatePath`)
- [x] Fixed text not editable: private-record notice, Ledgerline name, navigation, "Recorded Balance" wording
- [x] Validation (required, max lengths, no HTML) on client and server; server re-checks the admin role on every action
- [x] Loading skeletons (admin dashboard, account/content editors, transactions)
- [x] Error handling ("Unable to save changes.") with toasts
- [x] Responsive QA (1440 / 1280 / 1024 / 768 / 430 / 390) on all five admin pages
- [x] Auth regression (user two-step, admin single-step, role protection, logout)
- [x] Build / lint / typecheck

**Superseded by Phase 3B (settings now live in `.data/db.json`):** the settings store was a local JSON file, which suits a single server; on serverless hosting swap `readSettings`/`writeSettings` in `src/lib/settings-store.ts` for a database (callers don’t change). Financial data still lives in `src/data/records.ts`.

## Phase 3B — User Management

**Scope decision:** the financial record stays **read-only** and belongs to one record owner (the migrated original user). Accounts created by an admin get their own identity and settings but **no financial record** — they see "No financial record linked", so a new account can never show that balance under a different name or organization.

- [x] Users database (`users`, `user_settings`, `content_settings` in `.data/db.json`; hashes only, never plaintext)
- [x] User settings database (per-user greeting, subtitle, record status/type, balance-hidden default, record-info and quick-actions toggles)
- [x] Existing user migrated (first run: `USER_*` / `ADMIN_*` env values are hashed server-side and stored; env credentials are not used for sign-in afterwards)
- [x] User list (search by username / name / organization; All / Active / Inactive / User / Admin; table on desktop, cards on mobile; action menu)
- [x] Add user (`/admin/users/new`, unique username, password + access code with confirmation)
- [x] Edit user (`/admin/users/[id]`: profile, access, dashboard settings, login activity, system metadata)
- [x] Delete user (confirmation dialog + type-the-username; cannot delete yourself)
- [x] Activate / deactivate (inactive accounts blocked with "This account is currently inactive.", existing sessions end immediately)
- [x] Password reset and access-code reset (hash only, old values rejected, existing sessions signed out)
- [x] Role management (user ↔ admin, enforced server-side; cannot demote/deactivate yourself or the last active admin)
- [x] Last-login tracking ("Never" until first successful sign-in)
- [x] Database-backed login (user: password → access code → dashboard; admin: password; account state re-checked against the database on every request)
- [x] Admin overview: total / active / inactive / admin counts, recently created users, recent logins; financial summary kept separate and read-only
- [x] Responsive user management (1440 / 1280 / 1024 / 768 / 430 / 390)
- [x] Financial data remains read-only (no financial mutation function or API route exists)
- [x] Tests (160 user-management checks + 28 auth + 75 dashboard/filter/responsive)
- [x] Build / lint / typecheck

**Notes for Phase 4:** the store is a local JSON file — fine for one server; for serverless hosting reimplement `readDb`/`mutateDb` in `src/lib/db.ts` (e.g. Supabase/Postgres) and nothing else changes. Sessions are stateless signed cookies validated against the database on each request. There is still no rate limiting on sign-in.

## Branding — Text-Only (no logos)

- [x] Ledgerline logo/icon removed everywhere (user and admin); the product name is the plain text "Dashboard" (`src/components/ui/BrandName.tsx`)
- [x] No images, icon logos, uploaded logos or third-party/bank logos anywhere; `public/` is empty
- [x] 72px icon rail shows a single neutral letter "D" (the word can’t fit); no empty logo containers
- [x] Compact disclaimer notice and login footer line unchanged
- [x] Responsive check at 1440 / 1280 / 1024 / 768 / 430 / 390 (255 checks)

## User Profile Photos

- [x] User model extended (`profilePhotoPath` / `profilePhotoMime` / `profilePhotoUpdatedAt`, all nullable; existing records unaffected)
- [x] Admin upload UI (create form and edit page)
- [x] Admin preview (immediate local preview before saving)
- [x] Photo persistence (`.data/uploads/users/`, server-generated filenames only, served read-only via `/avatars/[file]`)
- [x] Replace photo (old file deleted once the new one is saved)
- [x] Remove photo (confirmation dialog; falls back to initials)
- [x] Initials fallback (`UserAvatar` component, used everywhere an avatar appears)
- [x] User-side avatar integration (topbar, sidebar, mobile header, account page)
- [x] Admin list avatar integration (users table, mobile cards, recently-created/recent-logins)
- [x] Mobile QA (430 / 390 / 360 / 320)
- [x] Authorization (every mutation re-checks the admin role server-side)
- [x] Validation (size, and the file's real bytes — not the browser-reported type)
- [x] Regression tests
- [x] Build
- [x] Lint
- [x] Typecheck

## Full User Frontend Content Management

**Scope decision:** admin content control covers nearly all ordinary user-facing text — login, navigation, dashboard, transactions, account, support, toast messages and (see Disclaimers & Notices below) the safety/positioning notices — organized as one `content_settings` object (`src/data/settings.ts`) instead of scattered fields. Admin-side pages keep their own hardcoded copy and are out of scope. Financial values, credentials, session/role logic, internal IDs and timestamps stay fixed and non-editable everywhere.

- [x] Centralized content structure: 8 sections (`login`, `navigation`, `dashboard`, `transactions`, `account`, `support`, `messages`, `notices`) in one `UserContent` type, persisted in `content_settings` inside the existing `.data/db.json`
- [x] Default-value fallback (`mergeUserContent`) — a missing, old-shaped or absent field always falls back to approved default wording; nothing ever renders blank
- [x] Declarative field-spec arrays (`src/lib/settings-validation.ts`) drive both validation and the admin editor UI from one source of truth per field (~100 fields total)
- [x] Validation: required, per-field character limits, plain-text only (`<`/`>` rejected) on client and server; server re-checks the admin role on every save/reset
- [x] Tabbed admin editor at `/admin/content` (Login / Navigation / Dashboard / Transactions / Account / Support / Messages / Disclaimers & Notices / Advanced), generated from the field specs
- [x] Standard Save Changes / unsaved-changes indicator UX (`SaveBar`)
- [x] Per-section "Reset to Defaults" (confirmation dialog) and "Reset All" (confirmation dialog)
- [x] All wired pages read content server-side in one `getContent()` call per page (no per-component separate reads)
- [x] Wired: `/login` (headline, tagline, trust points, form labels/placeholders, buttons, help text), sidebar/topbar/mobile nav labels, `/dashboard` (greeting words, subtitle, balance/summary-card labels, recent-transactions heading, quick actions, record-info card, no-record states), `/dashboard/transactions` (search, filter group + option labels, result-count template, empty state, table headers, detail drawer, copy toasts, credit/debit labels), `/dashboard/account` (section titles, field labels, no-record text), `/dashboard/support` (intro, help topics, contact card, footer note), sign-in/sign-out toasts
- [x] Deliberately NOT editable (fixed in code): all 11 transaction values/dates/references/types, the recorded balance, usernames/passwords/access codes/hashes, session/role logic, internal IDs, system timestamps
- [x] Global vs. per-user separation preserved: per-user greeting/subtitle/display toggles stay in `user_settings` and are never duplicated into the global content object
- [x] Regression: login (two-step user, single-step admin), role protection, user management, profile photos, dashboard data, transaction search/filter, financial-data-unchanged
- [x] Build / lint / typecheck

### Disclaimers & Notices (within the content system above)

**Scope decision:** the five safety/positioning notices (login footer, dashboard-wide strip, balance-card helper, account-page balance helper, transaction-detail helper) moved from permanently-fixed to admin-editable-with-guardrails. Admins may reword and retone each one freely, but cannot blank it, remove its core meaning, or make it falsely claim official bank affiliation/verification — there is no toggle to disable one.

- [x] `notices` section added to `UserContent` (`src/data/settings.ts`), each field defaulting to the exact prior hardcoded text
- [x] Core-notice validation (`src/lib/settings-validation.ts`): required-phrase check (normalized for hyphen/space differences, e.g. "not bank-verified") plus a false-claim blocklist ("official bank statement", "bank-issued", "FDIC insured", etc.) — both run on every save in addition to the ordinary required/length/no-HTML checks
- [x] Admin UI: dedicated "Disclaimers & Notices" tab, one card per notice showing the location it appears, a textarea with character count, a live compact preview, the current default (when different from the saved value), and a per-field "Reset to Default"
- [x] Save on this tab shows "Disclaimer content updated"; the generic "Content updated" toast still covers every other tab
- [x] Threaded to both the user AND admin side where the same shared component renders the notice: `RecordNotice`/`AppShell` (dashboard strip, shown on every page both sides) and `AuthShell` (login footer, shown on both `/login` and `/admin/login`) — the only two places admin layouts read from the otherwise user-only content system, and only for these two fields
- [x] New transaction-detail helper notice added to `TransactionDetailSheet` (didn't exist before this request)
- [x] Tests: edit + verify for all 5 notices across their render locations (including the shared user/admin surfaces), persistence across a fresh navigation, field-level reset, blank-value rejection, core-meaning-stripped rejection, false-claim rejection, normal-user access denial, financial data unaffected — 18 checks, all passing
- [x] Build / lint / typecheck

**Bug found and fixed during testing:** the required-phrase check looked up `CORE_REQUIRED_PHRASE` using the error-map key (e.g. `"notices.balanceCardHelperText"`) instead of the bare field key (`"balanceCardHelperText"`), so the lookup always missed and that half of the core-notice protection silently never ran (the false-claim blocklist half worked correctly throughout). Fixed in `settings-validation.ts`; the false-claim-rejection test (14c) caught the symptom, closer inspection of the then-failing required-phrase test (14b) found the root cause.

## Phase 4 — Final Polish & Deployment

- [ ] Visual QA across breakpoints
- [ ] Security hardening (rate limiting, secrets management)
- [ ] Deployment and environment setup
- [ ] Documentation handover
