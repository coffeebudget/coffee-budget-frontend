# PRD: Expense Plan Coverage Monitoring

**Feature ID**: FEAT-20260109-expense-plan-coverage
**Created**: 2026-01-09
**Status**: Draft
**Priority**: Medium
**Complexity**: Medium

---

## Overview

### Problem Statement
Users create expense plans to save for upcoming bills and expenses, but currently have no visibility into whether their bank accounts have sufficient funds to cover these planned expenses. This creates a disconnect between planning and actual financial capacity.

### Solution
Add payment account linking to expense plans and provide a dashboard widget that monitors coverage status - showing whether bank accounts have enough balance to cover upcoming expense plans in the next 30 days.

### Success Metrics
- Users can see coverage status at a glance on dashboard
- Shortfall alerts help users take proactive action
- Reduces missed payments due to insufficient funds awareness

---

## User Stories

### US-1: Link Payment Account to Expense Plan
**As a** user creating an expense plan
**I want to** optionally specify which bank account will be used for payment
**So that** the system can track if that account has sufficient funds

**Acceptance Criteria:**
- [ ] Account selector dropdown in Expense Plan Wizard (CategoryExpenseForm)
- [ ] Account selector dropdown in ExpensePlanFormDialog (create/edit)
- [ ] Dropdown shows all user's bank accounts
- [ ] Selection is optional (flexible, not enforced)
- [ ] Selected account persists with the expense plan

### US-2: View Coverage Summary on Dashboard
**As a** user viewing my dashboard
**I want to** see a summary of my expense plan coverage status
**So that** I can quickly identify if I have funding gaps

**Acceptance Criteria:**
- [ ] Dedicated "Coverage Issues" section on dashboard
- [ ] Summary card showing:
  - Account balance
  - Total upcoming plans amount (next 30 days)
  - Shortfall amount (if any)
- [ ] Only shows when there are coverage issues (or always shows status?)
- [ ] Groups by bank account

### US-3: View Plans at Risk
**As a** user with insufficient coverage
**I want to** see which specific expense plans are at risk
**So that** I can prioritize and take action

**Acceptance Criteria:**
- [ ] List of plans that may not be covered
- [ ] Shows plan name, amount, and due date
- [ ] Sorted by due date (soonest first)
- [ ] Link to view/edit each plan

### US-4: Handle Unassigned Plans
**As a** user with expense plans not linked to any account
**I want to** see these plans grouped separately
**So that** I understand they're not part of coverage calculation

**Acceptance Criteria:**
- [ ] Unassigned plans shown under "General" grouping
- [ ] No coverage status calculated for unassigned plans
- [ ] Clear indication that no account is linked

---

## Technical Specification

### Data Model Changes

#### Backend: ExpensePlan Entity
```typescript
// Add to ExpensePlan entity
@Column({ nullable: true })
paymentAccountType: 'bank_account' | null;  // Future: | 'credit_card'

@Column({ nullable: true })
paymentAccountId: number | null;

// Optional: Add relation
@ManyToOne(() => BankAccount, { nullable: true })
@JoinColumn({ name: 'paymentAccountId' })
paymentAccount: BankAccount;
```

#### Backend: DTOs
```typescript
// CreateExpensePlanDto / UpdateExpensePlanDto
paymentAccountType?: 'bank_account';
paymentAccountId?: number;
```

#### Frontend: Types
```typescript
// expense-plan-types.ts
interface ExpensePlan {
  // ... existing fields
  paymentAccountType?: 'bank_account';
  paymentAccountId?: number;
  paymentAccount?: BankAccount;  // Populated when fetched
}

// Wizard types
interface WizardExpensePlan {
  // ... existing fields
  paymentAccountId?: number;
  paymentAccountType?: 'bank_account';
}
```

### API Changes

#### New Endpoint: Coverage Summary
```
GET /expense-plans/coverage-summary
```

**Response:**
```typescript
interface CoverageSummaryResponse {
  accounts: AccountCoverage[];
  unassignedPlans: UnassignedPlanSummary;
}

interface AccountCoverage {
  accountId: number;
  accountName: string;
  institution: string;
  currentBalance: number;
  upcomingPlansTotal: number;  // Sum of plans due in next 30 days
  projectedBalance: number;    // currentBalance - upcomingPlansTotal
  hasShortfall: boolean;
  shortfallAmount: number;     // 0 if no shortfall
  plansAtRisk: PlanAtRisk[];
}

interface PlanAtRisk {
  id: number;
  name: string;
  amount: number;
  nextDueDate: string;
  daysUntilDue: number;
}

interface UnassignedPlanSummary {
  count: number;
  totalAmount: number;
  plans: {
    id: number;
    name: string;
    amount: number;
    nextDueDate: string;
  }[];
}
```

### Coverage Calculation Logic

```typescript
// Backend service method
async getCoverageSummary(userId: string): Promise<CoverageSummaryResponse> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get all active expense plans with next due date in 30 days
  const plans = await this.expensePlanRepository.find({
    where: {
      user: { auth0Id: userId },
      status: 'active',
      nextDueDate: LessThanOrEqual(thirtyDaysFromNow),
    },
    relations: ['paymentAccount'],
  });

  // Get all user's bank accounts with current balances
  const bankAccounts = await this.bankAccountRepository.find({
    where: { user: { auth0Id: userId } },
  });

  // Group plans by account
  const plansByAccount = groupBy(plans, p => p.paymentAccountId || 'unassigned');

  // Calculate coverage per account
  const accounts: AccountCoverage[] = bankAccounts.map(account => {
    const accountPlans = plansByAccount[account.id] || [];
    const upcomingTotal = sum(accountPlans, p => p.amount);
    const projected = account.balance - upcomingTotal;

    return {
      accountId: account.id,
      accountName: account.name,
      institution: account.institution,
      currentBalance: account.balance,
      upcomingPlansTotal: upcomingTotal,
      projectedBalance: projected,
      hasShortfall: projected < 0,
      shortfallAmount: projected < 0 ? Math.abs(projected) : 0,
      plansAtRisk: projected < 0
        ? accountPlans.map(p => ({
            id: p.id,
            name: p.name,
            amount: p.amount,
            nextDueDate: p.nextDueDate,
            daysUntilDue: differenceInDays(p.nextDueDate, new Date()),
          }))
        : [],
    };
  });

  // Unassigned plans
  const unassignedPlans = plansByAccount['unassigned'] || [];

  return {
    accounts: accounts.filter(a => a.upcomingPlansTotal > 0 || a.hasShortfall),
    unassignedPlans: {
      count: unassignedPlans.length,
      totalAmount: sum(unassignedPlans, p => p.amount),
      plans: unassignedPlans.map(p => ({
        id: p.id,
        name: p.name,
        amount: p.amount,
        nextDueDate: p.nextDueDate,
      })),
    },
  };
}
```

---

## UI/UX Design

### Account Selector Component

**Location**: CategoryExpenseForm (wizard) + ExpensePlanFormDialog

```
┌─────────────────────────────────────────┐
│ Payment Account (Optional)              │
│ ┌─────────────────────────────────────┐ │
│ │ Select account...               ▼  │ │
│ └─────────────────────────────────────┘ │
│ Where you'll pay this expense from      │
│                                         │
│ Options:                                │
│ ├─ None (don't track coverage)          │
│ ├─ Main Checking - €2,450 (ING)         │
│ ├─ Savings Account - €5,200 (ING)       │
│ └─ Joint Account - €890 (N26)           │
└─────────────────────────────────────────┘
```

### Dashboard Coverage Section

**Location**: Dashboard page, new section

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Expense Coverage - Next 30 Days              View All → │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🏦 Main Checking (ING)                             │   │
│  │  Current: €1,200                                    │   │
│  │  Upcoming: €1,850 (4 plans)                         │   │
│  │  ──────────────────────────────────────             │   │
│  │  Projected: -€650 ⚠️                                │   │
│  │                                                     │   │
│  │  Plans at risk:                                     │   │
│  │  • Rent (€800) - 5 days                            │   │
│  │  • Electricity (€120) - 12 days                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📋 General (no account linked)                     │   │
│  │  3 plans totaling €340                              │   │
│  │  Not included in coverage calculation               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### States

1. **All Covered** (Green):
   - Shows "All expenses covered" message
   - Optional: Show projected balances per account

2. **Shortfall** (Warning):
   - Shows accounts with insufficient funds
   - Lists plans at risk
   - Shortfall amount highlighted

3. **No Data**:
   - No expense plans with due dates in next 30 days
   - "No upcoming expenses in the next 30 days"

---

## Implementation Phases

### Phase 1: Data Model & Account Selector (MVP)
1. Backend: Add fields to ExpensePlan entity + migration
2. Backend: Update DTOs and validation
3. Frontend: Add account selector to wizard (CategoryExpenseForm)
4. Frontend: Add account selector to ExpensePlanFormDialog
5. Frontend: Update types and API client

### Phase 2: Coverage Calculation & Dashboard
1. Backend: Create coverage summary endpoint
2. Backend: Implement calculation logic
3. Frontend: Create CoverageSection component
4. Frontend: Add to Dashboard page
5. Frontend: Add React Query hook for coverage data

### Phase 3: Polish & Edge Cases
1. Handle accounts with no plans
2. Handle plans with past due dates
3. Add loading and error states
4. Mobile responsive design
5. Empty state messaging

---

## Backlog Items

### Future Enhancements
- [ ] **Credit Card Support**: Add credit cards as payment source option
- [ ] **Smart Coverage (Income-Aware)**: Factor in expected income deposits
- [ ] **Coverage Alerts**: Notifications when shortfall detected
- [ ] **Historical Coverage**: Track coverage status over time
- [ ] **Coverage Forecast**: Project coverage for 60/90 days
- [ ] **Auto-Assignment**: Suggest account based on past transactions

---

## Dependencies

- Existing ExpensePlan entity and CRUD operations
- Existing BankAccount entity with synced balances
- GoCardless sync keeping balances up-to-date
- Dashboard page structure

---

## Testing Strategy

### Unit Tests
- Coverage calculation with various scenarios
- Edge cases: no plans, all covered, partial shortfall
- Date calculations for 30-day window

### Integration Tests
- API endpoint returns correct data structure
- Account linking persists correctly

### E2E Tests
- Create plan with account in wizard
- View coverage section on dashboard
- Edit plan to change account

---

## Open Questions

1. Should coverage section always be visible or only when there are issues?
2. Should we show accounts with no upcoming plans in the coverage section?
3. How to handle paused expense plans in coverage calculation?

---

## Appendix

### Wireframe References
See UI/UX Design section above.

### Related Features
- FEAT-20260108-expense-plan-wizard (Expense Plan Wizard)
- Expense Plans module
- Bank Accounts module
