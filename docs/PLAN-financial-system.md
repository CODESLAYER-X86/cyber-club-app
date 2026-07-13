# Financial Management System Redesign Plan

## 1. Context & Goal
The objective is to completely remove the existing financial management module (Budgets, complex Ledger Entries) and replace it with a clean, simple, and transparent workflow. The new system will focus on **Funds**, **Expenses** (with line items), and **Financial Reports**, all governed by a strict approval workflow before affecting the organization's actual balance.

## 2. Database Schema Changes (Prisma)

### Remove Old Models
- `Budget`
- `LedgerEntry`
- Old `Expense` model fields that are no longer relevant.

### New / Updated Models
1. **`Fund`**
   - `id`, `amount`, `source` (Enum: UNIVERSITY, SPONSOR, MEMBER_REG, EVENT_REG, DONATION, OTHER)
   - `status` (PENDING, APPROVED, REJECTED)
   - `createdBy` (Treasurer)
   - `approvedBy` (President / GS / VP)
   - `createdAt`, `updatedAt`

2. **`Expense`**
   - `id`, `title`, `totalAmount` (Auto-calculated from items)
   - `status` (PENDING, APPROVED, REJECTED)
   - `createdBy` (Treasurer)
   - `approvedBy` (President / GS / VP)
   - `createdAt`, `updatedAt`

3. **`ExpenseItem`**
   - `id`, `expenseId` (Relation to Expense)
   - `name`, `quantity`, `unitPrice`, `totalPrice`

4. **`FinancialReport`**
   - `id`, `eventName`, `eventDate` (Optional)
   - `incomeSummary`, `expenseSummary`, `remainingBalance`
   - `notes`
   - `status` (PENDING, APPROVED, REJECTED)
   - `createdBy` (Treasurer)
   - `approvedByPresidentId` (Nullable)
   - `approvedByGsId` (Nullable)
   - `createdAt`, `updatedAt`

## 3. Backend Implementation (APIs)
- **`GET /api/finance/dashboard`**: Calculates `Total Balance = SUM(Approved Funds) - SUM(Approved Expenses)`. Returns pending counts and recent transactions.
- **`POST & GET /api/finance/funds`**: Create and list funds.
- **`PUT /api/finance/funds/[id]/approve`**: Approve/Reject fund entries.
- **`POST & GET /api/finance/expenses`**: Create expenses (with nested items) and list them.
- **`PUT /api/finance/expenses/[id]/approve`**: Approve/Reject expense entries.
- **`POST & GET /api/finance/reports`**: Create and list event-based financial reports.
- **`PUT /api/finance/reports/[id]/approve`**: Multi-signature approval for reports.

## 4. Frontend Implementation (UI)
- **Treasurer View**: Forms to Add Fund, Create Expense (with dynamic line-item rows), and Generate Financial Reports.
- **Approver View (President/GS/VP)**: Pending approval queues for Funds, Expenses, and Reports with Approve/Reject actions.
- **Member View (Read-Only)**: A "Financial Transparency" page showing the Dashboard (Balance, Total Income/Expense) and lists of *Approved* Funds, Expenses, and Reports.
- **Dashboard**: Unified view showing Available Funds, Total Income, Total Expenses, and Pending Approvals based on the user's role.

---

> [!WARNING]
> **User Review Required**
> Please review the Open Questions below before we proceed with the implementation.

## 5. Open Questions for Clarification

1. **Approval Logic for Funds & Expenses**: Can *either* the President OR the GS/VP approve a fund/expense on their own, or do they require approval from *both*? 
2. **Approval Logic for Reports**: You mentioned reports require approval from "the President and the GS (or Vice President)". Does this mean it strictly needs **two** separate approvals (one from President + one from GS/VP) before it is published?
3. **Existing Financial Data**: Should we completely wipe all existing `Budget`, `Expense`, and `LedgerEntry` data from the database, or do you need a migration strategy to keep past records?

---
*Run `/create` or answer the questions to begin implementation.*
