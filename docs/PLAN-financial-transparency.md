# PLAN: Financial Transparency & Ledger Reconcile System

This plan details the implementation of a resilient, transparent, and auditable financial system for the Cyber Security Club. It decouples incoming user fees from the public balance, introduces budget approval gates, tracks distinct asset wallets, and presents a simplified balance dashboard to all members.

---

## 1. Calculation & Flow Specification

### 1.1 Ledger Calculations
- **Wallet Reconciled Balance** (e.g., bKash, Nagad, Bank, Cash):
  $$\text{Wallet Balance} = \sum (\text{LedgerEntry.amount} \text{ where type = 'CREDIT' and wallet = W}) - \sum (\text{LedgerEntry.amount} \text{ where type = 'DEBIT' and wallet = W})$$
- **Total Reconciled Funds** (Net Treasury):
  $$\text{Net Treasury} = \sum (\text{LedgerEntry.amount} \text{ where type = 'CREDIT'}) - \sum (\text{LedgerEntry.amount} \text{ where type = 'DEBIT'})$$
- **Remaining Allocated Budget** (Committed but unspent funds):
  $$\text{Allocated Budget} = \sum (\text{Budget.amount} \text{ where status = 'APPROVED'}) - \sum (\text{Expense.amount} \text{ where status = 'APPROVED'})$$
- **Unallocated Available Funds** (Liquidity for new budgets):
  $$\text{Available Funds} = \text{Net Treasury} - \text{Allocated Budget}$$

### 1.2 User Payment Submission & Reconciliation Flow
1. **User Submission**: When registering or paying membership fees, members must enter their `transactionId` and select their `paymentMethod` (`BKASH`, `NAGAD`, `BANK`, `CASH`). Payment is saved as `PENDING`.
2. **Treasurer Verification**: The Treasurer checks their accounts and clicks "Verify". The payment status shifts to `VERIFIED`.
3. **Ledger Posting**: Upon verification, the Treasurer clicks "Post to Ledger", selects the target Asset Wallet (`BKASH_PERSONAL`, `NAGAD_PERSONAL`, `CLUB_BANK_ACCOUNT`, `CASH_IN_HAND`), and confirms. This creates a `LedgerEntry` of type `CREDIT` linking to the payment ID. Only now does the amount increase the public `Net Treasury` balance.

---

## 2. Database Schema Changes

We will modify [schema.prisma](file:///home/codeslayer_x86/codeslayer/projects/cyber-club-glm/prisma/schema.prisma):
1. **Modify `Payment`**: Add a `paymentMethod` field (String) to track user payment mode on submission.
2. **Modify `Budget`**: Add `status` (String, default "PENDING") and `approvedBy` (String, optional relation to User) fields.
3. **New Model `LedgerEntry`**:
   - `id`: String (cuid)
   - `type`: String (CREDIT / DEBIT)
   - `amount`: Float
   - `wallet`: String (BKASH_PERSONAL, NAGAD_PERSONAL, CLUB_BANK_ACCOUNT, CASH_IN_HAND)
   - `description`: String
   - `referenceId`: String? (links to paymentId or expenseId)
   - `performedBy`: String (relation to User)
   - `createdAt`: DateTime (default now)

---

## 3. API Updates

### 3.1 `src/app/api/stats/route.ts`
- Update counts and sum aggregations to calculate `totalFunds` strictly from `LedgerEntry` credits minus debits.
- Return Wallet balances, Allocated budgets, and Available funds to the dashboard.

### 3.2 `src/app/api/budgets/route.ts` & `src/app/api/budgets/[id]/approve/route.ts`
- Enforce `status = 'PENDING'` upon budget request creation.
- Add an `/api/budgets/[id]/approve` PATCH handler where the President approves a budget request, shifting its status to `APPROVED`.

### 3.3 `src/app/api/expenses/route.ts` & `src/app/api/expenses/[id]/approve/route.ts`
- Expenses can only be requested against an `APPROVED` budget.
- Add an `/api/expenses/[id]/approve` PATCH handler for the President or Treasurer to approve the expense, shifting its status to `APPROVED` and automatically creating a `DEBIT` `LedgerEntry` subtracting the spent amount from the selected wallet.

### 3.4 `src/app/api/payments/[id]/reconcile/route.ts` [NEW]
- Create a POST handler for the Treasurer to manually reconcile a `VERIFIED` user payment and post a `CREDIT` `LedgerEntry` to their selected Wallet.

---

## 4. Frontend UI Updates

### 4.1 Payment Forms
- Update the membership application page and event registration models to include a required dropdown selector for `paymentMethod` (`BKASH`, `NAGAD`, `BANK`, `CASH`).

### 4.2 Payments Verification Tab (`verify-payments-page.tsx`)
- Add a "Post to Ledger" button next to verified payments. Clicking it opens a dialog where the Treasurer selects the target Wallet and confirms.

### 4.3 Finance Dashboard (`finance-page.tsx`)
- Rebuild stat cards to display:
  - **Net Balance** (with wallet breakdowns)
  - **Allocated Funds**
  - **Available Funds**
  - **Audit Feed**: Chronological list of ledger entries with links to see receipts and approvals for total transparency.

---

## 5. Verification Plan

### Automated Checks
- `npx tsc --noEmit` to verify TypeScript compile.
- `npm run lint` to check linter validation.
- `npx prisma db push` to synchronize changes with Supabase PostgreSQL.

### Functional Verification
- Verify that submitting a payment does not immediately increase `Net Treasury` until the Treasurer verifies and posts it to the ledger.
- Verify that a budget starts as `PENDING` and cannot have expenses approved until its status shifts to `APPROVED`.
