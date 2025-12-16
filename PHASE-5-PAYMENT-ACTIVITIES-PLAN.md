# Phase 4: Payment Activities Page - Implementation Plan

**Status**: Ready to Start
**Branch**: `feature/payment-activities-page`
**Estimated Time**: 2 days (16 hours)
**Dependencies**: Phase 1-2 complete (Foundation + CRUD) ✅

---

## 🎯 Goal

Create a comprehensive page where users can:
- View all imported payment activities
- Filter by account, status, date range, and search term
- See reconciliation statistics
- View detailed information about each activity
- Navigate to reconciliation workflow

---

## 📋 Success Criteria

- ✅ Payment Activities page accessible from navigation
- ✅ List view displays all payment activities
- ✅ Filters work correctly (account, status, dates)
- ✅ Statistics card shows reconciliation metrics
- ✅ Detail modal shows full activity information
- ✅ Empty states handled gracefully
- ✅ Loading states and error handling
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ 100% test coverage for new components
- ✅ All tests pass (unit + E2E)

---

## 🏗️ Architecture

### File Structure
```
src/app/payment-activities/
├── page.tsx                           # Main page (TDD)
├── components/
│   ├── PaymentActivitiesList.tsx     # List/table view (TDD)
│   ├── PaymentActivityCard.tsx       # Individual card (TDD)
│   ├── PaymentActivityFilters.tsx    # Filter panel (TDD)
│   ├── ReconciliationStatsCard.tsx   # Stats display (TDD)
│   ├── PaymentActivityDetailModal.tsx # Detail view (TDD)
│   └── __tests__/
│       ├── PaymentActivitiesList.test.tsx
│       ├── PaymentActivityCard.test.tsx
│       ├── PaymentActivityFilters.test.tsx
│       ├── ReconciliationStatsCard.test.tsx
│       └── PaymentActivityDetailModal.test.tsx
```

### Data Flow
```
Page (Server Component)
  └─> PaymentActivitiesList (Client Component)
        ├─> usePaymentActivities hook
        ├─> PaymentActivityFilters
        ├─> ReconciliationStatsCard
        ├─> PaymentActivityCard (for each activity)
        └─> PaymentActivityDetailModal (when clicked)
```

---

## 🔄 TDD Workflow Steps

### STEP 1: Create Feature Branch (5 min)
```bash
git checkout -b feature/payment-activities-page
```

**Todo:**
- Create branch from main
- Verify starting point is clean

---

### STEP 2: Write Tests for ReconciliationStatsCard (30 min)

**File**: `src/app/payment-activities/components/__tests__/ReconciliationStatsCard.test.tsx`

**Test Cases** (RED Phase):
1. Should render all stat cards
2. Should display total activities count
3. Should display reconciled count and percentage
4. Should display pending count
5. Should display failed count
6. Should handle zero activities gracefully
7. Should format percentages correctly

**Todo:**
- Create test file
- Write 7 failing tests
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create ReconciliationStatsCard component
- Implement minimal logic to pass tests
- Run tests to confirm GREEN ✓

---

### STEP 3: Write Tests for PaymentActivityCard (45 min)

**File**: `src/app/payment-activities/components/__tests__/PaymentActivityCard.test.tsx`

**Test Cases** (RED Phase):
1. Should render activity description
2. Should render amount with currency formatting
3. Should render activity date
4. Should display reconciliation status badge
5. Should display payment provider
6. Should show "View Details" button
7. Should call onClick when details button clicked
8. Should highlight unreconciled activities
9. Should show transaction link if reconciled

**Todo:**
- Create test file
- Write 9 failing tests
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create PaymentActivityCard component
- Implement UI with Shadcn components
- Add click handler for detail modal
- Run tests to confirm GREEN ✓

---

### STEP 4: Write Tests for PaymentActivityFilters (60 min)

**File**: `src/app/payment-activities/components/__tests__/PaymentActivityFilters.test.tsx`

**Test Cases** (RED Phase):
1. Should render payment account selector
2. Should render reconciliation status filter
3. Should render date range picker
4. Should render search input
5. Should call onFilterChange when account selected
6. Should call onFilterChange when status selected
7. Should call onFilterChange when dates changed
8. Should debounce search input
9. Should show "Clear Filters" button when filters active
10. Should reset all filters when "Clear" clicked

**Todo:**
- Create test file
- Write 10 failing tests
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create PaymentActivityFilters component
- Implement all filter controls
- Add debounce for search (use lodash or custom hook)
- Wire up onFilterChange callbacks
- Run tests to confirm GREEN ✓

---

### STEP 5: Write Tests for PaymentActivityDetailModal (45 min)

**File**: `src/app/payment-activities/components/__tests__/PaymentActivityDetailModal.test.tsx`

**Test Cases** (RED Phase):
1. Should not render when closed
2. Should render when open
3. Should display all activity details
4. Should show reconciliation status
5. Should show linked transaction if reconciled
6. Should show "Reconcile" button if not reconciled
7. Should call onClose when close button clicked
8. Should call onReconcile when reconcile button clicked
9. Should close on escape key

**Todo:**
- Create test file
- Write 9 failing tests
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create PaymentActivityDetailModal component
- Use Dialog from Shadcn UI
- Display all activity fields
- Add reconciliation action button
- Run tests to confirm GREEN ✓

---

### STEP 6: Write Tests for PaymentActivitiesList (90 min)

**File**: `src/app/payment-activities/components/__tests__/PaymentActivitiesList.test.tsx`

**Test Cases** (RED Phase):
1. Should render loading state
2. Should render error state
3. Should render empty state with no activities
4. Should render list of activities
5. Should render filters panel
6. Should render stats card
7. Should open detail modal when card clicked
8. Should close detail modal
9. Should fetch activities on mount
10. Should refetch when filters change
11. Should handle pagination
12. Should sort activities by date (newest first)

**Todo:**
- Create test file
- Write 12 failing tests
- Mock usePaymentActivities hook
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create PaymentActivitiesList component
- Integrate all sub-components
- Wire up usePaymentActivities hook
- Implement state management for filters and modal
- Handle loading/error/empty states
- Run tests to confirm GREEN ✓

---

### STEP 7: Write Tests for Main Page (30 min)

**File**: `src/app/payment-activities/__tests__/page.test.tsx`

**Test Cases** (RED Phase):
1. Should render page title
2. Should render PaymentActivitiesList
3. Should handle missing session (redirect)
4. Should pass user ID to components

**Todo:**
- Create test file
- Write 4 failing tests
- Mock NextAuth session
- Run tests to confirm RED ✗

**GREEN Phase**:
- Create page.tsx
- Add session check
- Render PaymentActivitiesList
- Run tests to confirm GREEN ✓

---

### STEP 8: Add Navigation Link (15 min)

**Update**: `src/components/Menu.tsx`

**Test Update**: Add test case to existing Menu.test.tsx
- Should render Payment Activities link

**Todo:**
- Write failing test (RED)
- Add link to protectedLinks array (GREEN)
- Run test to confirm ✓

---

### STEP 9: Create Cypress E2E Tests (60 min)

**File**: `cypress/e2e/payment-activities.cy.ts`

**Test Scenarios**:
1. Page loads and displays activities
2. Filters work correctly
3. Stats card updates when filtering
4. Detail modal opens and closes
5. Search functionality works
6. Date range filtering works
7. Pagination works
8. Empty state displays correctly
9. Error state displays correctly
10. Mobile responsive view

**Todo:**
- Create E2E test file
- Mock API responses
- Test all user workflows
- Run Cypress tests

---

### STEP 10: Manual Testing & Polish (60 min)

**Todo:**
- Test in browser manually
- Check mobile responsiveness
- Verify all interactions
- Check accessibility
- Fix any visual issues
- Verify error handling

---

## 📦 Required Dependencies

All dependencies already installed:
- ✅ `@tanstack/react-query` - Data fetching
- ✅ `@radix-ui/react-dialog` - Modal
- ✅ `@radix-ui/react-select` - Dropdowns
- ✅ `date-fns` - Date formatting
- ✅ `lucide-react` - Icons

---

## 🎨 UI/UX Design Patterns

### ReconciliationStatsCard
```
┌────────────────────────────────────────────────┐
│  Reconciliation Statistics                     │
├────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ 1,234│ │  892 │ │  312 │ │  30  │          │
│  │Total │ │Recon-│ │Pend- │ │Failed│          │
│  │      │ │ciled │ │ing   │ │      │          │
│  │      │ │(72%) │ │(25%) │ │(3%)  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
└────────────────────────────────────────────────┘
```

### PaymentActivityCard
```
┌────────────────────────────────────────────────┐
│  PayPal Payment - Coffee Shop                  │
│  $5.50 | 2024-12-15 | ✓ Reconciled             │
│  [View Details]                                 │
└────────────────────────────────────────────────┘
```

### PaymentActivityFilters
```
┌────────────────────────────────────────────────┐
│  [Account ▼] [Status ▼] [From Date] [To Date] │
│  [Search: ________]              [Clear All]   │
└────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest + RTL)
- Component rendering
- User interactions
- State management
- Props validation
- Edge cases

### E2E Tests (Cypress)
- Full user workflows
- Filter combinations
- Modal interactions
- Responsive behavior
- Error scenarios

### Test Coverage Target
- ✅ 90%+ coverage for new code
- ✅ All critical paths tested
- ✅ Happy path + edge cases
- ✅ Error handling

---

## 🚀 Implementation Order

**Day 1** (8 hours):
1. STEP 1: Create branch (5 min) ✓
2. STEP 2: ReconciliationStatsCard (30 min) ✓
3. STEP 3: PaymentActivityCard (45 min) ✓
4. STEP 4: PaymentActivityFilters (60 min) ✓
5. STEP 5: PaymentActivityDetailModal (45 min) ✓
6. STEP 6: PaymentActivitiesList (90 min) ✓
7. STEP 7: Main Page (30 min) ✓

**Day 2** (8 hours):
8. STEP 8: Navigation Link (15 min) ✓
9. STEP 9: Cypress E2E Tests (60 min) ✓
10. STEP 10: Manual Testing & Polish (60 min) ✓
11. Code review & refactoring (60 min)
12. Documentation (30 min)
13. Commit and merge (30 min)

---

## ✅ Definition of Done

- [ ] All unit tests pass (100%)
- [ ] All E2E tests pass
- [ ] Code coverage ≥90% for new code
- [ ] Manual testing completed
- [ ] Mobile responsive verified
- [ ] Accessibility checked
- [ ] Error handling tested
- [ ] Loading states verified
- [ ] Empty states verified
- [ ] Code reviewed (self-review)
- [ ] Documentation updated
- [ ] Committed with proper messages
- [ ] Merged to main

---

## 🔗 Related Documents

- Original Plan: `tidy-dreaming-starfish.md`
- Status Document: `docs/private/payment-account-frontend-status.md`
- Phase 2 Complete: `PHASE-2-COMPLETE.md`
- API Routes Doc: `PAYMENT-ACCOUNTS-API-ROUTES.md`

---

## 📝 Notes

- Follow existing patterns from bank-accounts and transactions pages
- Use TypeScript strictly (no `any` types)
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks
- Use Shadcn UI components consistently
- Follow TDD strictly: RED → GREEN → REFACTOR
- Commit frequently with descriptive messages
- Test on multiple screen sizes

---

**Ready to start?**

Begin with STEP 1: Create the feature branch!
