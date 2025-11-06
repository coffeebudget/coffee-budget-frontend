# AuthButtons Test Fix Guide

## Issue #3: Test AuthButtons Component - Progress Report

### Current Status
- **Tests Created**: 30 comprehensive test cases
- **Tests Passing**: 12/30 (40%)
- **Tests Failing**: 18/30 (60%)
- **Infrastructure**: ✅ Resolved (MSW polyfills added to jest.setup.ts)

### Test Infrastructure Fixes Applied

1. **Removed UI Component Mocks**: Shadcn Button and Card components now render naturally
2. **Fixed Import Path**: Changed from `test-utils` to `test-utils/test-wrappers` to avoid loading MSW unnecessarily
3. **Added Polyfills** (jest.setup.ts):
   - TextEncoder/TextDecoder for MSW compatibility
   - whatwg-fetch for fetch API polyfill

### Test Failure Analysis

#### Category 1: Loading State Tests (3 failures)

**Problem**: Component doesn't show "Loading..." text during tests because `useEffect` sets `isClient` to `true` immediately in jest environment.

**Component Code**:
```typescript
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

if (!isClient) {
  return <Card><CardContent>Loading...</CardContent></Card>;
}
```

**Failing Tests**:
- `shows loading state during SSR (desktop)`
- `shows loading state during SSR (mobile)`
- `transitions from loading to login button`

**Fix Strategy**:
Mock the `useState` and `useEffect` hooks to control the client-side hydration state in these specific tests.

#### Category 2: Negative Assertion Timeouts (10 failures)

**Problem**: Tests using `.not.toBeInTheDocument()` are timing out after 1000ms.

**Failing Tests**:
- `does not show logout button` (unauthenticated desktop)
- `does not show mobile logout button` (unauthenticated mobile)
- `does not show login button` (authenticated desktop)
- `does not show mobile login button` (authenticated mobile)
- `defaults to desktop mode when isMobile not provided`
- `uses mobile mode when isMobile is true`
- `uses desktop mode when isMobile is false`

**Fix Strategy**:
Remove `waitFor` wrapper for negative assertions. Use direct `queryBy*` checks which return immediately.

**Before**:
```typescript
await waitFor(() => {
  expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
});
```

**After**:
```typescript
await waitFor(() => {
  expect(screen.getByTestId('login-button')).toBeInTheDocument();
});
expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
```

#### Category 3: State Transition Tests (2 failures)

**Problem**: Tests that change session state and expect UI to update are failing.

**Failing Tests**:
- `transitions from unauthenticated to authenticated`
- `transitions from authenticated to unauthenticated`

**Fix Strategy**:
Use `rerender()` with updated mock values to trigger React re-renders after changing session state.

#### Category 4: Error Handling Tests (2 failures)

**Problem**: Tests expect error messages to be displayed, but component doesn't render error states.

**Failing Tests**:
- `handles signIn errors gracefully`
- `handles signOut errors gracefully`

**Component Behavior**: AuthButtons doesn't display error messages - it just calls `signIn()`/`signOut()` and relies on NextAuth to handle errors.

**Fix Strategy**:
Change test expectations to verify that errors are caught and don't crash the component, rather than expecting error messages to be displayed.

### Next Steps

1. **Fix Loading State Tests**: Add React hooks mocking for SSR hydration tests
2. **Fix Negative Assertions**: Remove `waitFor` from negative assertions
3. **Fix Transition Tests**: Add `rerender` calls after session state changes
4. **Fix Error Tests**: Adjust expectations to match component behavior

### Coverage Goal
Target: >90% coverage for AuthButtons component

### Files Modified

- ✅ `src/components/__tests__/AuthButtons.test.tsx` - Created comprehensive test suite
- ✅ `jest.setup.ts` - Added TextEncoder/TextDecoder and whatwg-fetch polyfills
- ✅ `jest.setup.js` - Added polyfills (not used, config points to .ts file)

### Commands Used

```bash
# Run AuthButtons tests
npm test -- src/components/__tests__/AuthButtons.test.tsx

# Run tests with coverage
npm run test:coverage -- src/components/__tests__/AuthButtons.test.tsx
```

### Test Results Summary

```
Test Suites: 1 failed, 1 total
Tests:       18 failed, 12 passed, 30 total
Time:        12.61 s
```

**Passing Tests** (12):
- ✅ shows login icon
- ✅ calls signIn with auth0 provider when login clicked
- ✅ shows login icon on mobile
- ✅ calls signIn with auth0 provider when mobile login clicked
- ✅ shows logout icon
- ✅ calls signOut when logout clicked
- ✅ shows logout icon on mobile
- ✅ calls signOut when mobile logout clicked
- ✅ handles session with null data but authenticated status
- ✅ handles session with data but unauthenticated status
- ✅ handles rapid login clicks
- ✅ handles rapid logout clicks

**Failing Tests** (18): See categories above for details

### Estimated Time to Complete
- Fix loading state tests: ~15 minutes
- Fix negative assertions: ~20 minutes
- Fix transition tests: ~15 minutes
- Fix error tests: ~10 minutes
- **Total**: ~60 minutes to achieve 100% passing tests
